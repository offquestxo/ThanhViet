# Thanh Việt — Visual Primitives Reference (Draft v1, Light Pass)

*Companion document to [Curriculum-Lesson-Design-Framework.md](Curriculum-Lesson-Design-Framework.md), which governs when and why these primitives get used pedagogically (see that document's Section 15, Visual Learning System). This document is authoritative for primitive-level detail (composition, interaction pattern, constraints); the Framework governs the pedagogy around them. "Framework Section N" below refers to that document's numbering — not PRD.md's or TAD.md's, which use the same digits for unrelated sections (e.g. PRD.md Section 4 is "MVP Scope," TAD.md Section 4 is "Tone Tuner Architecture," UI-UX-Design-System.md Section 8 is "Screen Build Order" — all distinct from this Framework's Section 4/8 of the same number).*

This is a system-level sketch of the 8 reusable visual primitives that power Thanh Việt's visual layer. Every lesson's Visual Design section should cite one or more of these rather than inventing new visual behavior. This draft locks names, boundaries, and default layer assignments. Full specs come next, in this order: Character Relationship Scene → Conversation Scene → Action Animation → Timeline → Object/Classifier Scene → Location/Spatial Scene → Quantity/Grouping Scene → Tone/Pitch Visualization.

## 1. Character Relationship Scene

- **Purpose:** Teach that a term or structure depends on the relationship between speakers, not on either person alone. The learner's own position in the relationship changes what's correct.
- **Default layer(s):** Scene (primary teaching surface); can demote to a lighter Concept Map use once the relationship logic is already known.
- **Core composition:** A learner-avatar anchor point, with 2–5 other figures positioned around it. Figures and avatar carry adjustable attributes (age, gender, generation).
- **Interaction pattern:** Tap a figure → reveals the term + a short rule, conveyed visually (not translated). Toggle the avatar's own attribute (e.g. make the avatar older or younger) → all figure labels re-evaluate live, demonstrating the relationship logic rather than a fixed lookup.
- **Allowed parameters:** number/arrangement of figures, which attributes are adjustable, scene setting/backdrop, which relationship axis is in focus (age, gender, generation, formality).
- **Constraints:** No English text on tap — meaning conveyed through visual age/generation cues and the Vietnamese term itself. Any background detail must clear Framework Section 11 vocabulary governance. Sparrow: optional reaction character at the edge of the scene, never one of the core relationship figures.
- **Non-uses:** Not for showing a sequence of actions over time (→ Timeline or Action Animation). Not for two people actively exchanging dialogue (→ Conversation Scene).

## 2. Conversation Scene

- **Purpose:** Show a live exchange between two or more speakers — the functional, in-use version of language, as opposed to the relationship logic behind it.
- **Default layer(s):** Scene.
- **Core composition:** Two (occasionally more) speaking figures with a visible turn-taking structure — speech surfaces (bubbles, captions, or animated mouth/gesture cues) tied to audio.
- **Interaction pattern:** Learner listens to the exchange, can tap a turn to replay it, can swap their own role (become one of the speakers) and hear/see how the exchange would change.
- **Allowed parameters:** number of speakers, topic/content of the exchange, whether the learner is a participant or observer, formality register of the exchange.
- **Constraints:** No line-by-line English subtitles — meaning established through context, repetition, and visual staging, consistent with Framework Section 8's comprehensible-input principle. New vocabulary introduced in dialogue must be tagged per Framework Section 11.
- **Non-uses:** Not for teaching a relationship-dependent term system on its own (→ Character Relationship Scene, which this primitive assumes as already understood). Not for narrating a sequence of physical actions (→ Action Animation).

## 3. Action Animation

- **Purpose:** Show grammar and meaning changing through a visual state change, rather than explaining it — e.g. an action's completion, ongoing state, or future framing shown as a change in a small scene.
- **Default layer(s):** Micro-animation.
- **Core composition:** A single character or object performing a short, loopable action, with a clear before/during/after visual state.
- **Interaction pattern:** Learner taps between variants of the same sentence/chunk (e.g. present continuous vs. past vs. future framing) and watches the scene's state change correspondingly — plate fills/empties, character mid-motion vs. finished, etc.
- **Allowed parameters:** the action depicted, number of state-variants shown, pacing/loop length.
- **Constraints:** This primitive frequently surfaces grammar (tense/aspect markers) — tag [GRAMMAR OPPORTUNITY] per Framework Section 10 rather than explaining the structure within the animation itself. The animation shows the change; it does not narrate the rule.
- **Non-uses:** Not for showing extended time spans or scheduling (→ Timeline). Not for a full back-and-forth exchange (→ Conversation Scene).

## 4. Timeline

- **Purpose:** Represent when something happens relative to other events — sequencing, duration, or chronological order across a longer span than a single action.
- **Default layer(s):** Concept Map, occasionally Scene if animated.
- **Core composition:** A horizontal (or otherwise spatial) axis with markers for events/points in time.
- **Interaction pattern:** Tap a point on the timeline to hear/see the associated phrase; drag or scrub to move through time and watch time-related vocabulary or markers update.
- **Allowed parameters:** time scale (a day, a week, a sequence of unrelated events), number of markers, whether it's tied to a specific narrative or abstract.
- **Constraints:** Avoid clock-face or calendar-grid literalism unless the lesson is specifically about telling time — default to simple sequential markers for general "before/after/during" teaching.
- **Non-uses:** Not for showing a single action's internal state change (→ Action Animation). Not for spatial/location relationships (→ Location/Spatial Scene), even though both can feel like "axes."

## 5. Object / Classifier Scene

- **Purpose:** Teach classifier words and object-category logic — how Vietnamese groups nouns by shape/type/function, which has no direct English equivalent to lean on.
- **Default layer(s):** Concept Map, with Scene elements for grounding (real objects shown, not abstract icons alone).
- **Core composition:** A small set of objects grouped by shared classifier, with the classifier term visually distinct from the object labels.
- **Interaction pattern:** Tap an object → classifier + object term shown together; drag a new object into a group → learner predicts/confirms the correct classifier.
- **Allowed parameters:** which classifier category is in focus, number of objects, whether it's receptive (tap to learn) or productive (learner sorts objects themselves).
- **Constraints:** This is explicit grammar territory (classifiers are structural) — flag [GRAMMAR OPPORTUNITY] for sequencing/explanation timing, same as Action Animation's tense markers.
- **Non-uses:** Not for teaching plain vocabulary without classifier logic (that's just standard Memory Illustration use). Not for quantity/counting (→ Quantity/Grouping Scene) even though both involve grouped objects.

## 6. Location / Spatial Scene

- **Purpose:** Teach spatial relationships and location vocabulary — prepositions of place, directions, "in front of / behind / next to," navigating a space.
- **Default layer(s):** Scene.
- **Core composition:** A small environment (room, street, market) with distinct, nameable zones and objects/characters placed within it.
- **Interaction pattern:** Tap a zone or object → hear/see the location term; move a character through the space → learner hears directional language matched to the movement.
- **Allowed parameters:** environment type, number of nameable zones, static vs. navigable (learner-directed movement).
- **Constraints:** Background/environmental detail is especially prone to accidental vocabulary exposure here — every visible, nameable element needs Framework Section 11 clearance if the lesson expects the learner to notice it.
- **Non-uses:** Not for showing relationships between people (→ Character Relationship Scene). Not for sequencing events over time (→ Timeline), even when a scene involves movement.

## 7. Quantity / Grouping Scene

- **Purpose:** Teach counting, quantity, singular/plural logic, and number-related structures through visual grouping rather than translated math.
- **Default layer(s):** Scene, with Concept Map for abstracted number logic.
- **Core composition:** Discrete, countable objects or characters arranged in groups that can visually grow, shrink, or combine.
- **Interaction pattern:** Learner taps to add/remove items from a group and hears the corresponding quantity language update; compare two groups to surface comparative language (more/fewer/equal).
- **Allowed parameters:** object type, group size range, whether classifiers are involved (overlaps with Object/Classifier Scene — see below).
- **Constraints:** When quantity and classifiers intersect (most real Vietnamese counting does), this primitive should compose with Object/Classifier Scene rather than duplicate its classifier logic — define the seam clearly when both are used in one lesson.
- **Non-uses:** Not for classifier logic on its own without quantity in focus (→ Object/Classifier Scene). Not for timeline-based counting (e.g. "day 3 of 7") — that's Timeline's job.

## 8. Tone / Pitch Visualization

- **Purpose:** Give tone a visual form — pitch contour, shape, or motion — reinforcing Framework Section 4's principle that tone is part of a word's identity, not decoration.
- **Default layer(s):** Concept Map (contour shown statically) and Micro-animation (contour animated in sync with audio).
- **Core composition:** A pitch-contour line or shape per tone, ideally consistent across the whole app so a given tone always looks the same regardless of which word carries it.
- **Interaction pattern:** Tap a word → see its contour drawn/animated in sync with the native audio; compare two words' contours side by side for minimal-pair discrimination.
- **Allowed parameters:** single-word vs. contrastive-pair display, animation speed, whether paired with Tone Tuner feedback (once that engine exists).
- **Constraints:** Currently inactive for the Introductory course, per the decision to drop tone-focused activities there — this primitive remains defined for future courses and for whenever Tone Tuner is integrated, but should not be used in Introductory-course lessons until that changes.
- **Non-uses:** Not a general audio-visualizer for non-tonal purposes. Not a substitute for the Character Relationship Scene's age/generation visual cues, even though both use shape/motion to encode meaning.

## Cross-primitive notes

- **Overlap seams to watch:** Object/Classifier Scene ↔ Quantity/Grouping Scene (classifiers + counting), Timeline ↔ Action Animation (both show change, different timescales), Location/Spatial Scene ↔ Character Relationship Scene (both use spatial arrangement, but one encodes relationship logic, the other encodes physical space).
- **Grammar-surfacing primitives:** Action Animation and Object/Classifier Scene are the two most likely to surface [GRAMMAR OPPORTUNITY] tags by default — worth expecting this rather than treating it as an edge case each time.
- **Sparrow usage:** Defined per-primitive above; general rule remains guide/reactor/occasional participant, never a default inhabitant of every scene.
- **Vocabulary governance:** Location/Spatial Scene and Conversation Scene carry the highest risk of incidental, unintended vocabulary exposure through background detail — flag explicitly in any lesson's Visual Design section using these.

## Next step

Full spec of Character Relationship Scene, using the 8-field format (Name, Purpose, Default layer, Core composition rules, Interaction pattern, Allowed parameters, Constraints, Non-uses) at full depth, with worked examples across at least two courses.
