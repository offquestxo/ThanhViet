# tone-analysis (tone engine + research harness)

The Python side of the Tone Tuner (beta). Its own Python environment and
dependencies; the Next.js app reaches it only over HTTP, through a
server-side route — never from the browser.

## Tone engine (deployed to Modal)

One Modal app (`modal_app.py`) serving `POST /analyze` (multipart `audio` +
`target_text`), `POST /warm`, and `GET /health`:

| Signal | Runs on | Role |
|---|---|---|
| Parselmouth harness (below) | Modal CPU | Pitch contour, duration, phonation/creak — **uncalibrated**, no pass/fail |
| PhoWhisper-small (`phowhisper_service.py`, copied verbatim) | Modal GPU, scale-to-zero | Which syllable(s) a Vietnamese ear heard |
| Parakeet-CTC-0.6B-vi (NVIDIA hosted NIM) | NVIDIA cloud, called from Modal | Second ASR opinion + word timestamps |

Every upload is first normalized to 16 kHz mono 16-bit WAV (`normalize.py`).
Both ASR transcripts go through the same `compare()`; `agreement.py`
combines them. If either model errors or times out, its field is marked
`unavailable` and everything else is still returned (`engine.py`).
Multi-syllable targets skip the acoustic layer until Parakeet's word
timestamps drive per-syllable segmentation.

Deploy: `modal deploy modal_app.py` (from this folder). Secrets live in
Modal only — `thanhviet-nvidia` (`NVIDIA_API_KEY`) and
`thanhviet-tone-shared` (`TONE_ENGINE_SHARED_SECRET`) — never in git.

## Research harness

## Scope of this pass

Extraction pipeline only:

1. **Audio validation** — format, sample rate, duration, clipping,
   silence checks (`validation.py`).
2. **Speech/vowel isolation** — energy-trim + intensity-nucleus
   heuristic, not a phonetic aligner (`segmentation.py`).
3. **F0 (pitch) extraction** — via Parselmouth/Praat, normalized to
   utterance-internal semitones (`pitch.py`).
4. **Duration extraction** (`duration.py`).
5. **Phonation features** — jitter, shimmer, HNR, and explicit voice-break
   reporting (`phonation.py`).

**Deliberately not built** (per the standing brief): reference
distributions, scoring/verdict logic, any hard-coded feature-weighting
formula, or any integration point into the production app. All of those
need real native-speaker reference recordings first.

### The one rule that matters most

Frames where Praat finds no pitch candidate — which is exactly what a
genuine glottal interruption in a glottalized tone (ngã, nặng) produces —
are reported as `null`, never interpolated or smoothed over. See the
docstrings in `pitch.py` and `phonation.py` for why, and
`phonation.py`'s `voice_breaks` for the explicit, human-readable evidence
that this is actually happening (nonzero for ngã/nặng, empty for the
four modal pilot tones in the synthetic test set).

## No real recordings yet

The native-speaker recording effort (4 Hanoi/Northern speakers, 3 takes
each, the 44-item word list — see `RECORDING_BRIEF.md`'s superseded note
for where that list lives) is a separate, parallel task. Until those exist, this pipeline is validated
against its own synthetic placeholder audio — see
`src/tone_analysis/synth.py` for exactly what that means (source-filter
synthesis, not real speech) and why it's not a substitute. Swapping in
real recordings needs no pipeline changes — same WAV/FLAC contract.

## Setup

```bash
cd tone-analysis
python3.12 -m venv .venv   # or any Python 3.11/3.12; kept separate from
source .venv/bin/activate  # the Next.js app's own tooling on purpose
pip install -r requirements.txt
```

## Generate synthetic test audio

```bash
python scripts/generate_test_audio.py
```

Writes six `synthetic_<tone>.wav` files to `sample_audio/` (gitignored —
regenerate rather than commit).

## Run the pipeline directly (no server)

```bash
python scripts/run_pipeline.py                    # every file in sample_audio/
python scripts/run_pipeline.py path/to/one.wav     # a specific file
```

Prints a step-by-step report (validation -> segmentation -> pitch ->
duration -> phonation) per file and saves a waveform + pitch-contour plot
to `output/` (also gitignored).

## Run the API

```bash
uvicorn tone_analysis.main:app --app-dir src --reload --port 8100
```

- `GET /health`
- `POST /analyze` — multipart file upload, returns the full extraction
  report as JSON. No scoring, no verdict field anywhere in the response.

## Tests

```bash
pytest
```

Covers each stage in isolation plus an end-to-end run against all six
synthetic pilot tones, including the specific assertion that ngã/nặng
produce real voice breaks while the four modal tones don't.
