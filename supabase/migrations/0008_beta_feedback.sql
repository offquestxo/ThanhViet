-- Thanh Việt — beta feedback ("Report a problem")
--
-- One new table. A signed-in tester writes a short note; the app adds the
-- page path and a short device description (e.g. "iPhone · Safari ·
-- home screen app · 390×844"). No audio, no screenshots, no full user-agent
-- string. Admins and the ceo read and triage notes in /admin.
--
-- Who can write: any signed-in user, including people still pending
-- approval (they can only see /pending, and a broken sign-up flow is
-- exactly what a beta tester should be able to report).
-- Who can read: admin/ceo only. Testers don't read notes back.
-- Status changes (new -> seen -> resolved) go through an admin Server
-- Action, which re-checks the caller's role, same pattern as approvals.
--
-- Run this once in the Supabase SQL Editor, AFTER 0007.

create table public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  -- Kept if the tester's account is deleted, so the note isn't lost.
  user_id uuid references auth.users (id) on delete set null,
  note text not null check (char_length(btrim(note)) between 1 and 1000),
  page_path text not null check (char_length(page_path) <= 300),
  device text check (char_length(device) <= 200),
  status text not null default 'new' check (status in ('new', 'seen', 'resolved')),
  created_at timestamptz not null default now()
);

create index beta_feedback_created_at_idx on public.beta_feedback (created_at desc);

alter table public.beta_feedback enable row level security;

create policy "signed-in users can submit their own feedback"
  on public.beta_feedback for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'new');

create policy "staff can read feedback"
  on public.beta_feedback for select
  to authenticated
  using (public.current_user_role() in ('admin', 'ceo'));

-- No update/delete policy on purpose: status changes go through the admin
-- client in src/app/admin/actions.ts after a server-side role check.
