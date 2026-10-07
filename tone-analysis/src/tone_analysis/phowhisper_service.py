"""
PhoWhisper "second opinion" service for the Thanh Việt Tone Tuner.

Role in the pipeline:
    Parselmouth harness  -> PRIMARY judge (pitch contour + glottalization)
    PhoWhisper (this)    -> SECONDARY check: "what word did a Vietnamese ear hear?"

If the learner targets "má" and PhoWhisper hears "mà", that's strong evidence of a
tone confusion (sắc -> huyền), independent of the acoustic scoring.

Model: vinai/PhoWhisper-* (BSD-3-Clause, free, runs locally). Default is "small":
good accuracy, runs acceptably on CPU. Override with env var PHOWHISPER_MODEL.

Install:
    pip install "transformers>=4.40" torch librosa
"""

from __future__ import annotations

import os
import unicodedata
from dataclasses import dataclass, asdict
from functools import lru_cache
from typing import Optional

import numpy as np

MODEL_ID = os.getenv("PHOWHISPER_MODEL", "vinai/PhoWhisper-small")
TARGET_SR = 16_000  # Whisper models expect 16 kHz mono

# ---------------------------------------------------------------------------
# Tone parsing (pure logic, no model needed)
# ---------------------------------------------------------------------------

# Combining marks that encode TONE. Vowel-quality marks (circumflex ^, breve,
# horn) are NOT tones and are deliberately excluded.
_TONE_MARKS = {
    "\u0300": "huyen",  # grave       à
    "\u0301": "sac",    # acute       á
    "\u0309": "hoi",    # hook above  ả
    "\u0303": "nga",    # tilde       ã
    "\u0323": "nang",   # dot below   ạ
}


def _clean(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace, NFC-normalize."""
    text = unicodedata.normalize("NFC", text.lower())
    kept = [ch if (ch.isalnum() or ch.isspace()) else " " for ch in text]
    return " ".join("".join(kept).split())


def syllable_tone(syllable: str) -> str:
    """Return the tone of a single Vietnamese syllable ('ngang' if unmarked)."""
    for ch in unicodedata.normalize("NFD", syllable):
        if ch in _TONE_MARKS:
            return _TONE_MARKS[ch]
    return "ngang"


def strip_tone(syllable: str) -> str:
    """Remove ONLY the tone mark; keep vowel-quality marks (â, ă, ơ, ư) and đ."""
    decomposed = unicodedata.normalize("NFD", syllable)
    no_tone = "".join(ch for ch in decomposed if ch not in _TONE_MARKS)
    return unicodedata.normalize("NFC", no_tone)


# ---------------------------------------------------------------------------
# Comparison result
# ---------------------------------------------------------------------------

@dataclass
class SyllableCheck:
    expected: str
    heard: Optional[str]
    expected_tone: str
    heard_tone: Optional[str]
    verdict: str  # "match" | "tone_mismatch" | "different_word" | "missing"


@dataclass
class PhoWhisperResult:
    expected_text: str
    transcript: str
    verdict: str  # "match" | "tone_mismatch" | "different_word" | "unclear"
    syllables: list[SyllableCheck]

    def to_dict(self) -> dict:
        d = asdict(self)
        d["syllables"] = [asdict(s) for s in self.syllables]
        return d


def compare(expected_text: str, transcript: str) -> PhoWhisperResult:
    """
    Syllable-by-syllable comparison of the target vs. what PhoWhisper heard.

    - match           : same syllable, same tone
    - tone_mismatch   : same base syllable, different tone  <- the signal we care about
    - different_word  : base syllable differs (segmental error, or ASR guessed a word)
    - missing         : transcript shorter than target
    """
    exp = _clean(expected_text).split()
    got = _clean(transcript).split()

    checks: list[SyllableCheck] = []
    for i, e in enumerate(exp):
        g = got[i] if i < len(got) else None
        e_tone = syllable_tone(e)
        if g is None:
            checks.append(SyllableCheck(e, None, e_tone, None, "missing"))
            continue
        g_tone = syllable_tone(g)
        # Compare base syllable + tone, not raw spelling: "khỏe" and "khoẻ" are
        # the same word with the tone mark placed on a different vowel.
        same_base = strip_tone(g) == strip_tone(e)
        if same_base and g_tone == e_tone:
            v = "match"
        elif same_base:
            v = "tone_mismatch"
        else:
            v = "different_word"
        checks.append(SyllableCheck(e, g, e_tone, g_tone, v))

    verdicts = {c.verdict for c in checks}
    if not got:
        overall = "unclear"
    elif verdicts == {"match"} and len(got) == len(exp):
        overall = "match"
    elif "tone_mismatch" in verdicts and "different_word" not in verdicts:
        overall = "tone_mismatch"
    elif "different_word" in verdicts or "missing" in verdicts:
        overall = "different_word"
    else:
        overall = "unclear"

    return PhoWhisperResult(expected_text, transcript, overall, checks)


# ---------------------------------------------------------------------------
# Model (loaded once, lazily)
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_pipeline():
    import torch
    from transformers import pipeline

    device = 0 if torch.cuda.is_available() else -1
    return pipeline(
        "automatic-speech-recognition",
        model=MODEL_ID,
        device=device,
    )


def warm_up() -> None:
    """Call at FastAPI startup so the first learner request isn't slow."""
    pipe = _get_pipeline()
    pipe(np.zeros(TARGET_SR, dtype=np.float32))  # 1s of silence


def _load_audio(path: str) -> np.ndarray:
    import librosa

    audio, _ = librosa.load(path, sr=TARGET_SR, mono=True)
    # Single syllables are very short; pad 0.3s of silence each side so the
    # model doesn't clip or hallucinate on ultra-short clips.
    pad = np.zeros(int(0.3 * TARGET_SR), dtype=np.float32)
    return np.concatenate([pad, audio.astype(np.float32), pad])


def transcribe(path: str) -> str:
    pipe = _get_pipeline()
    out = pipe(
        _load_audio(path),
        generate_kwargs={"language": "vi", "task": "transcribe", "temperature": 0.0},
    )
    return out["text"].strip()


def check(path: str, expected_text: str) -> PhoWhisperResult:
    """Main entry point: transcribe a learner clip and compare to the target."""
    return compare(expected_text, transcribe(path))


# ---------------------------------------------------------------------------
# Combining with the acoustic engine
# ---------------------------------------------------------------------------

def combine(acoustic_pass: bool, asr: PhoWhisperResult) -> dict:
    """
    How the two signals combine into what the learner sees.
    The acoustic engine stays primary; PhoWhisper raises or lowers confidence.
    """
    if acoustic_pass and asr.verdict == "match":
        return {"result": "correct", "confidence": "high"}
    if not acoustic_pass and asr.verdict == "tone_mismatch":
        heard = next((s.heard for s in asr.syllables if s.verdict == "tone_mismatch"), None)
        return {"result": "wrong_tone", "confidence": "high", "heard_as": heard}
    if acoustic_pass and asr.verdict == "tone_mismatch":
        # Disagreement: log for review; this is exactly the data that tunes the engine.
        return {"result": "correct", "confidence": "low", "flag_for_review": True}
    if not acoustic_pass:
        return {"result": "wrong_tone", "confidence": "medium"}
    return {"result": "correct", "confidence": "medium"}
