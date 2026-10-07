"""
Step 3 — F0 (pitch) extraction via Parselmouth/Praat, normalized.

The one rule that matters most here: frames where Praat finds no pitch
candidate (voiceless/silent/genuinely aperiodic-beyond-recognition, which
is exactly what happens during a real glottal interruption) are reported
as `None`, never interpolated, never filled, never smoothed over. That's
the specific failure mode this pass was asked to avoid — a pipeline that
quietly papers over a glottal stop in nga/nang would silently mis-score
those tones later. So: no "Interpolate" call, no filtering, no gap-filling
anywhere in this module.

Normalization: semitones relative to *this utterance's own* median voiced
F0. Cross-utterance / cross-speaker normalization needs a real speaker
profile built from multiple real recordings, which doesn't exist yet —
deferred, not approximated here.
"""

from __future__ import annotations

import numpy as np
import parselmouth

from . import config
from .schemas import PitchFrame, PitchResult


def extract_pitch(nucleus_samples: np.ndarray, sr: int) -> PitchResult:
    sound = parselmouth.Sound(nucleus_samples, sampling_frequency=sr)
    pitch = sound.to_pitch(
        time_step=config.PITCH_TIME_STEP_S,
        pitch_floor=config.PITCH_FLOOR_HZ,
        pitch_ceiling=config.PITCH_CEILING_HZ,
    )

    times = pitch.xs()
    freqs = pitch.selected_array["frequency"]  # 0.0 == unvoiced, by Praat convention

    voiced_mask = freqs > 0
    voiced_values = freqs[voiced_mask]
    median_f0 = float(np.median(voiced_values)) if voiced_values.size else None

    frames: list[PitchFrame] = []
    for t, f in zip(times, freqs):
        if f > 0:
            semitones = 12.0 * np.log2(f / median_f0) if median_f0 else None
            frames.append(
                PitchFrame(time_s=float(t), f0_hz=float(f), f0_semitones_re_utterance_median=semitones)
            )
        else:
            # Deliberately not dropped from the list and not filled in —
            # a real gap in time, kept as a real gap in the output.
            frames.append(PitchFrame(time_s=float(t), f0_hz=None, f0_semitones_re_utterance_median=None))

    return PitchResult(
        frames=frames,
        voiced_frame_count=int(voiced_mask.sum()),
        unvoiced_frame_count=int((~voiced_mask).sum()),
        median_voiced_f0_hz=median_f0,
        min_voiced_f0_hz=float(voiced_values.min()) if voiced_values.size else None,
        max_voiced_f0_hz=float(voiced_values.max()) if voiced_values.size else None,
    )
