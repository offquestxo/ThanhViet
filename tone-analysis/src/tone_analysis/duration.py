"""
Step 4 — duration extraction.

Deliberately trivial: derives from the segmentation boundaries and the
pitch frame voiced/unvoiced mask already computed in step 3, rather than
re-deriving its own notion of "voiced" — one source of truth for that.
"""

from __future__ import annotations

from .schemas import DurationResult, PitchResult, SegmentationResult


def extract_duration(
    segmentation: SegmentationResult, pitch: PitchResult, time_step_s: float
) -> DurationResult:
    segment_duration_s = segmentation.nucleus_end_s - segmentation.nucleus_start_s
    voiced_duration_s = pitch.voiced_frame_count * time_step_s
    voiced_fraction = (
        voiced_duration_s / segment_duration_s if segment_duration_s > 0 else 0.0
    )
    return DurationResult(
        segment_duration_s=segment_duration_s,
        voiced_duration_s=voiced_duration_s,
        voiced_fraction=min(voiced_fraction, 1.0),
    )
