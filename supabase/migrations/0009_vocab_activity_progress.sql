-- Thanh Việt — picture-collection progress
--
-- One row per (user, collection, activity) once that activity has been
-- finished at least once. Collections are content files (content/vocab/
-- <id>.json), not database rows, so collection_id is the file's id
-- ("food", "colors", "body", ...) — text, no foreign key, the same way the
-- app already keys collection pages.
--
-- "Finished" means reaching the activity's end screen: See it / Hear it /
-- Match after the last round, Say it after the last word. best_score/total
-- are the best "right first time" result for See it / Hear it; Match and
-- Say it have no score today (Say it waits on a calibrated Tone Tuner), so
-- they stay null.
--
-- Own rows only, like user_streaks.
--
-- Run this once in the Supabase SQL Editor, AFTER 0008.

create table public.vocab_activity_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  collection_id text not null check (collection_id ~ '^[a-z0-9-]{1,40}$'),
  activity text not null check (activity in ('see', 'hear', 'match', 'say')),
  times_completed integer not null default 1 check (times_completed >= 1),
  best_score integer check (best_score >= 0),
  total integer check (total > 0),
  first_completed_at timestamptz not null default now(),
  last_completed_at timestamptz not null default now(),
  primary key (user_id, collection_id, activity)
);

alter table public.vocab_activity_progress enable row level security;

create policy "users can view their own collection progress"
  on public.vocab_activity_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own collection progress"
  on public.vocab_activity_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own collection progress"
  on public.vocab_activity_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
