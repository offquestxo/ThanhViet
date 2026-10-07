"""
Step 5 — phonation / voice-quality features: jitter, shimmer, HNR, and
explicit voice-break reporting.

jitter/shimmer/HNR use the standard Parselmouth-via-Praat-script pattern
(the same calls Praat's own Jitter/Shimmer/Harmonicity menu commands use),
computed from a periodic-cross-correlation PointProcess derived straight
from the audio — not from the already-extracted pitch contour, so this
stays an independent measurement rather than compounding step 3's choices.

`voice_breaks` is the explicit, human-readable evidence that step 3
actually preserved glottal interruptions rather than smoothing them: any
sustained run of unvoiced frames *inside* the nucleus (as opposed to the
silence trimmed off in segmentation) is surfaced here, not treated as
noise. For a genuinely glottalized tone (nga/nang) this list should be
non-empty; for a modal tone (ngang/huyen/sac/hoi) it should typically be
empty or near-empty. That contrast is exactly what this pass is meant to
demonstrate mechanically works — see README.md.
"""

from __future__ import annotations

import numpy as np
import parselmouth
from parselmouth.praat import call

from . import config
from .schemas import PhonationResult, PitchResult, VoiceBreak

MIN_VOICE_BREAK_S = 1.5 * config.PITCH_TIME_STEP_S  # filter single-frame flicker


def _safe_call(*args) -> float | None:
    try:
        value = call(*args)
    except Exception:  # noqa: BLE001 - Praat can refuse on pathological input
        return None
    if value is None:
        return None
    value = float(value)
    return value if np.isfinite(value) else None


def _find_voice_breaks(pitch: PitchResult) -> list[VoiceBreak]:
    breaks: list[VoiceBreak] = []
    run_start: float | None = None
    prev_time = None

    for frame in pitch.frames:
        if frame.f0_hz is None:
            if run_start is None:
                run_start = frame.time_s
            prev_time = frame.time_s
        else:
            if run_start is not None and prev_time is not None:
                duration = prev_time - run_start
                if duration >= MIN_VOICE_BREAK_S:
                    breaks.append(VoiceBreak(start_s=run_start, end_s=prev_time, duration_s=duration))
            run_start = None
            prev_time = None

    if run_start is not None and prev_time is not None:
        duration = prev_time - run_start
        if duration >= MIN_VOICE_BREAK_S:
            breaks.append(VoiceBreak(start_s=run_start, end_s=prev_time, duration_s=duration))

    return breaks


def extract_phonation(
    nucleus_samples: np.ndarray, sr: int, pitch: PitchResult
) -> PhonationResult:
    sound = parselmouth.Sound(nucleus_samples, sampling_frequency=sr)

    point_process = call(
        sound,
        "To PointProcess (periodic, cc)",
        config.PITCH_FLOOR_HZ,
        config.PITCH_CEILING_HZ,
    )

    jitter_local = _safe_call(
        point_process,
        "Get jitter (local)",
        0,
        0,
        config.PERIOD_FLOOR_S,
        config.PERIOD_CEILING_S,
        config.MAX_PERIOD_FACTOR,
    )
    jitter_rap = _safe_call(
        point_process,
        "Get jitter (rap)",
        0,
        0,
        config.PERIOD_FLOOR_S,
        config.PERIOD_CEILING_S,
        config.MAX_PERIOD_FACTOR,
    )
    shimmer_local = _safe_call(
        [sound, point_process],
        "Get shimmer (local)",
        0,
        0,
        config.PERIOD_FLOOR_S,
        config.PERIOD_CEILING_S,
        config.MAX_PERIOD_FACTOR,
        config.MAX_AMPLITUDE_FACTOR,
    )
    shimmer_apq11 = _safe_call(
        [sound, point_process],
        "Get shimmer (apq11)",
        0,
        0,
        config.PERIOD_FLOOR_S,
        config.PERIOD_CEILING_S,
        config.MAX_PERIOD_FACTOR,
        config.MAX_AMPLITUDE_FACTOR,
    )

    harmonicity = sound.to_harmonicity_cc(
        time_step=config.HARMONICITY_TIME_STEP_S,
        minimum_pitch=config.PITCH_FLOOR_HZ,
        silence_threshold=config.HARMONICITY_SILENCE_THRESHOLD,
        periods_per_window=config.HARMONICITY_PERIODS_PER_WINDOW,
    )
    hnr_values = harmonicity.values[0]
    finite_hnr = hnr_values[np.isfinite(hnr_values) & (hnr_values > -200)]
    hnr_db = float(np.mean(finite_hnr)) if finite_hnr.size else None

    voice_breaks = _find_voice_breaks(pitch)
    longest_break = max((b.duration_s for b in voice_breaks), default=0.0)

    return PhonationResult(
        jitter_local=jitter_local,
        jitter_rap=jitter_rap,
        shimmer_local=shimmer_local,
        shimmer_apq11=shimmer_apq11,
        hnr_db=hnr_db,
        voice_breaks=voice_breaks,
        longest_voice_break_s=longest_break,
    )
