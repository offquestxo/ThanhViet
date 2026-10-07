"""Orchestration tests with fake model calls — no GPU, network, or key."""

from __future__ import annotations

import asyncio
import json

import pytest

from tone_analysis import engine


def fake_transcript(text: str):
    async def call(_wav: bytes) -> str:
        return text

    return call


def fake_parakeet(text: str):
    async def call(_wav: bytes) -> dict:
        return {"transcript": text, "words": [{"word": text, "start_ms": 100, "end_ms": 400, "confidence": 0.9}], "mode": "offline"}

    return call


async def boom(_wav: bytes):
    raise RuntimeError("model down")


def run(wav, target, pho, par):
    return asyncio.run(engine.analyze(wav, target, phowhisper=pho, parakeet=par))


def test_single_syllable_full_response(synthetic_wavs_16k):
    r = run(synthetic_wavs_16k["sac"], "má", fake_transcript("má"), fake_parakeet("má"))
    assert r["target_syllables"] == [{"text": "má", "tone": "sac"}]
    a = r["acoustic"]
    assert a["status"] == "ok" and a["calibrated"] is False
    assert len(a["pitch_contour"]) > 0 and a["duration_ms"] > 0
    assert a["validation_warnings"] == []  # 16 kHz no longer warns
    assert r["phowhisper"]["status"] == "ok" and r["parakeet"]["status"] == "ok"
    assert r["parakeet"]["words"][0]["start_ms"] == 100
    assert r["summary"] == {"heard_as": "má", "agreement": "both_match", "flag_for_review": False}


def test_no_pass_fail_anywhere(synthetic_wavs_16k):
    """Uncalibrated by design — no acoustic verdict may leak into the response."""
    r = run(synthetic_wavs_16k["sac"], "má", fake_transcript("má"), fake_parakeet("má"))
    blob = json.dumps(r["acoustic"]).lower()
    for word in ("pass", "score", "correct", "verdict"):
        assert word not in blob


def test_creak_data_flows_through():
    """Plumbing check: voice breaks the harness detects must reach the
    response (the UI shades them on the pitch line).

    Uses an explicit seed where 16 kHz detection finds the break. This is
    NOT the sensitivity question: on the same synthetic audio, 16 kHz finds
    voice breaks less often than 44.1 kHz (ngã 5-6/8 seeds vs 8/8; nặng
    2-3/8 vs 5/8). That finding is reported for a design decision, not
    hidden here."""
    import io

    import soundfile as sf

    from tone_analysis.synth import TONE_SPECS, synthesize_tone

    buf = io.BytesIO()
    sf.write(buf, synthesize_tone(TONE_SPECS["nga"], sr=16_000, seed=3000), 16_000, format="WAV", subtype="PCM_16")
    r = run(buf.getvalue(), "mã", fake_transcript("mã"), fake_parakeet("mã"))
    breaks = r["acoustic"]["voice_breaks"]
    assert len(breaks) >= 1 and all(b["end_ms"] > b["start_ms"] for b in breaks)


def test_multisyllable_skips_acoustic(synthetic_wavs_16k):
    r = run(synthetic_wavs_16k["ngang"], "Xin chào", fake_transcript("xin chào"), fake_parakeet("xin chào"))
    assert r["acoustic"]["status"] == "skipped_multisyllable"
    assert [s["tone"] for s in r["target_syllables"]] == ["ngang", "huyen"]
    assert r["summary"]["agreement"] == "both_match"


@pytest.mark.parametrize("down", ["phowhisper", "parakeet"])
def test_one_model_down_still_returns_everything_else(synthetic_wavs_16k, down):
    pho = boom if down == "phowhisper" else fake_transcript("má")
    par = boom if down == "parakeet" else fake_parakeet("má")
    r = run(synthetic_wavs_16k["sac"], "má", pho, par)
    assert r[down] == {"status": "unavailable", "reason": "RuntimeError"}
    other = "parakeet" if down == "phowhisper" else "phowhisper"
    assert r[other]["status"] == "ok"
    assert r["acoustic"]["status"] == "ok"
    assert r["summary"]["agreement"] == "partial_unavailable"


def test_timeout_marks_unavailable(synthetic_wavs_16k, monkeypatch):
    monkeypatch.setattr(engine, "PHOWHISPER_TIMEOUT_S", 0.05)

    async def slow(_wav):
        await asyncio.sleep(1)
        return "má"

    r = run(synthetic_wavs_16k["sac"], "má", slow, fake_parakeet("má"))
    assert r["phowhisper"] == {"status": "unavailable", "reason": "timeout"}
    assert r["parakeet"]["status"] == "ok"


def test_both_models_down(synthetic_wavs_16k):
    r = run(synthetic_wavs_16k["sac"], "má", boom, boom)
    assert r["acoustic"]["status"] == "ok"
    assert r["summary"]["agreement"] == "partial_unavailable"
