from __future__ import annotations

from tone_analysis.phonation import extract_phonation
from tone_analysis.pitch import extract_pitch
from tone_analysis.segmentation import isolate_segment
from tone_analysis.validation import load_and_validate


def _phonation_for(wav_bytes, filename):
    _, mono, sr = load_and_validate(wav_bytes, filename)
    _, nucleus = isolate_segment(mono, sr)
    pitch = extract_pitch(nucleus, sr)
    return extract_phonation(nucleus, sr, pitch), pitch


def test_modal_tone_has_sane_jitter_shimmer_hnr(ngang_wav):
    phonation, _ = _phonation_for(ngang_wav, "ngang.wav")
    assert phonation.jitter_local is not None
    assert phonation.shimmer_local is not None
    assert phonation.hnr_db is not None
    # Loose sanity bounds, not tuned thresholds — this is checking the
    # measurement runs and returns plausible units, not scoring quality.
    assert 0 <= phonation.jitter_local < 0.2
    assert 0 <= phonation.shimmer_local < 0.5


def test_glottalized_tones_report_voice_breaks(nga_wav, nang_wav):
    for wav_bytes, name in [(nga_wav, "nga.wav"), (nang_wav, "nang.wav")]:
        phonation, _ = _phonation_for(wav_bytes, name)
        assert len(phonation.voice_breaks) >= 1, f"{name}: expected at least one reported voice break"
        assert phonation.longest_voice_break_s > 0


def test_modal_tone_has_fewer_voice_breaks_than_glottalized(ngang_wav, nang_wav):
    modal, _ = _phonation_for(ngang_wav, "ngang.wav")
    glottalized, _ = _phonation_for(nang_wav, "nang.wav")
    assert len(modal.voice_breaks) <= len(glottalized.voice_breaks)
