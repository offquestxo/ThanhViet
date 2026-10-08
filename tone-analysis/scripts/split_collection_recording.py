#!/usr/bin/env python
"""
Split one continuous native-speaker recording of a vocab collection into
per-word clips.

Expected recording: every word of the collection, in the content file's
order, said N times (default 2), with a pause between each take.

Steps:
  1. Decode at the source's own rate (mono) and find speech by energy.
  2. Merge gaps shorter than a threshold (syllables within one word), then
     search for the threshold that yields exactly words x takes segments.
     If no threshold does, STOP and report — never guess an alignment.
  3. For each word, run every take through the live tone engine (both ASR
     models) and keep the best: both models hear the word > one does >
     neither; ties broken by no clipping, then loudness.
  4. Write the kept take, named per the sheet's "Audio file" column, plus a
     report. Any word where no take was heard correctly by both models is
     FLAGGED for a human to check.

Output stays in the gitignored test-audio/ folder by default. `--publish`
copies the kept clips into the app (public/audio/vocab/<collection>/) and
sets each word's `audio` path in content/vocab/<collection>.json. Publishing
is deliberately opt-in: the repo is public, so committing these files makes
the speaker's voice public — get their consent first.

Usage (from tone-analysis/, venv active):
    python scripts/split_collection_recording.py food path/to/food.m4a
    python scripts/split_collection_recording.py food path/to/food.m4a --publish
"""

from __future__ import annotations

import argparse
import io
import json
import os
import shutil
import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "src"))
from tone_analysis.normalize import to_wav_acoustic  # noqa: E402

REPO = HERE.parents[1]
FRAME_S, HOP_S = 0.02, 0.01
PAD_S = 0.15


def ensure_ffmpeg():
    if not os.environ.get("FFMPEG_BIN") and not shutil.which("ffmpeg"):
        try:
            import imageio_ffmpeg

            os.environ["FFMPEG_BIN"] = imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError:
            sys.exit("ffmpeg not found — install ffmpeg or `pip install imageio-ffmpeg`")


def decode(path: Path) -> tuple[np.ndarray, int]:
    wav = to_wav_acoustic(path.read_bytes(), timeout_s=120)
    with wave.open(io.BytesIO(wav), "rb") as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768
    return x, sr


def speech_runs(x: np.ndarray, sr: int) -> list[tuple[float, float]]:
    """Contiguous above-threshold runs, in seconds."""
    frame, hop = int(FRAME_S * sr), int(HOP_S * sr)
    n = max(1, 1 + (len(x) - frame) // hop)
    db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * hop:i * hop + frame] ** 2)) + 1e-9) for i in range(n)])
    floor, peak = np.percentile(db, 10), np.percentile(db, 99)
    thresh = max(floor + 15, peak - 35)
    on = db > thresh
    runs, start = [], None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append((start * HOP_S, i * HOP_S + FRAME_S)); start = None
    if start is not None:
        runs.append((start * HOP_S, n * HOP_S + FRAME_S))
    return runs


def merge(runs, min_gap_s, min_len_s=0.12):
    merged = []
    for a, b in runs:
        if merged and a - merged[-1][1] < min_gap_s:
            merged[-1] = (merged[-1][0], b)
        else:
            merged.append((a, b))
    return [(a, b) for a, b in merged if b - a >= min_len_s]


def segment(x, sr, expected):
    runs = speech_runs(x, sr)
    tried = {}
    for gap_ms in range(150, 1201, 25):
        segs = merge(runs, gap_ms / 1000)
        tried[gap_ms] = len(segs)
        if len(segs) == expected:
            return segs, gap_ms, tried
    return None, None, tried


def to_wav_bytes(y: np.ndarray, sr: int) -> bytes:
    y = y / max(1e-6, float(np.abs(y).max())) * 0.89  # peak at about -1 dBFS
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((y * 32767).astype("<i2").tobytes())
    return buf.getvalue()


def engine_client():
    env = dict(l.split("=", 1) for l in (REPO / ".env.local").read_text().splitlines() if "=" in l and not l.startswith("#"))
    url, secret = env.get("MODAL_TONE_ENGINE_URL", "").strip(), env.get("TONE_ENGINE_SHARED_SECRET", "").strip()
    if not url or not secret:
        sys.exit("MODAL_TONE_ENGINE_URL / TONE_ENGINE_SHARED_SECRET missing from .env.local")
    import httpx

    client = httpx.Client(timeout=180)

    def check(wav: bytes, target: str) -> dict:
        r = client.post(f"{url}/analyze", headers={"X-Tone-Engine-Secret": secret},
                        files={"audio": ("take.wav", wav, "audio/wav")}, data={"target_text": target})
        r.raise_for_status()
        b = r.json()
        return {"agreement": b["summary"]["agreement"],
                "phowhisper": b["phowhisper"].get("transcript"), "parakeet": b["parakeet"].get("transcript"),
                "pho_match": b["phowhisper"].get("verdict") == "match", "par_match": b["parakeet"].get("verdict") == "match"}

    return check


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("collection")
    ap.add_argument("recording", type=Path)
    ap.add_argument("--takes", type=int, default=2)
    ap.add_argument("--out-dir", type=Path)
    ap.add_argument("--publish", action="store_true")
    args = ap.parse_args()

    ensure_ffmpeg()
    content_path = REPO / f"content/vocab/{args.collection}.json"
    content = json.loads(content_path.read_text())
    words = content["words"]
    expected = len(words) * args.takes
    out_dir = args.out_dir or HERE.parent / f"test-audio/lesson-audio/{args.collection}"
    out_dir.mkdir(parents=True, exist_ok=True)

    x, sr = decode(args.recording)
    print(f"{args.recording.name}: {len(x) / sr:.1f}s at {sr} Hz; expecting {len(words)} words x {args.takes} takes = {expected} segments")
    segs, gap_ms, tried = segment(x, sr, expected)
    if segs is None:
        counts = sorted(set(tried.values()))
        sys.exit(f"STOP: no silence threshold gives exactly {expected} segments (found counts {counts}). "
                 "Check the recording: a missed or extra take, a cough, or pauses that are too short. Nothing written.")
    print(f"found {expected} segments (merging gaps < {gap_ms} ms)")

    check = engine_client()
    report, flags = [], []
    for i, w in enumerate(words):
        takes = []
        for t, (a, b) in enumerate(segs[i * args.takes:(i + 1) * args.takes]):
            lo, hi = max(0, int((a - PAD_S) * sr)), min(len(x), int((b + PAD_S) * sr))
            clip = x[lo:hi]
            wav = to_wav_bytes(clip, sr)
            res = check(wav, w["text"])
            clipped = float(np.mean(np.abs(clip) > 0.99))
            rank = (res["pho_match"] and res["par_match"], res["pho_match"] or res["par_match"], clipped < 0.001, float(np.sqrt(np.mean(clip ** 2))))
            takes.append({"take": t + 1, "start_s": round(a, 2), "dur_s": round(b - a, 2), "clipped": clipped, "rank": rank, "wav": wav, **res})
        best = max(takes, key=lambda tk: tk["rank"])
        (out_dir / w["audio_file"]).write_bytes(best["wav"])
        ok = best["pho_match"] and best["par_match"]
        if not ok:
            flags.append(f"{w['text']}: best take {best['take']} — PhoWhisper heard {best['phowhisper']!r}, Parakeet heard {best['parakeet']!r}")
        report.append({"word": w["text"], "file": w["audio_file"], "kept_take": best["take"], "both_models_heard_it": ok,
                       "takes": [{k: v for k, v in tk.items() if k not in ("wav", "rank")} for tk in takes]})
        print(f"  {w['text']:16s} -> {w['audio_file']:28s} take {best['take']}  {'OK' if ok else 'FLAG'}  (pho {best['phowhisper']!r}, par {best['parakeet']!r})")

    (out_dir / "split-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"\nwrote {len(words)} clips + split-report.json to {out_dir}")
    print("\nFLAGGED for a human check:" if flags else "\nno flags — both models heard every kept take correctly")
    for f in flags:
        print("  FLAG", f)

    if args.publish:
        pub = REPO / f"public/audio/vocab/{args.collection}"
        pub.mkdir(parents=True, exist_ok=True)
        for w in words:
            shutil.copy2(out_dir / w["audio_file"], pub / w["audio_file"])
            w["audio"] = f"/audio/vocab/{args.collection}/{w['audio_file']}"
        content_path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n")
        print(f"published to {pub.relative_to(REPO)} and updated {content_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()
