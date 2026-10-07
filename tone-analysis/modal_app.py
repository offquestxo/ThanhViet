"""
Thanh Việt tone engine — one Modal app.

    web (CPU, FastAPI)   ffmpeg normalization, Parselmouth acoustic harness,
                         Parakeet (NVIDIA hosted NIM) call, orchestration
    PhoWhisper (GPU)     vinai/PhoWhisper-small, loaded once per container

Deploy (from tone-analysis/):
    modal deploy modal_app.py

Secrets (created once with `modal secret create`, values never in git):
    thanhviet-nvidia       NVIDIA_API_KEY
    thanhviet-tone-shared  TONE_ENGINE_SHARED_SECRET   (same value as the
                           Next.js server's TONE_ENGINE_SHARED_SECRET)

Both containers scale to zero and stay warm for KEEP_WARM_S after their
last request — a short window, not 24/7.
"""

from __future__ import annotations

import sys
from pathlib import Path

import modal

# Make the local package importable at deploy time so it can be shipped into
# the images (add_local_python_source requires a locally importable module).
sys.path.insert(0, str(Path(__file__).parent / "src"))

APP_NAME = "thanhviet-tone-engine"
PHOWHISPER_MODEL = "vinai/PhoWhisper-small"
GPU = "T4"
KEEP_WARM_S = 300

app = modal.App(APP_NAME)

nvidia_secret = modal.Secret.from_name("thanhviet-nvidia")
engine_secret = modal.Secret.from_name("thanhviet-tone-shared")

cpu_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "fastapi>=0.115,<1.0",
        "python-multipart>=0.0.9",
        "pydantic>=2.6,<3.0",
        "numpy>=1.26,<3.0",
        "scipy>=1.11",
        "soundfile>=0.12",
        "praat-parselmouth>=0.4.3,<0.5",
        "nvidia-riva-client>=2.17",
    )
    .add_local_python_source("tone_analysis")
)


def _download_phowhisper() -> None:
    from huggingface_hub import snapshot_download

    snapshot_download(PHOWHISPER_MODEL)


gpu_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "torch>=2.3",
        "transformers>=4.40,<5",
        "librosa>=0.10",
        "numpy>=1.26,<3.0",
        "huggingface_hub>=0.23",
    )
    .env({"HF_HOME": "/models/hf", "PHOWHISPER_MODEL": PHOWHISPER_MODEL})
    # Bake the weights into the image so a cold start loads from local disk
    # instead of downloading ~1 GB from Hugging Face each time.
    .run_function(_download_phowhisper)
    .add_local_python_source("tone_analysis")
)


def _warmup_wav() -> bytes:
    """One second of a voiced-ish 180 Hz tone with harmonics, as 16 kHz s16
    WAV — enough to make the decoder run the real path, no speech needed."""
    import io
    import wave

    import numpy as np

    t = np.arange(16_000) / 16_000
    signal = sum(np.sin(2 * np.pi * 180 * k * t) / k for k in range(1, 6))
    pcm = (signal / np.max(np.abs(signal)) * 0.3 * 32767).astype("<i2").tobytes()
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16_000)
        w.writeframes(pcm)
    return buf.getvalue()


@app.cls(image=gpu_image, gpu=GPU, scaledown_window=KEEP_WARM_S, timeout=300)
class PhoWhisper:
    @modal.enter()
    def load(self) -> None:
        import time

        from tone_analysis import phowhisper_service

        start = time.perf_counter()
        phowhisper_service.warm_up()
        # Logged so cold start can be split into container start vs. model load.
        print(f"[phowhisper] model load + warm-up: {time.perf_counter() - start:.1f}s")
        self.svc = phowhisper_service

        # warm_up() feeds the pipeline a numpy array directly, so it never
        # touches the file-loading path transcribe() uses. Measured
        # 2026-10-07: the first real transcription on a fresh container then
        # took ~19 s (GPU) / ~31 s (CPU) on top of the logged load. Running
        # one real transcribe() here moves that one-time cost into container
        # start, before any learner request. (phowhisper_service.py itself is
        # kept verbatim — this only calls its public function.)
        start = time.perf_counter()
        self._transcribe_bytes(_warmup_wav())
        print(f"[phowhisper] full-path warm-up transcribe: {time.perf_counter() - start:.1f}s")

    def _transcribe_bytes(self, wav: bytes) -> str:
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".wav") as f:
            f.write(wav)
            f.flush()
            return self.svc.transcribe(f.name)

    @modal.method()
    def transcribe(self, wav: bytes) -> str:
        return self._transcribe_bytes(wav)

    @modal.method()
    def ping(self) -> bool:
        return True


@app.function(
    image=cpu_image,
    secrets=[nvidia_secret, engine_secret],
    scaledown_window=KEEP_WARM_S,
    timeout=120,
)
@modal.concurrent(max_inputs=8)
@modal.asgi_app()
def web():
    import asyncio

    from tone_analysis import parakeet
    from tone_analysis.engine_api import create_app

    phowhisper = PhoWhisper()

    async def phowhisper_call(wav: bytes) -> str:
        return await phowhisper.transcribe.remote.aio(wav)

    async def parakeet_call(wav: bytes) -> dict:
        return await asyncio.to_thread(parakeet.transcribe, wav)

    async def warm() -> None:
        # Fire-and-forget: starts the GPU container without waiting on it.
        await phowhisper.ping.spawn.aio()

    return create_app(phowhisper=phowhisper_call, parakeet=parakeet_call, warm=warm)
