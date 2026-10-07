"""
Audio normalization — the first step for every upload, before any model or
the acoustic harness sees it.

Whatever the browser recorded (Chrome/Firefox: webm/opus; Safari: mp4/AAC)
becomes 16 kHz, mono, 16-bit PCM WAV. Parakeet requires linear PCM, and
Parselmouth and PhoWhisper should analyze exactly the same audio, so there
is one normalized copy and everything reads from it.

The input is written to a temp file rather than piped to ffmpeg's stdin:
Safari's mp4 output can place the `moov` atom at the end of the file, which
ffmpeg cannot read from a non-seekable pipe.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile

TARGET_SAMPLE_RATE = 16_000

# Hard caps — an upload over these is rejected before any model runs.
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_DURATION_S = 15.0


class AudioNormalizationError(Exception):
    """The upload couldn't be decoded as audio at all."""


def _ffmpeg_bin() -> str:
    # FFMPEG_BIN lets local tests point at a pip-installed static binary
    # (imageio-ffmpeg); the Modal image installs ffmpeg via apt, on PATH.
    found = os.environ.get("FFMPEG_BIN") or shutil.which("ffmpeg")
    if not found:
        raise RuntimeError("ffmpeg not found (set FFMPEG_BIN or install ffmpeg)")
    return found


def to_wav16k_mono(raw: bytes, timeout_s: float = 20.0) -> bytes:
    """Return 16 kHz mono s16le WAV bytes, or raise AudioNormalizationError."""
    if not raw:
        raise AudioNormalizationError("empty upload")

    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "input")
        dst = os.path.join(tmp, "output.wav")
        with open(src, "wb") as f:
            f.write(raw)

        cmd = [
            _ffmpeg_bin(),
            "-nostdin",
            "-hide_banner",
            "-loglevel", "error",
            "-i", src,
            "-vn",
            "-ac", "1",
            "-ar", str(TARGET_SAMPLE_RATE),
            "-sample_fmt", "s16",
            "-f", "wav",
            dst,
        ]
        try:
            proc = subprocess.run(cmd, capture_output=True, timeout=timeout_s)
        except subprocess.TimeoutExpired as exc:
            raise AudioNormalizationError("audio conversion timed out") from exc

        if proc.returncode != 0 or not os.path.exists(dst):
            detail = proc.stderr.decode("utf-8", "replace").strip().splitlines()
            raise AudioNormalizationError(
                "could not decode audio" + (f": {detail[-1]}" if detail else "")
            )

        with open(dst, "rb") as f:
            return f.read()


def wav_duration_s(wav: bytes) -> float:
    """Duration of a 16 kHz mono s16 WAV produced by to_wav16k_mono."""
    import io
    import wave

    with wave.open(io.BytesIO(wav), "rb") as w:
        return w.getnframes() / float(w.getframerate())
