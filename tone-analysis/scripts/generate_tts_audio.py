#!/usr/bin/env python
"""
Placeholder lesson audio from Google Cloud Text-to-Speech, until the native
speaker's recordings replace it (scripts/split_collection_recording.py).

For one vocab collection: synthesize every word with the chosen vi-VN voice,
name each clip per the sheet's "Audio file" column, and check each clip
against the expected word with both ASR models on the live tone engine.
Chirp3 voices are not deterministic — the same request can come back with a
different (sometimes wrong) tone — so each word is synthesized up to
--tries times and the first take both models hear correctly is kept (else
the take at least one model heard, else the first). Mismatches are FLAGGED.

Credentials: a service-account key via GOOGLE_APPLICATION_CREDENTIALS. The
key must live OUTSIDE this repo — the script refuses to run otherwise — and
is used locally only (never committed, never in Vercel).

Output goes to the gitignored test-audio/tts/<voice>/<collection>/ by
default. `--publish` copies the clips into the app
(public/audio/vocab/<collection>/) and marks each word in
content/vocab/<collection>.json with audio_source "google-tts" + the voice.

Usage (from tone-analysis/, venv active):
    GOOGLE_APPLICATION_CREDENTIALS=/path/outside/repo/key.json \\
        python scripts/generate_tts_audio.py food --voice vi-VN-Chirp3-HD-Leda [--publish]
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from split_collection_recording import REPO, engine_client  # noqa: E402

SAMPLE_RATE = 24_000


def credentials_outside_repo():
    key = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not key or not Path(key).is_file():
        sys.exit("Set GOOGLE_APPLICATION_CREDENTIALS to the service-account key file (kept outside the repo).")
    if Path(key).resolve().is_relative_to(REPO):
        sys.exit("Refusing: the Google key file is inside the repo. Move it outside the repo first.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("collection")
    ap.add_argument("--voice", required=True)
    ap.add_argument("--rate", type=float, default=1.0, help="speaking rate (1.0 = voice default)")
    ap.add_argument("--out-dir", type=Path)
    ap.add_argument("--tries", type=int, default=5, help="max syntheses per word while looking for a take both models hear")
    ap.add_argument("--no-check", action="store_true", help="skip the ASR check on the tone engine")
    ap.add_argument("--publish", action="store_true")
    args = ap.parse_args()

    credentials_outside_repo()
    from google.cloud import texttospeech as tts

    content_path = REPO / f"content/vocab/{args.collection}.json"
    content = json.loads(content_path.read_text())
    words = content["words"]
    out_dir = args.out_dir or HERE.parent / f"test-audio/tts/{args.voice}/{args.collection}"
    out_dir.mkdir(parents=True, exist_ok=True)

    client = tts.TextToSpeechClient()
    voice = tts.VoiceSelectionParams(language_code="vi-VN", name=args.voice)
    config = tts.AudioConfig(audio_encoding=tts.AudioEncoding.LINEAR16, sample_rate_hertz=SAMPLE_RATE,
                             speaking_rate=args.rate)
    check = None if args.no_check else engine_client()

    report, flags = [], []
    for w in words:
        synth = lambda: client.synthesize_speech(input=tts.SynthesisInput(text=w["text"]), voice=voice,
                                                 audio_config=config).audio_content
        row = {"word": w["text"], "file": w["audio_file"]}
        if check:
            takes = []
            for _ in range(max(1, args.tries)):
                wav = synth()
                res = check(wav, w["text"])
                takes.append((res["pho_match"] and res["par_match"], res["pho_match"] or res["par_match"], -len(takes), wav, res))
                if takes[-1][0]:
                    break
            *_, wav, res = max(takes, key=lambda t: t[:3])
            row.update(res, tries=len(takes))
            ok = res["pho_match"] and res["par_match"]
            if not ok:
                flags.append(f"{w['text']}: PhoWhisper heard {res['phowhisper']!r}, Parakeet heard {res['parakeet']!r} (best of {len(takes)})")
            print(f"  {w['text']:16s} -> {w['audio_file']:28s} {'OK  ' if ok else 'FLAG'}  try {len(takes)}  (pho {res['phowhisper']!r}, par {res['parakeet']!r})")
        else:
            wav = synth()
            print(f"  {w['text']:16s} -> {w['audio_file']}")
        (out_dir / w["audio_file"]).write_bytes(wav)
        report.append(row)

    (out_dir / "tts-report.json").write_text(json.dumps({"voice": args.voice, "rate": args.rate, "words": report},
                                                        ensure_ascii=False, indent=2))
    print(f"\nwrote {len(words)} clips + tts-report.json to {out_dir}")
    if check:
        print("\nFLAGGED:" if flags else "\nno flags — both models heard every clip correctly")
        for f in flags:
            print("  FLAG", f)

    if args.publish:
        pub = REPO / f"public/audio/vocab/{args.collection}"
        pub.mkdir(parents=True, exist_ok=True)
        for w in words:
            shutil.copy2(out_dir / w["audio_file"], pub / w["audio_file"])
            w["audio"] = f"/audio/vocab/{args.collection}/{w['audio_file']}"
            w["audio_source"] = "google-tts"
            w["audio_voice"] = args.voice
        content_path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n")
        print(f"published to {pub.relative_to(REPO)} and updated {content_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()
