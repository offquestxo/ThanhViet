-- Thanh Việt — Chunk-based learning content + Workspace (Talk Practice v2)
--
-- Implements spec Section 9 as revised for the concept-first pedagogy
-- (Sections 1a–1d) and the Workspace redesign (Section 5.6). Supersedes/
-- extends 0001's units/words-only content model — Chunk (sentence/phrase
-- level) is now the primary teaching unit; Word survives as a supporting
-- reference layer reached via ChunkWord, no longer unit-scoped directly.
--
-- Run this once in the Supabase SQL Editor, AFTER 0001_init.sql and
-- 0002_roles_and_approval.sql.
--
-- ============================================================================
-- FLAGS — Section 9's data model vs. what Postgres/RLS actually needs
-- (per request: called out here, not silently patched)
-- ============================================================================
--
-- 1. HLR vs. the SM-2-shaped field names. Section 1d/Section 11 (Decision 7)
--    confirm Half-Life Regression as the chosen SRS algorithm, but Section
--    9's own sketch names `ease_factor`/`interval_days` — SM-2 vocabulary,
--    not HLR vocabulary. Real HLR (Settles & Meeder 2016, Duolingo) fits a
--    *shared* logistic-regression model over lexeme/lag/history features
--    across the whole user base — that's Section 1d's "Layer 2," explicitly
--    deferred until there's real interaction volume to calibrate against.
--    There's no such model to store per-row yet. This migration keeps the
--    requested field names (they're schema-compatible with either
--    algorithm), but they should be read as a *simplified per-item
--    half-life heuristic* for Phase 1a, not literal HLR:
--      - `interval_days` is `real`, not `integer` — HLR half-lives are
--        continuous, not day-granular like SM-2.
--      - the intended update rule (app-layer, not built this session):
--        recall probability p(t) = 2^(-t / half_life), which is exactly
--        0.5 at t = half_life — so `next_review_at` = `last_practiced_at`
--        + `interval_days` falls naturally out of treating `interval_days`
--        AS the current half-life estimate, not a separately-derived value.
--      - `ease_factor` has no clean HLR equivalent (HLR doesn't use a
--        per-item ease multiplier). Kept as a per-item half-life growth
--        factor (grow on correct recall, shrink on lapse) — a hand-rolled
--        proxy, not a trained HLR weight. Revisit once Layer 2 exists.
--
-- 2. `words.unit_id` is dropped, not just superseded. Section 9 states Word
--    is "no longer unit-scoped directly — reached via ChunkWord." That's a
--    real column removal from 0001, not an additive change. Any existing
--    seeded words lose their direct unit link; they're still reachable
--    once (re-)associated to a chunk via `chunk_words`. The one unit
--    already seeded live has 2 words — trivially re-seedable via the
--    updated seed script.
--
-- 3. `UserRehearsalProgress` mirrors `UserChunkProgress`'s shape (a
--    separate per-user progress table), but that shape exists to handle
--    many users sharing one `Chunk`. `RehearsalChunk` isn't shared — it's
--    already 1:1-owned via `workspace_item_id -> user_id`. Built as
--    specified (added a uniqueness constraint below), but functionally the
--    progress fields could live directly on `rehearsal_chunks` with no
--    loss, since the join never has more than one real row per chunk.
--
-- 4. `display_order` added on `chunks` and uniqueness added on
--    `rehearsal_chunks(workspace_item_id, display_order)` — Section 9's
--    sketch doesn't itemize these, but Sections 5.3/5.4 assume an ordered
--    lesson path within a unit, and 5.6/breath-groups assume rehearsal
--    chunks play back in a fixed sequence. Same pattern as `units.order`.
--
-- 5. `WorkspaceSchedule.deadline_date` duplicates `workspace_items
--    .deadline_date` — kept because Section 9 lists it explicitly on both,
--    and a separate table makes the build/taper computation re-derivable
--    later (exact timeline defaults are still an open item, Section 5.6)
--    without migrating `workspace_items` itself.
--
-- 6. `FullRunThroughAttempt.timestamp` renamed to `created_at` — matches
--    every other attempt-log table in this schema (`tone_practice_
--    attempts`), and `timestamp` is an awkward column name in Postgres
--    (shadows the built-in type name).
--
-- ============================================================================
-- WORDS: drop the direct unit scoping (Flag 2)
-- ============================================================================

drop index if exists public.words_unit_id_idx;

alter table public.words
  drop column unit_id;

-- ============================================================================
-- TALK_PRACTICE_SETS / TALK_PRACTICE_WORDS: drop, superseded (Flag 7)
--
-- Flag 7 (not asked for explicitly, called out rather than done silently):
-- these two tables were a 0001-era stub for "Talk Practice" — zero
-- references anywhere in src/, never wired to a screen. Section 9's
-- revised model (WorkspaceItem/RehearsalChunk/etc., below) is a direct
-- redesign of that same unbuilt feature under its current name, "Talk
-- Practice / Personal Workspace" (Section 5.6). Dropping rather than
-- leaving two competing, same-purpose schemas around — there's no data
-- loss risk since nothing ever wrote to these.
-- ============================================================================

drop table if exists public.talk_practice_words;
drop table if exists public.talk_practice_sets;

-- ============================================================================
-- CHUNKS  (primary teaching unit, Section 1a/9)
-- ============================================================================

create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  vietnamese_text text not null,
  english_text text not null,
  source_context text,
  audio_url text,
  structural_concept text not null default 'none'
    check (structural_concept in
      ('classifier', 'topic_comment', 'particle', 'tone_identity', 'none')),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on column public.chunks.structural_concept is
  'Section 1b tag — drives Pattern Noticing selection (surface many real
   examples of one concept before stating the rule). One tag per chunk per
   the spec''s literal wording; a chunk touching multiple concepts just
   picks its primary one.';

create index chunks_unit_id_idx on public.chunks (unit_id);
create index chunks_structural_concept_idx on public.chunks (structural_concept);

-- ============================================================================
-- CHUNK_WORDS  (links chunks to the Tone Tuner's word-level data)
-- Composite PK, no surrogate id — matches Section 9's ChunkWord sketch
-- exactly; this is a pure join with no attributes of its own besides order.
-- ============================================================================

create table public.chunk_words (
  chunk_id uuid not null references public.chunks (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  display_order integer not null default 0,
  primary key (chunk_id, word_id)
);

create index chunk_words_word_id_idx on public.chunk_words (word_id);

-- ============================================================================
-- USER_CHUNK_PROGRESS  (SRS scheduling — see Flag 1 above)
-- ============================================================================

create table public.user_chunk_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chunk_id uuid not null references public.chunks (id) on delete cascade,
  mastery_level integer not null default 0,
  recognition_accuracy real,
  last_practiced_at timestamptz,
  -- SRS fields (HLR-simplified — see Flag 1):
  interval_days real not null default 0,
  ease_factor real not null default 2.5,
  next_review_at timestamptz,
  consecutive_correct integer not null default 0,
  unique (user_id, chunk_id)
);

create index user_chunk_progress_user_id_idx on public.user_chunk_progress (user_id);
create index user_chunk_progress_due_idx
  on public.user_chunk_progress (user_id, next_review_at);

-- ============================================================================
-- WORKSPACE_ITEMS  (Section 5.6 — user's own talk/demo/reading + deadline)
-- ============================================================================

create table public.workspace_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  source_text text not null,
  item_type text not null default 'other'
    check (item_type in ('talk', 'demo', 'prayer', 'reading', 'other')),
  deadline_date date not null,
  created_at timestamptz not null default now()
);

create index workspace_items_user_id_idx on public.workspace_items (user_id);

-- ============================================================================
-- REHEARSAL_CHUNKS  (breath-group segmented, Principle 3 — distinct from
-- the Learning tab's `chunks` table)
-- ============================================================================

create table public.rehearsal_chunks (
  id uuid primary key default gen_random_uuid(),
  workspace_item_id uuid not null
    references public.workspace_items (id) on delete cascade,
  text text not null,
  display_order integer not null default 0,
  tier text not null default 'gist' check (tier in ('verbatim', 'gist')),
  is_opener boolean not null default false,
  is_closer boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_item_id, display_order)
);

create index rehearsal_chunks_workspace_item_id_idx
  on public.rehearsal_chunks (workspace_item_id);

-- ============================================================================
-- USER_REHEARSAL_PROGRESS  (Principle 5, weak-spot-first — see Flag 3)
-- ============================================================================

create table public.user_rehearsal_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rehearsal_chunk_id uuid not null
    references public.rehearsal_chunks (id) on delete cascade,
  error_count integer not null default 0,
  avg_hesitation_ms integer,
  last_practiced_at timestamptz,
  mastery_status text not null default 'weak'
    check (mastery_status in ('weak', 'developing', 'ready')),
  unique (user_id, rehearsal_chunk_id)
);

create index user_rehearsal_progress_user_id_idx
  on public.user_rehearsal_progress (user_id);

-- ============================================================================
-- WORKSPACE_SCHEDULES  (Principle 2, build-then-taper — see Flag 5)
-- ============================================================================

create table public.workspace_schedules (
  workspace_item_id uuid primary key
    references public.workspace_items (id) on delete cascade,
  deadline_date date not null,
  build_phase_end date,
  taper_start date
);

-- ============================================================================
-- FULL_RUN_THROUGH_ATTEMPTS  (Principle 5, taper-phase drill — see Flag 6)
-- ============================================================================

create table public.full_run_through_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_item_id uuid not null
    references public.workspace_items (id) on delete cascade,
  completed_without_restart boolean not null,
  duration_seconds integer not null,
  created_at timestamptz not null default now()
);

create index full_run_through_attempts_user_id_idx
  on public.full_run_through_attempts (user_id);

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

alter table public.chunks enable row level security;
alter table public.chunk_words enable row level security;
alter table public.user_chunk_progress enable row level security;
alter table public.workspace_items enable row level security;
alter table public.rehearsal_chunks enable row level security;
alter table public.user_rehearsal_progress enable row level security;
alter table public.workspace_schedules enable row level security;
alter table public.full_run_through_attempts enable row level security;

-- CHUNKS & CHUNK_WORDS: shared lesson content, same pattern as units/words
-- (0002) — readable once approved, writes are service_role-only (content
-- pipeline, Section 7) since there's no insert/update/delete policy here.

create policy "approved users can view chunks"
  on public.chunks for select
  to authenticated
  using (public.current_user_approval_status() = 'approved');

create policy "approved users can view chunk_words"
  on public.chunk_words for select
  to authenticated
  using (public.current_user_approval_status() = 'approved');

-- USER_CHUNK_PROGRESS: strictly own-rows only, same pattern as
-- user_progress (0001).

create policy "users can view their own chunk progress"
  on public.user_chunk_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own chunk progress"
  on public.user_chunk_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own chunk progress"
  on public.user_chunk_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- WORKSPACE_ITEMS: strictly own-rows only, full CRUD — same pattern as
-- talk_practice_sets (0001), which this supersedes.

create policy "users can view their own workspace items"
  on public.workspace_items for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own workspace items"
  on public.workspace_items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own workspace items"
  on public.workspace_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own workspace items"
  on public.workspace_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- REHEARSAL_CHUNKS: ownership flows through the parent workspace item, same
-- pattern as talk_practice_words (0001). Update policy added (not present
-- on talk_practice_words) since tier/opener/closer flags get corrected
-- after auto-segmentation (Section 5.6, "manually confirmable").

create policy "users can view their own rehearsal chunks"
  on public.rehearsal_chunks for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_items w
      where w.id = workspace_item_id and w.user_id = auth.uid()
    )
  );

create policy "users can insert their own rehearsal chunks"
  on public.rehearsal_chunks for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workspace_items w
      where w.id = workspace_item_id and w.user_id = auth.uid()
    )
  );

create policy "users can update their own rehearsal chunks"
  on public.rehearsal_chunks for update
  to authenticated
  using (
    exists (
      select 1 from public.workspace_items w
      where w.id = workspace_item_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspace_items w
      where w.id = workspace_item_id and w.user_id = auth.uid()
    )
  );

create policy "users can delete their own rehearsal chunks"
  on public.rehearsal_chunks for delete
  to authenticated
  using (
    exists (
      select 1 from public.workspace_items w
      where w.id = workspace_item_id and w.user_id = auth.uid()
    )
  );

-- USER_REHEARSAL_PROGRESS: strictly own-rows only.

create policy "users can view their own rehearsal progress"
  on public.user_rehearsal_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own rehearsal progress"
  on public.user_rehearsal_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own rehearsal progress"
  on public.user_rehearsal_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- WORKSPACE_SCHEDULES: ownership flows through the parent workspace item.
-- No delete policy — cascades automatically when the parent workspace item
-- is deleted.

create policy "users can view their own workspace schedule"
  on public.workspace_schedules for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_items w
      where w.id = workspace_item_id and w.user_id = auth.uid()
    )
  );

create policy "users can insert their own workspace schedule"
  on public.workspace_schedules for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workspace_items w
      where w.id = workspace_item_id and w.user_id = auth.uid()
    )
  );

create policy "users can update their own workspace schedule"
  on public.workspace_schedules for update
  to authenticated
  using (
    exists (
      select 1 from public.workspace_items w
      where w.id = workspace_item_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspace_items w
      where w.id = workspace_item_id and w.user_id = auth.uid()
    )
  );

-- FULL_RUN_THROUGH_ATTEMPTS: strictly own-rows only, immutable log — same
-- pattern as tone_practice_attempts (no update/delete policy on purpose).

create policy "users can view their own run-through attempts"
  on public.full_run_through_attempts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert their own run-through attempts"
  on public.full_run_through_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);
