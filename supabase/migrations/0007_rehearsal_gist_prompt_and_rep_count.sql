-- Thanh Việt — gist-mode prompts + rep-count for the mastery gate (PRD Section 6a)
--
-- Two additive columns, nothing else:
--
-- 1. rehearsal_chunks.gist_prompt — hand-authored keywords/prompt shown
--    during gist-mode rehearsal, never algorithmically derived from
--    vietnamese_text or english_text. Nullable; a group without one
--    simply has nothing to show if gist mode is used before this gets
--    authored.
--
-- 2. user_rehearsal_progress.rep_count — total reps completed on a
--    chunk, distinct from restart_count (how many reps were abandoned/
--    restarted mid-take). The resolved no-look-at-text gate requires
--    BOTH rep_count >= 2 AND mastery_status != 'weak' — rep_count didn't
--    exist anywhere in the schema before this, a real mismatch against
--    the resolved PRD language, not just a doc gap.
--
-- Run this once in the Supabase SQL Editor, AFTER 0006.

alter table public.rehearsal_chunks
  add column gist_prompt text;

alter table public.user_rehearsal_progress
  add column rep_count integer not null default 0
  check (rep_count >= 0);
