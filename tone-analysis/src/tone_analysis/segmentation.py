"""
Step 2 — speech/vowel isolation.

This is a heuristic, not a phonetic aligner or ASR-based segmenter:

  1. Energy-based trim: drop leading/trailing frames that are quiet
     relative to the recording's peak (removes lead-in/lead-out silence
     and mic-handling noise, not the syllable itself).
  2. Within the trimmed region, find the "nucleus" — the span from the
     first to the last frame whose intensity stays within
     NUCLEUS_INTENSITY_WINDOW_DB of the region's peak intensity, bridging
     over any internal dips rather than stopping at the first one. For a
     single Vietnamese syllable (onset consonant, if any, + vowel +
     tone), the vowel is reliably the loudest and most sustained part, so
     this is a reasonable stand-in until real recordings show where it
     needs to get smarter (e.g. a real forced aligner). The "bridge over
     internal dips" part specifically matters for nga/nang: a genuine
     glottal closure can dip well below the rest of the syllable's
     intensity, and treating that dip as "end of nucleus" would crop the
     exact material this pipeline is meant to preserve — see the comment
     in _find_nucleus for how this was caught.

Both the trimmed region and the nucleus region are returned; pitch/
duration/phonation all run on the nucleus, since that's where the tone
is actually carried.
"""

from __future__ import annotations

import numpy as np
import parselmouth

from . import config
from .schemas import SegmentationResult


def _energy_trim(samples: np.ndarray, sr: int) -> tuple[int, int]:
    """Returns (start_sample, end_sample) after trimming low-energy edges."""
    frame_len = max(1, int(config.TRIM_FRAME_MS / 1000 * sr))
    hop_len = max(1, int(config.TRIM_HOP_MS / 1000 * sr))

    if len(samples) <= frame_len:
        return 0, len(samples)

    n_frames = 1 + (len(samples) - frame_len) // hop_len
    frame_db = np.empty(n_frames)
    for i in range(n_frames):
        start = i * hop_len
        frame = samples[start : start + frame_len]
        rms = np.sqrt(np.mean(np.square(frame))) if frame.size else 0.0
        frame_db[i] = 20 * np.log10(rms) if rms > 0 else -np.inf

    peak_db = np.max(frame_db[np.isfinite(frame_db)]) if np.any(np.isfinite(frame_db)) else -np.inf
    threshold = peak_db - config.TRIM_THRESHOLD_DB
    above = np.where(frame_db >= threshold)[0]

    if above.size == 0:
        return 0, len(samples)

    start_frame, end_frame = above[0], above[-1]
    start_sample = start_frame * hop_len
    end_sample = min(len(samples), end_frame * hop_len + frame_len)
    return start_sample, end_sample


def _find_nucleus(sound: parselmouth.Sound) -> tuple[float, float]:
    """Locate the high-intensity span within `sound` — from the first to
    the last frame within NUCLEUS_INTENSITY_WINDOW_DB of the peak,
    bridging over any internal dips (see comment below for why that
    matters). Returns (start_s, end_s) relative to `sound`'s own start
    (0.0)."""
    intensity = sound.to_intensity(time_step=config.TRIM_HOP_MS / 1000)
    values = intensity.values[0]
    times = intensity.xs()

    finite = values[np.isfinite(values)]
    if finite.size == 0:
        return 0.0, sound.duration

    peak_db = np.max(finite)
    threshold = peak_db - config.NUCLEUS_INTENSITY_WINDOW_DB
    mask = values >= threshold

    # Span from the first to the last above-threshold frame, rather than
    # requiring one *unbroken* run above threshold. Found this the hard
    # way: a genuinely glottalized tone (nga/nang) can dip 10-15+ dB
    # mid-syllable during the creaky closure — that's real signal, not
    # the boundary of the syllable — and a "longest contiguous run"
    # search treats that dip as the nucleus *ending*, silently cropping
    # off the exact glottalized material this pipeline exists to
    # preserve (sometimes keeping the pre-creak portion, sometimes the
    # post-creak portion, depending on which side happened to be a frame
    # longer). Bridging over internal dips keeps the whole syllable
    # together and lets pitch/phonation actually see the interruption
    # instead of having it cut away before they run.
    above = np.where(mask)[0]
    if above.size == 0:
        return 0.0, sound.duration

    start_idx, end_idx = int(above[0]), int(above[-1])
    start_s = float(times[start_idx])
    end_s = float(times[end_idx])
    return start_s, end_s


def isolate_segment(
    mono: np.ndarray, sr: int
) -> tuple[SegmentationResult, np.ndarray]:
    """Returns (result, nucleus_samples). nucleus_samples is the audio
    the rest of the pipeline should actually analyze."""
    trim_start, trim_end = _energy_trim(mono, sr)
    trimmed = mono[trim_start:trim_end]

    if trimmed.size == 0:
        # Degenerate case (e.g. near-silent file that still passed
        # validation's threshold) — fall back to the whole recording
        # rather than crashing on an empty Sound.
        trimmed = mono
        trim_start, trim_end = 0, len(mono)

    sound = parselmouth.Sound(trimmed, sampling_frequency=sr)
    nucleus_start_rel, nucleus_end_rel = _find_nucleus(sound)

    trimmed_start_s = trim_start / sr
    trimmed_end_s = trim_end / sr
    nucleus_start_s = trimmed_start_s + nucleus_start_rel
    nucleus_end_s = trimmed_start_s + nucleus_end_rel

    nucleus_start_sample = trim_start + int(nucleus_start_rel * sr)
    nucleus_end_sample = trim_start + int(nucleus_end_rel * sr)
    nucleus_samples = mono[nucleus_start_sample:nucleus_end_sample]

    if nucleus_samples.size == 0:
        nucleus_samples = trimmed

    result = SegmentationResult(
        method="energy-trim + intensity-nucleus heuristic",
        trimmed_start_s=trimmed_start_s,
        trimmed_end_s=trimmed_end_s,
        nucleus_start_s=nucleus_start_s,
        nucleus_end_s=nucleus_end_s,
    )
    return result, nucleus_samples
