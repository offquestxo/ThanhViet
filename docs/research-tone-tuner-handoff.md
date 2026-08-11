**Tone Tuner**

Engineering Research Handoff — Pitch Analysis & Tone Scoring

*Handoff document for architecture and build phases • Prepared with
Claude • Updated August 9, 2026 (v2 — adds product decisions + modern
tech stack)*

1\. Purpose

This document validates and revises the Tone Tuner engineering plan
against the phonetics and CAPT (computer-assisted pronunciation
training) research literature, and now also captures the product
decisions locked in during the design-question session, plus updated
technology recommendations reflecting current (2025–2026) approaches
rather than older signal-processing-only methods.

2\. What the Original Plan Gets Right

The following decisions are well-supported by the research and can be
considered validated, not just proposed.

**Dedicated audio-analysis service:** Correct call. Real-time signal
processing (pitch extraction, contour analysis) does not belong in
Node/Edge Functions; a separate Python service is the standard
architecture for this class of problem.

**Praat / Parselmouth as a core library:** Correct call for prototyping
and interpretable acoustic features; see Section 7 for where a modern
neural component should now sit alongside it.

**Speaker normalization via semitone/log-frequency, not raw Hz:**
Strongly validated. Published tone-normalization methods (Chao's
five-point system, Z-score, proportion-of-range, and
logarithmic-semitone methods) all convert away from raw Hz for exactly
the reason in the current plan: absolute pitch varies enormously by
speaker age and sex, while relative contour shape does not.

**Google Speech-to-Text as optional verification only:** Correct
prioritization. Tone identification is fundamentally a
pitch/voice-quality tracking problem, not a word-recognition problem —
full ASR is the wrong primary tool for it (see Section 7 for how modern
ASR actually works and why it doesn't transfer).

**Three separate scores (audio usable / right word / right tone):**
Well-aligned with current CAPT practice, which favors multi-aspect,
hierarchical scoring over a single pass/fail judgment, precisely to
avoid misattributing a bad recording as a pronunciation error.

3\. Critical Revision: Pitch Contour Alone Is Not Sufficient

**This changes the pipeline:** The plan's original premise —
“Vietnamese's six tones are defined by pitch contour shape, not raw
pitch value” — is only half correct. Contour shape alone is not enough:
at least two, arguably three, of the six tones are defined as much by
voice quality as by pitch.

Modern phonetic research treats Vietnamese as a register language, not a
pure pitch-contour tonal language. Northern Vietnamese's tones combine
pitch contour with a distinction between modal, breathy, and
creaky/glottalized voice quality — this is treated in the literature as
a primary, sometimes the primary, perceptual cue for certain tones.

The two tones most affected are ngã and nặng. The ngã tone involves
glottalization — an audible interruption or creak — in the middle of the
vowel; this glottalization makes it impossible to get well-defined pitch
measurements at the tone's midpoint, because there is effectively no
clean phonation to track during the glottal break. The nặng tone is
short and creaky, typically ending in glottal closure, which produces
irregular glottal pulses that make standard F0 extraction unreliable
exactly where the tone's identity lives. The hỏi tone has also been
described as involving breathy or more constricted phonation, though the
evidence here is less absolute.

|                     |                     |                                                       |                                                                                       |
|---------------------|---------------------|-------------------------------------------------------|---------------------------------------------------------------------------------------|
| **Tone (Northern)** | **Pitch behavior**  | **Voice quality requirement**                         | **Pitch-only tracking risk**                                                          |
| ngang (T1)          | mid level           | modal (clean) voice                                   | Low — pitch alone is a reliable cue                                                   |
| huyền (T2)          | low falling         | modal voice                                           | Low — pitch alone is a reliable cue                                                   |
| sắc (T3)            | high rising         | modal voice                                           | Low — pitch alone is a reliable cue                                                   |
| hỏi (T5)            | dipping-rising      | breathy / more constricted phonation                  | Moderate — phonation is a supporting cue                                              |
| ngã (T6)            | high, broken/rising | glottalization mid-vowel (creaky, voice interruption) | High — pitch tracking is unreliable or gaps during the glottal break itself           |
| nặng (T4)           | low, short, falling | creaky voice, often glottal closure at the end        | High — creakiness causes irregular glottal pulses that make F0 measurement unreliable |

**Product decision (confirmed):** Following this finding, the product
session resolved to build full voice-quality feedback for all tones from
v1, including visual display of glottalization — see Sections 6 and 7.

4\. Revised Signal Pipeline

- Validate audio quality

- Detect the speech region

- Isolate the vowel (tone lives in the syllable nucleus)

- Extract pitch AND extract voice-quality measures in parallel, not as a
  fallback (see Section 7 for the recommended modern tools for each)

- Clean the contour — explicitly distinguish “low-confidence frame due
  to noise” from “low-confidence frame due to genuine glottalization”
  before smoothing; the latter is signal, not noise, for ngã and nặng

- Normalize pitch by speaker and by time (semitone/log-frequency)

- Extract features: start pitch, end pitch, slope, turning point,
  duration, plus glottalization presence/timing and phonation-type
  indicators

- Score against a reference range (not a single target), using
  tone-appropriate feature weighting

- Generate one specific, actionable correction, and drive the dual-layer
  visual (pitch line + glottalization marker)

5\. Other Elements of the Deeper Plan — Validated As-Is

5.1 Reference data from multiple speakers

Supported. The call for 5–10 speakers × 3–5 repetitions per word is a
reasonable starting point; the recorded speaker set must include clear,
unambiguous glottalization examples for ngã and nặng specifically, or
the reference data will silently reproduce the pitch-only blind spot.

5.2 Dataset scope and staged rollout

The staged approach (prove the pipeline on ~6 words, one per tone,
before recruiting a larger recording effort) remains sound. Given
Decision 7 (freeform is blocked without reference data), the size and
composition of this initial word list now directly determines Tone
Tuner's usable scope at launch, not just its technical proof-of-concept.

5.3 Regression fixture set

Validated. Include fixture cases for glottalized tones specifically —
e.g., correct ngã with clear glottalization vs. correct pitch contour
but no glottalization at all, which a pitch-only design would
incorrectly score as correct.

5.4 Go/no-go criteria

Validated, with the added check that the system does not silently
mis-score glottalized tones as correct based on pitch contour alone.

6\. Product Decisions Locked In (Design Session)

The following were decided in the follow-up product session and should
be treated as settled scope, not open questions, unless revisited
explicitly.

|        |                           |                                                                                                                                                                                                                                           |
|--------|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **\#** | **Decision**              | **Detail**                                                                                                                                                                                                                                |
| 1      | Dialect scope             | Northern first. Architecture must support adding Southern later without a rebuild (separate reference dataset + separate scoring target, not just a UI label).                                                                            |
| 2      | Engine roadmap            | Rule-based signal-processing pipeline now; move toward a learned model once enough labeled recordings exist (see Section 7 for what that model should be).                                                                                |
| 3      | Correction feedback scope | Full voice-quality (glottalization) feedback for all tones from v1 — not deferred. Reopens and supersedes the “pitch-only correction” framing from earlier drafts.                                                                        |
| 4      | Practice unit             | Words plus short phrases (not full sentences, not isolated syllables only).                                                                                                                                                               |
| 5      | Feedback timing           | Instant, per recording — sets a hard low-latency requirement on the pipeline (see Section 7).                                                                                                                                             |
| 6      | Content source            | Curated word/phrase list by default, plus freeform practice on any word.                                                                                                                                                                  |
| 7      | Freeform guardrail        | Freeform practice is blocked for any word without recorded reference data — no best-effort/estimated scoring. The curated list is therefore the entire usable vocabulary at any given time; dataset growth directly gates feature growth. |
| 8      | Visual feedback           | Dual-layer: pitch contour line (attempt vs. target) AND glottalization/creak shown visually, not just folded into a score.                                                                                                                |

7\. Updated Technology Recommendations — Current State of the Art

The original plan's stack (Praat, hand-built rules) is sound as a v1
foundation, but two components have meaningfully better options
available now than when Praat/YIN-based pipelines were the default
choice. Both are directly relevant given Decision 5 (instant feedback)
and Decision 3 (full voice-quality scoring for all tones).

7.1 Pitch tracking: consider a neural pitch tracker alongside Praat/YIN

Classical pitch trackers (Praat's autocorrelation method, YIN, RAPT) are
fast and interpretable but were shown in direct benchmark comparisons to
be less robust than deep-learning-based pitch trackers, especially under
noise — a real concern for a mobile app used outside a studio
environment. CREPE, a convolutional neural network that estimates pitch
directly from the raw waveform, maintains substantially higher accuracy
than classical methods across multiple noise conditions and datasets,
and more recent lightweight successors (SwiftF0, FCPE, PENN) are
specifically designed for fast, real-time use — directly relevant to the
instant-feedback requirement (Decision 5). A practical PyTorch
implementation (TorchCREPE) already exists, which matters for a
Python-based service.

**Recommendation:** Keep Praat/Parselmouth for prototyping,
reference-dataset analysis, and interpretable acoustic-feature
extraction (jitter, shimmer, HNR). For the production real-time scoring
path, evaluate a lightweight neural pitch tracker (SwiftF0 or
TorchCREPE) as the primary extractor, since it directly addresses both
the noise-robustness risk of a consumer mobile mic and the latency
requirement from Decision 5.

*Sources: Kim, Salamon, Li & Bello, “CREPE: A Convolutional
Representation for Pitch Estimation” (2018); SwiftF0 (2025)
arXiv:2508.18440; FCPE (2025) arXiv:2509.15140; Morrison, TorchCREPE
(PyTorch implementation, 2023); GitHub “pitch-benchmark” comparison
suite.*

7.2 Voice-quality / glottalization detection: use a dedicated
classifier, not a static formula

This is the more consequential upgrade given Decision 3. The original
plan proposed detecting glottalization via Praat's static acoustic
formulas (jitter, shimmer, H1–H2 spectral tilt). These measures are a
reasonable baseline, but the research is explicit that
pitch-and-formula-based methods struggle exactly where it matters: F0
detection algorithms are known to fail in glottalized regions of speech,
which means F0-adjacent measures are not always reliable indicators of
creaky voice either. Purpose-built creak/voice-quality classifiers now
exist and outperform static-formula approaches — for example, a
CNN-based model trained directly on raw waveform audio to detect creaky
voice, using a self-supervised speech representation (HuBERT) as one
encoder option, reflecting the same shift toward learned representations
seen in modern ASR.

**Recommendation:** Budget for a dedicated glottalization/creak detector
as part of the v1 pipeline, not a v2 add-on — this is exactly the
component Decision 3 now requires for all six tones, not just as a
nice-to-have for ngã and nặng. This can start as a simpler
acoustic-feature classifier (SVM or small neural net on
jitter/shimmer/periodicity features, consistent with earlier published
creak-detection work) and graduate to a raw-waveform CNN once enough
labeled Vietnamese creaky/non-creaky examples exist from the reference
dataset — which naturally aligns with Decision 2's rule-based-now,
learned-model-later roadmap.

*Sources: Chernyak et al., “DeepFry: Identifying Vocal Fry Using Deep
Neural Networks” (2022); Kane & Drugman, “Improved automatic detection
of creak”; COVAREP creaky-voice-detection toolkit; “Automatic detection
of voice creak” (86.7% average accuracy across 97 speakers).*

7.3 Why modern end-to-end ASR (Google Translate-style) still isn't the
right core engine

For context on why the existing “Google STT as optional verification
only” decision holds even against the newest ASR technology: modern
systems like Google's streaming models have moved away from separate
acoustic/pronunciation/language model pipelines toward a single
end-to-end neural network (e.g., RNN-Transducer architectures combining
a transcription network and a prediction network into one joint model).
This is a major advance for word recognition, but it remains
fundamentally optimized for the most probable sequence of words, not for
fine-grained tone/voice-quality scoring — the underlying problem Tone
Tuner solves is different in kind, not just in scale, from what these
systems are built to do.

*Sources: Google Research, “Large-Scale Multilingual Speech Recognition
with a Streaming End-to-End Model”; “Automatic Speech Recognition in the
Modern Era: Architectures, Training, and Evaluation” (2025),
arXiv:2510.12827.*

7.4 Dialect toggle — technical basis

Confirms Decision 1 is a data/scoring-target problem, not a UI problem.
Northern Vietnamese retains all six tones distinctly, while Southern
Vietnamese merges hỏi and ngã into a single effective tone (some
analyses count only four fully distinct tones once other consonant/vowel
mergers are included). Consonant realization also shifts by dialect
(tr/ch, r/d/gi, s/x, v/d, and n/l patterns differ North vs. South).
Building Southern support later means a separate reference dataset and a
separate scoring target for the merged-tone pairs — not a relabeled
version of the Northern model — which is exactly what Decision 1 already
anticipated.

*Sources: Wikipedia, “Vietnamese phonology”; VietFluent, “Southern vs
Northern Vietnamese: What's the Real Difference?”; Thao & Co., “Northern
vs Southern Vietnamese: 3 Key Differences”; 1-StopAsia, “Vietnamese
Dialects Explained.”*

8\. Still Genuinely Open

- Offline vs. online — unchanged; online-first for MVP, architected to
  allow an on-device swap later. Note: a neural pitch tracker and creak
  classifier both need to run within the instant-feedback latency budget
  (Decision 5), which should factor into the offline/online and hosting
  decision.

- Exact feature-weighting formula for combining pitch-contour score and
  phonation-type score into a single tone verdict — needs empirical
  tuning once real reference recordings exist.

- Whether hỏi needs the same phonation-inclusive treatment as ngã/nặng,
  or can stay primarily pitch-contour-scored — the literature is less
  unanimous here.

- Adaptive grading strictness by learner level — flagged, not decided.

- Sizing of the initial curated word/phrase list, now a launch-scope
  question given Decision 7's freeform guardrail.

- Whether the creak/glottalization classifier is trained in-house on the
  Vietnamese reference dataset or adapted from an existing
  English-trained model (e.g., DeepFry) via transfer learning — worth a
  short feasibility check before committing engineering time.

9\. Reference List

- Brunelle, M. (2009). Dialectal variation in Vietnamese tones and
  perceptual cues.

- Brunelle, M., Nguyễn, D. D., & Khanh, L. T. (2010). Acoustic study of
  Vietnamese tonal coarticulation and phonation types.

- Kirby, J. (2010, 2011). Dialect experience in Vietnamese tone
  perception; Vietnamese tone acoustics.

- Pham, A. H. “The Key Phonetic Properties of Vietnamese Tone: A
  Reassessment,” ICPhS proceedings.

- Michaud, A. (2004). Final consonants and glottalization in Vietnamese.

- Huang, Y. — “Creaky voice in Vietnamese,” UC San Diego research
  summary.

- “The ups and downs of Vietnamese tones” — acoustic analysis of pitch
  measurement failure during glottalization.

- Frontiers in Education (2024). “Investigating the variation of
  intonation contours in Northern Vietnamese tones” (70-speaker
  production study).

- Li et al. “Tone Value Representation for Computer-Assisted
  Pronunciation Training” (2024).

- “A Computer-Assisted Prosody Pronunciation Teaching System” — F0
  contour visual feedback methodology (Kay Elemetrics CSL-Pitch
  precedent).

- Rogerson-Revell, P. (2021). “Computer-Assisted Pronunciation Training
  (CAPT): Current Issues and Future Directions.”

- Kim, J. W., Salamon, J., Li, P., & Bello, J. P. (2018). “CREPE: A
  Convolutional Representation for Pitch Estimation.”

- “SwiftF0: Fast and Accurate Monophonic Pitch Detection” (2025),
  arXiv:2508.18440.

- “FCPE: A Fast Context-based Pitch Estimation Model” (2025),
  arXiv:2509.15140.

- Morrison, M. “TorchCREPE: PyTorch implementation of the CREPE pitch
  tracker” (2023).

- Chernyak, B. R. et al. “DeepFry: Identifying Vocal Fry Using Deep
  Neural Networks” (2022), arXiv:2203.17019.

- Kane, J. & Drugman, T. “Improved automatic detection of creak.”

- COVAREP glottal-source creaky-voice-detection toolkit (GitHub).

- Google Research. “Large-Scale Multilingual Speech Recognition with a
  Streaming End-to-End Model” (2019).

- “Automatic Speech Recognition in the Modern Era: Architectures,
  Training, and Evaluation” (2025), arXiv:2510.12827.

- Wikipedia, “Vietnamese phonology.”

- VietFluent, “Southern vs Northern Vietnamese: What's the Real
  Difference?” (2026).

- Thao & Co., “Northern vs Southern Vietnamese: 3 Key Differences”
  (2026).

- 1-StopAsia, “Vietnamese Dialects Explained: Northern, Central &
  Southern Variations” (2025).
