from __future__ import annotations

from tone_analysis.pitch import extract_pitch
from tone_analysis.segmentation import isolate_segment
from tone_analysis.validation import load_and_validate


def _pitch_for(wav_bytes, filename):
    _, mono, sr = load_and_validate(wav_bytes, filename)
    _, nucleus = isolate_segment(mono, sr)
    return extract_pitch(nucleus, sr)


def test_pitch_has_frames_and_median(ngang_wav):
    pitch = _pitch_for(ngang_wav, "ngang.wav")
    assert len(pitch.frames) > 0
    assert pitch.voiced_frame_count > 0
    assert pitch.median_voiced_f0_hz is not None
    assert 50 < pitch.median_voiced_f0_hz < 500


def test_unvoiced_frames_are_none_not_zero(ngang_wav):
    pitch = _pitch_for(ngang_wav, "ngang.wav")
    for frame in pitch.frames:
        if frame.f0_hz is not None:
            # Praat convention is 0.0 for unvoiced; make sure we never
            # leak that raw convention into the API as a fake pitch value.
            assert frame.f0_hz > 0
        else:
            assert frame.f0_semitones_re_utterance_median is None


def test_semitone_normalization_centers_near_zero(ngang_wav):
    pitch = _pitch_for(ngang_wav, "ngang.wav")
    semitones = [f.f0_semitones_re_utterance_median for f in pitch.frames if f.f0_semitones_re_utterance_median is not None]
    assert semitones  # non-empty
    # Median-referenced by construction: median of the semitone series
    # itself should sit close to 0.
    import statistics

    assert abs(statistics.median(semitones)) < 1.0


def test_glottalized_tone_produces_pitch_gaps(nga_wav, nang_wav):
    # This is the core mechanical check for the "preserve glottal
    # interruptions" requirement: nga/nang were synthesized with a
    # deliberately irregular creaky region, and the pipeline must not
    # paper over it with an unbroken contour.
    for wav_bytes, name in [(nga_wav, "nga.wav"), (nang_wav, "nang.wav")]:
        pitch = _pitch_for(wav_bytes, name)
        assert pitch.unvoiced_frame_count > 0, f"{name}: expected at least some unvoiced frames from the creaky region"
