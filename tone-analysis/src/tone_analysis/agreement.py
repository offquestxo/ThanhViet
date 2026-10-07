"""
How the two ASR opinions (PhoWhisper, Parakeet) combine into the summary
the learner sees. Pure logic over the verdicts phowhisper_service.compare()
already produces for each model — compare() itself is not changed.

Agreement values (approved set):
    both_match                    both heard the target, right tone
    both_tone_mismatch_same       both heard the same base syllable(s) with
                                  the same wrong tone(s) — e.g. both "mà"
    both_tone_mismatch_different  both heard a tone mismatch, but not the same
                                  one — e.g. "mà" vs "mã"
    both_same_other_word          both heard the same different word
    disagree                      anything else where both models answered
    unclear                       both models answered, neither heard speech
    partial_unavailable           at least one model didn't answer (error or
                                  timeout). "Partial" describes the response:
                                  the remaining signals are still returned.

heard_as is set only when both models heard the same thing. When they
disagree — or only one answered — it stays null and the UI shows each
model's reading separately.

flag_for_review is true whenever the models disagree about what they heard
(disagree, both_tone_mismatch_different).
"""

from __future__ import annotations

from typing import Optional

from .phowhisper_service import _clean, strip_tone, syllable_tone


def _reading(transcript: str) -> tuple[tuple[str, str], ...]:
    """Spelling-insensitive identity of a transcript: (base, tone) per
    syllable. "khỏe" and "khoẻ" compare equal; "mà" and "mã" don't."""
    return tuple((strip_tone(s), syllable_tone(s)) for s in _clean(transcript).split())


def summarize(phowhisper: Optional[dict], parakeet: Optional[dict]) -> dict:
    """Each argument is a compare() result dict (expected_text, transcript,
    verdict, syllables) or None when that model was unavailable."""
    if phowhisper is None or parakeet is None:
        return {"heard_as": None, "agreement": "partial_unavailable", "flag_for_review": False}

    v1, v2 = phowhisper["verdict"], parakeet["verdict"]
    r1, r2 = _reading(phowhisper["transcript"]), _reading(parakeet["transcript"])
    same_reading = r1 == r2 and len(r1) > 0

    if v1 == "unclear" and v2 == "unclear":
        agreement = "unclear"
    elif v1 == "match" and v2 == "match":
        agreement = "both_match"
    elif v1 == "tone_mismatch" and v2 == "tone_mismatch":
        agreement = "both_tone_mismatch_same" if same_reading else "both_tone_mismatch_different"
    elif v1 == "different_word" and v2 == "different_word" and same_reading:
        agreement = "both_same_other_word"
    else:
        agreement = "disagree"

    agreed = agreement in ("both_match", "both_tone_mismatch_same", "both_same_other_word")
    return {
        "heard_as": _clean(phowhisper["transcript"]) if agreed else None,
        "agreement": agreement,
        "flag_for_review": agreement in ("disagree", "both_tone_mismatch_different"),
    }
