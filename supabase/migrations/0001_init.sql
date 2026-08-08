-- Thanh Việt — initial schema
-- Implements the data model sketch in spec Section 9, adapted for Supabase:
--   * "User" becomes `profiles`, a 1:1 extension of Supabase's built-in
--     `auth.users` table (best practice: never modify auth.users directly).
--   * All primary keys are UUIDs.
--   * `user_streaks` + `profiles.total_points` are added — required by the
--     gamification design (Section 10) even though Section 9's sketch didn't
--     itemize a streak table.
--   * `LeaderboardEntry` is implemented as a view, per the spec's own note
--     that it "can be computed, not necessarily stored."
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- or via `supabase db push` if you later adopt the Supabase CLI.

-- ============================================================================
-- PROFILES  (extends auth.users)
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  avatar_url text,
  accent_pref text not null default 'northern'
    check (accent_pref in ('northern', 'southern')),
  total_points integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data, 1:1 with auth.users.';

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
-- security definer: runs as the function owner, bypassing RLS, because at
-- signup time the new user has no session yet to satisfy a normal policy.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- UNITS & WORDS  (founder-authored lesson content, Section 7)
-- ============================================================================

create table public.units (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  "order" integer not null,
  source_reference text,
  created_at timestamptz not null default now()
);

create table public.words (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units (id) on delete set null,
  vietnamese_text text not null,
  english_text text not null,
  tone_pattern text,
  audio_url text,
  created_at timestamptz not null default now()
);

create index words_unit_id_idx on public.words (unit_id);

-- ============================================================================
-- USER PROGRESS
-- ============================================================================

create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  mastery_level integer not null default 0,
  last_practiced_at timestamptz,
  accuracy_history jsonb not null default '[]'::jsonb,
  unique (user_id, word_id)
);

create index user_progress_user_id_idx on public.user_progress (user_id);

-- ============================================================================
-- TALK PRACTICE  (Section 5.6)
-- ============================================================================

create table public.talk_practice_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  source_text text,
  created_at timestamptz not null default now()
);

create table public.talk_practice_words (
  id uuid primary key default gen_random_uuid(),
  talk_practice_set_id uuid not null
    references public.talk_practice_sets (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade
);

create index talk_practice_words_set_id_idx
  on public.talk_practice_words (talk_practice_set_id);

-- ============================================================================
-- TONE TUNER ATTEMPTS
-- ============================================================================

create table public.tone_practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  detected_tone text,
  target_tone text,
  passed boolean not null,
  created_at timestamptz not null default now()
);

create index tone_practice_attempts_user_id_idx
  on public.tone_practice_attempts (user_id);

-- ============================================================================
-- BADGES  (Section 10)
-- ============================================================================

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  icon_url text
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- ============================================================================
-- STREAKS  (supports the leaderboard + streak UI in Sections 5.2 and 10)
-- ============================================================================

create table public.user_streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date
);

-- ============================================================================
-- LEADERBOARD  (derived view, not a stored table — per spec Section 9)
-- security_invoker: the view runs with the *querying user's* RLS
-- permissions, not the view owner's — so it stays subject to the profiles
-- SELECT policy below rather than silently bypassing it.
-- ============================================================================

create view public.leaderboard
with (security_invoker = true) as
select
  p.id as user_id,
  p.name,
  p.total_points,
  coalesce(s.current_streak, 0) as current_streak
from public.profiles p
left join public.user_streaks s on s.user_id = p.id
order by p.total_points desc;

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.units enable row level security;
alter table public.words enable row level security;
alter table public.user_progress enable row level security;
alter table public.talk_practice_sets enable row level security;
alter table public.talk_practice_words enable row level security;
alter table public.tone_practice_attempts enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.user_streaks enable row level security;

-- PROFILES: everyone signed in can read names/points (needed for the group
-- leaderboard); each user may only modify their own row.
create policy "profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- UNITS & WORDS: shared lesson content. Readable by any signed-in member;
-- writes are intentionally left with no policy, so only the service_role
-- key (admin console / content pipeline, Section 7) can write.
create policy "units are viewable by authenticated users"
  on public.units for select
  to authenticated
  using (true);

create policy "words are viewable by authenticated users"
  on public.words for select
  to authenticated
  using (true);

-- USER PROGRESS: strictly own-rows only.
create policy "users can view their own progress"
  on public.user_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own progress"
  on public.user_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own progress"
  on public.user_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- TALK PRACTICE SETS: strictly own-rows only ("My Talks", Section 5.7).
create policy "users can view their own talk practice sets"
  on public.talk_practice_sets for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own talk practice sets"
  on public.talk_practice_sets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own talk practice sets"
  on public.talk_practice_sets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own talk practice sets"
  on public.talk_practice_sets for delete
  to authenticated
  using (auth.uid() = user_id);

-- TALK PRACTICE WORDS: ownership flows through the parent set.
create policy "users can view their own talk practice words"
  on public.talk_practice_words for select
  to authenticated
  using (
    exists (
      select 1 from public.talk_practice_sets s
      where s.id = talk_practice_set_id and s.user_id = auth.uid()
    )
  );

create policy "users can insert their own talk practice words"
  on public.talk_practice_words for insert
  to authenticated
  with check (
    exists (
      select 1 from public.talk_practice_sets s
      where s.id = talk_practice_set_id and s.user_id = auth.uid()
    )
  );

create policy "users can delete their own talk practice words"
  on public.talk_practice_words for delete
  to authenticated
  using (
    exists (
      select 1 from public.talk_practice_sets s
      where s.id = talk_practice_set_id and s.user_id = auth.uid()
    )
  );

-- TONE PRACTICE ATTEMPTS: strictly own-rows only.
create policy "users can view their own tone practice attempts"
  on public.tone_practice_attempts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own tone practice attempts"
  on public.tone_practice_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- BADGES: shared catalog, readable by all; writes are admin/service_role only.
create policy "badges are viewable by authenticated users"
  on public.badges for select
  to authenticated
  using (true);

-- USER BADGES: users can see their own earned badges. Badges are awarded by
-- server-side logic (service_role), not inserted directly by the client, so
-- there's no insert policy here on purpose.
create policy "users can view their own badges"
  on public.user_badges for select
  to authenticated
  using (auth.uid() = user_id);

-- USER STREAKS: users can see and update their own streak record.
create policy "users can view their own streak"
  on public.user_streaks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can update their own streak"
  on public.user_streaks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can insert their own streak"
  on public.user_streaks for insert
  to authenticated
  with check (auth.uid() = user_id);
