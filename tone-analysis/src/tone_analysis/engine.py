"""
The tone engine's request pipeline: one normalized audio clip in, three
signals and a summary out.

    normalize (ffmpeg), then concurrently, each independently:
        acoustic harness  (single-syllable targets only)
        PhoWhisper        (own timeout)
        Parakeet          (own timeout)
    then summary (agreement between the two ASR opinions)

Graceful degradation: if either model errors or times out, its field comes
back with status "unavailable" and the rest of the response is still
returned. The acoustic layer is likewise independent — a failure there
never takes down the model opinions.

Acoustic scoring is deliberately uncalibrated (no native reference data
yet): the pitch contour, duration and phonation are measured and returned,
but there is no pass/fail anywhere in this response. Multi-syllable targets
skip the acoustic layer entirely until Parakeet's word timestamps drive
per-syllable segmentation.

The model calls are injected (async callables) so the orchestration can be
tested without a GPU or an NVIDIA key.
"""

from __future__ import annotations

import asyncio
import time
from typing import Awaitable, Callable

from .agreement import summarize
from .phowhisper_service import _clean, compare, syllable_tone

PhoWhisperCall = Callable[[bytes], Awaitable[str]]
ParakeetCall = Callable[[bytes], Awaitable[dict]]

# Generous enough to cover a GPU cold start, so the first request after an
# idle period degrades to slow rather than "unavailable". Measured cold start
# on T4 was ~52 s (2026-10-07) — 60 s left too little headroom.
PHOWHISPER_TIMEOUT_S = 90.0
PARAKEET_TIMEOUT_S = 20.0


def target_syllables(target_text: str) -> list[dict]:
    """Per-syllable tones computed from the text — never hand-entered."""
    return [{"text": s, "tone": syllable_tone(s)} for s in _clean(target_text).split()]


def _acoustic(wav: bytes, n_syllables: int) -> dict:
    if n_syllables != 1:
        return {
            "status": "skipped_multisyllable",
            "calibrated": False,
            "note": "Pitch analysis for multi-syllable items waits on Parakeet-timestamp segmentation.",
        }

    from .pipeline import run_pipeline

    result = run_pipeline(wav, "upload.wav")
    if not result.validation.ok:
        return {
            "status": "invalid_audio",
            "calibrated": False,
            "issues": [i.model_dump() for i in result.validation.issues],
        }

    offset_s = result.segmentation.nucleus_start_s
    return {
        "status": "ok",
        "calibrated": False,
        "pitch_contour": [
            {"t_ms": round((offset_s + f.time_s) * 1000), "f0_hz": f.f0_hz}
            for f in result.pitch.frames
        ],
        "voice_breaks": [
            {
                "start_ms": round((offset_s + b.start_s) * 1000),
                "end_ms": round((offset_s + b.end_s) * 1000),
            }
            for b in result.phonation.voice_breaks
        ],
        "duration_ms": round(result.duration.segment_duration_s * 1000),
        "voiced_duration_ms": round(result.duration.voiced_duration_s * 1000),
        "median_f0_hz": result.pitch.median_voiced_f0_hz,
        "phonation": {
            "jitter_local": result.phonation.jitter_local,
            "shimmer_local": result.phonation.shimmer_local,
            "hnr_db": result.phonation.hnr_db,
            "longest_voice_break_ms": round(result.phonation.longest_voice_break_s * 1000),
        },
        "validation_warnings": [i.code for i in result.validation.issues],
    }


async def _timed(coro: Awaitable, timeout_s: float) -> tuple[object, float]:
    start = time.perf_counter()
    value = await asyncio.wait_for(coro, timeout=timeout_s)
    return value, (time.perf_counter() - start) * 1000


async def _phowhisper_opinion(call: PhoWhisperCall, wav: bytes, target_text: str) -> dict:
    try:
        transcript, ms = await _timed(call(wav), PHOWHISPER_TIMEOUT_S)
    except asyncio.TimeoutError:
        return {"status": "unavailable", "reason": "timeout"}
    except Exception as exc:  # noqa: BLE001 - one opinion failing must not fail the request
        return {"status": "unavailable", "reason": type(exc).__name__}
    result = compare(target_text, transcript).to_dict()
    return {
        "status": "ok",
        "transcript": result["transcript"],
        "verdict": result["verdict"],
        "syllables": result["syllables"],
        "latency_ms": round(ms),
    }


async def _parakeet_opinion(call: ParakeetCall, wav: bytes, target_text: str) -> dict:
    try:
        raw, ms = await _timed(call(wav), PARAKEET_TIMEOUT_S)
    except asyncio.TimeoutError:
        return {"status": "unavailable", "reason": "timeout"}
    except Exception as exc:  # noqa: BLE001
        return {"status": "unavailable", "reason": type(exc).__name__}
    result = compare(target_text, raw["transcript"]).to_dict()
    return {
        "status": "ok",
        "transcript": result["transcript"],
        "verdict": result["verdict"],
        "syllables": result["syllables"],
        "words": raw.get("words", []),
        "mode": raw.get("mode"),
        "latency_ms": round(ms),
    }


async def analyze(
    wav: bytes,
    target_text: str,
    *,
    phowhisper: PhoWhisperCall,
    parakeet: ParakeetCall,
) -> dict:
    """`wav` must already be normalized (normalize.to_wav16k_mono)."""
    start = time.perf_counter()
    syllables = target_syllables(target_text)

    acoustic_task = asyncio.to_thread(_acoustic, wav, len(syllables))
    pho_task = _phowhisper_opinion(phowhisper, wav, target_text)
    par_task = _parakeet_opinion(parakeet, wav, target_text)
    acoustic, pho, par = await asyncio.gather(acoustic_task, pho_task, par_task, return_exceptions=True)

    if isinstance(acoustic, BaseException):
        acoustic = {"status": "error", "calibrated": False, "reason": type(acoustic).__name__}

    summary = summarize(
        pho if pho.get("status") == "ok" else None,
        par if par.get("status") == "ok" else None,
    )
    return {
        "target_text": target_text,
        "target_syllables": syllables,
        "acoustic": acoustic,
        "phowhisper": pho,
        "parakeet": par,
        "summary": summary,
        "total_ms": round((time.perf_counter() - start) * 1000),
    }
