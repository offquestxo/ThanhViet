# Concept-First Language Acquisition
### Research Foundations for a Vietnamese Learning App
*Handoff document for architecture and build phases • Prepared with Claude • August 9, 2026*

## 1. Purpose
This document consolidates the linguistic and cognitive-science research behind a proposed Vietnamese learning application. The app's core premise: replace word-for-word translation as the primary learning mechanism with direct concept formation in the target language, supported by learning mechanisms with strong empirical backing. This document is the research foundation layer — intended as input for architecture and content/algorithm design, not the design itself.

**Fully integrated into `vietnamese-app-spec.md` Sections 1a–1d.**

## 2. Core Premise
Standard language learning tools lean heavily on interlingual translation: mapping target-language words and phrases onto native-language equivalents. This creates a persistent dependency — the learner never stops routing meaning through their first language, which caps fluency and speaking speed.

The alternative is conceptual fluency: building meaning directly in the target language's own semantic and grammatical structure, the way a first language is acquired. Different languages categorize reality differently — space, time, relationships, and action are not carved up the same way across languages — so literal translation actively fights comprehension rather than aiding it.

Vietnamese is a strong candidate for a concept-first approach because it is an isolating/analytic language: no conjugation, no tense marking, no plural marking. Meaning is carried by word order, particles, and context rather than word endings.

## 3. On the "train it like a neural network" analogy
**Where the analogy holds:** Both human brains and neural networks perform statistical/distributional learning — detecting regularities across repeated exposure to input.

**Where it breaks:** Children reach native fluency on an estimated 2–7 million words of input per year — a tiny fraction of what LLMs require. Humans are dramatically more sample-efficient than transformers. Brains do not add "layers" with practice; what changes is which circuits handle the task and how automatic (implicit, effortless) processing becomes — automatization.

**Design implication:** The app should not be built around maximizing volume of exposure alone. It should maximize the quality and comprehensibility of each exposure.

## 4. Four Research-Backed Learning Mechanisms

### 4.1 Comprehensible Input ("i+1")
Krashen's Input Hypothesis: language is acquired through input understood — pitched just slightly above current competence — through comprehension of meaning, not conscious study of grammatical form. Comprehension-based methods consistently outperform explicit grammar drilling. Weakest part of the theory: Krashen's claim that output matters comparatively little to acquisition is thinner on evidence than the core input claim.

*Sources: Krashen (1985), The Input Hypothesis: Issues and Implications; Krashen, "The Case for Comprehensible Input" (sdkrashen.com); Language Magazine, "The Case for Comprehensible Input" (2017).*

### 4.2 Statistical / Implicit Pattern Extraction
Learners detect a language's structural regularities purely by tracking distributional patterns in input, without being told the rule, showing measurable learning after limited exposure.

*Sources: Sandoval et al., "Neural Correlates of Morphology Acquisition through a Statistical Learning Paradigm," Frontiers in Psychology (2017); meta-analysis of statistical learning brain networks (2024, PMC).*

### 4.3 Spaced Repetition + Retrieval Practice
Spacing effect: studying across spaced intervals produces significantly better long-term retention than massed study, even at equal total study time. Testing/retrieval effect: actively attempting recall strengthens memory more than passive re-review, even when the attempt fails.

*Sources: Adesope et al. meta-analysis (2017) on retrieval practice; "Spaced Repetition and Retrieval Practice..." (2025); systematic review, ScienceDirect (2023).*

### 4.4 Chunking → Automatization
Fluent speakers retrieve whole prefabricated multi-word chunks as single units rather than assembling sentences word-by-word. This frees working memory from grammatical construction, redirecting it toward meaning.

## 5. Mechanism → Feature Map

| Mechanism | Research basis | App design implication |
|---|---|---|
| Comprehensible input (i+1) | Acquisition happens through input pitched slightly above current level, understood via context. | Feed native-style Vietnamese content just above the learner's level — never English-translated captions. |
| Statistical / implicit pattern extraction | Learners detect structural regularities from exposure alone. | Expose many real examples of a pattern before explaining the rule. |
| Spaced repetition + retrieval practice | Spaced study and active recall outperform massed study/passive review. | SRS engine around concept recall, not translation prompts. |
| Chunking → automatization | Fluent processing retrieves prefabricated chunks as units. | Teach high-frequency chunks as atomic units, drilled to instant recall. |

## 6. Open Questions for the Architecture Phase
- How is "i+1" calculated and adjusted per learner in real time?
- What is the atomic content unit — sentence, chunk, or micro-scene?
- How is implicit pattern exposure sequenced so patterns appear with enough density to be detectable before any rule is shown?
- What retrieval-practice formats will be used, and how are near-misses scored?
- How is spoken output incorporated, given the open question around Krashen's output-hypothesis critique?

## 7. Reference List
- Krashen, S. (1985). *The Input Hypothesis: Issues and Implications.* Longman.
- Krashen, S. "The Case for Comprehensible Input." sdkrashen.com
- Language Magazine (2017). "The Case for Comprehensible Input."
- Sandoval, M. et al. (2017). "Neural Correlates of Morphology Acquisition through a Statistical Learning Paradigm." Frontiers in Psychology.
- Coordinate-based meta-analysis of statistical learning brain networks (2024/2025). PMC.
- Adesope, O. et al. (2017). Meta-analysis on retrieval practice and long-term retention.
- "Spaced Repetition and Retrieval Practice: Efficient Learning Mechanisms from a Cognitive Psychology Perspective and Their Empowerment by AI" (2025).
- Systematic review: spacing/interleaving/retrieval practice, ScienceDirect (2023).
- Beguš, G. et al., reported in Quanta Magazine, "Some Neural Networks Learn Language Like Humans" (2023).
- "Comparing feedforward and recurrent neural network architectures with human behavior in artificial grammar learning" (PMC).
- Warstadt, A. & Bowman, S. "What Artificial Neural Networks Can Tell Us About Human Language Acquisition." arXiv:2208.07998.
