# Workspace: Personal Content Rehearsal
### Design Principles & Research Foundations
*Handoff document for architecture and build phases • Prepared with Claude • August 9, 2026*

## 1. Purpose
Defines the design principles for the Workspace section — the personal-content rehearsal feature, distinct from the general-acquisition Learning tab. Helps someone deliver a specific, fixed piece of content (a talk, prayer, or reading) naturally and from genuine understanding, by a fixed date.

**Fully integrated into `vietnamese-app-spec.md` Section 5.6.**

## 2. Why Workspace Is a Different Problem Than the Learning Tab
The Learning tab optimizes for general acquisition: long time horizon, cumulative fluency, durable retrieval months later. Workspace optimizes for performance mastery of fixed, known content by a fixed date — closer to rehearsing a speech than acquiring a language. Relevant research fields: deliberate practice, memory-type research (verbatim vs. gist), athletic tapering/peaking, and public-speaking rehearsal science.

## 3. Six Design Principles

**3.1 Verbatim vs. Conceptual Delivery — Two-Tier Content.** Verbatim and gist memory are distinct, parallel memory systems. Gist memory is encoded more effectively and retrieved more fluently. The readiness test: losing a word mid-rehearsal and continuing without restarting signals true mastery. *Principle:* most content trains for gist-mastery; a small flagged subset (direct quotes, scripture citations, opener, closer) gets dedicated verbatim drilling.

**3.2 Deadline-Driven Scheduling — Build, Then Taper.** Athletic tapering: reduce training volume ~40–60% in the final stretch while keeping intensity/frequency high. Training hard to the final days pushes physiological peak to ~10 days after the event, missing the target date. *Principle:* practice volume builds and peaks more than a week before the deadline, then tapers in the final days while staying frequent.

**3.3 What a "Chunk" Means — Breath-Groups, Not Sentences.** The breath group is an established functional unit in speech science. Rehearsed/planned speech shows breath-breaks aligning with clause/phrase boundaries. Practical size: ~10–15 words per breath. *Principle:* auto-segment into breath-groups of ~10–15 words following clause/punctuation boundaries.

**3.4 Prosody / Sentence-Level Delivery — Explicitly Out of Scope.** No strong evidence base yet justifies a dedicated prosody/pacing scorer. *Principle:* keep out of scope; breath-group segmentation is a low-cost seed for future rhythm work without foreclosing it.

**3.5 Anxiety / Performance-Readiness — Weak-Spot-First Practice.** Practicing from the beginning every time produces a strong opening and weak ending, since any mistake sends the speaker back to start. *Principle:* disproportionately resurface poorly-performing chunks; introduce timed no-restart full run-throughs as a late-stage taper-phase drill.

**3.6 Personal vs. Shared Content — No Comparative Gamification.** Workspace content is private and individual. *Principle:* self-referential gamification only — per-chunk mastery, personal streaks, a "ready" indicator. No leaderboard.

## 4. Principle Summary Table

| # | Question | Principle |
|---|---|---|
| 1 | Verbatim vs. conceptual | Two-tier: gist-mastery by default; verbatim only for quotes/citations, opener, closer. |
| 2 | Deadline scheduling | Build-then-taper: volume peaks ~1+ week out, decreases in final days, frequency stays high. |
| 3 | Chunk definition | Auto-segment by breath-group (~10–15 words), not full sentence. |
| 4 | Prosody | Out of scope for now; breath-group segmentation is the seed for a future feature. |
| 5 | Performance-readiness | Weak-spot-first practice, plus timed no-restart run-throughs in the taper phase. |
| 6 | Personal vs. shared | No comparative gamification; self-referential mastery indicators only. |

## 5. Remaining Open Items for Architecture
- Exact breath-group segmentation algorithm: clause/punctuation heuristics vs. a trained model.
- How "verbatim-tier" content gets auto-flagged vs. requiring manual tagging.
- Precise taper timeline defaults — likely scales with how far out the deadline is.
- Definition of "weak chunk" for resurfacing: error rate, hesitation/pause length, or both.
- Whether "ready" requires a successful no-restart full run-through, or can be inferred from chunk-level mastery alone.

## 6. Reference List
- Reyna, V. F. & Brainerd, C. J. — Fuzzy-trace theory; verbatim and gist as parallel memory systems.
- Schönplug et al. — Pause-length studies distinguishing verbatim and gist recall in children (ScienceDirect).
- Effective Presentations, "Why Memorizing Your Speech Backfires" (2026).
- Toastmasters International, "Techniques To Remember Your Speech" (2024).
- LongTerm Memory Blog, "How to Memorize a Speech Fast: Step-by-Step Guide" (2025).
- NSCA, "Tapering and Peaking."
- Perform Podcast, "How to Properly Taper & Peak for Performance" (2025).
- Sports Performance Bulletin, "Peaking: the art of planning and tapering."
- Wang, Y-T., Green, J. R., Nip, I. S. B., Kent, R. D. & Kent, J. F. — "Breath Group Analysis for Reading and Spontaneous Speech in Healthy Adults," Folia Phoniatrica et Logopaedica, 62(6), 297–302 (2010).
- Moxie Institute, breath-phrasing and public-speaking coaching guidance.
