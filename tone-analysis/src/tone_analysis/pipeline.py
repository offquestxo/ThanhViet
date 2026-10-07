"""
Orchestrates steps 1-5 end to end. No scoring, no reference comparison —
see README.md for what's explicitly out of scope for this pass.
"""

from __future__ import annotations

from . import config
from .duration import extract_duration
from .phonation import extract_phonation
from .pitch import extract_pitch
from .schemas import AnalysisResult
from .segmentation import isolate_segment
from .validation import UnreadableAudioError, load_and_validate


def run_pipeline(file_bytes: bytes, filename: str) -> AnalysisResult:
    validation, mono, sr = load_and_validate(file_bytes, filename)

    if not validation.ok:
        # Errors (bad format, too short/long, clipping, silence) mean
        # downstream analysis would be measuring noise, not a voice. Stop
        # here and hand back exactly why, rather than running the rest of
        # the pipeline on data validation already flagged as unusable.
        return AnalysisResult(
            source_filename=filename,
            validation=validation,
            segmentation=None,
            pitch=None,
            duration=None,
            phonation=None,
        )

    segmentation, nucleus_samples = isolate_segment(mono, sr)
    pitch = extract_pitch(nucleus_samples, sr)
    duration = extract_duration(segmentation, pitch, config.PITCH_TIME_STEP_S)
    phonation = extract_phonation(nucleus_samples, sr, pitch)

    return AnalysisResult(
        source_filename=filename,
        validation=validation,
        segmentation=segmentation,
        pitch=pitch,
        duration=duration,
        phonation=phonation,
    )


__all__ = ["run_pipeline", "UnreadableAudioError"]
