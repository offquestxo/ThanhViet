"""
Pydantic response models for the extraction pipeline.

Deliberately no "score", "verdict", "pass/fail vs. reference", or
feature-weighting fields anywhere in here — those all require reference
distributions from real native-speaker recordings, which don't exist yet.
This is measurement output only.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ValidationIssue(BaseModel):
    severity: Literal["warning", "error"]
    code: str
    message: str


class ValidationResult(BaseModel):
    ok: bool
    format: str
    sample_rate_hz: int
    channels: int
    duration_s: float
    peak_amplitude: float
    rms_dbfs: float
    issues: list[ValidationIssue] = Field(default_factory=list)


class SegmentationResult(BaseModel):
    method: Literal["energy-trim + intensity-nucleus heuristic"]
    trimmed_start_s: float
    trimmed_end_s: float
    nucleus_start_s: float
    nucleus_end_s: float
    note: str = (
        "Heuristic segmentation, not a forced aligner. Isolates the "
        "highest-sustained-intensity region as the vowel/syllable nucleus "
        "candidate; revisit once real recordings show where this heuristic "
        "actually breaks."
    )


class PitchFrame(BaseModel):
    time_s: float
    f0_hz: float | None  # None = unvoiced/no pitch candidate at this frame,
    # preserved deliberately rather than interpolated (see pitch.py).
    f0_semitones_re_utterance_median: float | None


class PitchResult(BaseModel):
    frames: list[PitchFrame]
    voiced_frame_count: int
    unvoiced_frame_count: int
    median_voiced_f0_hz: float | None
    min_voiced_f0_hz: float | None
    max_voiced_f0_hz: float | None
    note: str = (
        "Frames with no pitch candidate are reported as null, not "
        "interpolated or smoothed across — a real, sustained gap here is "
        "the expected signature of a glottal interruption (nga/nang), not "
        "noise to be cleaned up."
    )


class DurationResult(BaseModel):
    segment_duration_s: float
    voiced_duration_s: float
    voiced_fraction: float


class VoiceBreak(BaseModel):
    start_s: float
    end_s: float
    duration_s: float


class PhonationResult(BaseModel):
    jitter_local: float | None
    jitter_rap: float | None
    shimmer_local: float | None
    shimmer_apq11: float | None
    hnr_db: float | None
    voice_breaks: list[VoiceBreak] = Field(default_factory=list)
    longest_voice_break_s: float
    note: str = (
        "voice_breaks lists sustained unvoiced gaps found inside the "
        "nucleus segment itself (as opposed to the surrounding silence "
        "trimmed off in segmentation). A nonzero count/duration here is "
        "expected and meaningful for glottalized tones (nga/nang) — it is "
        "not treated as a defect to smooth over."
    )


class AnalysisResult(BaseModel):
    source_filename: str
    validation: ValidationResult
    segmentation: SegmentationResult | None
    pitch: PitchResult | None
    duration: DurationResult | None
    phonation: PhonationResult | None
