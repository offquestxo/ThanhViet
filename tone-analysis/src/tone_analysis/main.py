"""
FastAPI app exposing the extraction pipeline over HTTP.

Standalone research harness — no auth, no persistence, no connection of
any kind to the Next.js app or its database. Run locally only:

    uvicorn tone_analysis.main:app --reload --port 8100

Endpoints:
    GET  /health   - liveness check
    POST /analyze  - upload an audio file, get back the full step 1-5
                     extraction report (validation + segmentation + pitch
                     + duration + phonation). No scoring, no verdict.
"""

from __future__ import annotations

from fastapi import FastAPI, UploadFile
from fastapi.responses import JSONResponse

from .pipeline import UnreadableAudioError, run_pipeline
from .schemas import AnalysisResult

app = FastAPI(
    title="tone-analysis (research harness)",
    description=(
        "Standalone Vietnamese tone acoustic-feature extraction prototype. "
        "Not wired into any user-facing product surface. See README.md."
    ),
    version="0.1.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResult)
async def analyze(file: UploadFile) -> AnalysisResult | JSONResponse:
    file_bytes = await file.read()
    try:
        return run_pipeline(file_bytes, file.filename or "upload")
    except UnreadableAudioError as exc:
        return JSONResponse(status_code=422, content={"error": str(exc)})
