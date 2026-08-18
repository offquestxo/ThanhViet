-- Thanh Việt — Workspace/Practice schema alignment against PRD Section 6a
--
-- Brings workspace_items/rehearsal_chunks/user_rehearsal_progress (from
-- migration 0003) in line with the resolved Section 6a design: optional
-- deadlines, a Comments assignment type, soft-delete, TTS-vs-native audio
-- tracking, inline-quotation flagging, a fix for a real (verified live)
-- reordering bug, the self-rating/restart-count weak-spot signals, and the
-- new admin-visibility view. Also adds Claude-generated English text per
-- breath group (Section 6a's reversed intake decision).
--
-- Run this once in the Supabase SQL Editor, AFTER 0005. Applied by hand —
-- see Engineering-Standards.md Section 2 (no CLI/direct DB connection is
-- configured for this project).
--
-- ============================================================================
-- FLAGS
-- ============================================================================
--
-- 1. item_type gets 'comment' added, not a full rename. A rename of 'demo'
--    -> 'demonstration' / 'reading' -> 'scripture_reading' was floated as a
--    free option (the table is empty) but never confirmed, so it's not
--    done here — only the confirmed 'comment' addition.
--
-- 2. rehearsal_chunks.audio_url/audio_source and english_text/
--    english_generated_at are added as plain nullable columns, not a status
--    enum. Per the resolved decision, generic-quality generated content is
--    acceptable as-is; null simply means "not generated yet" (or a failed
--    attempt that's safe to retry). A CHECK keeps audio_url/audio_source
--    moving together (both null or both set) as a light integrity
--    safeguard — no equivalent constraint is added for english_text since
--    english_generated_at is an observability timestamp, not a paired
--    state flag.
--
-- 3. rehearsal_chunks' unique(workspace_item_id, display_order) constraint
--    is dropped and recreated as DEFERRABLE INITIALLY DEFERRED. This isn't
--    speculative — a plain two-row reorder (A:0->1, B:1->0 as two
--    sequential updates, the naive shape any drag-reorder handler would
--    produce) was verified live against the current constraint and threw a
--    duplicate-key error. Recreated rather than ALTERed in place since the
--    table is currently empty (zero rows) and drop+recreate is unambiguous
--    about the resulting constraint definition.
--
-- 4. admin_workspace_progress_view is a VIEW, not a new RLS policy on the
--    base tables. This distinction matters: RLS controls which *rows* a
--    role can see, not which *columns* — a naive admin SELECT policy
--    directly on workspace_items/rehearsal_chunks would let an admin read
--    source_text/text/english_text by querying the base table directly,
--    which is exactly the leak Section 6a's privacy language rules out.
--    Instead: the view is created WITHOUT security_invoker (so it runs
--    with its owner's privileges against the base tables, bypassing their
--    owner-only RLS internally — standard Postgres view behavior), its own
--    column list never selects source_text/text/english_text at all, and
--    the actual per-caller authorization is a WHERE clause using the
--    existing current_user_role() helper (migration 0002) — auth.uid()
--    reflects the real calling session regardless of the view's
--    security_invoker setting, so this correctly gates per real user, not
--    per view-owner. A non-admin querying this view gets zero rows, not a
--    permission error — that's the intended behavior, not a bug.
--
-- ============================================================================
-- WORKSPACE_ITEMS
-- ============================================================================

alter table public.workspace_items
  alter column deadline_date drop not null;

comment on column public.workspace_items.deadline_date is
  'Optional per Section 6a. Null = ongoing practice, no deadline-driven
   scheduling engine applied — see workspace_schedules, which simply has no
   row for such an item.';

alter table public.workspace_items
  drop constraint workspace_items_item_type_check;

alter table public.workspace_items
  add constraint workspace_items_item_type_check
    check (item_type in ('talk', 'demo', 'prayer', 'reading', 'comment', 'other'));

alter table public.workspace_items
  add column archived_at timestamptz;

comment on column public.workspace_items.archived_at is
  'Soft-delete per Section 6a — deleting an assignment sets this rather
   than removing the row. Null = active. Active-list queries filter
   archived_at is null.';

create index workspace_items_active_idx
  on public.workspace_items (user_id)
  where archived_at is null;

-- ============================================================================
-- REHEARSAL_CHUNKS
-- ============================================================================

alter table public.rehearsal_chunks
  add column is_quotation boolean not null default false,
  add column audio_url text,
  add column audio_source text check (audio_source in ('tts', 'native')),
  add column english_text text,
  add column english_generated_at timestamptz,
  add constraint rehearsal_chunks_audio_pair_check
    check ((audio_url is null) = (audio_source is null));

comment on column public.rehearsal_chunks.is_quotation is
  'Section 6a: "Scripture quotations always default verbatim." Separate
   from is_opener/is_closer since a quotation can appear inline in any
   assignment type, not just item_type = ''reading''.';

comment on column public.rehearsal_chunks.audio_source is
  'Tracks the TTS-vs-native state behind Section 6a''s "reference audio
   plays every group, every time... silently upgraded per-item as
   recordings come in." tts = interim stand-in, native = real recording.';

comment on column public.rehearsal_chunks.english_text is
  'Section 6a (reversed from the original draft): auto-generated via the
   Claude API at intake, not learner-typed, not on-demand MT. Generic
   translation quality is accepted as-is, including for quoted-Scripture
   spans — this is a rehearsal aid, not a doctrinal reference. Null =
   not yet generated (or a failed attempt), safe to retry; never
   regenerated once populated.';

-- Fix 3 (see FLAGS) — verified live that a naive two-row reorder throws
-- under the plain unique constraint from migration 0003.
alter table public.rehearsal_chunks
  drop constraint rehearsal_chunks_workspace_item_id_display_order_key;

alter table public.rehearsal_chunks
  add constraint rehearsal_chunks_workspace_item_id_display_order_key
    unique (workspace_item_id, display_order) deferrable initially deferred;

-- ============================================================================
-- USER_REHEARSAL_PROGRESS
-- ============================================================================

alter table public.user_rehearsal_progress
  add column last_self_rating text
    check (last_self_rating in ('struggled', 'okay', 'easy')),
  add column restart_count integer not null default 0;

comment on column public.user_rehearsal_progress.last_self_rating is
  'The rehearsal loop''s "mark difficulty (Struggled / Okay / Easy)" step
   (Section 6a) — most-recent value only, no per-attempt history table.
   One of the three signals (alongside restart_count and the existing
   avg_hesitation_ms/error_count) feeding the weak-spot system.';

comment on column public.user_rehearsal_progress.restart_count is
  'Explicit restart detection, distinct from avg_hesitation_ms (pause
   length within a take) — Section 6a names "hesitation/restart detection"
   as two separate signals.';

-- ============================================================================
-- ADMIN_WORKSPACE_PROGRESS_VIEW  (see Flag 4)
-- ============================================================================

create view public.admin_workspace_progress_view
with (security_invoker = false)
as
select
  wi.id as workspace_item_id,
  wi.user_id,
  wi.item_type,
  wi.title,
  wi.deadline_date,
  wi.archived_at,
  wi.created_at,
  count(urp.id) as total_chunks,
  count(urp.id) filter (where urp.mastery_status = 'weak') as weak_chunks,
  count(urp.id) filter (where urp.mastery_status = 'developing') as developing_chunks,
  count(urp.id) filter (where urp.mastery_status = 'ready') as ready_chunks,
  max(urp.last_practiced_at) as last_practiced_at,
  (
    select count(*)
    from public.full_run_through_attempts fra
    where fra.workspace_item_id = wi.id
      and fra.completed_without_restart
  ) as successful_run_throughs
from public.workspace_items wi
left join public.rehearsal_chunks rc on rc.workspace_item_id = wi.id
left join public.user_rehearsal_progress urp on urp.rehearsal_chunk_id = rc.id
where public.current_user_role() in ('admin', 'ceo')
group by wi.id;

comment on view public.admin_workspace_progress_view is
  'Section 6a: "group admins can see practice activity/progress metadata...
   but not recording content... or the verbatim text." Deliberately never
   selects source_text/rehearsal_chunks.text/english_text — see Flag 4
   above for why this is a view + WHERE-clause gate rather than a base-
   table RLS policy.';

revoke all on public.admin_workspace_progress_view from public, anon;
grant select on public.admin_workspace_progress_view to authenticated;
