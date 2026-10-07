from __future__ import annotations

from tone_analysis.segmentation import isolate_segment
from tone_analysis.validation import load_and_validate


def test_nucleus_is_within_trimmed_region_and_nonempty(ngang_wav):
    _, mono, sr = load_and_validate(ngang_wav, "ngang.wav")
    seg, nucleus_samples = isolate_segment(mono, sr)

    assert seg.trimmed_start_s <= seg.nucleus_start_s
    assert seg.nucleus_end_s <= seg.trimmed_end_s
    assert seg.nucleus_end_s > seg.nucleus_start_s
    assert nucleus_samples.size > 0
