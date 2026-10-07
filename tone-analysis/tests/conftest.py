from __future__ import annotations

import io
import sys
from pathlib import Path

import pytest
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from tone_analysis.synth import SAMPLE_RATE, TONE_SPECS, synthesize_tone  # noqa: E402


def _wav_bytes(samples, sr) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, samples, sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()


@pytest.fixture(scope="session")
def synthetic_wavs() -> dict[str, bytes]:
    """One in-memory WAV per pilot tone, keyed by tone name."""
    out = {}
    for i, (key, spec) in enumerate(TONE_SPECS.items()):
        samples = synthesize_tone(spec, sr=SAMPLE_RATE, seed=2000 + i)
        out[key] = _wav_bytes(samples, SAMPLE_RATE)
    return out


@pytest.fixture
def ngang_wav(synthetic_wavs) -> bytes:
    return synthetic_wavs["ngang"]


@pytest.fixture
def nang_wav(synthetic_wavs) -> bytes:
    return synthetic_wavs["nang"]


@pytest.fixture
def nga_wav(synthetic_wavs) -> bytes:
    return synthetic_wavs["nga"]


@pytest.fixture
def silence_wav() -> bytes:
    import numpy as np

    samples = np.zeros(int(0.5 * SAMPLE_RATE))
    return _wav_bytes(samples, SAMPLE_RATE)


@pytest.fixture
def too_short_wav() -> bytes:
    import numpy as np

    samples = np.random.default_rng(0).normal(0, 0.1, int(0.02 * SAMPLE_RATE))
    return _wav_bytes(samples, SAMPLE_RATE)
