"""
HTTP surface of the tone engine (served from Modal in production).

    GET  /health   unauthenticated liveness check, no model work
    POST /warm     authenticated; nudges the PhoWhisper container awake so a
                   learner's first recording isn't the one paying cold start
    POST /analyze  authenticated; multipart `audio` + form `target_text`

Every authenticated route requires the X-Tone-Engine-Secret header to match
TONE_ENGINE_SHARED_SECRET. Only the Next.js server holds that value — the
browser never calls this service directly. The Next.js route in front of it
is separately responsible for checking that the learner is signed in and
approved.

Built as a factory taking the model calls as arguments, so tests can run it
with fakes and no GPU, network, or NVIDIA key.
"""

from __future__ import annotations

import hmac
import os
from typing import Awaitable, Callable, Optional

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile

from . import engine
from .normalize import (
    MAX_DURATION_S,
    MAX_UPLOAD_BYTES,
    AudioNormalizationError,
    to_wav16k_mono,
    wav_duration_s,
)

MAX_TARGET_TEXT_CHARS = 120
SECRET_HEADER = "X-Tone-Engine-Secret"


def create_app(
    *,
    phowhisper: engine.PhoWhisperCall,
    parakeet: engine.ParakeetCall,
    warm: Optional[Callable[[], Awaitable[None]]] = None,
) -> FastAPI:
    app = FastAPI(title="Thanh Việt tone engine", docs_url=None, redoc_url=None)

    def _check_secret(provided: Optional[str]) -> None:
        expected = os.environ.get("TONE_ENGINE_SHARED_SECRET")
        if not expected:
            # Misconfiguration must fail closed, never open.
            raise HTTPException(status_code=503, detail="engine secret not configured")
        if not provided or not hmac.compare_digest(provided, expected):
            raise HTTPException(status_code=401, detail="unauthorized")

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    @app.post("/warm")
    async def warm_route(
        x_tone_engine_secret: Optional[str] = Header(default=None, alias=SECRET_HEADER),
    ) -> dict:
        _check_secret(x_tone_engine_secret)
        if warm is not None:
            await warm()
        return {"status": "warming"}

    @app.post("/analyze")
    async def analyze_route(
        audio: UploadFile = File(...),
        target_text: str = Form(...),
        x_tone_engine_secret: Optional[str] = Header(default=None, alias=SECRET_HEADER),
    ) -> dict:
        _check_secret(x_tone_engine_secret)

        target_text = target_text.strip()
        if not target_text or len(target_text) > MAX_TARGET_TEXT_CHARS:
            raise HTTPException(status_code=422, detail="target_text missing or too long")

        raw = await audio.read(MAX_UPLOAD_BYTES + 1)
        if len(raw) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="audio upload too large")

        try:
            wav = to_wav16k_mono(raw)
        except AudioNormalizationError as exc:
            raise HTTPException(status_code=422, detail=f"unreadable audio: {exc}") from exc

        duration = wav_duration_s(wav)
        if duration > MAX_DURATION_S:
            raise HTTPException(
                status_code=422, detail=f"recording too long ({duration:.1f}s > {MAX_DURATION_S:.0f}s)"
            )

        result = await engine.analyze(wav, target_text, phowhisper=phowhisper, parakeet=parakeet)
        result["input"] = {
            "content_type": audio.content_type,
            "bytes": len(raw),
            "duration_ms": round(duration * 1000),
        }
        return result

    return app
