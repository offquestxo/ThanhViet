# Thanh Việt — Technical Architecture Document (TAD)

*Split from the master spec on August 11, 2026. See also: PRD (Product Requirements), UI/UX Design System, Engineering Standards.*

## 1. Tech Stack

Given: mobile-first *end goal* but starting **web-first** for faster iteration and easier setup (no Node/Expo environment needed to get going, no app-store review for internally-distributed, copyrighted-content-based material), cloud sync required, live audio processing is the hardest technical piece.

**Sequencing:** Phase 1 (MVP) ships as an installable web app (PWA). Phase 3 migrates the frontend to React Native/Expo for real app-store distribution. The backend — Supabase (Postgres, Auth, Storage, RLS) and the Python/FastAPI audio-analysis service — stays identical across both phases; only the client layer changes. This isn't a free migration (screens get rebuilt for React Native rather than copy-pasted), but no backend work, schema design, or Tone Tuner logic is thrown away.

| Layer | Recommendation | Why |
|---|---|---|
| Web app framework (Phase 1) | **Next.js (App Router) + TypeScript** | Fast to build and deploy, installable as a PWA for an app-like feel without app-store review; TypeScript catches mistakes early and pairs well with AI-assisted development |
| Mobile app framework (Phase 3) | **React Native + Expo + TypeScript** | Single codebase for iOS + Android when it's time for real app-store distribution |
| Hosting (web) | **Vercel** | Straightforward Next.js deployment, share a URL, fast iteration |
| Navigation | **Next.js App Router** (Phase 1) → **Expo Router** (Phase 3) | Standard routing for each respective framework |
| Server state | **TanStack Query** | Handles fetching/caching/syncing data from Supabase (lessons, progress); same library works in both web and React Native |
| Local/UI state | **Zustand** | Lightweight state for things like the current drill or live tuner state; same library works in both web and React Native |
| Backend platform | **Supabase** | Postgres + auth + storage + realtime, minimal infrastructure to manage |
| Database | **Supabase Postgres** | Relational fits the data model well (users, lessons, words, progress) |
| Authentication | **Supabase Auth** | Individual logins per user |
| File/audio storage | **Supabase Storage** | Native-speaker recordings + user practice recordings |
| Authorization | **Postgres Row-Level Security** | Locks each user's progress/recordings to them at the database level, not just the app level |
| Normal API operations | **Supabase client + Edge Functions** | Covers standard CRUD without a full custom backend |
| Audio-analysis service | **Python + FastAPI** | A separate service dedicated to the Tone Tuner's pitch analysis (not tied to web vs. mobile — same service serves both) |
| Signal processing | **TorchAudio / librosa / Praat-Parselmouth** | Praat-Parselmouth in particular is a phonetics research tool built specifically for pitch/tone contour analysis |
| Client-side pitch detection (web) | **Pitchy or Aubio.js** (optional, web-only) | Browser-based YIN-algorithm pitch tracking via Web Audio API — can power the live "tuner needle" feel client-side, since browsers have mature mic-access APIs |
| ASR verification | **Google Speech-to-Text V2** (optional) | Used only for verification, not core tone detection |
| Local lesson cache | **Browser storage/service worker (Phase 1)** → **Expo SQLite (Phase 3)** | Web offline support is more limited (especially notifications on iOS Safari) |
| Builds/releases | **Vercel (Phase 1)** → **EAS Build + EAS Update (Phase 3)** | Minimal DevOps overhead for a small team |
| Analytics | **PostHog** | Enough to see engagement without custom build |
| Error tracking | **Sentry** | Catch issues in production from day one |
| Admin console | **Next.js + Supabase** | Founder-facing tool to add lesson content without touching the app code |

**Note on architecture:** this stack runs two backends — Supabase for the main app, and a separate Python/FastAPI service for audio analysis. That's the right call (Python's audio-processing ecosystem is far ahead of anything in Node), but it means a bit more deployment surface: the FastAPI service needs its own hosting (e.g., Fly.io or Render) alongside Supabase.

**Trade-off to keep in mind for Phase 1 (web):** no offline support, and push notifications are weaker on mobile web (especially iOS Safari) — fine for a small group mostly on wifi/data, but worth revisiting once streak-reminder notifications matter more.

---

## 2. As-Built Stack (Reality Check)

*Living section — update as the actual codebase diverges from or confirms the plan above.*

- Next.js + TypeScript + Tailwind, App Router, `src/` layout — confirmed
- Supabase (Postgres, Auth, Storage, RLS) — confirmed, live project `pcywqsswbgodycqsanwm`
- TanStack Query — installed, provider wired in root layout
- Zustand — installed, not yet used (no local/UI state need arose until the Tone Tuner or lesson drills required it)
- **Not yet installed as of the homepage redesign:** shadcn/ui, Framer Motion, Lucide Icons — install these first (sequencing proposed during PRD/TAD planning, not yet formalized as a standing convention in Engineering-Standards.md)
- Python/FastAPI audio service — **not started**, gated on Phase 1b reference-recording collection

---

## 3. Content Pipeline (Founder-Supplied Material)

Since all content comes from the founder (JW.org, wol.jw.org, and other material), the app needs a lightweight way to turn that into structured lesson data without hand-coding each entry:

1. **Source intake** — connected Vietnamese text (sentences/phrases from real talks, not isolated word lists — source material already has translations, so English meaning comes along for the check/reveal step) and native-speaker audio, ideally at the chunk (sentence/phrase) level, with word-level audio for the subset of words used in Tone Tuner drills
2. **Structuring** — content gets organized into Collections → Units → Chunks (sentence/phrase-level entries with Vietnamese text, English meaning, source context, and audio); each chunk references the underlying `Word` entries it contains for Tone Tuner purposes
3. **Admin console (Phase 1 build)** — a simple internal tool so the founder can add new units and chunks without a developer touching code each time. **As-built:** currently a JSON-file seed script (`scripts/seed-unit.mjs`), idempotent on re-run — the full admin UI is not yet built
4. **Copyright handling** — because JW.org/wol.jw.org content is copyrighted by the Watch Tower Bible and Tract Society, the app should be treated as an internal study tool for the defined group rather than a public product — this affects distribution (e.g., private app distribution / TestFlight-style internal distribution rather than public App Store listing) more than it affects the technical build. Worth revisiting before any public release.

---

## 4. Tone Tuner — Architecture Decision

This is the hardest and most novel part of the app. Two decisions from the original scoping, plus one **critical correction** surfaced by deeper phonetics research since — flagged first, because it changes the pipeline, the dataset spec, and the go/no-go criteria all at once.

**Not yet implemented as of this document's split** — see PRD Section 5, Phase 1b for build status.

### 4.0 Critical Revision: Pitch Contour Alone Is Not Sufficient

**The corrected premise:** it's true that raw pitch (Hz) is the wrong thing to compare — but *contour shape alone* is also not enough. Northern Vietnamese is better treated as a **register language**, not a pure pitch-contour tonal language: at least two tones, arguably three, are defined as much by voice quality as by pitch shape.

| Tone (Northern) | Pitch behavior | Voice quality requirement | Pitch-only tracking risk |
|---|---|---|---|
| ngang (T1) | mid level | modal (clean) voice | Low — pitch alone is reliable |
| huyền (T2) | low falling | modal voice | Low — pitch alone is reliable |
| sắc (T3) | high rising | modal voice | Low — pitch alone is reliable |
| hỏi (T5) | dipping-rising | breathy / more constricted phonation | Moderate — phonation is a supporting cue, evidence less unanimous |
| ngã (T6) | high, broken/rising | glottalization mid-vowel (creaky, voice interruption) | **High** — pitch tracking is unreliable or gaps during the glottal break itself |
| nặng (T4) | low, short, falling | creaky voice, often glottal closure at the end | **High** — creakiness causes irregular glottal pulses, unreliable F0 exactly where the tone's identity lives |

**Why this matters concretely:** a naive contour-cleaning step ("fix octave errors, smooth, filter low-confidence frames") would treat the glottal gap in ngã or nặng as a tracking error and smooth over the exact feature that identifies the tone. That needs to be corrected in the pipeline design, not patched after the fact.

**The fix doesn't require a new library.** Praat/Parselmouth already computes the relevant voice-quality measures (jitter, shimmer, harmonics-to-noise ratio, H1–H2 spectral tilt) used throughout the Vietnamese tone-acoustics literature to quantify creakiness and breathiness. The requirement is architectural: treat "glottalization detected" as a first-class output the pipeline produces, not noise to be filtered away.

### 4.1 Revised Signal Pipeline

1. Validate audio quality
2. Detect the speech region
3. Isolate the vowel (tone lives in the syllable nucleus)
4. Extract pitch (Praat/YIN) **and** voice-quality measures (jitter, shimmer, HNR, H1–H2) **in parallel**, not as a fallback
5. Clean the contour — but explicitly distinguish "low-confidence frame due to noise" from "low-confidence frame due to genuine glottalization" *before* smoothing; the latter is signal, not noise, for ngã and nặng
6. Normalize pitch by speaker and by time (semitone/log-frequency — see 4.2)
7. Extract features: start pitch, end pitch, slope, turning point, duration, **plus glottalization presence/timing and phonation-type indicators** for the tones where they matter
8. Score against a reference range (not a single target), using **tone-appropriate feature weighting** — **confirmed scope: full voice-quality/glottalization scoring runs for all six tones in v1** (not deferred to just ngã/nặng/hỏi), even though ngang/huyền/sắc are expected to lean pitch-dominant in practice
9. Generate one specific, actionable correction — e.g. "start slightly lower," or, for glottalized tones, "add more of a catch/break in your voice," not just "wrong" — and drive a **dual-layer visual**: pitch contour line (attempt vs. target) *and* glottalization/creak shown visually, not folded silently into a single score

### 4.2 Validated Decisions

- **Dedicated Python/FastAPI audio-analysis service, separate from Supabase** — correct; real-time signal processing doesn't belong in Node/Edge Functions.
- **Praat/Parselmouth as the core library** — correct, and it already supports the voice-quality measures needed for 4.0/4.1 without adding a new dependency.
- **Speaker normalization via semitone/log-frequency, not raw Hz** — strongly validated; standard practice in tone-focused CAPT (computer-assisted pronunciation training) research, since absolute pitch varies by speaker age/sex while relative contour shape doesn't.
- **Google Speech-to-Text as optional verification only** — correct prioritization; tone identification is a pitch/voice-quality problem, not a word-recognition problem.
- **Three separate scores (audio usable / right word / right tone)** — well-aligned with current CAPT practice, which favors multi-aspect scoring over a single pass/fail specifically to avoid misattributing a bad recording as a pronunciation error.

This runs as a second backend service alongside Supabase, hosted separately (e.g., Fly.io or Render).

### 4.3 Product Decisions (Confirmed)

Locked in during a follow-up product/research session, treated as settled scope unless explicitly revisited:

| # | Decision | Detail |
|---|---|---|
| 1 | Dialect scope | Northern first. Architecture supports adding Southern later without a rebuild — a separate reference dataset and separate scoring target (Southern merges hỏi/ngã into one effective tone, plus consonant differences), not just a UI label. |
| 2 | Engine roadmap | Rule-based scoring logic now; move toward a learned model once enough labeled recordings exist. (Distinct from the pitch-*extraction* front-end — see 4.4, which recommends a neural extractor even in v1; the scoring/decision layer on top stays rule-based first.) |
| 3 | Correction feedback scope | **Confirmed: full voice-quality (glottalization) feedback for all six tones from v1** — not deferred to just the high-risk tones. |
| 4 | Practice unit | **Words only for v1** (not phrases) — short phrases are Phase 2, consistent with sentence-level grading already being deferred there. |
| 5 | Feedback timing | Instant, per recording — a hard low-latency requirement on the pipeline, which factors directly into the offline/online decision (4.6) and the pitch-tracker choice (4.4). |
| 6 | Content source | Entirely curated, preset content — no user customization of what goes into Tone Tuner. Users work through a fixed series, not open browsing or selection (by Collection/Unit/Word/Weak Words/Favorites, etc. — explicitly considered and rejected). |
| 7 | Freeform guardrail | Freeform practice is **blocked** for any word without recorded reference data — no best-effort/estimated scoring. The curated list is the entire usable vocabulary at any given time; dataset growth directly gates feature growth. Workspace will eventually consume this same engine (4.5) and inherits this same guardrail. |
| 8 | Visual feedback | Dual-layer: pitch contour line (attempt vs. target) **and** glottalization/creak shown visually, not just folded into a score. |
| 9 | User-added vocabulary | **Resolved: no user customization, ever, in the foreseeable term.** The curated word/phrase set is entirely preset; users only ever select from what's been curated and recorded. Vocabulary grows via the founder/content pipeline, not user contribution — removes any "user adds an unrecorded word" edge case. |

### 4.4 Technology Recommendations (Current State of the Art)

Two components have meaningfully better options now than classical Praat/YIN-only pipelines, both directly relevant to Decision 5 (instant feedback) and Decision 3 (full voice-quality scoring for all tones):

**Pitch tracking — add a neural pitch tracker alongside Praat/YIN.** Classical trackers (Praat's autocorrelation, YIN, RAPT) are fast and interpretable but less robust under noise than deep-learning-based trackers — a real concern for a mobile app used outside a studio. CREPE (a CNN estimating pitch directly from raw waveform) holds accuracy better across noise conditions than classical methods; lightweight successors (SwiftF0, FCPE, PENN) are built specifically for real-time use, and TorchCREPE already provides a practical PyTorch implementation fitting a Python-based service. **Recommendation:** keep Praat/Parselmouth for prototyping, reference-dataset analysis, and interpretable feature extraction (jitter, shimmer, HNR); use a lightweight neural pitch tracker (SwiftF0 or TorchCREPE) as the primary extractor in the production real-time path.

**Voice-quality/glottalization detection — use a dedicated classifier, not a static formula.** Static Praat-formula measures (jitter, shimmer, H1–H2) are a reasonable baseline, but F0-adjacent measures are known to be unreliable in exactly the glottalized regions that matter most. Purpose-built creak/voice-quality classifiers outperform static-formula approaches. **Recommendation:** budget a dedicated glottalization/creak detector into the v1 pipeline, not a v2 add-on. Start as a simpler acoustic-feature classifier (SVM or small neural net on jitter/shimmer/periodicity) and graduate to a raw-waveform CNN once enough labeled Vietnamese creaky/non-creaky examples exist from the reference dataset.

**Why modern end-to-end ASR still isn't the core engine.** Even current streaming ASR architectures remain optimized for the most probable word sequence, not fine-grained tone/voice-quality scoring — a different problem in kind, not just scale, from what Tone Tuner needs to solve.

### 4.5 Product Surface: Shared Engine, Multiple Consumers

Confirmed architecture: the Tone Tuner is **one backend engine, consumed by three different frontends** over time, not three separate implementations:

1. **Tone Tuner tab (primary, v1)** — its own dedicated space where users work through a **preset series** from the curated dataset (words now, phrases per the Phase 2 plan) — not open browsing or customization.
2. **Collections tab (v1, already designed)** — the Chunk Drilling step embeds a pass/fail Tone Tuner check on key words from the day's chunk; this is a consumer of the same engine, not a separate build.
3. **Practice/Workspace tab (deferred, not v1)** — Tone Tuner elements get embedded into rehearsal eventually. Not yet designed. When this happens, it inherits the same freeform guardrail (Decision 7): a word from someone's own talk only gets pronunciation feedback if it's already in the curated reference dataset.

### 4.6 Reference Data — Revised Guidance

The original call for 5–10 speakers × 3–5 repetitions per word stands, with one addition: the recorded speaker set must explicitly include **clear, unambiguous examples of glottalization** for ngã and nặng specifically. A speaker set that happens to underrepresent creakiness would silently reproduce the pitch-only blind spot inside the reference data itself, even with the corrected pipeline.

**Dataset staging:** the staged six-word first milestone (one word per tone, prove the pipeline before scaling up) — that six-word set must include at least one glottalized tone as a real test case.

**Regression fixture set:** add explicit cases for glottalized tones — e.g., a correct ngã with clear glottalization *vs.* a ngã attempt with correct pitch contour but no glottalization at all, which under a pitch-only design would likely have scored as correct despite being perceptually wrong to a native listener.

### 4.7 Remaining Open Decisions

1. **Offline vs. online** — online-first for MVP, architected so it can swap to an on-device model later without a rearchitecture. Both the neural pitch tracker and the creak classifier need to run within the instant-feedback latency budget (Decision 5).
2. **Feature-weighting formula** — how pitch-contour score and phonation-type score combine into one tone verdict needs empirical tuning once real reference recordings exist.
3. **Whether hỏi needs the same phonation-inclusive treatment as ngã/nặng**, or can stay primarily pitch-contour-scored — the evidence is less unanimous here than for the other two.
4. **Go/no-go criteria addition:** alongside agreement on "correct," stability across repeated attempts, and fair handling of different voice ranges — add an explicit check that the system does **not** silently mis-score glottalized tones as correct based on pitch contour alone.
5. **Adaptive grading strictness by learner level** — flagged, not decided.
6. **Sizing of the initial curated word list** — a real launch-scope question given the freeform guardrail: the curated list *is* the entire usable vocabulary at launch.
7. **Creak/glottalization classifier: train in-house on the Vietnamese reference dataset, or adapt an existing model (e.g., DeepFry) via transfer learning** — worth a short feasibility check before committing engineering time.

---

## 5. Data Model

**Note on this revision:** `Chunk` (sentence/phrase-level, pulled from real talks) is the *primary* teaching unit, per the concept-first design (PRD Section 2). `Word` still exists and still matters — it's the required unit for the Tone Tuner and a supporting reference layer — but lessons, the SRS engine, and Practice/Workspace now schedule and track progress at the `Chunk` level, not the `Word` level.

`Collection` sits above `Unit` — `Unit` conceptually plays the role of a "Journey" (a sequential, unlockable learning experience); `Collection` is the natural grouping above it (e.g., "2027 Convention," "Bible Reading Series," "Scriptures," "Family Worship").

**Synced against the live schema (migrations 0001–0007) as of this revision.** Previously this section had drifted in several places that were never Workspace-related: `profiles`' role/approval/points fields (0002), `collections`' icon_key/theme_key (0005), `chunks.display_order` (0003), and the `timestamp` → `created_at` rename that `FullRunThroughAttempt` already documented but `TonePracticeAttempt` never picked up. `UserStreak` was never listed here at all despite being live since 0001. All fixed below in one pass, not just the Workspace delta.

```
User (profiles table)
 - id, name, avatar_url, accent_pref, total_points, created_at
 - role (member | admin | ceo — migration 0002), approval_status (pending | approved | rejected — migration 0002), email (mirrors auth.users.email — migration 0002)

Collection
 - id, title, description, display_order (as `order`), icon_key (book | presentation | microphone | library — migration 0005), theme_key (primary | secondary | accent | muted — migration 0005), created_at

Unit
 - id, collection_id (nullable), title, order, source_reference (e.g., "July 2026 Convention Program"), created_at

Chunk
 - id, unit_id, vietnamese_text, english_text, source_context (e.g. which talk/paragraph this came from), audio_url, structural_concept (tags: classifier | topic_comment | particle | tone_identity | none — drives Pattern Noticing selection), display_order, created_at

ChunkWord
 - chunk_id, word_id, display_order (which Word entries appear within this chunk — links chunks to the Tone Tuner's word-level data; composite PK, no surrogate id)

Word
 - id, vietnamese_text, english_text, tone_pattern, audio_url, created_at
 (no longer unit-scoped directly — reached via ChunkWord; still the atomic unit for Tone Tuner drills)

UserChunkProgress
 - id, user_id, chunk_id, mastery_level, recognition_accuracy, last_practiced_at
 - SRS fields: interval_days, ease_factor, next_review_at, consecutive_correct
   (real spaced-repetition scheduling. As-built: `interval_days`/`ease_factor` are SM-2 vocabulary, not HLR
    vocabulary. Phase 1a treats interval_days as the item's current half-life estimate itself — continuous,
    not day-granular — with next_review_at = last_practiced_at + interval_days, since predicted recall
    probability hits 50% exactly at t = half-life. ease_factor is a hand-rolled per-item growth multiplier
    [grows on correct recall, shrinks on lapse], not a trained HLR weight — real HLR needs a shared
    logistic-regression model over real interaction volume across users, which doesn't exist yet.)

UserWordProgress
 - id, user_id, word_id, pronunciation_accuracy, last_practiced_at
 (Tone Tuner-specific progress, separate from chunk-level SRS since word-level tone practice has its own cadence)
 (NOT YET BUILT — this reflects the target/planned shape only. The currently live table, from migration
  0001 and unmodified since, is `user_progress`: id, user_id, word_id, mastery_level, last_practiced_at,
  accuracy_history [jsonb] — no `pronunciation_accuracy` field, never renamed. The rename/field addition
  is deferred until Tone Tuner scoring's actual data needs are decided [Section 4.7, open decisions 4-6
  and 9]. Don't treat UserWordProgress as implemented.)

WorkspaceItem
 - id, user_id, title, source_text, item_type (talk | demo | prayer | reading | comment | other — 'comment' added 0006), deadline_date (nullable — 0006, optional deadlines per PRD Section 6a), archived_at (nullable, soft-delete — 0006), created_at

RehearsalChunk
 - id, workspace_item_id, text, display_order, tier (verbatim | gist), is_opener (bool), is_closer (bool), is_quotation (bool — 0006, inline Scripture-quotation flagging independent of item_type), audio_url (nullable — 0006), audio_source (tts | native, nullable, paired with audio_url via a CHECK — 0006), english_text (nullable, Claude-generated — 0006), english_generated_at (nullable — 0006), gist_prompt (nullable, hand-authored — 0007)
 (breath-group segmented, ~10–15 words, following clause/punctuation — distinct from Collections' `Chunk`. display_order's uniqueness constraint is DEFERRABLE INITIALLY DEFERRED as of 0006 — reordering must be written as a single batched multi-row write, e.g. one upsert call; a naive sequence of individual per-row updates still violates it, verified live against the migrated schema)

UserRehearsalProgress
 - id, user_id, rehearsal_chunk_id, error_count, avg_hesitation_ms, last_practiced_at, mastery_status (weak | developing | ready), last_self_rating (struggled | okay | easy, nullable — 0006), restart_count (0006), rep_count (0007)
 (drives weak-spot-first resurfacing per PRD Section 6a's selectRehearsalSession algorithm: mastery_status is the single stored source of truth, written by the rep-completion action from last_self_rating/restart_count/avg_hesitation_ms — weak if last_self_rating='struggled' OR restart_count>=2 OR avg_hesitation_ms exceeds a picked 800ms default. rep_count (0007) is a distinct signal from restart_count — total reps completed vs. reps abandoned/restarted — and is required alongside mastery_status != 'weak' for the no-look-at-text gate (rep_count >= 2, picked default). Deliberately no SRS interval fields — deadline-driven build-then-taper, not long-horizon spaced repetition.
  Known redundancy, flagged not fixed: RehearsalChunk is always 1:1-owned via WorkspaceItem, so this join table's many-to-many shape is
  structurally unnecessary here — kept as specified for now.)

WorkspaceSchedule (workspace_schedules table — persisted cache of computable deadline-derived values; known deadline_date duplication flagged in migration 0003 and intentionally retained for now)
 - workspace_item_id, deadline_date, build_phase_end, taper_start
 (computed from deadline_date; drives the build-then-taper practice-volume curve. Session-*capacity* per phase is resolved — PRD Section 6a's picked defaults: 4 chunks before build_phase_end, 10 at peak, 6 during taper, 6 flat for undated items. The phase-*boundary* day-thresholds themselves — how many days before the deadline build_phase_end/taper_start actually fall — remain an open implementation detail, Section 6 below.)

FullRunThroughAttempt
 - id, user_id, workspace_item_id, completed_without_restart (bool), duration_seconds, created_at (renamed from the spec sketch's `timestamp` — see migration 0003 Flag 6)
 (taper-phase drill; contributes toward "ready" status — exact criteria still open. Also the vehicle for PRD Section 6a's periodic forced full run-through: picked cadence is every 5th eligible rehearsal session, and always on the final day. The final day's run-through IS the Deadline engine's "final-day-light" recommendation, not a separately-sized capacity session on top of it — the final day bypasses per-chunk session-capacity selection [UserRehearsalProgress above] entirely in favor of this one whole-piece pass.)

AdminWorkspaceProgressView (admin_workspace_progress_view — migration 0006, a view, not a table)
 - workspace_item_id, user_id, item_type, title, deadline_date, archived_at, created_at, total_chunks, weak_chunks, developing_chunks, ready_chunks, last_practiced_at, successful_run_throughs
 (Group-admin visibility per PRD Section 6a — rolled up to item level, never selects source_text/rehearsal_chunks.text/english_text. Gated by a WHERE clause inside the view itself (current_user_role() in ('admin','ceo')), not RLS on the base tables — RLS controls rows, not columns, and a naive admin SELECT policy directly on workspace_items/rehearsal_chunks would leak verbatim content to anyone querying those tables directly. A non-admin querying this view gets zero rows, not a permission error.)

TonePracticeAttempt
 - id, user_id, word_id, detected_tone, target_tone, passed (bool), created_at (renamed from `timestamp`, matching FullRunThroughAttempt — this section previously still said `timestamp`)

Badge / UserBadge
 - standard badge/achievement join table

LeaderboardEntry (leaderboard view — computed, not stored)
 - user_id, name, total_points, current_streak
 (a Postgres view joining profiles.total_points + user_streaks.current_streak — corrected from the previous "derived from UserChunkProgress + streaks," which didn't match: total_points is a maintained rolling total on profiles, updated directly by completeChunk, not recomputed from UserChunkProgress rows)

UserStreak (user_streaks table — live since migration 0001, never previously listed in this section)
 - user_id, current_streak, longest_streak, last_activity_date
 (day-level streak. Per PRD Section 6a: bumped by both Collections' completeChunk and Practice rehearsal-session completion — one shared streak, not a separate Practice-specific one. Practice reps award zero points, per the same Section 6a decision.)
```

**As-built note:** `talk_practice_sets`/`talk_practice_words` (an earlier, pre-redesign stub for the same Workspace feature) were dropped in migration 0003 rather than left as dead schema alongside the new `WorkspaceItem`/`RehearsalChunk` model.

---

## 6. Technical Open Decisions

1. Offline requirement for the Tone Tuner (Section 4.7)
2. Exact SRS algorithm refinement — real Half-Life Regression (a trained model) vs. the current simplified per-item heuristic; deferred until real usage data exists
