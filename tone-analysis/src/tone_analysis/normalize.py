"""
Audio normalization — the first step for every upload, before any model or
the acoustic harness sees it.

Whatever the browser recorded (Chrome/Firefox: webm/opus; Safari: mp4/AAC)
becomes 16 kHz mono 16-bit PCM WAV (to_wav16k_mono). Parakeet requires
linear PCM, and Parselmouth and PhoWhisper analyze exactly the same audio,
so there is one normalized copy and everything in the engine reads from it.

Decision 4 (a separate native-rate copy for the Parselmouth harness) was
built on 2026-10-07 and reverted on 2026-10-08: on real speech it roughly
doubled false creak alarms (voice breaks reported on tones that have none),
which outweighed the small gain in catching real ngã/nặng breaks seen on
synthetic audio. to_wav_acoustic remains for offline tools only (the lesson
-recording splitter cuts clips at the source rate); the engine never uses it.

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
ACOUSTIC_MAX_RATE = 48_000

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


def _decode_to_wav(raw: bytes, sample_rate: int | None, timeout_s: float) -> bytes:
    """Decode to mono s16 WAV; `sample_rate=None` keeps the source rate."""
    if not raw:
        raise AudioNormalizationError("empty upload")

    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "input")
        dst = os.path.join(tmp, "output.wav")
        with open(src, "wb") as f:
            f.write(raw)

        cmd = [_ffmpeg_bin(), "-nostdin", "-hide_banner", "-loglevel", "error", "-i", src, "-vn", "-ac", "1"]
        if sample_rate is not None:
            cmd += ["-ar", str(sample_rate)]
        cmd += ["-sample_fmt", "s16", "-f", "wav", dst]
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


def to_wav16k_mono(raw: bytes, timeout_s: float = 20.0) -> bytes:
    """16 kHz mono s16le WAV for the ASR models, or raise AudioNormalizationError."""
    return _decode_to_wav(raw, TARGET_SAMPLE_RATE, timeout_s)


def to_wav_acoustic(raw: bytes, timeout_s: float = 20.0) -> bytes:
    """Mono s16le WAV at the source's own rate (<= ACOUSTIC_MAX_RATE). Offline
    tools only — not used by the engine. Never upsampled."""
    wav = _decode_to_wav(raw, None, timeout_s)
    if wav_sample_rate(wav) > ACOUSTIC_MAX_RATE:
        wav = _decode_to_wav(raw, ACOUSTIC_MAX_RATE, timeout_s)
    return wav


def wav_sample_rate(wav: bytes) -> int:
    import io
    import wave

    with wave.open(io.BytesIO(wav), "rb") as w:
        return w.getframerate()


def wav_duration_s(wav: bytes) -> float:
    """Duration of a mono s16 WAV produced by this module."""
    import io
    import wave

    with wave.open(io.BytesIO(wav), "rb") as w:
        return w.getnframes() / float(w.getframerate())
