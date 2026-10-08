"""HTTP-layer tests: auth fails closed, caps hold, real formats go through."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

from tone_analysis import normalize
from tone_analysis.engine_api import SECRET_HEADER, create_app

SECRET = "test-secret-not-real"


async def pho(_wav):
    return "má"


async def par(_wav):
    return {"transcript": "má", "words": [], "mode": "offline"}


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("TONE_ENGINE_SHARED_SECRET", SECRET)
    warmed = []

    async def warm():
        warmed.append(True)

    c = TestClient(create_app(phowhisper=pho, parakeet=par, warm=warm))
    c.warmed = warmed
    return c


def post(client, audio=b"", target="má", headers=None, content_type="audio/wav"):
    return client.post(
        "/analyze",
        files={"audio": ("rec.wav", audio, content_type)},
        data={"target_text": target},
        headers=headers if headers is not None else {SECRET_HEADER: SECRET},
    )


def test_health_is_open(client):
    assert client.get("/health").json() == {"status": "ok"}


@pytest.mark.parametrize("headers", [{}, {SECRET_HEADER: "wrong"}])
def test_bad_or_missing_secret_rejected(client, headers, ngang_wav):
    assert post(client, ngang_wav, headers=headers).status_code == 401
    assert client.post("/warm", headers=headers).status_code == 401
    assert client.warmed == []


def test_unconfigured_secret_fails_closed(monkeypatch, ngang_wav):
    monkeypatch.delenv("TONE_ENGINE_SHARED_SECRET", raising=False)
    c = TestClient(create_app(phowhisper=pho, parakeet=par))
    r = post(c, ngang_wav, headers={SECRET_HEADER: ""})
    assert r.status_code == 503


@pytest.mark.skipif(not os.environ.get("FFMPEG_BIN"), reason="no ffmpeg available")
def test_analyze_ok(client, synthetic_wavs):
    r = post(client, synthetic_wavs["sac"])
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["summary"]["agreement"] == "both_match"
    assert body["acoustic"]["status"] == "ok"
    # Decision 4: the harness analyzed the 44.1 kHz upload at its own rate,
    # not the 16 kHz copy the ASR models get.
    assert body["acoustic"]["sample_rate_hz"] == 44_100
    assert body["input"]["content_type"] == "audio/wav"


def test_warm(client):
    assert client.post("/warm", headers={SECRET_HEADER: SECRET}).json() == {"status": "warming"}
    assert client.warmed == [True]


def test_upload_cap(client, monkeypatch):
    monkeypatch.setattr("tone_analysis.engine_api.MAX_UPLOAD_BYTES", 1000)
    assert post(client, b"x" * 2000).status_code == 413


@pytest.mark.skipif(not os.environ.get("FFMPEG_BIN"), reason="no ffmpeg available")
def test_garbage_audio_422(client):
    r = post(client, b"not audio at all" * 100)
    assert r.status_code == 422 and "unreadable audio" in r.json()["detail"]


@pytest.mark.skipif(not os.environ.get("FFMPEG_BIN"), reason="no ffmpeg available")
def test_duration_cap(client, monkeypatch, ngang_wav):
    monkeypatch.setattr("tone_analysis.engine_api.MAX_DURATION_S", 0.1)
    r = post(client, ngang_wav)
    assert r.status_code == 422 and "too long" in r.json()["detail"]


@pytest.mark.parametrize("target", ["", "   ", "x" * 500])
def test_bad_target_text(client, ngang_wav, target):
    assert post(client, ngang_wav, target=target).status_code == 422
