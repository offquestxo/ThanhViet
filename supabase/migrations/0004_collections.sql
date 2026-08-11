-- Thanh Việt — Collection (groups Units)
--
-- Implements spec Section 9's addendum: Collection sits above Unit,
-- purely additive per this session's product decisions (docs/
-- vietnamese-app-spec.md, Section 9 addendum). Groups units the way a
-- convention program or publication would — partially resolves Open
-- Decision #5 (Section 11) one level up from Unit, without forcing that
-- decision fully (a Collection could be a program, a publication, or a
-- topic — the schema doesn't pick for you).
--
-- Run this once in the Supabase SQL Editor, AFTER 0001–0003.
--
-- FLAG: `collection_id` is nullable, not required. The spec's own framing
-- ("purely additive, nothing existing breaks") requires this — the one
-- unit already live ("Unit 1 — Greetings") predates Collection and isn't
-- assigned to one. A NOT NULL constraint would break it immediately. Once
-- existing units are backfilled with a real collection, a follow-up
-- migration can tighten this to NOT NULL if that's ever wanted.

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  "order" integer not null default 0,
  description text,
  created_at timestamptz not null default now()
);

alter table public.units
  add column collection_id uuid references public.collections (id) on delete set null;

create index units_collection_id_idx on public.units (collection_id);

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

alter table public.collections enable row level security;

-- Shared lesson content, same pattern as units/words/chunks: readable once
-- approved, writes are service_role-only (content pipeline, Section 7).
create policy "approved users can view collections"
  on public.collections for select
  to authenticated
  using (public.current_user_approval_status() = 'approved');
