# Proposal: Tone Tuner practice-attempt logging (Phase 4)

**Status:** proposal only — not applied, not in `supabase/migrations/`. Becomes
`0010_practice_attempt_logging.sql` once approved.

## What gets logged

One row per analyzed attempt (every successful `/api/tone/analyze` call):
which item, its target tones, what both models heard and their verdicts,
the agreement and `flag_for_review`, and the acoustic *features*. **No audio**,
no audio URL, no recording-derived file of any kind.

## Reconciling with the existing `tone_practice_attempts`

`tone_practice_attempts` (migration 0001) has **0 rows and no code writes to
it**. Its shape doesn't fit what the Tone Tuner became:

| 0001 column | Problem |
|---|---|
| `word_id uuid → words.id` | Tone Tuner items and picture words live in content files (`content/tone-tuner/items.json`, `content/vocab/*.json`), not the `words` table. A FK can't point at them. |
| `detected_tone`, `target_tone` (single text) | Words and phrases have one tone **per syllable**, and there are two models' readings, not one. |
| `passed boolean not null` | There is no pass/fail yet — the score is "calibrating" until native reference data exists. |

**Recommendation: evolve the table in place** (keep the name, the own-row
RLS policies, and the `user_id` index; replace the four columns). The table
is empty, so nothing is migrated or lost. The alternative — drop it and create
`practice_attempts` — is equally safe; in-place keeps the name the PRD/TAD use.

## Proposed SQL (0010)

```sql
-- Empty, never written (verified 2026-10-08) — safe to reshape.
alter table public.tone_practice_attempts
  drop column word_id,
  drop column detected_tone,
  drop column target_tone,
  drop column passed;

alter table public.tone_practice_attempts
  -- Content id, e.g. 'ma--sac' (Tone Tuner) or 'ao-thun--sac-ngang' (a picture word).
  add column item_id text not null,
  add column item_source text not null check (item_source in ('tone_tuner', 'vocab')),
  add column collection_id text,               -- set when practiced from a picture collection
  add column target_text text not null,
  add column target_tones text[] not null,     -- computed by syllable_tone(), e.g. {sac,ngang}
  add column phowhisper_transcript text,       -- null when that model was unavailable
  add column phowhisper_verdict text,          -- match | tone_mismatch | different_word | missing
  add column parakeet_transcript text,
  add column parakeet_verdict text,
  add column agreement text not null check (agreement in (
    'both_match', 'both_tone_mismatch_same', 'both_tone_mismatch_different',
    'both_same_other_word', 'disagree', 'unclear', 'partial_unavailable')),
  add column heard_as text,                    -- only when both models agree
  add column flag_for_review boolean not null,
  add column acoustic jsonb,                   -- features only — see below
  add column client_audio_type text;           -- 'audio/mp4' (Safari) / 'audio/webm' — debugging only

create index tone_practice_attempts_review_idx
  on public.tone_practice_attempts (created_at desc) where flag_for_review;

-- Existing policies stay: users insert/select their own rows.
-- New: staff can read attempts to review flagged ones.
create policy "staff can read tone practice attempts"
  on public.tone_practice_attempts for select
  to authenticated
  using (public.current_user_role() in ('admin', 'ceo'));
```

`acoustic` stores exactly what the engine already returns for single words,
minus nothing: `status`, `sample_rate_hz`, `pitch_contour` (≈100 points of
`{t_ms, f0_hz}`), `voice_breaks`, `duration_ms`, `voiced_duration_ms`,
`median_f0_hz`, `phonation` (jitter, shimmer, HNR, longest break),
`validation_warnings`. For phrases it is `{"status": "skipped_multisyllable"}`.

## Write path

`/api/tone/analyze` inserts the row after a successful analysis, through the
caller's own session (RLS own-row insert) — same place it already bumps the
streak, and like the streak, a failed insert never fails the response.

## Decisions for you

1. **Pitch contours are derived from someone's voice.** They're not audio and
   can't be played back, but they are voice characteristics. Storing them is
   what makes calibrating the tone score possible later. Keep them, or log
   only the summary numbers?
2. **Admins can read members' attempts** (what the models heard). Needed to
   review flags; it does mean staff see who practised what. OK?
3. **Privacy line.** The Tone Tuner currently says recordings aren't stored —
   still true — but this adds "we keep the text of what the models heard".
   Proposed copy: *"Beta. Recordings are analyzed by our tone engine and
   NVIDIA's speech-recognition service and never stored. We keep what the
   models heard to improve the Tone Tuner."*
4. **Retention.** Suggest deleting attempts older than 180 days (a scheduled
   SQL job), or keep indefinitely during the beta?
5. **Loanword spellings.** Some attempts will be flagged only because a model
   wrote "sofa" for *sô-pha* or "sandal" for *xăng-đan*. Logging makes these
   visible; the fix (an alias list in the comparison) is separate work.
