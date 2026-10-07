from __future__ import annotations

from tone_analysis.validation import load_and_validate


def test_valid_audio_passes(ngang_wav):
    result, mono, sr = load_and_validate(ngang_wav, "ngang.wav")
    assert result.ok
    assert result.format == "WAV"
    assert sr > 0
    assert mono.ndim == 1
    assert not any(i.severity == "error" for i in result.issues)


def test_silence_is_flagged(silence_wav):
    result, _, _ = load_and_validate(silence_wav, "silence.wav")
    assert not result.ok
    assert any(i.code == "likely_silent" for i in result.issues)


def test_too_short_is_flagged(too_short_wav):
    result, _, _ = load_and_validate(too_short_wav, "short.wav")
    assert not result.ok
    assert any(i.code == "too_short" for i in result.issues)
