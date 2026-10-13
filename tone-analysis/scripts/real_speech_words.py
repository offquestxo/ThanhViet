#!/usr/bin/env python
"""
Real-speech single-word test: send every isolated word in the openly
licensed test sets (test-audio/lingualibre/<speaker>/<word>.wav and
test-audio/vi-hanoi/Vi-hanoi-<m|f|nam>-<word>.ogg) through the live tone
engine and summarize:

  * "heard as" — shown when both models agree; is it the target word?
  * per-model accuracy (PhoWhisper, Parakeet)
  * creak — does Parselmouth find a voice break, split by target tone
    (ngã/nặng are the glottalized tones; the rest should mostly have none)

The target word comes from the file name (NFC-normalized — macOS stores
names decomposed). Audio stays in the gitignored test-audio/ folder; it is
sent only to our Modal engine (which forwards it to NVIDIA's Parakeet API).
Results go to test-audio/real-speech-words.json (also gitignored).

Usage (from tone-analysis/, venv active):
    python scripts/real_speech_words.py
"""

from __future__ import annotations

import json
import sys
import unicodedata
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "src"))
from split_collection_recording import REPO  # noqa: E402
from tone_analysis.phowhisper_service import syllable_tone  # noqa: E402

AUDIO = HERE.parent / "test-audio"
AGREED = {"both_match", "both_tone_mismatch_same", "both_same_other_word"}


def items():
    for spk in sorted((AUDIO / "lingualibre").iterdir()):
        for f in sorted(spk.glob("*.wav")):
            yield f"lingualibre/{spk.name}", f, unicodedata.normalize("NFC", f.stem)
    for f in sorted((AUDIO / "vi-hanoi").glob("*.ogg")):
        stem = unicodedata.normalize("NFC", f.stem)
        voice, word = stem.split("-", 3)[2], stem.split("-", 3)[3]
        yield f"vi-hanoi/{voice}", f, word.replace("_", " ")


def main():
    analyze = _engine()
    rows = []
    for source, path, target in items():
        body = analyze(path, target)
        if "error" in body:
            rows.append({"source": source, "file": path.name, "target": target, "error": body["error"]})
            print(f"  {source:28s} {target:10s} ENGINE REJECTED: {body['error']}")
            continue
        s, a = body["summary"], body["acoustic"]
        syl = target.split()
        rows.append({
            "source": source, "file": path.name, "target": target,
            "tones": [syllable_tone(x) for x in syl],
            "agreement": s["agreement"], "heard_as": s.get("heard_as"),
            "phowhisper": body["phowhisper"].get("transcript"), "pho_verdict": body["phowhisper"].get("verdict"),
            "parakeet": body["parakeet"].get("transcript"), "par_verdict": body["parakeet"].get("verdict"),
            "acoustic": a["status"], "voice_breaks": len(a.get("voice_breaks") or []),
            "sample_rate_hz": a.get("sample_rate_hz"),
        })
        r = rows[-1]
        print(f"  {source:28s} {target:10s} {r['agreement']:28s} heard_as={r['heard_as']!s:10s} "
              f"pho={r['phowhisper']!r:14s} par={r['parakeet']!r:14s} {r['acoustic']:22s} breaks={r['voice_breaks']}")
    (AUDIO / "real-speech-words.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2))
    summarize(rows)


def _engine():
    env = dict(l.split("=", 1) for l in (REPO / ".env.local").read_text().splitlines() if "=" in l and not l.startswith("#"))
    url, secret = env["MODAL_TONE_ENGINE_URL"].strip(), env["TONE_ENGINE_SHARED_SECRET"].strip()
    import httpx

    client = httpx.Client(timeout=180)

    def call(path: Path, target: str) -> dict:
        mime = "audio/ogg" if path.suffix == ".ogg" else "audio/wav"
        r = client.post(f"{url}/analyze", headers={"X-Tone-Engine-Secret": secret},
                        files={"audio": (path.name, path.read_bytes(), mime)}, data={"target_text": target})
        if r.status_code in (413, 422):
            return {"error": f"{r.status_code} {r.json().get('detail')}"}
        r.raise_for_status()
        return r.json()

    return call


def summarize(rows):
    errors = [r for r in rows if "error" in r]
    rows = [r for r in rows if "error" not in r]
    n = len(rows)
    shown = [r for r in rows if r["agreement"] in AGREED and r["heard_as"]]
    right = [r for r in shown if r["agreement"] == "both_match"]
    print(f"\n{n} words.  'Heard as' shown (both agree): {len(shown)}; right: {len(right)}")
    for r in shown:
        if r["agreement"] != "both_match":
            print(f"    wrong-but-agreed: {r['source']} {r['target']} -> {r['heard_as']}")
    print(f"PhoWhisper right: {sum(r['pho_verdict'] == 'match' for r in rows)}/{n}; "
          f"Parakeet right: {sum(r['par_verdict'] == 'match' for r in rows)}/{n}; "
          f"disagree: {sum(r['agreement'] == 'disagree' for r in rows)}; agreement counts: {dict(Counter(r['agreement'] for r in rows))}")
    single = [r for r in rows if len(r["tones"]) == 1 and r["acoustic"] == "ok"]
    glott = [r for r in single if r["tones"][0] in ("nga", "nang")]
    other = [r for r in single if r["tones"][0] not in ("nga", "nang")]
    print(f"Creak (single syllables, pitch ok): ngã/nặng with a break {sum(r['voice_breaks'] > 0 for r in glott)}/{len(glott)}; "
          f"other tones with a break {sum(r['voice_breaks'] > 0 for r in other)}/{len(other)}; "
          f"rejected for pitch: {sum(r['acoustic'] != 'ok' for r in rows if len(r['tones']) == 1)}")
    for r in errors:
        print(f"engine rejected the file: {r['source']} {r['target']}: {r['error']}")


if __name__ == "__main__":
    main()
