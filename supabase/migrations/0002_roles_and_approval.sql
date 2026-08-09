-- Thanh Việt — role-based access control + signup approval workflow
--
-- Adds a three-tier role (member/admin/ceo) and an approval_status
-- (pending/approved/rejected) to profiles. Run this AFTER 0001_init.sql.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).

-- ============================================================================
-- COLUMNS
-- ============================================================================

alter table public.profiles
  add column role text not null default 'member'
    check (role in ('member', 'admin', 'ceo')),
  add column approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  -- Mirrors auth.users.email so the /admin approval list can show it via a
  -- normal RLS-scoped query, without needing the admin API just to list
  -- pending signups. Populated below by updating handle_new_user.
  add column email text;

comment on column public.profiles.role is
  'member: default. admin/ceo: can access /admin. Only ceo can change role.';
comment on column public.profiles.approval_status is
  'pending: default, blocks all app access except /pending. approved: full
   access. rejected: blocked, distinct from pending so admins can tell
   the two apart in the UI.';

-- Backfill handle_new_user (from 0001) to also copy email onto the profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

-- ============================================================================
-- HELPERS
--
-- security definer: these read profiles.role / .approval_status for the
-- CALLING user's own row, bypassing RLS internally. That's required, not
-- just convenient — an RLS policy on `profiles` that queries `profiles`
-- again (even for a different column check) re-enters that same table's
-- RLS, which is a well-known Postgres/Supabase footgun. Wrapping the lookup
-- in a security definer function breaks that cycle. Each function is
-- hard-scoped to auth.uid(), so it can never leak another user's data.
-- ============================================================================

create function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.current_user_approval_status()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select approval_status from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- COLUMN-LEVEL GUARD (trigger, not RLS — see note at top of file)
-- ============================================================================

create function public.enforce_profile_field_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  -- The admin client (SUPABASE_SECRET_KEY, used only in src/lib/supabase/
  -- server-admin.ts) connects as Postgres role `service_role`, which has no
  -- auth.uid() — there's no end-user session to check. That path is
  -- authorized instead by the calling Server Action re-checking the
  -- caller's role from the database before it ever touches this client
  -- (see src/app/admin/actions.ts). This trigger's job is the other half:
  -- stopping a signed-in member from calling the REST API directly with
  -- their own anon-key session to self-grant role/approval_status,
  -- bypassing the UI (and the Server Actions) entirely.
  if auth.role() = 'service_role' then
    return new;
  end if;

  caller_role := public.current_user_role();

  if new.role is distinct from old.role
     and caller_role is distinct from 'ceo' then
    raise exception 'Only ceo can change role';
  end if;

  if new.approval_status is distinct from old.approval_status
     and caller_role is distinct from 'admin'
     and caller_role is distinct from 'ceo' then
    raise exception 'Only admin or ceo can change approval_status';
  end if;

  return new;
end;
$$;

create trigger enforce_profile_field_permissions
  before update on public.profiles
  for each row execute function public.enforce_profile_field_permissions();

-- ============================================================================
-- RLS: profiles — who can SEE which rows
--
-- Replaces the 0001 policy (which let any authenticated user see every
-- profile). Now: your own row, always; everyone else's row only once
-- you're approved (leaderboard, Section 5.8) or staff (admin/ceo, who need
-- to see pending signups regardless of their own approval state).
-- ============================================================================

drop policy "profiles are viewable by authenticated users" on public.profiles;

create policy "profiles visible to self, approved members, and staff"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id
    or public.current_user_approval_status() = 'approved'
    or public.current_user_role() in ('admin', 'ceo')
  );

-- Note: no new UPDATE policy for admin/ceo editing *other* users' rows.
-- The existing "users can update their own profile" policy (auth.uid() =
-- id) already blocks cross-user updates at the row level — on purpose.
-- Approve/reject/promote/demote go through Server Actions using the admin
-- client instead (src/app/admin/actions.ts), which re-check the caller's
-- role server-side before writing. The trigger above is the backstop if
-- that check is ever wrong.

-- ============================================================================
-- RLS: units & words — require approval, not just authentication
-- ============================================================================

drop policy "units are viewable by authenticated users" on public.units;

create policy "approved users can view units"
  on public.units for select
  to authenticated
  using (public.current_user_approval_status() = 'approved');

drop policy "words are viewable by authenticated users" on public.words;

create policy "approved users can view words"
  on public.words for select
  to authenticated
  using (public.current_user_approval_status() = 'approved');
