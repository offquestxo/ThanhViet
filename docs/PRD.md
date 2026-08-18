# Thanh Việt — Product Requirements Document (PRD)

*Split from the master spec on August 11, 2026. See also: TAD (Technical Architecture), UI/UX Design System, Engineering Standards.*

## 1. Vision

A Vietnamese learning app built for one specific community — a Vietnamese-learning group of ~20–50 people, mostly complete beginners, learning the Northern (Hanoi) accent — using **only** curated source material (JW.org, wol.jw.org, and material the founder supplies) rather than generic lesson content.

Two features set it apart from a generic language app:

1. **Tone Tuner** — real-time pronunciation feedback for Vietnamese's six tones, modeled after an instrument tuner: speak a word, see immediate visual feedback on whether the tone landed correctly.
2. **Practice / Personal Workspace** — a user pastes/uploads/types their own talk, demonstration, or scripture reading, and the app turns that material into gamified practice — built from their own real, in-context content rather than generic vocabulary lists.

The app is **Duolingo-*shaped*** (streaks, points, unlockable path, gamified drills) but explicitly **not Duolingo-*taught*** — see Section 2 for why, and how that changes the content model.

---

## 2. Learning Philosophy: Concept-First, Not Translation-First

**Scope note:** everything in this section (and Sections 2a–2c below) applies specifically to the **Collections tab** (formerly "Learning tab") — the actual teaching engine. Two other systems are explicitly **out of scope here and follow their own separate design**: the **Tone Tuner** (see TAD Section 4) and **Practice / Personal Workspace** (Sections 6/6a below — deadline-driven rehearsal of a user's own fixed content, governed by its own research-backed principles, not the acquisition-focused ones below).

*Full research basis: see `research-learning-foundations.md`. This section summarizes the design implications.*

**The core premise.** Standard language apps lean on interlingual translation — mapping Vietnamese words onto English equivalents — which creates a permanent dependency where the learner never stops routing meaning through English. This app is built around **concept-first acquisition** instead: forming meaning directly in Vietnamese, the way a first language is learned, with translation available as a fallback/check rather than the primary teaching mechanism. Vietnamese is a strong fit for this — as an isolating/analytic language (no conjugation, no tense marking, no plural marking), meaning is carried by word order, particles, and context, which rewards pattern recognition over the rule-memorization habits English speakers default to.

**Four research-backed mechanisms drive the design:**

| Mechanism | Design implication |
|---|---|
| Comprehensible input (i+1) | Content is native-style Vietnamese pitched just above the learner's level, understood from context — never delivered as English-translated captions upfront |
| Statistical / implicit pattern extraction | Learners see many real examples of a pattern (e.g., word order, particles) before any rule is explained — the rule lands as confirmation, not instruction |
| Spaced repetition + retrieval practice | The SRS engine schedules **concept recall** ("how would you express this idea?"), not word-for-word translation prompts; near-miss retrieval attempts are deliberately included, not just pass/fail |
| Chunking → automatization | Learners drill high-frequency multi-word chunks as atomic units, not single words assembled from grammar rules — this closes the exact gap where head-translation currently happens mid-sentence |

**What this changes concretely (decided — see UI-UX-Design-System.md Section 7.4, TAD Section 5):**
- The atomic content unit is a **sentence/phrase-level chunk pulled from real talks**, not an isolated vocabulary word. This is a good fit for the content source specifically — JW.org talks and scripture readings are naturally connected, contextualized prose, not word lists, so this philosophy fits the *source material* better than the flashcard model would have.
- The lesson flow is reordered so the Vietnamese chunk is encountered **in context first**, before any English translation is shown.
- Word-level data still exists and still matters — it's the necessary unit for the Tone Tuner (which is inherently word/syllable-level) and serves as a supporting reference layer, but it's no longer the *primary* teaching unit.

**Resolved: supplementary flashcard/matching layer, kept alongside (not instead of) concept-first flow.** Translation-pair flashcards ("Learn Vocabulary" cards) and VN→EN matching games are **not the primary teaching mechanism**, but they're kept as an **optional supplementary layer** — e.g., accessible as extra review/practice after the core Chunk Drilling flow, not as the default path a learner is funneled through. This resolves a real tension surfaced by the "Interactive Learning Architecture" doc: those mechanics are useful as quick reinforcement/review once meaning is already established via comprehensible input, just not as the *first* exposure to a word. Treat this the same way a paper dictionary is useful *after* you've read a sentence in context, not as the thing you read first. **This is also the confirmed destination for the Home screen's Weak Words "Practice" button** — SRS-based recall review, not a Tone Tuner deep-link (see UI/UX Design System Section 1).

---

## 2a. Core Vietnamese Structural Concepts (content basis for "Pattern Noticing")

These are the specific structural quirks the **Pattern Noticing** phase of the daily lesson (Section 2b) rotates through — the actual content of "statistical/implicit pattern extraction" from the mechanism table above. Each should be tagged on `Chunk` records (see TAD Section 5) so the app can systematically surface many real examples of one concept before ever stating the rule.

1. **Classifiers** — nouns require a classifier categorizing what kind of thing it is (flat objects, animals, abstract concepts, vehicles) before the noun itself — mandatory and systematic, unlike English's occasional "a piece of paper." Concept to build: nouns aren't standalone units, they're always mentally pre-sorted into a category first.
2. **Topic-comment structure** — Vietnamese frequently states the topic first, then comments on it, closer to "As for X, Y is true" than English subject-verb-object. Translating word-order literally produces backwards-sounding English and trains the ear wrong. Concept to build: sentences are "what we're talking about" → "what's true about it," not "actor → action → target."
3. **Particles carrying grammar English puts in verb endings** — no conjugation, no tense suffixes; time, completion, mood, and emphasis are carried by small standalone particles (*đã, đang, sẽ, rồi, à, nhé...*) placed around the sentence. Concept to build: grammar is positional and particle-based, not word-internal.
4. **Tone as part of the word's identity, not decoration** — each tone is a distinct phoneme; a different tone is a different word, not the same word said differently. Concept to build: tone isn't pronunciation styling, it's spelling. (This is the conceptual link between Collections and the Tone Tuner — Collections teaches *that* tone is meaning-bearing; the Tone Tuner is where production is actually practiced and scored.)

Each concept should get its own recurring rotation through Pattern Noticing across multiple units, rather than a single one-off lesson — statistical learning depends on repeated exposure across varied examples, not a single explanation.

---

## 2b. Daily Learning Session Structure

A fixed ~20-minute daily skeleton for the Collections tab, sequencing the mechanisms above:

| Phase | Time | Mechanism | What happens |
|---|---|---|---|
| Warm-up recall | 3 min | Retrieval practice | Quick concept-recall of chunks currently due per the SRS schedule (`next_review_at`) — no translation prompts, only "express this idea" |
| Comprehensible input | 7 min | i+1 | Short native-style scene/story slightly above level (see Section 2c for how "slightly above" is calculated), meaning grasped from context |
| Pattern noticing | 5 min | Statistical/implicit learning | Multiple real examples of one structural concept from Section 2a (e.g., classifiers), with no rule stated yet |
| Rule confirmation | 2 min | Explicit follow-up | One-line rule shown *after* noticing — confirms, doesn't teach |
| Chunk drilling | 3 min | Automatization | Rapid-fire retrieval of today's high-frequency chunks, pushed toward instant recall; includes a brief Tone Tuner check on 1–2 key words from today's chunks — a light touchpoint into the Tone Tuner's existing, unchanged design, not a modification of it |

Sequencing rationale: retrieval comes first (the testing effect makes "recall before new input" stronger than reviewing then testing), comprehensible input gets the largest share since it's the primary acquisition driver, pattern noticing immediately follows so it draws on the same scene just consumed, and the session closes with fast production so today's exposure actually becomes retrievable rather than passively recognized.

**Actual lesson flow, as built (Encounter → Notice → Check → Speak → Produce → Review):** see UI-UX-Design-System.md Section 7.4.

---

## 2c. Implementing i+1

Krashen's original "i+1" has no built-in operational definition — this section resolves that with two layers, one buildable immediately and one deferred.

**Layer 1 (MVP, deterministic, no ML required): lexical/chunk coverage matching.** Second-language acquisition research has converged on a concrete proxy: comprehension holds up well when roughly 90–100% of the words in a passage are already known, with comprehension improving steadily across that range. For listening/audio input specifically — which is most of what this app delivers, given native-speaker audio is central — comprehension tends to be strong above ~90% coverage, with some learners still managing adequately even between 80–90%. Written text needs a higher bar, with 95–98% coverage typically cited for reading comprehension specifically.

**Implementation:** track each user's known-chunk/word set from `UserChunkProgress`/`UserWordProgress` (SRS-confirmed mastery, not just "seen once"). For every candidate next chunk, compute what percentage of its constituent words (via `ChunkWord`) are already known. Surface only chunks whose coverage lands in a target band — **90–95%, given the audio-first format** — for both the core lesson path's next-unit selection and the Comprehensible Input phase's scene selection. This *is* i+1, operationalized as a coverage calculation against existing tables — no model training required.

**Layer 2 (Phase 2+, adaptive, deferred): IRT-based ability/difficulty co-estimation.** The proven precedent here is Duolingo's Birdbrain engine, which uses a logistic regression model to simultaneously estimate exercise difficulty and learner ability after every interaction, targeting a "Goldilocks difficulty" — challenging enough to push growth, not so hard the learner disengages. This is a real engineering investment (needs meaningful interaction volume to calibrate against) and is reasonably deferred until Layer 1's coverage-matching has real usage data behind it.

**Related — SRS algorithm:** Duolingo's actual spaced-repetition scheduler isn't classic SM-2 — it's **Half-Life Regression (HLR)**, which estimates a continuous "half-life" for each memory and schedules review right when predicted recall probability hits ~50% (the point of maximum benefit from a retrieval attempt). This is a closer match to this app's spaced-retrieval mechanism than generic SM-2 intervals and is specifically validated for language learning rather than borrowed from flashcard apps — adopted as the scheduling approach for `UserChunkProgress`. (As-built note: `interval_days`/`ease_factor` field names are SM-2 vocabulary, not HLR vocabulary. Phase 1a treats `interval_days` as the item's current half-life estimate itself — continuous, not day-granular — with `next_review_at = last_practiced_at + interval_days`, since predicted recall probability hits 50% exactly at t = half-life. `ease_factor` is a hand-rolled per-item growth multiplier (grows on correct recall, shrinks on lapse), not a trained HLR weight — real HLR needs a shared logistic-regression model over real interaction volume across users, which is Layer 2 above and doesn't exist yet.)

---

## 3. Target Users

| Attribute | Detail |
|---|---|
| Group size (MVP → rollout) | Starts small, scales to 20–50 users |
| Skill level | Mostly complete beginners |
| Accent taught | Northern (Hanoi) |
| Age range | Includes at least one 12-year-old; otherwise general adult congregation members |
| Motivation | Practical — reading/giving talks, demonstrations, and scripture readings in Vietnamese |
| Devices | Web-first (installable PWA) for MVP, migrating to native mobile app (iOS/Android) in Phase 3 |

**Primary persona:** An English-speaking congregation member with little to no Vietnamese, assigned a talk or reading in Vietnamese, who needs to (a) learn foundational vocabulary/tones and (b) practice the specific words in their upcoming assignment until pronunciation is solid.

---

## 4. MVP Scope

### In scope for MVP
- Individual user accounts (email/password or similar), cloud-synced progress
- A fixed, unlockable core lesson path built from JW.org/wol.jw.org-sourced **sentence/phrase-level chunks** (not isolated vocabulary lists), using native-speaker audio provided by the founder
- Comprehensible-input-first lesson flow: Vietnamese chunk encountered in context before translation is revealed
- Tone Tuner: **live feedback**, **single words only** (drawn from within chunks), using recorded/native audio as the reference
- Practice / Personal Workspace: user adds Vietnamese text + an optional deadline via paste or manual typing (file/image upload deferred — Section 6a); app auto-segments into breath-groups (learner can merge/split/reorder), suggests a default verbatim-vs-gist tag per group that the learner can override, and runs peak-then-taper practice scheduling with aggressive weak-spot-first resurfacing (Sections 6, 6a)
- Basic SRS scheduling for chunk review (spaced retrieval, not just a mastery percentage)
- Core gamification: points, streaks, badges, and a leaderboard (group-wide or per-cohort)
- Cloud storage for progress and voice-practice history

### Explicitly out of scope for MVP (Phase 2+)
- Sentence-level tone grading (Phase 2)
- Offline mode (decision pending — see TAD Section 4.7, Tone Tuner offline/online scoring; general course-content offline caching isn't detailed anywhere yet, so don't read this as more resolved than it is)
- Auto-detection of "known vs. unknown" words in an uploaded talk (Phase 2 — MVP is manual selection)
- Southern (Saigon) accent / dialect toggle
- Support for languages beyond Vietnamese
- Public/social features beyond the internal group leaderboard (no public sharing, no discovery feed)

---

## 5. Phased Feature Roadmap

**Build sequencing (confirmed):** Collections and Practice/Workspace are built and shipped as fully working first. Tone Tuner's data collection (recording native speakers for the reference dataset) runs in parallel on its own track starting now, but the Tone Tuner *engine* build follows once that data exists — it's not blocking the rest of Phase 1, and the rest of Phase 1 isn't blocking it either. The two tracks converge when Collections' Chunk Drilling step and Tone Tuner's engine are both ready to connect.

### Phase 1a — MVP: Collections + Practice/Workspace (primary track, no external dependency)
- [x] User accounts + profile — **done**
- [x] Core lesson path: chunk-based units — **done** (real lesson flow built and verified end-to-end)
- [x] Comprehensible-input-first lesson flow (Encounter → Notice → Check → Speak → Produce → Review) — **done**
- [x] Basic SRS scheduling (simplified half-life heuristic) — **done**
- [ ] i+1 content selection: lexical/chunk coverage matching (90–95% known-word band) — not yet built
- [ ] Workspace v1 (breath-groups, verbatim/gist tagging, peak-then-taper scheduling, weak-spot system) — not yet built; resolved design: Section 6a
- [x] Gamification: streak, points — **done** (badges/leaderboard UI not yet built)
- [x] Admin/content pipeline: seed script — **done** (spreadsheet/JSON import); full admin console not yet built
- [ ] Homepage redesign per UI/UX Design System — **in progress**
- **Note:** the Chunk Drilling step's Tone Tuner check and Workspace's eventual Tone Tuner integration are stubbed/deferred until Phase 1b's engine exists — the lesson flow accommodates the check, but it doesn't gate lesson completion until Tone Tuner is live

### Phase 1b — MVP: Tone Tuner (parallel track)
- [ ] Recruit and record the initial 6-word reference dataset (one word per tone, including at least one glottalized tone), 3–4 speakers, 2–3 reps each
- [ ] Build the FastAPI audio-analysis service skeleton
- [ ] Implement the revised signal pipeline (see TAD Section 4) against the initial 6-word set
- [ ] Hit the go/no-go criteria before connecting Tone Tuner into Collections' Chunk Drilling step or expanding the dataset further
- [ ] Once validated: connect to Collections, begin scaling the curated dataset toward full vocabulary/phrase coverage

### Phase 2 — Depth
- [ ] Tone Tuner v2: phrase-level grading, building on the validated word-level engine
- [ ] Workspace ↔ Tone Tuner integration (deferred item)
- [ ] Auto-detect known vs. unknown vocabulary in uploaded talks
- [ ] Record-and-review mode as an alternative to live tuning
- [ ] Expanded badge/achievement system, streak-freeze/repair mechanics
- [ ] Offline mode for core lessons

### Phase 3 — Scale & Expand
- [ ] Migrate frontend from Next.js (web/PWA) to React Native + Expo for real iOS/Android app-store distribution — backend carries over unchanged
- [ ] Southern (Saigon) accent option
- [ ] Cohort/class structure
- [ ] Expand beyond Vietnamese to a second language using the same framework
- [ ] Richer social features

---

## 6. Practice / Personal Workspace

**Why this is a different problem than Collections:** Collections optimizes for general acquisition — long time horizon, cumulative fluency. Workspace optimizes for performance mastery of fixed, known content by a fixed date — the person already knows what they need to say; the task is delivering it correctly and naturally, out loud, under real social stakes, by a deadline. Closer to rehearsing a speech than acquiring a language. *Full research basis: see `research-workspace-principles.md`.*

**Six design principles:**

1. **Two-tier content (verbatim vs. gist).** Most content is trained for gist-mastery (expressible in the learner's own words) — the field-tested readiness signal is losing a word mid-rehearsal and continuing without restarting. A small, explicitly flagged subset — direct quotes, scripture citations, the opener, and the closer — gets dedicated verbatim drilling.
2. **Build-then-taper scheduling.** Practice volume builds and peaks more than a week before the deadline, then decreases in the final days while staying frequent (short, sharp run-throughs, not cramming).
3. **Breath-groups, not sentences, as the rehearsal unit.** Content auto-segments into ~10–15 word breath-groups following clause/punctuation boundaries.
4. **Prosody/sentence-level delivery — out of scope for now.** Breath-group segmentation is a low-cost seed for a future version of this.
5. **Weak-spot-first practice.** The app disproportionately resurfaces poorly-performing breath-groups rather than always running the piece from the top. Timed, no-restart full run-throughs are introduced as a distinct late-stage drill during the taper phase.
6. **No comparative gamification.** Self-referential mechanics only (per-chunk mastery status, personal streak, a "ready" indicator tied to the individual's own deadline). No leaderboard.

**Flow:**
1. **Add material** — paste or type Vietnamese text, with an optional deadline date (MVP: paste/type only, no file upload — see Section 6a)
2. **Auto-segment** — app breaks the text into breath-groups and suggests verbatim-tier spans, both learner-adjustable
3. **Build phase** — regular practice, volume increasing toward the deadline; weak breath-groups resurface disproportionately
4. **Taper phase** (final ~week) — practice volume decreases but stays frequent; periodic no-restart full run-throughs required, weak spots or not
5. **Ready status** — tied to the individual's own deadline, not group comparison; exact criteria still open (see Section 6a)

**Resolved design:** the open items previously listed here (segmentation approach, verbatim-tier assignment, build/taper scaling, weak-chunk definition, and more) are resolved in **Section 6a** below, which is the authoritative spec for Workspace/Practice — this section stays as framing/rationale, 6a as the detail.

---

## 6a. Workspace / Practice Design (Resolved)

*Resolves the Workspace-related product decisions tracked as #10–14, plus several sub-decisions surfaced during design review. Supersedes the prior vaguer Workspace language in Section 6 above wherever the two conflict; Section 6's "why" framing and six design principles still stand as the rationale this section makes concrete.*

**Optimization goal.** Pronunciation, memorization, and natural delivery are pursued simultaneously, not sequenced. Practice assumes comprehension already exists (built via Learn/lessons) — it is pure rehearsal, not a comprehension-building tool.

**Type-differentiated flows.** One shared rehearsal engine, not five separate flows/state machines — the earlier "meaningfully different, not just relabeled" language is resolved as a **per-`item_type` configuration profile** feeding the same engine, not branching logic:

| `item_type` | Profile |
|---|---|
| Scripture reading | High exactness; verbatim default; full-text → text-fade progression |
| Talk | Gist default; keyword/prompt-driven → no-text progression |
| Demonstration | Gist-oriented; delivery-emphasis framing |
| Prayer | Gist-oriented; minimal memorization pressure |
| Comment | Gist-oriented; short-session bias |

Phase 2 can graduate a type to a genuinely distinct drill (not just a config profile) where real usage shows the shared engine isn't enough — not designed here. *(Data-model implication for the TAD — an assignment-type field driving flow/defaults per type — not detailed further here.)*

**Material intake (MVP).**
- Paste/type only. PDF/DOCX/image upload deferred to later (this corrects Section 4's MVP scope bullet, which previously listed file upload).
- Vietnamese only at intake — the learner never types or supplies English.
- **Reversed from this section's original decision:** English *is* generated for the learner — automatically, via the Claude API, not learner-typed and not an on-demand MT lookup. Generated eagerly at intake (one batched call per item, immediately after auto-segmentation, so it's ready before the learner ever opens the per-group toggle — see Segmentation below) and persisted per breath group; not regenerated on each toggle-open. Generic translation quality is accepted as-is, **including for quoted-Scripture spans** — this is a rehearsal aid, not a doctrinal reference, and no JW-terminology-aware translation handling is in scope. Recorded here as a deliberate scope decision, not an accidental gap.
- Imported/segmented Vietnamese text remains editable after processing — not locked. (Open question this reversal surfaces, not resolved here: whether the generated English text is likewise learner-editable, or read-only.)
- Deadlines are optional per item; undated items are ongoing practice with no scheduling engine applied.

**Segmentation.**
- Auto-split into breath groups via simple punctuation/clause heuristics for MVP (smarter linguistic segmentation deferred).
- Learner can manually merge/split/reorder groups after auto-split.
- English meaning display is an optional per-group toggle — default on/off not specified, implementer's discretion unless otherwise noted.

**Rehearsal loop (resolved shape):** Listen to reference → learner's choice: shadow (record while/immediately after listening) or read-then-record as two separate reps → compare own recording vs. reference → *[mastery-gated]* attempt without looking at text → mark difficulty (Struggled / Okay / Easy) → move to next group.
- A group marked "Struggled" does not re-loop immediately — it moves on and resurfaces in a later session via the weak-spot/spaced system.
- The no-looking-at-text step is adaptive, gated on a group having prior demonstrated mastery — **resolved gate: both conditions required — at least 2 prior reps on that group, AND `mastery_status != 'weak'`** (see the Weak-spot system's mastery classification below; 2 is a picked default, not derived from data, flagged as tunable).
- The shadow-vs-read-then-record choice is a fresh, ephemeral, per-rep UI choice — not persisted anywhere, no stored preference.
- Reference audio plays for every breath group, every time. Source: TTS as an interim stand-in until native recordings exist for that content; native preferred once available, silently upgraded per-item as recordings come in (no user-facing distinction needed at MVP).

**Verbatim vs. gist.** Hybrid ownership — the app suggests a default per group (opener/closer/Scripture quotations always default verbatim), the learner can override any suggestion. Gist-mode rehearsal hides the full sentence and shows only keywords/prompts; the learner reconstructs the idea aloud rather than reciting hidden text. **Resolved: keywords/prompts are hand-authored per breath group, not algorithmically derived** from the Vietnamese text or the generated English — needs its own field (`gist_prompt`, nullable; see the follow-up migration).

**Deadline engine.**
- Auto-generates a suggested daily plan; fully editable by the learner, never a rigid lock.
- Plan intensity scales with time remaining: a 21-day runway gets a light, spread-out plan; a 3-day runway gets intensive daily sessions. (Exact curve/thresholds are an implementation detail, not specified further here.)
- Practice intensity follows a peak-then-taper curve: heaviest ~7–10 days before delivery, tapering afterward, with a light run-through-only recommendation on the final day.
- Missed practice days are flagged to the learner, who decides how to catch up — no automatic guilt messaging, no automatic aggressive rescheduling.

**Weak-spot system, resolved into a concrete session-selection algorithm** (`selectRehearsalSession`, a pure function mirroring `selectChunksForLesson`'s architecture — see TAD):

1. **Mastery classification per chunk**, computed from the same raw signals a rep writes to `user_rehearsal_progress` (`last_self_rating`, `restart_count`, `avg_hesitation_ms`) — `mastery_status` is the single stored source of truth for this, written by the rep-completion action using this rule, read (not recomputed) by both session selection and the no-look gate above:
   - **weak** if `last_self_rating = 'struggled'` OR `restart_count >= 2` OR `avg_hesitation_ms` exceeds a threshold (**picked default: 800ms**, flagged as tunable once real usage data exists)
   - **new** if no progress row exists for that chunk yet
   - otherwise **developing** or **ready**
2. **Ordinary session composition:** weak chunks first (oldest-attempted first), new chunks fill any remaining session capacity in `display_order`.
3. **Session capacity scales with deadline phase** (picked defaults, same "flag, don't over-specify" treatment as the build/taper curve itself — tunable, not derived from data):
   - Before `build_phase_end` (light): **4 chunks**
   - Peak (between `build_phase_end` and `taper_start`): **10 chunks**
   - Taper (after `taper_start`, not the final day): **6 chunks**
   - **Undated items:** flat **6 chunks** always — phase-scaling is skipped entirely, since there's no deadline to phase against.
4. Weak chunks resurface in *every* eligible session, no cooldown, until they stop qualifying as weak.
5. **Periodic forced full run-through** bypasses steps 1–3 entirely and uses `full_run_through_attempts` instead of per-chunk selection — **picked cadence: every 5th eligible session, and always on the final day** (the Deadline engine's existing "light run-through-only recommendation on the final day" *is* this drill, not a separate thing). Required even with known weak spots still present — not optional.

**Gamification.** Zero points from Practice reps — consistent with Section 6's "no comparative gamification" principle, since `total_points` directly feeds the group-wide leaderboard. Streak *is* shared: a completed rehearsal session bumps the same `user_streaks` row Collections/lessons already write to — one unified daily-activity streak, not a separate Practice-specific one.

**Tone Tuner integration.** Fully separate systems for MVP — no live handoff, no shared UI. When integration eventually happens (post-MVP): tapping a word during rehearsal that Tone Tuner doesn't support (outside its curated word list) renders as plain, non-interactive text — no fallback scoring, no degraded mode. Once integrated, pronunciation problems Tone Tuner detects will automatically feed into Practice's weak-spot system as a shared signal source.

**Privacy & retention.**
- Rehearsal recordings are not permanently stored — analyzed/played back within the session, then discarded. This significantly simplifies the privacy story: there's no persistent audio artifact to protect or leak.
- Practice material and activity are private by default; group admins can see practice activity/progress metadata (that an assignment exists, general progress), but not recording content (moot anyway, given recordings aren't retained) or the verbatim text of what someone's rehearsing, unless otherwise specified later.
- Deleting an assignment soft-deletes/archives it — hidden from the learner's active list but recoverable, not a hard, irreversible delete.

**Still open after this pass:**
- Whether "ready" status requires a successful no-restart full run-through, or can be inferred from chunk mastery alone — the periodic no-restart run-through above is an ongoing practice-discipline requirement, not a stated definition of "ready."
- English-meaning-toggle default (on/off) — explicitly implementer's discretion, not decided here.
- The build/taper *phase-boundary* day-thresholds themselves (exactly how many days before the deadline `build_phase_end`/`taper_start` fall) — still an implementation detail, not decided here. (Distinct from the session-*capacity*-per-phase numbers above, which are now picked.)
- Exact parsing of "shadow ... or read-then-record as two separate reps": whether read-then-record's "two reps" means a silent-read rep followed by a recorded rep, or that the learner gets two full attempts either way. Persistence is resolved (ephemeral, not stored) — this narrower phrasing question is not.

---

## 7. Gamification Design

- **Points** — earned per completed drill, weighted so tone-tuner passes are worth more than passive recognition drills (production > recognition)
- **Streaks** — daily practice streak, visible on Home, core retention driver
- **Badges** — milestone-based (e.g., "First 10 words mastered," "7-day streak," "First talk practiced end-to-end," "Perfect tone score on a full lesson")
- **Leaderboard** — group-wide ranking; consider whether it's purely points-based or has a "most consistent" (streak-based) view too, since raw points can favor time-availability over effort. **Note:** styled as a "Friends Leaderboard" per the design system, but sourced from the real group-wide leaderboard — there is no friend-relationship/social-graph feature.

---

## 8. Product-Level Open Decisions

1. Internal distribution method given copyrighted source content (TestFlight/internal track vs. public store listing)
2. Exact structure of "units"/Collections — organized by convention program, by publication, by topic, or some combination
3. "Reading Readiness" homepage stat — genuinely undefined, no formula or source table yet; needs definition once Workspace's "ready" concept has real usage behind it, not invented just to fill a stat card

*(Technical open decisions — Tone Tuner architecture, SRS implementation details — live in the TAD.)*

---

## 9. Name

**Chosen: Thanh Việt** — "thanh" (tone) + "Việt" (Vietnamese), a direct nod to the Tone Tuner as the app's signature feature.

Other options considered, kept here as backups: Tiếng Nhà, Sáu Thanh, Học Cùng, Tune Việt.
