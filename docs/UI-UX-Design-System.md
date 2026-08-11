# Thanh Việt — UI/UX Design System

*Split from the master spec on August 11, 2026. See also: PRD (Product Requirements), TAD (Technical Architecture), Engineering Standards. Reference files: `design-homepage-handoff.md` (original v1 handoff), `homepage-mockup-reference.png` (visual mockup).*

## 0. Philosophy

Thanh Việt should feel like a premium Apple product rather than a traditional educational application. The UI should feel calm, spacious, interactive, and effortless. The learner should always know the next action. **This is not a dashboard — it is a personal learning environment.**

Avoid clutter. Avoid dashboards. Avoid enterprise software aesthetics.

Every screen should answer one question: **"What should I do next?"**

---

## 1. Navigation & Tab Naming (Resolved)

**Home · Collections · Practice · Tone Tuner · Leaderboard · Profile**

- **Collections** = the Learning tab (PRD Section 2) — replaces generic "courses"
- **Practice** = Personal Workspace (PRD Section 6)

**Resolved design decisions:**
- **Favorites** (a Collection card on Home) is a personal, non-linear bookmark list — **no completion percentage** shown, unlike curriculum Collections (Scriptures, Presentations, Talks) which track real progress through sequential content. (The reference mockup shows Favorites with a 58% bar — that's stale; this resolution supersedes it.)
- **Weak Words widget "Practice" button** routes to **SRS-based recall review using the supplementary flashcard layer** (PRD Section 2), *not* the Tone Tuner. Keeps the Tone Tuner's preset-series-only decision (TAD Section 4.3, Decision 6) fully intact with no carve-outs.
- **"Friends Leaderboard"** styling, but sourced from the real group-wide leaderboard — there is no friend-relationship/social-graph feature or data model to back an actual "friends" concept.

**Build sequencing note:** the homepage design assumes all systems (Collections, Tone Tuner, Practice/reading) are simultaneously live. Given the confirmed Phase 1a/1b split (PRD Section 5), Tone Tuner's engine is gated on real recordings that don't exist yet. Homepage components tied to Tone Tuner (the "Tone Accuracy" stat card, "Practice Tone Tuner" daily-goal item) should **gracefully degrade or hide** rather than show fake/broken data until Phase 1b lands. Same treatment applies to "Reading Readiness" (undefined — PRD Section 8) and any Collection card with zero real content behind it (real empty state, not a fabricated card).

---

## 2. Design Principles

**1. One Primary Action Per Screen.** Every screen should have one obvious action (Home → Continue Journey; Lesson → Next; Tone Tuner → Practice Again; Practice → Resume Assignment). Never compete for attention.

**2. Progressive Disclosure.** Do not show everything at once. Reveal additional information only when useful (tap to reveal translation, expand lesson details, open vocabulary explanations, open tone breakdown). Never overwhelm beginners.

**3. Motion Has Purpose.** Animations should communicate state changes, never animate simply because it looks nice. Motion should explain (progress fills, journey unlocks, cards expand, collections elevate on hover, avatar enters naturally, XP counts upward, confetti only after meaningful milestones).

**4. Large Visual Hierarchy.** Large typography, large whitespace, large imagery, small amounts of text. Every screen should breathe.

**5. Audio First.** The application teaches spoken Vietnamese. Audio is a primary interaction. Play buttons should always feel prominent. Recording should feel effortless. **Listening should always happen before speaking.**

---

## 3. Design Language

**Style inspiration:** Apple, Apple Fitness+, Apple Music, Duolingo, Headspace, Spotify.

**Avoid:** Material Design look, enterprise dashboards, Windows-style UI, heavy gradients, neon colors, busy interfaces.

### Color System
- **Background:** Warm White, Cream, Soft Gray
- **Primary:** Emerald, Teal
- **Secondary:** Deep Jade
- **Accent:** Warm Gold, Soft Coral, Orange
- **Success:** Green
- **Warning:** Amber
- **Error:** Muted Red
- **Typography:** Deep Slate, Dark Navy — **never pure/harsh black**

### Typography
Large headings, comfortable reading size, generous line spacing.
Hierarchy: Display → Heading → Subheading → Body → Caption → Label
Never use tiny text for important information.

### Border Radius
- Cards: 20–24px
- Buttons: 16–20px
- Inputs: 16px
- Avatars: circular
Cards should feel soft.

### Elevation
Subtle shadows only, no heavy floating cards. Use elevation only to indicate interaction:
- Hover → slight lift
- Pressed → small compression
- Selected → soft glow or outline

### Iconography
**Lucide Icons.** Thin, consistent stroke width, minimal. Never decorative.

### Illustration Style
Friendly, modern, warm, semi-flat, soft lighting, rounded shapes — inspired by Apple illustrations and Headspace.
**Avoid:** anime, heavy cartoons, aggressive mascots, overly childish graphics.

### Avatar
Purpose: coach, guide, companion. **Never mascot-first, never interrupts the workflow.**
Appears during: welcome, achievements, journey completion, helpful reminders, encouragement.
Should feel supportive rather than entertaining. Example messages: "Only two words left." / "Great pronunciation." / "Ready to practice?" / "Excellent work."

---

## 4. Component Architecture

Every screen must be assembled from reusable components. Core components:

Hero Card · Collection Card · Journey Card · Lesson Card · Chunk Card · Vocabulary Card · Weak Word Card · Continue Card · Leaderboard Card · Progress Ring · Progress Bar · Tone Graph · Audio Player · Recorder · Avatar Bubble · Badge · Achievement Toast · Bottom Sheet · Modal · Loading Skeleton · Empty State · Error State

All components should exist independently before screen assembly.

---

## 5. Homepage Layout

**Structure (superseded by Section 5a's three-column composition — kept here as the original section-by-section content list, still accurate for *what* appears, just not *how* it's arranged):** Hero → Progress Cards → Collections → Today's Goal → Continue Practice → Leaderboard → Weak Words → Footer

The homepage should function as a personalized learning workspace.

## 5a. Homepage Visual Direction (Resolved)

**Provenance note:** this section was reconstructed from a one-line bracketed summary plus a reference mockup and detailed composition instructions given in chat — not copied from an actual prior draft, which was referenced but never actually received in this conversation (same situation as the original design-homepage-handoff.md earlier in this project, and handled the same way: flagged, not silently paraphrased). Correct anything below that doesn't match what was actually decided elsewhere.

**Two conflicts the reference mockup introduced, resolved in favor of already-settled decisions rather than silently changed:**
- The mockup's brand mark reads "TONEPATH." Treated as a mockup-generation artifact, not a rename — the app stays **Thanh Việt** (Section 12 of the archived spec, used consistently everywhere else).
- The mockup's sidebar shows "Learn (Courses)" instead of "Collections," and adds a 7th tab, "Social," not present anywhere else in this project. Section 1's tab taxonomy (**Home · Collections · Practice · Tone Tuner · Leaderboard · Profile** — six items, already Resolved) is kept as-is; the mockup's naming/addition is not adopted.

**Composition — three columns, frozen as of this pass (not to be redesigned further without an explicit ask):**
- **Left: compact sidebar** — logo/brand, the six nav items (Section 1), and a "This Week" weekly-progress module pinned at the bottom (streak, XP, journeys completed, next-badge progress).
- **Center (dominant column):** greeting row → hero card → compact stat cards row → collections grid → recently-practiced row.
- **Right (narrower rail):** Today's Goal, Leaderboard, Weak Words.

**Hero card:** the clear dominant visual element on the page. **Solid emerald fill** (`--primary`), not a photo/ambient background — supersedes the original design-homepage-handoff.md's "warm sunlight, floating particles" treatment, which assumed real photography/imagery that doesn't exist yet. Large title, progress bar, dual CTAs ("Continue Journey" primary, "View Journey" secondary).

**Per-collection accent colors:** each Collection card (Scriptures, Presentations, Talks, Favorites) gets its own accent tint rather than uniform styling — the mechanism for "should feel like Spotify playlists" (Section 5) without needing real per-collection photography yet.

**Colorful icon badges:** icons throughout (Today's Goal checklist rows, stat cards, nav) sit on small colored badge backgrounds matched to their category, rather than plain monochrome icons — reinforces the "friendly, alive" feel from Section 3 without relying on imagery.

**Full motion commitment:** Section 6's motion system stands at full scope, not scaled back — animations aren't implemented yet as of this pass (structural-first), but nothing here should be read as walking that back.

**Two-mode system:** light and dark mode are both first-class, not a light-mode-only design with dark as an afterthought — already true of the token system (globals.css), reaffirmed here.

**No monetization:** no ads, upsells, or paywall visual patterns anywhere in this UI — internal, non-commercial tool for a defined group (PRD Section 1).

**Sparrow mascot — slot reserved, asset not integrated.** Real reference art exists now (provided in chat, not yet saved into `docs/` — ask if you want it archived there like the homepage mockup was). The Hero card reserves a component slot for it (`MascotBubble` in `src/components/home/hero-card.tsx`, currently renders nothing) — actual integration is explicitly deferred to the later polish pass (PRD-adjacent roadmap item 6, see Engineering-Standards.md's build-order note).

**Scale:** slightly larger content scale and whitespace than the tightest version of the reference mockup — the mockup itself reads dense/compressed; the goal is a desktop experience that feels premium, not cramped, per Section 2's "Large Visual Hierarchy" principle.

**Status: this visual architecture is frozen as of this pass.** Further homepage visual iteration is out of scope going forward — real content lands feature-by-feature (Collections, then Lesson, then Practice, then Leaderboard/progress data, then Tone Tuner, then a final polish pass covering mascot integration, imagery, motion, responsive/mobile, and empty/loading states), refining each screen's visuals alongside its real data rather than as a standalone design exercise.

### Hero Card
Large immersive card, occupies visual focus. Contents: greeting ("Xin chào, Jay 👋 / Ready for today's journey?"), current Journey (e.g., "Psalm 23 / Scripture Collection"), large progress bar, "Continue Journey" primary button + "View Journey" secondary button. Background should feel alive — warm sunlight, floating particles, moving leaves, subtle ambient animation. Never static.

### Progress Cards (four, below hero)
🔥 Current Streak · ⭐ XP · 🎯 Tone Accuracy (hidden until Phase 1b) · 📖 Reading Readiness (hidden until defined — PRD Section 8)

### Collections
Replace generic courses, displayed as large visual cards, each with its own visual identity — should feel like Spotify playlists:
- 📖 **Scriptures** — warm parchment, open Bible, gold accents
- 🎤 **Presentations** — stage, podium, audience lighting
- 🎙 **Talks** — professional microphone, warm studio
- ⭐ **Favorites** — notebook, bookmarks, gold star (no progress bar — see Section 1)

### Today's Goal
Simple checklist (e.g., "Learn 12 Words," "Practice Tone Tuner" [hidden until Phase 1b], "Read Today's Scripture," "Complete Journey"). One tap begins each activity.

### Continue Practice
Shows current Workspace assignment (e.g., "Psalm 23 — 74% Ready"), Resume button, large progress bar.

### Leaderboard
Weekly, Duolingo Leagues-inspired styling (🥇🥈🥉 + ranked list), a nudge line ("Only 40 XP to pass Hannah"), large "Practice Now" button. **Sourced from the real group-wide leaderboard, not a friends/social graph** (Section 1). Goal is friendly motivation, not competition.

### Weak Words
Rows: Vietnamese, English, mini tone contour, Practice button → routes to SRS flashcard review (Section 1).

---

## 6. Motion System

Motion tokens:
- **Hover** → Card Lift
- **Press** → Card Compress
- **Navigation** → Smooth Slide
- **Progress** → Animated Fill
- **Journey Unlock** → Scale + Glow
- **XP** → Counter Animation
- **Hero** → Ambient Background Motion
- **Avatar** → Fade + Slide
- **Confetti** → Milestones Only

Motion duration should feel premium and deliberate — nothing abrupt.

---

## 7. Screens & User Flows

### 7.1 Onboarding
1. Welcome screen → sign up / log in
2. Placement (optional in MVP — can default everyone to Unit 1 given "mostly beginners")
3. Quick tutorial: how the Tone Tuner works (practice on 1–2 sample words before real lessons start)

### 7.2 Home
See Section 5.

### 7.3 Collections / Lesson Path
Visual map of units (locked/unlocked/completed states — standard Duolingo-style path). Tapping a unit opens the lesson flow.

### 7.4 Lesson Flow (within a unit) — as built
1. **Encounter** — the Vietnamese chunk (sentence/phrase from a real talk) is shown with native audio and, where helpful, a supporting image or short situational context — **no English translation yet**
2. **Notice** — a lightweight pattern-recognition step: e.g., matching the chunk to one of a few context clues, or identifying a recurring word/particle across a few chunks
3. **Check** — the English meaning becomes available on request (tap to reveal), confirming or correcting what the learner inferred
4. **Speak** — the learner records themselves saying the chunk, plays it back next to the native audio for self-comparison. **No automated scoring here** — playback-only, distinct from the Tone Tuner's scored word-level check in the next step
5. **Produce** — Tone Tuner drill on one or two key words from the chunk (currently a non-gating stub until Phase 1b's engine exists)
6. **Review** — quick recap screen, points awarded, streak updated; the chunk is scheduled for spaced review via the SRS engine

### 7.5 Tone Tuner (standalone + embedded in lessons)
- Large visual tone indicator (needle, wave, or tone-contour graphic — matches the "instrument tuner" metaphor)
- Word shown in Vietnamese with tone marks highlighted
- Live waveform/pitch trace overlaid against the target tone contour
- Dual-layer visual: pitch contour line *and* glottalization/creak shown visually (TAD Section 4.1)
- Pass/adjust feedback in real time; "Try again" vs. "Nice — next word"
- Preset series only — no browsing/selection (TAD Section 4.3, Decision 6)

### 7.6 Practice / Personal Workspace
See PRD Section 6 for the full design principles and flow. UI-specific notes:
- Add material screen: paste / upload / type, with a deadline-date picker
- Build-phase and taper-phase practice screens differ in framing (volume/intensity cues) even if the underlying breath-group drill UI is shared
- "Ready" status indicator — self-referential, no leaderboard/comparison element anywhere in this tab

### 7.7 Profile / Progress
Streak calendar, total points, badges earned, list of saved Workspace items, accuracy history per unit/word.

### 7.8 Leaderboard
Group-wide ranking by points/streak (styled as "Friends Leaderboard" — see Section 1). Phase 3: filterable by cohort/family group.

### 7.9 Admin/Content Console (founder-facing, not end-user)
Add/edit lesson units, vocabulary, audio files. View aggregate usage (who's active, common trouble words).

---

## 8. Screen Build Order

Build one screen at a time — do not begin building every screen simultaneously. Perfect one screen before moving to the next.

1. Logo
2. App Icon
3. Avatar
4. Design System (tokens, components)
5. Homepage
6. Collections
7. Journey
8. Lesson
9. Tone Tuner
10. Practice/Workspace
11. Leaderboard
12. Profile

**As-built status:** Logo — **not integrated** (unchanged; still a loose, uncommitted file, no favicon/header usage — see Section 5a, sparrow mascot has the same "reserved, not integrated" status for the same reason: no final asset wired in yet). Design System (tokens, shadcn/ui, Framer Motion, Lucide Icons) — **done** (Stage 1). App shell (sidebar nav, top bar, page frame) — **done** (Stage 2). Homepage — **structural composition done** per Section 5a's frozen three-column architecture (hero, stat cards, collections grid, recently-practiced, Today's Goal, leaderboard, weak words all present as real components; most content is still placeholder — see Section 5a for exactly which parts are real data vs. placeholder). Lesson flow (steps 4/8) — functionally built, verified end-to-end, not yet restyled to this system. Collections/Journey/Tone Tuner/Practice/Leaderboard/Profile screens — placeholder-only ("coming soon" pages), real builds proceed feature-by-feature per Section 5a's roadmap.

---

## 9. Responsive Strategy

Desktop-first. Desktop serves as the design playground. Mobile is adapted after desktop approval — do not design mobile and desktop independently. Maintain the same component library across platforms.

---

## 10. Accessibility

Keyboard accessible. Screen-reader friendly. Large touch targets. High contrast. Support dynamic font sizes. Captions for all audio. Never rely solely on color to communicate meaning.

---

## 11. Design Success Criteria

The interface should make users feel: Calm · Focused · Motivated · Guided · Accomplished

A first-time user should immediately understand what to do without reading documentation. Every interaction should reinforce the feeling that Thanh Việt is a premium learning experience rather than a traditional educational application.

When someone opens Thanh Việt for the first time, they should immediately think: *"This is beautiful." "I know exactly what to do next." "I want to continue learning."*
