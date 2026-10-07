from __future__ import annotations

import pytest

from tone_analysis.pipeline import run_pipeline

TONE_NAMES = ["ngang", "huyen", "sac", "hoi", "nga", "nang"]


@pytest.mark.parametrize("tone", TONE_NAMES)
def test_pipeline_runs_end_to_end_for_every_pilot_tone(synthetic_wavs, tone):
    result = run_pipeline(synthetic_wavs[tone], f"synthetic_{tone}.wav")

    assert result.validation.ok, f"{tone}: validation failed: {result.validation.issues}"
    assert result.segmentation is not None
    assert result.pitch is not None
    assert result.duration is not None
    assert result.phonation is not None

    assert result.duration.segment_duration_s > 0
    assert len(result.pitch.frames) > 0
    # No scoring/verdict field should exist anywhere on the result.
    assert not hasattr(result, "score")
    assert not hasattr(result, "verdict")


def test_pipeline_stops_cleanly_on_invalid_audio(silence_wav):
    result = run_pipeline(silence_wav, "silence.wav")
    assert not result.validation.ok
    assert result.segmentation is None
    assert result.pitch is None
    assert result.duration is None
    assert result.phonation is None
