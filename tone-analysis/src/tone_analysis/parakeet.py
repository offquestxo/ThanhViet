"""
NVIDIA Parakeet-CTC-0.6B-vi via NVIDIA's hosted NIM (Riva gRPC).

Call shape taken from the model's API tab on build.nvidia.com (not guessed):
    server       grpc.nvcf.nvidia.com:443, SSL
    metadata     function-id: f3dff2bb-99f9-403d-a5f1-f574a757deb0
                 authorization: Bearer $NVIDIA_API_KEY
    language     vi-VN
    input        16-bit mono linear PCM (WAV/OGG/OPUS container)

Streaming only. Verified against the live endpoint (2026-10-07): an
offline (batch) request is rejected with INVALID_ARGUMENT "Unavailable model
requested given these parameters: language_code=vi; sample_rate=16000;
type=offline" — for both raw PCM and full-WAV payloads. The hosted function
serves streaming recognition only, so the whole clip is streamed in chunks
and only final results are kept.

Word timestamps — verified limits (2026-10-07, real FLEURS speech):
  * They are 80 ms CTC frame positions (FastConformer's 8x downsampling),
    not word boundaries: the median word "span" is exactly one frame. Cut
    between consecutive positions, never on [start, end].
  * Around punctuation the word list can drift from the model's own
    transcript: "...cho viết, Vụ va chạm đã gây..." came back as words
    "viết, đã, Vụ, va, chạm, ., gây" (labels shifted, a "." token in a word
    slot). Turning enable_automatic_punctuation off has no effect on the
    hosted function — punctuation is part of the model's output. Anything
    that segments by these timestamps must check that the word list matches
    the transcript first.

The API key comes from the environment (a Modal secret in production) and
is never logged or returned.
"""

from __future__ import annotations

import io
import os
import wave

PARAKEET_URI = "grpc.nvcf.nvidia.com:443"
PARAKEET_FUNCTION_ID = "f3dff2bb-99f9-403d-a5f1-f574a757deb0"
LANGUAGE_CODE = "vi-VN"
STREAM_CHUNK_BYTES = 16_000  # 0.5 s of 16 kHz s16 mono audio


def _pcm_from_wav(wav: bytes) -> tuple[bytes, int]:
    with wave.open(io.BytesIO(wav), "rb") as w:
        return w.readframes(w.getnframes()), w.getframerate()


def _service():
    import riva.client

    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        raise RuntimeError("NVIDIA_API_KEY is not set")
    auth = riva.client.Auth(
        uri=PARAKEET_URI,
        use_ssl=True,
        metadata_args=[
            ["function-id", PARAKEET_FUNCTION_ID],
            ["authorization", f"Bearer {api_key}"],
        ],
    )
    return riva.client.ASRService(auth)


def _config(sample_rate: int):
    import riva.client

    return riva.client.RecognitionConfig(
        encoding=riva.client.AudioEncoding.LINEAR_PCM,
        sample_rate_hertz=sample_rate,
        audio_channel_count=1,
        language_code=LANGUAGE_CODE,
        max_alternatives=1,
        enable_automatic_punctuation=True,
        enable_word_time_offsets=True,
    )


def _collect(results) -> tuple[str, list[dict]]:
    texts, words = [], []
    for result in results:
        if not result.alternatives:
            continue
        alt = result.alternatives[0]
        texts.append(alt.transcript.strip())
        for w in alt.words:
            words.append(
                {
                    "word": w.word,
                    "start_ms": int(w.start_time),
                    "end_ms": int(w.end_time),
                    "confidence": float(w.confidence),
                }
            )
    return " ".join(t for t in texts if t), words


def transcribe(wav: bytes) -> dict:
    """Blocking call. Returns {transcript, words, mode}; raises on failure."""
    import riva.client

    pcm, sample_rate = _pcm_from_wav(wav)
    service = _service()
    streaming_config = riva.client.StreamingRecognitionConfig(
        config=_config(sample_rate), interim_results=False
    )
    chunks = (pcm[i : i + STREAM_CHUNK_BYTES] for i in range(0, len(pcm), STREAM_CHUNK_BYTES))
    final_results = []
    for response in service.streaming_response_generator(
        audio_chunks=chunks, streaming_config=streaming_config
    ):
        final_results.extend(r for r in response.results if r.is_final)
    transcript, words = _collect(final_results)
    return {"transcript": transcript, "words": words, "mode": "streaming"}
