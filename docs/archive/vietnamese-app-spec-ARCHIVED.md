> **ARCHIVED (August 11, 2026):** superseded by `docs/PRD.md`, `docs/TAD.md`, `docs/UI-UX-Design-System.md`, and `docs/Engineering-Standards.md`. Kept here as a point-in-time snapshot only — do not treat as current.

# Vietnamese Learning App — MVP & Phased Spec

*Working title: Thanh Việt*

## 1. Vision

A Vietnamese learning app built for one specific community — a Vietnamese-learning group of ~20–50 people, mostly complete beginners, learning the Northern (Hanoi) accent — using **only** curated source material (JW.org, wol.jw.org, and material the founder supplies) rather than generic lesson content.

Two features set it apart from a generic language app:

1. **Tone Tuner** — real-time pronunciation feedback for Vietnamese's six tones, modeled after an instrument tuner: speak a word, see immediate visual feedback on whether the tone landed correctly.
2. **Talk Practice** — a user pastes/uploads/types their own talk, demonstration, or scripture reading, and the app turns that material into gamified practice — built from their own real, in-context content rather than generic vocabulary lists.

The app is **Duolingo-*shaped*** (streaks, points, unlockable path, gamified drills) but explicitly **not Duolingo-*taught*** — see Section 1a for why, and how that changes the content model.

---

## 1a. Learning Philosophy: Concept-First, Not Translation-First

**Scope note:** everything in this section (and Sections 1b–1c below) applies specifically to the **Learning / Daily Course tab** — the actual teaching engine. Two other systems are explicitly **out of scope here and follow their own separate design**: the **Tone Tuner** (Section 8 — unchanged, no alterations from this pedagogy work) and **Talk Practice / Personal Workspace** (Section 5.6 — deadline-driven rehearsal of a user's own fixed content, governed by its own research-backed principles, not the acquisition-focused ones below).

*Full research basis: see "Vietnamese App Research Foundations" reference doc. This section summarizes the design implications.*

**The core premise.** Standard language apps lean on interlingual translation — mapping Vietnamese words onto English equivalents — which creates a permanent dependency where the learner never stops routing meaning through English. This app is built around **concept-first acquisition** instead: forming meaning directly in Vietnamese, the way a first language is learned, with translation available as a fallback/check rather than the primary teaching mechanism. Vietnamese is a strong fit for this — as an isolating/analytic language (no conjugation, no tense marking, no plural marking), meaning is carried by word order, particles, and context, which rewards pattern recognition over the rule-memorization habits English speakers default to.

**Four research-backed mechanisms drive the design:**

| Mechanism | Design implication |
|---|---|
| Comprehensible input (i+1) | Content is native-style Vietnamese pitched just above the learner's level, understood from context — never delivered as English-translated captions upfront |
| Statistical / implicit pattern extraction | Learners see many real examples of a pattern (e.g., word order, particles) before any rule is explained — the rule lands as confirmation, not instruction |
| Spaced repetition + retrieval practice | The SRS engine schedules **concept recall** ("how would you express this idea?"), not word-for-word translation prompts; near-miss retrieval attempts are deliberately included, not just pass/fail |
| Chunking → automatization | Learners drill high-frequency multi-word chunks as atomic units, not single words assembled from grammar rules — this closes the exact gap where head-translation currently happens mid-sentence |

**What this changes concretely (decided — see Sections 5, 7, 9):**
- The atomic content unit is a **sentence/phrase-level chunk pulled from real talks**, not an isolated vocabulary word. This is a good fit for your content source specifically — JW.org talks and scripture readings are naturally connected, contextualized prose, not word lists, so this philosophy fits the *source material* better than the flashcard model would have.
- The lesson flow is reordered so the Vietnamese chunk is encountered **in context first**, before any English translation is shown (Section 5.4).
- `Word`-level data still exists and still matters — it's the necessary unit for the Tone Tuner (which is inherently word/syllable-level) and serves as a supporting reference layer, but it's no longer the *primary* teaching unit (Section 9).

**Resolved: supplementary flashcard/matching layer, kept alongside (not instead of) concept-first flow.** Translation-pair flashcards ("Learn Vocabulary" cards) and VN→EN matching games are **not the primary teaching mechanism**, but they're kept as an **optional supplementary layer** — e.g., accessible as extra review/practice after the core Chunk Drilling flow, not as the default path a learner is funneled through. This resolves a real tension surfaced by the "Interactive Learning Architecture" doc: those mechanics are useful as quick reinforcement/review once meaning is already established via comprehensible input, just not as the *first* exposure to a word. Treat this the same way a paper dictionary is useful *after* you've read a sentence in context, not as the thing you read first.

---

## 1b. Core Vietnamese Structural Concepts (content basis for "Pattern Noticing")

These are the specific structural quirks the **Pattern Noticing** phase of the daily lesson (Section 1c) rotates through — the actual content of "statistical/implicit pattern extraction" from the mechanism table above. Each should be tagged on `Chunk` records (see Section 9) so the app can systematically surface many real examples of one concept before ever stating the rule.

1. **Classifiers** — nouns require a classifier categorizing what kind of thing it is (flat objects, animals, abstract concepts, vehicles) before the noun itself — mandatory and systematic, unlike English's occasional "a piece of paper." Concept to build: nouns aren't standalone units, they're always mentally pre-sorted into a category first.
2. **Topic-comment structure** — Vietnamese frequently states the topic first, then comments on it, closer to "As for X, Y is true" than English subject-verb-object. Translating word-order literally produces backwards-sounding English and trains the ear wrong. Concept to build: sentences are "what we're talking about" → "what's true about it," not "actor → action → target."
3. **Particles carrying grammar English puts in verb endings** — no conjugation, no tense suffixes; time, completion, mood, and emphasis are carried by small standalone particles (*đã, đang, sẽ, rồi, à, nhé...*) placed around the sentence. Concept to build: grammar is positional and particle-based, not word-internal.
4. **Tone as part of the word's identity, not decoration** — each tone is a distinct phoneme; a different tone is a different word, not the same word said differently. Concept to build: tone isn't pronunciation styling, it's spelling. (This is the conceptual link between the Learning tab and the Tone Tuner — the Learning tab teaches *that* tone is meaning-bearing; the Tone Tuner, unchanged, is where production is actually practiced and scored.)

Each concept should get its own recurring rotation through Pattern Noticing across multiple units, rather than a single one-off lesson — statistical learning depends on repeated exposure across varied examples, not a single explanation.

---

## 1c. Daily Learning Session Structure

A fixed ~20-minute daily skeleton for the Learning tab, sequencing the mechanisms above:

| Phase | Time | Mechanism | What happens |
|---|---|---|---|
| Warm-up recall | 3 min | Retrieval practice | Quick concept-recall of chunks currently due per the SRS schedule (Section 9's `next_review_at`) — no translation prompts, only "express this idea" |
| Comprehensible input | 7 min | i+1 | Short native-style scene/story slightly above level (see Section 1d for how "slightly above" is calculated), meaning grasped from context |
| Pattern noticing | 5 min | Statistical/implicit learning | Multiple real examples of one structural concept from Section 1b (e.g., classifiers), with no rule stated yet |
| Rule confirmation | 2 min | Explicit follow-up | One-line rule shown *after* noticing — confirms, doesn't teach |
| Chunk drilling | 3 min | Automatization | Rapid-fire retrieval of today's high-frequency chunks, pushed toward instant recall; includes a brief Tone Tuner check on 1–2 key words from today's chunks — a light touchpoint into the Tone Tuner's existing, unchanged design, not a modification of it |

Sequencing rationale: retrieval comes first (the testing effect makes "recall before new input" stronger than reviewing then testing), comprehensible input gets the largest share since it's the primary acquisition driver, pattern noticing immediately follows so it draws on the same scene just consumed, and the session closes with fast production so today's exposure actually becomes retrievable rather than passively recognized.

---

## 1d. Implementing i+1

Krashen's original "i+1" has no built-in operational definition — this section resolves that with two layers, one buildable immediately and one deferred.

**Layer 1 (MVP, deterministic, no ML required): lexical/chunk coverage matching.** Second-language acquisition research has converged on a concrete proxy: comprehension holds up well when roughly 90–100% of the words in a passage are already known, with comprehension improving steadily across that range. For listening/audio input specifically — which is most of what this app delivers, given native-speaker audio is central — comprehension tends to be strong above ~90% coverage, with some learners still managing adequately even between 80–90%. Written text needs a higher bar, with 95–98% coverage typically cited for reading comprehension specifically.

**Implementation:** track each user's known-chunk/word set from `UserChunkProgress`/`UserWordProgress` (SRS-confirmed mastery, not just "seen once"). For every candidate next chunk, compute what percentage of its constituent words (via `ChunkWord`) are already known. Surface only chunks whose coverage lands in a target band — **90–95%, given the audio-first format** — for both the core lesson path's next-unit selection and the Comprehensible Input phase's scene selection. This *is* i+1, operationalized as a coverage calculation against existing tables — no model training required.

**Layer 2 (Phase 2+, adaptive, deferred): IRT-based ability/difficulty co-estimation.** The proven precedent here is Duolingo's Birdbrain engine, which uses a logistic regression model to simultaneously estimate exercise difficulty and learner ability after every interaction, targeting a "Goldilocks difficulty" — challenging enough to push growth, not so hard the learner disengages. This is a real engineering investment (needs meaningful interaction volume to calibrate against) and is reasonably deferred until Layer 1's coverage-matching has real usage data behind it.

**Related, resolves Open Decision #7:** Duolingo's actual spaced-repetition scheduler isn't classic SM-2 — it's **Half-Life Regression (HLR)**, which estimates a continuous "half-life" for each memory and schedules review right when predicted recall probability hits ~50% (the point of maximum benefit from a retrieval attempt). This is a closer match to this app's spaced-retrieval mechanism (1a) than generic SM-2 intervals and is specifically validated for language learning rather than borrowed from flashcard apps — recommended as the scheduling approach for `UserChunkProgress`.

---

## 2. Target Users

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

## 3. MVP Scope

### In scope for MVP
- Individual user accounts (email/password or similar), cloud-synced progress
- A fixed, unlockable core lesson path built from JW.org/wol.jw.org-sourced **sentence/phrase-level chunks** (not isolated vocabulary lists), using native-speaker audio provided by the founder
- Comprehensible-input-first lesson flow: Vietnamese chunk encountered in context before translation is revealed (Section 5.4)
- Tone Tuner: **live feedback**, **single words only** (drawn from within chunks), using recorded/native audio as the reference
- Talk Practice / Personal Workspace: user adds text + a deadline via paste, file upload, or manual typing; app auto-segments into breath-groups, tags verbatim vs. gist tiers, and runs build-then-taper practice scheduling with weak-spot-first resurfacing (Section 5.6)
- Basic SRS scheduling for chunk review (spaced retrieval, not just a mastery percentage)
- Core gamification: points, streaks, badges, and a leaderboard (group-wide or per-cohort)
- Cloud storage for progress and voice-practice history

### Explicitly out of scope for MVP (Phase 2+)
- Sentence-level tone grading (Phase 2)
- Offline mode (decision pending — see Section 8)
- Auto-detection of "known vs. unknown" words in an uploaded talk (Phase 2 — MVP is manual selection)
- Southern (Saigon) accent / dialect toggle
- Support for languages beyond Vietnamese
- Public/social features beyond the internal group leaderboard (no public sharing, no discovery feed)

---

## 4. Phased Feature Roadmap

**Build sequencing (confirmed):** Learning tab and Workspace are built and shipped as fully working first. Tone Tuner's data collection (recording native speakers for the reference dataset) runs in parallel on its own track starting now, but the Tone Tuner *engine* build follows once that data exists — it's not blocking the rest of Phase 1, and the rest of Phase 1 isn't blocking it either. The two tracks converge when Learning tab's Chunk Drilling step and Tone Tuner's engine are both ready to connect.

### Phase 1a — MVP: Learning Tab + Workspace (primary track, no external dependency)
- [ ] User accounts + profile (name, avatar optional, progress dashboard)
- [ ] Core lesson path: units built from founder-supplied **chunks** (sentence/phrase-level, pulled from real talks), each unit unlocks the next
- [ ] Each lesson: **comprehensible-input exposure first** (Vietnamese chunk in context, native audio, no translation shown) → pattern-recognition drill → translation reveal/check
- [ ] Basic SRS scheduling (Half-Life Regression): chunks come back for review based on recall success, not a fixed unlock-and-forget path
- [ ] i+1 content selection: lexical/chunk coverage matching (90–95% known-word band) for next-unit and scene selection
- [ ] Workspace v1: add text + deadline (paste/upload/type) → auto-segment into breath-groups → two-tier verbatim/gist marking → build-then-taper scheduling with weak-spot-first resurfacing → self-referential "ready" tracking (no leaderboard)
- [ ] Gamification: daily streak, points per activity, a handful of milestone badges, group leaderboard
- [ ] Admin/content pipeline: a way for the founder to add new lesson content and audio without touching code (see Section 7)
- [ ] **Note:** the Chunk Drilling step's Tone Tuner check (Section 1c) and Workspace's eventual Tone Tuner integration (Section 8.2c) are stubbed/deferred until Phase 1b's engine exists — build the lesson flow to accommodate that check, but it doesn't gate lesson completion until Tone Tuner is live

### Phase 1b — MVP: Tone Tuner (parallel track)
- [ ] Recruit and record the initial 6-word reference dataset (one word per tone, including at least one glottalized tone — Section 8.3), 3–4 speakers, 2–3 reps each
- [ ] Build the FastAPI audio-analysis service skeleton (Section 8.2) — can start alongside recording, doesn't need to wait for a full dataset to scaffold
- [ ] Implement the revised signal pipeline (Section 8.1) against the initial 6-word set
- [ ] Hit the go/no-go criteria (Section 8.4, item 5) before connecting Tone Tuner into the Learning tab's Chunk Drilling step or expanding the dataset further
- [ ] Once validated: connect to Course tab (Chunk Drilling), begin scaling the curated dataset toward full vocabulary/phrase coverage

### Phase 2 — Depth
- [ ] Tone Tuner v2: phrase-level grading (per Decision 4, Section 8.2a), building on the validated word-level engine
- [ ] Workspace ↔ Tone Tuner integration (Section 8.2c, deferred item)
- [ ] Auto-detect known vs. unknown vocabulary in uploaded talks
- [ ] Record-and-review mode as an alternative to live tuning (useful if live mode has connectivity issues)
- [ ] Expanded badge/achievement system, streak-freeze/repair mechanics
- [ ] Offline mode for core lessons (content + audio cached locally); tone tuner offline support depending on architecture decision (Section 8.4, item 1)

### Phase 3 — Scale & Expand
- [ ] Migrate frontend from Next.js (web/PWA) to React Native + Expo for real iOS/Android app-store distribution — backend (Supabase, FastAPI audio service) carries over unchanged
- [ ] Southern (Saigon) accent option
- [ ] Cohort/class structure (e.g., group leaders can assign specific talks to specific members)
- [ ] Expand beyond Vietnamese to a second language using the same framework
- [ ] Richer social features (encouragement, shared progress within family/cohort groups)

---

## 5. Screens & User Flows

### 5.0 Navigation & Tab Naming (adopted from the Homepage Design Handoff)

Formal tab names, replacing placeholder language used elsewhere in this doc — **Collections** = the Learning tab (Sections 1a–1d), **Practice** = Workspace (Section 5.6):

**Home · Collections · Practice · Tone Tuner · Leaderboard · Profile**

**Two decisions resolved from the design handoff:**
- **Favorites** (a Collection card on Home) is a personal, non-linear bookmark list — **no completion percentage**, unlike curriculum Collections (Scriptures, Presentations, Talks) which track real progress through sequential content.
- **Weak Words widget "Practice" button** routes to **SRS-based recall review using the supplementary flashcard layer** (Section 1a), *not* the Tone Tuner. This keeps the Tone Tuner's preset-series-only decision (Section 8.2a, Decision 6) fully intact with no carve-outs, and gives the flashcard layer its first concrete use case.

**Build sequencing note:** the homepage design assumes all systems (Collections, Tone Tuner, Practice/reading) are simultaneously live. Given the confirmed Phase 1a/1b split (Section 4) — Tone Tuner's engine is gated on real recordings that don't exist yet — homepage components tied to Tone Tuner (the "Tone Accuracy" stat card, "Practice Tone Tuner" daily-goal item) should be built to **gracefully degrade or hide** rather than show fake/broken data until Phase 1b actually lands.

### 5.1 Onboarding
1. Welcome screen → sign up / log in
2. Placement (optional in MVP — can default everyone to Unit 1 given "mostly beginners")
3. Quick tutorial: how the Tone Tuner works (practice on 1–2 sample words before real lessons start)

### 5.2 Home / Dashboard
- Current streak, points, next lesson in the path
- Shortcut into "Talk Practice"
- Leaderboard snippet (top 3 + your rank)

### 5.3 Lesson Path
- Visual map of units (locked/unlocked/completed states — standard Duolingo-style path)
- Tapping a unit opens the lesson flow

### 5.4 Lesson Flow (within a unit)
1. **Encounter** — the Vietnamese chunk (sentence/phrase from a real talk) is shown with native audio and, where helpful, a supporting image or short situational context — **no English translation yet**
2. **Notice** — a lightweight pattern-recognition step: e.g., matching the chunk to one of a few context clues, or identifying a recurring word/particle across a few chunks — reinforces statistical pattern detection before any rule is stated
3. **Check** — the English meaning becomes available on request (tap to reveal), confirming or correcting what the learner inferred, rather than being the starting point
4. **Speak** — the learner records themselves saying the chunk and can play it back next to the native audio for self-comparison. **No automated scoring here** — this is self-assessment/listening practice, distinct from the Tone Tuner's scored word-level check in the next step. Resolves an ambiguity from the "Interactive Learning Architecture" doc: this step is playback-only, not phrase-level automated grading, which stays out of scope per the Tone Tuner's word-only v1 decision (Section 8.2a, Decision 4).
5. **Produce** — Tone Tuner drill on one or two key words from the chunk: user speaks the word, gets live tone feedback, must pass a threshold to continue
6. **Review** — quick recap screen, points awarded, streak updated; the chunk is scheduled for spaced review via the SRS engine rather than being marked "done" permanently

### 5.5 Tone Tuner (standalone + embedded in lessons)
- Large visual tone indicator (needle, wave, or tone-contour graphic — matches the "instrument tuner" metaphor)
- Word shown in Vietnamese with tone marks highlighted
- Live waveform/pitch trace overlaid against the target tone contour
- Pass/adjust feedback in real time; "Try again" vs. "Nice — next word"

### 5.6 Talk Practice / Personal Workspace

**Why this is a different problem than the Learning tab:** the Learning tab optimizes for general acquisition — long time horizon, cumulative fluency. Workspace optimizes for performance mastery of fixed, known content by a fixed date — the person already knows what they need to say; the task is delivering it correctly and naturally, out loud, under real social stakes, by a deadline. Closer to rehearsing a speech than acquiring a language. *Full research basis: see "Workspace Design Principles" reference doc.*

**Six design principles:**

1. **Two-tier content (verbatim vs. gist).** Most content is trained for gist-mastery (expressible in the learner's own words) — the field-tested readiness signal is losing a word mid-rehearsal and continuing without restarting. A small, explicitly flagged subset — direct quotes, scripture citations, the opener, and the closer — gets dedicated verbatim drilling, since those are the spots where exact wording genuinely matters.
2. **Build-then-taper scheduling.** Practice volume builds and peaks more than a week before the deadline, then decreases in the final days while staying frequent (short, sharp run-throughs, not cramming) — deliberately overriding the instinct to drill hardest right before the deadline.
3. **Breath-groups, not sentences, as the rehearsal unit.** Content auto-segments into ~10–15 word breath-groups following clause/punctuation boundaries — the natural unit speech science identifies for planned/read speech, and the practical size public-speaking coaching converges on.
4. **Prosody/sentence-level delivery — out of scope for now.** No dedicated pacing/rhythm scorer at this stage; breath-group segmentation is a low-cost seed for a future version of this, not something to build in a way that forecloses it.
5. **Weak-spot-first practice.** The app disproportionately resurfaces poorly-performing breath-groups rather than always running the piece from the top (linear practice produces a strong opening and a weak ending, since any mid-rehearsal mistake sends the speaker back to start). Timed, no-restart full run-throughs are introduced as a distinct late-stage drill during the taper phase, not the default mode throughout.
6. **No comparative gamification.** Workspace content is private and individual — self-referential mechanics only (per-chunk mastery status, personal streak, a "ready" indicator tied to the individual's own deadline). No leaderboard, no shared-progress element.

**Flow:**
1. **Add material** — paste text / upload file / type manually, with a deadline date
2. **Auto-segment** — app breaks the text into breath-groups (Principle 3), tags verbatim-tier spans (quotes, citations, opener, closer — auto-detected where possible, manually confirmable)
3. **Build phase** — regular practice, volume increasing toward the deadline; weak breath-groups resurface disproportionately (Principle 5)
4. **Taper phase** (final ~week) — practice volume decreases but stays frequent; timed no-restart full run-throughs introduced
5. **Ready status** — tied to the individual's own deadline, not group comparison (Principle 6); exact criteria (chunk mastery alone vs. requiring a successful full run-through) still open — see Section 9

**Open items carried from the research doc, not yet resolved:**
- Exact breath-group segmentation approach: clause/punctuation heuristics vs. a trained sentence-boundary model
- How verbatim-tier content gets flagged automatically (quotation marks, citation formatting) vs. requiring manual tagging
- Precise build/taper timeline defaults, and whether they scale with how far out the deadline is
- Definition of "weak chunk" for resurfacing: error rate, hesitation/pause length, or both
- Whether "ready" requires a successful no-restart full run-through, or can be inferred from chunk mastery alone

### 5.7 Profile / Progress
- Streak calendar, total points, badges earned
- List of saved "Talk Practice" sets
- Accuracy history per unit/word (helps identify weak spots)

### 5.8 Leaderboard
- Group-wide ranking by points/streak
- (Phase 3) filterable by cohort/family group

### 5.9 Admin/Content Console (founder-facing, not end-user)
- Add/edit lesson units, vocabulary, audio files
- View aggregate usage (who's active, common trouble words) — helps prioritize new content

---

## 6. Tech Stack Recommendation

Given: mobile-first *end goal* but starting **web-first** for faster iteration and easier setup (no Node/Expo environment needed to get going, no app-store review for internally-distributed, copyrighted-content-based material), cloud sync required, live audio processing is the hardest technical piece.

**Sequencing:** Phase 1 (MVP) ships as an installable web app (PWA). Phase 3 migrates the frontend to React Native/Expo for real app-store distribution. The backend — Supabase (Postgres, Auth, Storage, RLS) and the Python/FastAPI audio-analysis service — stays identical across both phases; only the client layer changes. This isn't a free migration (screens get rebuilt for React Native rather than copy-pasted), but no backend work, schema design, or Tone Tuner logic is thrown away.

| Layer | Recommendation | Why |
|---|---|---|
| Web app framework (Phase 1) | **Next.js + TypeScript** | Fast to build and deploy, installable as a PWA for an app-like feel without app-store review; TypeScript catches mistakes early and pairs well with AI-assisted development |
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
| Signal processing | **TorchAudio / librosa / Praat-Parselmouth** | Praat-Parselmouth in particular is a phonetics research tool built specifically for pitch/tone contour analysis — the best-suited option for tone grading |
| Client-side pitch detection (web) | **Pitchy or Aubio.js** (optional, web-only) | Browser-based YIN-algorithm pitch tracking via Web Audio API — can power the live "tuner needle" feel client-side, before ever hitting the FastAPI service, since browsers have mature mic-access APIs |
| ASR verification | **Google Speech-to-Text V2** (optional) | Used only for verification, not core tone detection — tone grading is a pitch-tracking problem, not a full-ASR problem |
| Local lesson cache | **Browser storage/service worker (Phase 1)** → **Expo SQLite (Phase 3)** | Offline support differs by platform; web offline support is more limited (especially notifications on iOS Safari) |
| Builds/releases | **Vercel (Phase 1)** → **EAS Build + EAS Update (Phase 3)** | Minimal DevOps overhead for a small team |
| Analytics | **PostHog** | Enough to see engagement without custom build |
| Error tracking | **Sentry** | Catch issues in production from day one |
| Admin console | **Next.js + Supabase** | Founder-facing tool to add lesson content without touching the app code — this is already being built regardless, since it's shared infrastructure with the Phase 1 web app |

**Note on architecture:** this stack runs two backends — Supabase for the main app, and a separate Python/FastAPI service for audio analysis. That's the right call (Python's audio-processing ecosystem is far ahead of anything in Node), but it means a bit more deployment surface: the FastAPI service needs its own hosting (e.g., Fly.io or Render) alongside Supabase.

**Trade-off to keep in mind for Phase 1 (web):** no offline support, and push notifications are weaker on mobile web (especially iOS Safari) — fine for a small group mostly on wifi/data, but worth revisiting once streak-reminder notifications matter more.

---

## 7. Content Pipeline (Founder-Supplied Material)

Since all content comes from you (JW.org, wol.jw.org, and other material), the app needs a lightweight way to turn that into structured lesson data without hand-coding each entry:

1. **Source intake** — you provide connected Vietnamese text (sentences/phrases from real talks, not isolated word lists — since your material already has translations, English meaning comes along for the check/reveal step) and native-speaker audio, ideally at the chunk (sentence/phrase) level, with word-level audio for the subset of words used in Tone Tuner drills
2. **Structuring** — content gets organized into units (e.g., grouped by convention program, by publication, by topic) containing **chunks** (sentence/phrase-level entries with Vietnamese text, English meaning, source context, and audio); each chunk references the underlying `Word` entries it contains for Tone Tuner purposes
3. **Admin console (Phase 1 build)** — a simple internal tool (could even start as a spreadsheet/JSON import, as already prototyped in the seed script) so you can add new units and chunks without a developer touching code each time
4. **Copyright handling** — because JW.org/wol.jw.org content is copyrighted by the Watch Tower Bible and Tract Society, the app should be treated as an internal study tool for your defined group rather than a public product — this affects distribution (e.g., private app distribution / TestFlight-style internal distribution rather than public App Store listing) more than it affects the technical build. Worth revisiting before any public release.

---

## 8. Tone Tuner — Architecture Decision

This is the hardest and most novel part of the app. Two decisions from the original scoping, plus one **critical correction** surfaced by deeper phonetics research since — flagged first, because it changes the pipeline, the dataset spec, and the go/no-go criteria all at once.

### 8.0 Critical Revision: Pitch Contour Alone Is Not Sufficient

**The corrected premise:** it's true that raw pitch (Hz) is the wrong thing to compare — but *contour shape alone* is also not enough. Northern Vietnamese is better treated as a **register language**, not a pure pitch-contour tonal language: at least two tones, arguably three, are defined as much by voice quality as by pitch shape.

| Tone (Northern) | Pitch behavior | Voice quality requirement | Pitch-only tracking risk |
|---|---|---|---|
| ngang (T1) | mid level | modal (clean) voice | Low — pitch alone is reliable |
| huyền (T2) | low falling | modal voice | Low — pitch alone is reliable |
| sắc (T3) | high rising | modal voice | Low — pitch alone is reliable |
| hỏi (T5) | dipping-rising | breathy / more constricted phonation | Moderate — phonation is a supporting cue, evidence less unanimous |
| ngã (T6) | high, broken/rising | glottalization mid-vowel (creaky, voice interruption) | **High** — pitch tracking is unreliable or gaps during the glottal break itself |
| nặng (T4) | low, short, falling | creaky voice, often glottal closure at the end | **High** — creakiness causes irregular glottal pulses, unreliable F0 exactly where the tone's identity lives |

**Why this matters concretely:** the originally-planned contour-cleaning step ("fix octave errors, smooth, filter low-confidence frames") would treat the glottal gap in ngã or nặng as a tracking error and smooth over the exact feature that identifies the tone. That needs to be corrected in the pipeline design, not patched after the fact.

**The fix doesn't require a new library.** Praat/Parselmouth already computes the relevant voice-quality measures (jitter, shimmer, harmonics-to-noise ratio, H1–H2 spectral tilt) used throughout the Vietnamese tone-acoustics literature to quantify creakiness and breathiness. The requirement is architectural: treat "glottalization detected" as a first-class output the pipeline produces, not noise to be filtered away.

### 8.1 Revised Signal Pipeline

1. Validate audio quality
2. Detect the speech region
3. Isolate the vowel (tone lives in the syllable nucleus)
4. Extract pitch (Praat/YIN) **and** voice-quality measures (jitter, shimmer, HNR, H1–H2) **in parallel**, not as a fallback
5. Clean the contour — but explicitly distinguish "low-confidence frame due to noise" from "low-confidence frame due to genuine glottalization" *before* smoothing; the latter is signal, not noise, for ngã and nặng
6. Normalize pitch by speaker and by time (semitone/log-frequency — see 8.2)
7. Extract features: start pitch, end pitch, slope, turning point, duration, **plus glottalization presence/timing and phonation-type indicators** for the tones where they matter
8. Score against a reference range (not a single target), using **tone-appropriate feature weighting** — **confirmed scope: full voice-quality/glottalization scoring runs for all six tones in v1** (not deferred to just ngã/nặng/hỏi — see Decision 3 in 8.2a), even though ngang/huyền/sắc are expected to lean pitch-dominant in practice
9. Generate one specific, actionable correction — e.g. "start slightly lower," or, for glottalized tones, "add more of a catch/break in your voice," not just "wrong" — and drive a **dual-layer visual**: pitch contour line (attempt vs. target) *and* glottalization/creak shown visually, not folded silently into a single score

### 8.2 Validated Decisions

- **Dedicated Python/FastAPI audio-analysis service, separate from Supabase** — correct; real-time signal processing doesn't belong in Node/Edge Functions.
- **Praat/Parselmouth as the core library** — correct, and it already supports the voice-quality measures needed for 8.0/8.1 without adding a new dependency.
- **Speaker normalization via semitone/log-frequency, not raw Hz** — strongly validated; standard practice in tone-focused CAPT (computer-assisted pronunciation training) research, since absolute pitch varies by speaker age/sex while relative contour shape doesn't.
- **Google Speech-to-Text as optional verification only** — correct prioritization; tone identification is a pitch/voice-quality problem, not a word-recognition problem.
- **Three separate scores (audio usable / right word / right tone)** — well-aligned with current CAPT practice, which favors multi-aspect scoring over a single pass/fail specifically to avoid misattributing a bad recording as a pronunciation error.

This runs as a second backend service alongside Supabase, hosted separately (e.g., Fly.io or Render).

### 8.2a Product Decisions (Confirmed)

Locked in during a follow-up product/research session, treated as settled scope unless explicitly revisited:

| # | Decision | Detail |
|---|---|---|
| 1 | Dialect scope | Northern first. Architecture supports adding Southern later without a rebuild — a separate reference dataset and separate scoring target (Southern merges hỏi/ngã into one effective tone, plus consonant differences), not just a UI label. |
| 2 | Engine roadmap | Rule-based scoring logic now; move toward a learned model once enough labeled recordings exist. (Distinct from the pitch-*extraction* front-end — see 8.2b, which recommends a neural extractor even in v1; the scoring/decision layer on top stays rule-based first.) |
| 3 | Correction feedback scope | **Confirmed: full voice-quality (glottalization) feedback for all six tones from v1** — not deferred to just the high-risk tones. Supersedes the narrower ngã/nặng/hỏi-only scoping in 8.0/8.1. |
| 4 | Practice unit | **Words only for v1** (not phrases) — the source doc proposed "words plus short phrases," but this stays word-only per Phase 1 MVP scope; short phrases are Phase 2, consistent with sentence-level grading already being deferred there. |
| 5 | Feedback timing | Instant, per recording — a hard low-latency requirement on the pipeline, which factors directly into the offline/online decision (8.4) and the pitch-tracker choice (8.2b). |
| 6 | Content source | **Revised:** entirely curated, preset content — no user customization of what goes into Tone Tuner. Users work through a fixed series, not open freeform selection. "Freeform practice on any word" (as originally decided) now means freely practicing within the curated set, not user-added content — see 8.2c for the full resolution. **Reconfirmed** against the "Interactive Learning Architecture" doc's proposal to practice by Collection/Journey/Lesson/Word/Weak Words/Favorites/Random Review — that browse-by-selection model was explicitly considered and rejected; the preset-series decision stands. |
| 7 | Freeform guardrail | Freeform practice is **blocked** for any word without recorded reference data — no best-effort/estimated scoring. The curated list is the entire usable vocabulary at any given time; dataset growth directly gates feature growth. **Cross-cutting note:** confirmed — Workspace will eventually consume this same engine (see 8.2c), and inherits this same guardrail: a word from someone's own talk only gets feedback if it's already in the curated reference set. |
| 8 | Visual feedback | Dual-layer: pitch contour line (attempt vs. target) **and** glottalization/creak shown visually, not just folded into a score (reflected in pipeline step 9 above). |

### 8.2b Updated Technology Recommendations (Current State of the Art)

Two components have meaningfully better options now than classical Praat/YIN-only pipelines, both directly relevant to Decision 5 (instant feedback) and Decision 3 (full voice-quality scoring for all tones):

**Pitch tracking — add a neural pitch tracker alongside Praat/YIN.** Classical trackers (Praat's autocorrelation, YIN, RAPT) are fast and interpretable but less robust under noise than deep-learning-based trackers — a real concern for a mobile app used outside a studio. CREPE (a CNN estimating pitch directly from raw waveform) holds accuracy better across noise conditions than classical methods; lightweight successors (SwiftF0, FCPE, PENN) are built specifically for real-time use, and TorchCREPE already provides a practical PyTorch implementation fitting a Python-based service. **Recommendation:** keep Praat/Parselmouth for prototyping, reference-dataset analysis, and interpretable feature extraction (jitter, shimmer, HNR); use a lightweight neural pitch tracker (SwiftF0 or TorchCREPE) as the primary extractor in the production real-time path, since it addresses both mobile-mic noise robustness and the instant-feedback latency requirement.

**Voice-quality/glottalization detection — use a dedicated classifier, not a static formula.** This is the more consequential upgrade given Decision 3's broadened scope. Static Praat-formula measures (jitter, shimmer, H1–H2) are a reasonable baseline, but F0-adjacent measures are known to be unreliable in exactly the glottalized regions that matter most. Purpose-built creak/voice-quality classifiers (e.g., CNN-based models trained on raw waveform, sometimes using a self-supervised encoder like HuBERT) outperform static-formula approaches. **Recommendation:** budget a dedicated glottalization/creak detector into the v1 pipeline, not a v2 add-on — this is what Decision 3 now requires across all six tones. Start as a simpler acoustic-feature classifier (SVM or small neural net on jitter/shimmer/periodicity, consistent with earlier published creak-detection work) and graduate to a raw-waveform CNN once enough labeled Vietnamese creaky/non-creaky examples exist from the reference dataset — naturally aligned with Decision 2's rule-based-now, learned-model-later roadmap.

**Why modern end-to-end ASR still isn't the core engine (reaffirms 8.2).** Even current streaming ASR architectures (e.g., RNN-Transducer models combining transcription and prediction networks into one joint model) remain optimized for the most probable word sequence, not fine-grained tone/voice-quality scoring — a different problem in kind, not just scale, from what Tone Tuner needs to solve.

### 8.2c Product Surface: Shared Engine, Multiple Consumers

Confirmed architecture: the Tone Tuner is **one backend engine, consumed by three different frontends** over time, not three separate implementations:

1. **Tone Tuner tab (primary, v1)** — its own dedicated space where users work through a **preset series** from the curated dataset (words now, phrases per the existing Phase 2 plan) — not open browsing or customization; the practice sequence itself is curated, same as the content.
2. **Course tab (v1, already designed)** — the Chunk Drilling step (Section 1c) embeds a pass/fail Tone Tuner check on key words from the day's chunk; this is a consumer of the same engine, not a separate build.
3. **Workspace tab (deferred, not v1)** — Tone Tuner elements get embedded into rehearsal eventually. Not yet designed. When this happens, it inherits the same freeform guardrail (Decision 7 above): a word from someone's own talk only gets pronunciation feedback if it's already in the curated reference dataset.

**Resolved:** no user customization in v1 or the foreseeable near-term — the curated word/phrase set is entirely preset, and users work through it as a fixed series (words now, phrases per the Phase 2 plan). The long-term vision is a full, comprehensively-built-out vocabulary and common-phrase pairing set — but that's grown by the founder/content pipeline over time, not by individual users adding their own words. This removes the reference-data fork raised above: there's no "user adds an unrecorded word" case to design for, since users never add words at all — they only ever select from what's been curated and recorded.

### 8.3 Reference Data — Revised Guidance

The original call for 5–10 speakers × 3–5 repetitions per word stands, with one addition: the recorded speaker set must explicitly include **clear, unambiguous examples of glottalization** for ngã and nặng specifically. A speaker set that happens to underrepresent creakiness would silently reproduce the pitch-only blind spot inside the reference data itself, even with the corrected pipeline.

**Dataset staging (unchanged in approach, sharpened in content):** the staged six-word first milestone (one word per tone, prove the pipeline before scaling up) remains the right approach — but that six-word set must now specifically include at least one glottalized tone as a real test case, not defer that to the larger dataset phase.

**Regression fixture set:** add explicit cases for glottalized tones — e.g., a correct ngã with clear glottalization *vs.* a ngã attempt with correct pitch contour but no glottalization at all, which under the original pitch-only design would likely have scored as correct despite being perceptually wrong to a native listener.

### 8.4 Remaining Open Decisions

1. **Offline vs. online** — unchanged: online-first for MVP, architected so it can swap to an on-device model later without a rearchitecture. Note: both the neural pitch tracker and the creak classifier (8.2b) need to run within the instant-feedback latency budget (Decision 5), which should factor into this decision and the hosting choice.
2. **Feature-weighting formula** — how pitch-contour score and phonation-type score combine into one tone verdict needs empirical tuning once real reference recordings exist, not a constant guessed in advance.
3. **Whether hỏi needs the same phonation-inclusive treatment as ngã/nặng**, or can stay primarily pitch-contour-scored — the evidence is less unanimous here than for the other two.
4. **Dialect scope** — resolved as Decision 1 in 8.2a (Northern first, Southern architected for later as a separate dataset/scoring target).
5. **Go/no-go criteria addition:** alongside agreement on "correct," stability across repeated attempts, and fair handling of different voice ranges — add an explicit check that the system does **not** silently mis-score glottalized tones as correct based on pitch contour alone.
6. **Adaptive grading strictness by learner level** — flagged, not decided.
7. **Sizing of the initial curated word list** — now a real launch-scope question given Decision 7's freeform guardrail (8.2a): the curated list *is* the entire usable vocabulary at launch, not just a technical proof-of-concept detail.
8. **Creak/glottalization classifier: train in-house on the Vietnamese reference dataset, or adapt an existing model (e.g., DeepFry) via transfer learning** — worth a short feasibility check before committing engineering time.

---

## 9. Data Model (Sketch)

**Note on this revision:** `Chunk` (sentence/phrase-level, pulled from real talks) is now the *primary* teaching unit, per the concept-first design in Section 1a. `Word` still exists and still matters — it's the required unit for the Tone Tuner and a supporting reference layer — but lessons, the SRS engine, and Talk Practice now schedule and track progress at the `Chunk` level, not the `Word` level.

**New: `Collection` added above `Unit`**, per the "Interactive Learning Architecture" doc's hierarchy — accepted as a genuine improvement, not a conflict. `Unit` conceptually plays the role that doc calls "Journey" (a sequential, unlockable learning experience); `Collection` is the natural grouping above it (e.g., "2027 Convention," "Bible Reading Series," "Family Worship"). This is additive — existing `Unit`/`Chunk` structure is unchanged, just gains a parent.

```
User
 - id, name, email, accent_pref, created_at

Collection
 - id, title, description, display_order (e.g., "2027 Convention," "Bible Reading Series")

Unit
 - id, collection_id, title, order, source_reference (e.g., "July 2026 Convention Program")

Chunk
 - id, unit_id, vietnamese_text, english_text, source_context (e.g. which talk/paragraph this came from), audio_url, structural_concept (tags: classifier | topic_comment | particle | tone_identity | none — see Section 1b; drives Pattern Noticing selection)

ChunkWord
 - chunk_id, word_id, display_order (which Word entries appear within this chunk — links chunks to the Tone Tuner's word-level data)

Word
 - id, vietnamese_text, english_text, tone_pattern, audio_url
 (no longer unit-scoped directly — reached via ChunkWord; still the atomic unit for Tone Tuner drills)

UserChunkProgress
 - id, user_id, chunk_id, mastery_level, recognition_accuracy, last_practiced_at
 - SRS fields: interval_days, ease_factor, next_review_at, consecutive_correct
   (real spaced-repetition scheduling — e.g. SM-2-style — not just a mastery percentage)

UserWordProgress
 - id, user_id, word_id, pronunciation_accuracy, last_practiced_at
 (Tone Tuner-specific progress, separate from chunk-level SRS since word-level tone practice has its own cadence)

WorkspaceItem
 - id, user_id, title, source_text, item_type (talk | demo | prayer | reading | other), deadline_date, created_at

RehearsalChunk
 - id, workspace_item_id, text, display_order, tier (verbatim | gist), is_opener (bool), is_closer (bool)
 (breath-group segmented, ~10–15 words, following clause/punctuation — distinct from Learning tab's `Chunk`, see Section 5.6)

UserRehearsalProgress
 - id, user_id, rehearsal_chunk_id, error_count, avg_hesitation_ms, last_practiced_at, mastery_status (weak | developing | ready)
 (drives weak-spot-first resurfacing; deliberately no SRS interval fields — this is deadline-driven build-then-taper, not long-horizon spaced repetition)

WorkspaceSchedule
 - workspace_item_id, deadline_date, build_phase_end, taper_start
 (computed from deadline_date; drives the build-then-taper practice-volume curve — exact timeline defaults still open, see Section 5.6)

FullRunThroughAttempt
 - id, user_id, workspace_item_id, completed_without_restart (bool), duration_seconds, timestamp
 (taper-phase drill; contributes toward "ready" status — exact criteria still open, see Section 5.6)

TonePracticeAttempt
 - id, user_id, word_id, detected_tone, target_tone, passed (bool), timestamp

Badge / UserBadge
 - standard badge/achievement join table

LeaderboardEntry (can be computed, not necessarily stored)
 - derived from UserChunkProgress + streaks
```

---

## 10. Gamification Design

- **Points** — earned per completed drill, weighted so tone-tuner passes are worth more than passive recognition drills (production > recognition)
- **Streaks** — daily practice streak, visible on dashboard, core retention driver
- **Badges** — milestone-based (e.g., "First 10 words mastered," "7-day streak," "First talk practiced end-to-end," "Perfect tone score on a full lesson")
- **Leaderboard** — group-wide ranking; consider whether it's purely points-based or has a "most consistent" (streak-based) view too, since raw points can favor time-availability over effort

---

## 11. Open Decisions Before Build Starts

1. Offline requirement for the Tone Tuner (Section 8, Decision 1)
2. ~~Final choice of speech/pitch-tracking approach~~ — decided: Python/FastAPI + Praat-Parselmouth (Section 8, Decision 2)
3. ~~App name/brand~~ — decided: **Thanh Việt**
4. Internal distribution method given copyrighted source content (TestFlight/internal track vs. public store listing)
5. Exact structure of "units" — organized by convention program, by publication, by topic, or some combination
6. ~~Content model: word-list flashcards vs. concept-first chunks~~ — decided: **chunk-based (sentence/phrase-level)**, per Section 1a. Data model (Section 9) and lesson flow (Section 5.4) already updated to reflect this.
7. ~~Exact SRS algorithm for `UserChunkProgress`~~ — decided: **Half-Life Regression (HLR)**, per Section 1d, rather than classic SM-2
8. ~~How "i+1" gets calculated per learner~~ — decided: **lexical/chunk coverage matching** (90–95% known-word band) for MVP, with IRT-based adaptive difficulty (Duolingo Birdbrain-style) as a Phase 2+ evolution — per Section 1d

---

## 12. Name

**Chosen: Thanh Việt** — "thanh" (tone) + "Việt" (Vietnamese), a direct nod to the Tone Tuner as the app's signature feature.

Other options considered, kept here as backups:

- **Tiếng Nhà** ("Home Language" / "Language of Home") — evokes family/community
- **Sáu Thanh** ("Six Tones") — direct nod to the Tone Tuner feature
- **Học Cùng** ("Learn Together") — emphasizes the group/family aspect
- **Tune Việt** — playful pairing of "tone tuner" + Vietnamese

---

*Next step: pick which piece to design in depth first — recommend starting with the Tone Tuner architecture (Section 8), since it's the highest-risk, most novel part of the build and everything else in the app is comparatively standard.*
