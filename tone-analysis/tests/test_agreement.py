from __future__ import annotations

import pytest

from tone_analysis.agreement import summarize
from tone_analysis.phowhisper_service import compare


def op(target: str, heard: str) -> dict:
    return compare(target, heard).to_dict()


@pytest.mark.parametrize(
    "target, pho, par, agreement, heard_as, flag",
    [
        ("má", "má", "má", "both_match", "má", False),
        # khỏe/khoẻ: same word, tone mark on a different vowel — must agree.
        ("khỏe", "khoẻ", "khỏe", "both_match", "khoẻ", False),
        ("má", "mà", "mà", "both_tone_mismatch_same", "mà", False),
        ("má", "mà", "mã", "both_tone_mismatch_different", None, True),
        ("má", "ba", "ba", "both_same_other_word", "ba", False),
        ("má", "ba", "cá", "disagree", None, True),
        ("má", "má", "mà", "disagree", None, True),
        ("má", "", "", "unclear", None, False),
        ("má", "", "má", "disagree", None, True),
        # Multi-syllable: one model hears a tone slip on the second syllable.
        ("Xin chào", "xin chào", "xin chao", "disagree", None, True),
        ("Xin chào", "Xin chào.", "xin chào", "both_match", "xin chào", False),
    ],
)
def test_agreement_matrix(target, pho, par, agreement, heard_as, flag):
    s = summarize(op(target, pho), op(target, par))
    assert s["agreement"] == agreement
    assert s["heard_as"] == heard_as
    assert s["flag_for_review"] is flag


@pytest.mark.parametrize("which", ["phowhisper", "parakeet", "both"])
def test_partial_unavailable(which):
    ok = op("má", "má")
    pho = None if which in ("phowhisper", "both") else ok
    par = None if which in ("parakeet", "both") else ok
    s = summarize(pho, par)
    assert s == {"heard_as": None, "agreement": "partial_unavailable", "flag_for_review": False}
