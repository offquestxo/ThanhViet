"""
Tunable constants for the extraction pipeline.

Everything here is a mechanical/signal-processing parameter (validation
thresholds, pitch floor/ceiling, frame sizes). None of it is a scoring
weight or a decision about what counts as a "correct" tone — that's
explicitly out of scope for this pass (see README.md).
"""

from __future__ import annotations

# --- Audio validation -------------------------------------------------

# Formats accepted for upload. Kept deliberately narrow (soundfile reads
# these robustly and losslessly) rather than trying to support every
# container up front — mp3/m4a can be added later behind an explicit
# transcode step if the recording brief ends up needing them.
SUPPORTED_FORMATS = {"WAV", "FLAC"}

MIN_SAMPLE_RATE_HZ = 16_000
# 16 kHz, not 44.1 kHz: the tone engine normalizes every upload to 16 kHz
# mono (normalize.py) so Parselmouth, PhoWhisper and Parakeet all analyze
# identical audio. A 44.1 kHz "recommended" bar would attach a warning to
# every single engine request. 16 kHz is ample for F0 (60–500 Hz) analysis.
RECOMMENDED_SAMPLE_RATE_HZ = 16_000

# A single Vietnamese syllable is short. These bounds are deliberately
# generous (not tuned against real recordings yet) — wide enough not to
# reject a real take, tight enough to catch "wrong file uploaded"
# mistakes (silence, multi-word clips, truncated files).
MIN_DURATION_S = 0.15
MAX_DURATION_S = 6.0

CLIPPING_AMPLITUDE_THRESHOLD = 0.999  # fraction of full scale
CLIPPING_SAMPLE_FRACTION_LIMIT = 0.0005  # >0.05% of samples clipped -> flag

SILENCE_RMS_DBFS_THRESHOLD = -50.0  # below this, treat as "no real signal"

# --- Segmentation -------------------------------------------------------

# Energy-based trim: frames quieter than (peak_dB - threshold) at the
# start/end are dropped. This is a heuristic, not a forced aligner — see
# segmentation.py docstring.
TRIM_FRAME_MS = 20.0
TRIM_HOP_MS = 10.0
TRIM_THRESHOLD_DB = 30.0

# Vowel-nucleus heuristic: within the trimmed region, the nucleus spans
# from the first to the last intensity frame within this many dB of the
# region's peak (see segmentation.py for why it bridges rather than
# requires an unbroken run). 20 dB, not a tighter value, because testing
# against synthesized glottalized tones (nga/nang) showed a real,
# expected intensity dip during creaky/constricted voicing — driven by
# genuinely reduced glottal pulse density, not just per-pulse amplitude —
# of well over 10 dB. A tight window would fragment that real signal the
# same way it would fragment ordinary amplitude modulation in modal
# speech. Still a heuristic pending validation against real recordings.
NUCLEUS_INTENSITY_WINDOW_DB = 20.0

# --- Pitch extraction -----------------------------------------------------

# Wide floor/ceiling on purpose: covers adult male and female F0 ranges,
# and stays wide at the low end so genuine creaky/glottalized dips in
# nga/nang aren't pushed below the floor and silently dropped before we
# even get a chance to observe them.
PITCH_FLOOR_HZ = 60.0
PITCH_CEILING_HZ = 500.0
PITCH_TIME_STEP_S = 0.01

# --- Phonation (jitter/shimmer/HNR) --------------------------------------
# Standard Praat analysis-window parameters (the same defaults Praat's
# own "Jitter/Shimmer" menu commands use), not tuned per-tone.
PERIOD_FLOOR_S = 0.0001
PERIOD_CEILING_S = 0.02
MAX_PERIOD_FACTOR = 1.3
MAX_AMPLITUDE_FACTOR = 1.6

HARMONICITY_TIME_STEP_S = 0.01
HARMONICITY_SILENCE_THRESHOLD = 0.1
HARMONICITY_PERIODS_PER_WINDOW = 1.0
