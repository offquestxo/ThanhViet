"""Normalization against browser-realistic formats, not just WAV in/WAV out.

Chrome/Firefox MediaRecorder produce webm/opus; Safari produces mp4/AAC.
ffmpeg's default mp4 muxing puts the moov atom at the END of the file —
the case that breaks stdin-piped decoding, and why normalize.py writes the
upload to a temp file first.
"""

from __future__ import annotations

import io
import os
import subprocess
import tempfile
import wave

import pytest

from tone_analysis.normalize import AudioNormalizationError, to_wav16k_mono, wav_duration_s

pytestmark = pytest.mark.skipif(not os.environ.get("FFMPEG_BIN"), reason="no ffmpeg available")


def _encode(wav: bytes, ext: str, codec_args: list[str]) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = os.path.join(tmp, "in.wav"), os.path.join(tmp, f"out.{ext}")
        with open(src, "wb") as f:
            f.write(wav)
        subprocess.run(
            [os.environ["FFMPEG_BIN"], "-y", "-loglevel", "error", "-i", src, *codec_args, dst],
            check=True,
        )
        with open(dst, "rb") as f:
            return f.read()


def _assert_normalized(wav: bytes) -> None:
    with wave.open(io.BytesIO(wav), "rb") as w:
        assert w.getframerate() == 16_000
        assert w.getnchannels() == 1
        assert w.getsampwidth() == 2  # 16-bit


@pytest.mark.parametrize(
    "ext, codec_args",
    [
        ("webm", ["-c:a", "libopus", "-b:a", "32k"]),  # Chrome / Firefox
        ("mp4", ["-c:a", "aac", "-b:a", "64k"]),  # Safari (moov atom at end)
        ("wav", []),  # already WAV, but 44.1 kHz — must still be resampled
    ],
)
def test_browser_formats_normalize(ngang_wav, ext, codec_args):
    encoded = _encode(ngang_wav, ext, codec_args)
    out = to_wav16k_mono(encoded)
    _assert_normalized(out)
    assert 0.3 < wav_duration_s(out) < 0.7  # synthetic ngang is 0.45 s


def test_mp4_has_moov_at_end(ngang_wav):
    """Guard that the Safari-like fixture really exercises the hard case."""
    mp4 = _encode(ngang_wav, "mp4", ["-c:a", "aac"])
    assert mp4.find(b"moov") > mp4.find(b"mdat") > 0


def test_garbage_rejected():
    with pytest.raises(AudioNormalizationError):
        to_wav16k_mono(b"this is not audio" * 50)


def test_empty_rejected():
    with pytest.raises(AudioNormalizationError):
        to_wav16k_mono(b"")
