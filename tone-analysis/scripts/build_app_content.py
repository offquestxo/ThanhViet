#!/usr/bin/env python
"""
Builds the app's preset content files from the two source spreadsheets:

    content/tone-tuner/items.json   <- tone-tuner-word-list.xlsx ("Word List")
    content/vocab/<collection>.json <- thanh-viet-lessons-import.xlsx
                                       (rows with "Demo tomorrow" = Yes, plus
                                       every collection in
                                       content/vocab/picture-plan.json)

Planned collections take one decision per sheet row from the picture plan:
a Twemoji picture (downloaded once into public/vocab/<id>/) or "left out"
with a reason. Left-out rows are kept in the content file under
`left_out` (for custom art later) but never appear in drills.

Tones are computed here with phowhisper_service.syllable_tone() — the same
function the engine uses — never copied from the sheets' hand-entered tone
columns. Those columns are only cross-checked, and any disagreement is
printed as a FLAG for the content owner (the sheets have had tone-note
errors before).

Each syllable also records `mark_index`: the position (in the NFC string) of
the character carrying the tone mark, so the UI can highlight it without
re-implementing tone parsing.

Usage (from tone-analysis/, venv active):
    python scripts/build_app_content.py <word-list.xlsx> <lessons-import.xlsx>
"""

from __future__ import annotations

import json
import re
import urllib.request
import sys
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from tone_analysis.phowhisper_service import _TONE_MARKS, _clean, syllable_tone  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
M = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS = {"m": M}
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
TONE_NAMES = {"ngang": "ngang", "huyền": "huyen", "sắc": "sac", "hỏi": "hoi", "ngã": "nga", "nặng": "nang"}


def read_sheet(path: str, sheet_name: str) -> list[dict]:
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        shared = ["".join(t.text or "" for t in si.iter(f"{{{M}}}t"))
                  for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)]
    relmap = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
    sheet = next(s for s in ET.fromstring(z.read("xl/workbook.xml")).find("m:sheets", NS) if s.get("name") == sheet_name)
    target = relmap[sheet.get(REL)].lstrip("/")
    root = ET.fromstring(z.read(target if target.startswith("xl/") else "xl/" + target))

    def cell(c):
        v, t, inline = c.find("m:v", NS), c.get("t"), c.find("m:is", NS)
        if t == "s" and v is not None and v.text:
            return shared[int(v.text)]
        if t == "inlineStr" and inline is not None:
            return "".join(x.text or "" for x in inline.iter(f"{{{M}}}t"))
        return v.text if v is not None and v.text else ""

    def col(ref):  # "C12" -> 2
        n = 0
        for ch in re.match(r"[A-Z]+", ref).group():
            n = n * 26 + ord(ch) - 64
        return n - 1

    rows = []
    for r in root.iter(f"{{{M}}}row"):
        vals = {}
        for c in r.findall("m:c", NS):
            vals[col(c.get("r"))] = cell(c).strip()
        rows.append([vals.get(i, "") for i in range(max(vals) + 1)] if vals else [])
    header = rows[0]
    return [dict(zip(header, r + [""] * (len(header) - len(r)))) for r in rows[1:] if any(r)]


def syllables(text: str) -> list[dict]:
    out = []
    # Hyphenated loanwords (cà-vạt, va-li, sô-pha) are one syllable per
    # hyphen-separated part — the engine's _clean() splits them the same way.
    for raw in re.split(r"[\s-]+", text):
        syl = unicodedata.normalize("NFC", raw.strip(".,?!"))
        if not syl:
            continue
        mark_index = -1
        for i, ch in enumerate(syl):
            if any(m in _TONE_MARKS for m in unicodedata.normalize("NFD", ch)):
                mark_index = i
                break
        out.append({"text": syl, "tone": syllable_tone(syl), "mark_index": mark_index})
    return out


def sheet_tones(note: str) -> list[str] | None:
    """Parse a hand-entered tone note like 'sắc + ngang' into tone keys."""
    note = note.split("—")[0]  # ignore commentary after an em dash
    found = [TONE_NAMES[t] for t in re.findall(r"ngang|huyền|sắc|hỏi|ngã|nặng", note.lower())]
    return found or None


def item_id(text: str, syl: list[dict]) -> str:
    """Diacritic-free slug plus the computed tones, so minimal pairs stay
    distinct: ma--ngang, ma--sac, ca-phe--huyen-ngang."""
    return f"{slugify(text)}--{'-'.join(s['tone'] for s in syl)}"


def slugify(text: str) -> str:
    base = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    base = "".join(ch for ch in base if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", "-", base).strip("-")


flags: list[str] = []


def check(label: str, computed: list[dict], note: str) -> None:
    expected = sheet_tones(note)
    got = [s["tone"] for s in computed]
    if expected and expected != got:
        flags.append(f"{label}: sheet says {' + '.join(expected)}, syllable_tone() says {' + '.join(got)}")


def build_tone_tuner(path: str) -> None:
    items = []
    for row in read_sheet(path, "Word List"):
        text = row["Word / Phrase"]
        syl = syllables(text)
        kind = row["Type"].lower()
        check(f"tone-tuner #{row['#']} {text}", syl, row["Notes"] if len(syl) > 1 else row["Tone"])
        items.append({
            "id": item_id(text, syl),
            "text": text,
            "meaning": row["Meaning"],
            "kind": "word" if len(syl) == 1 else ("sentence" if "sentence" in kind else "phrase"),
            "glottalization_target": row["Glottalization Test?"].upper() == "Y",
            "syllables": syl,
            "reference_audio": None,  # filled in once native reference recordings exist
        })
    ids = [i["id"] for i in items]
    assert len(ids) == len(set(ids)), "duplicate tone-tuner ids"
    out = REPO / "content/tone-tuner/items.json"
    out.write_text(json.dumps({"source": "tone-tuner-word-list.xlsx (Word List)", "items": items},
                              ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {out.relative_to(REPO)}: {len(items)} items")


TWEMOJI = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.3/assets/svg/{}.svg"


def fetch_twemoji(codepoint: str, dest: Path) -> None:
    if dest.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(TWEMOJI.format(codepoint), timeout=30) as r:
        data = r.read()
    assert data.lstrip().startswith(b"<svg"), f"not an SVG: {codepoint}"
    dest.write_bytes(data)


def build_vocab(path: str) -> None:
    plan = json.loads((REPO / "content/vocab/picture-plan.json").read_text())["collections"]
    rows = [r for r in read_sheet(path, "All Words")
            if r["Demo tomorrow"].strip().lower() == "yes" or r["Collection"] in plan]
    by_collection: dict[str, list[dict]] = {}
    left_out: dict[str, list[dict]] = {}
    for row in rows:
        text = row["Vietnamese"]
        syl = syllables(text)
        check(f"vocab {row['Collection']} #{row['#']} {text}", syl, row["Tones"])
        word = {
            "id": item_id(text, syl),
            "text": text,
            "meaning": row["English"],
            "syllables": syl,
            "audio_file": row["Audio file"],
            "audio": None,  # set by split_collection_recording.py / generate_tts_audio.py --publish
        }
        cplan = plan.get(row["Collection"])
        if cplan:
            key = f"{text} | {row['English']}"
            decision = cplan["rows"].get(key)
            if decision is None:
                sys.exit(f"STOP: no picture-plan decision for {row['Collection']} row #{row['#']} ({key!r})")
            if "skip" in decision:
                left_out.setdefault(row["Collection"], []).append(
                    {"text": text, "meaning": row["English"], "reason": decision["skip"]})
                continue
            word["audio_file"] = decision.get("audio_file", word["audio_file"])
            # Named by word id, not slug: mặt and mắt share the slug "mat".
            img = f"vocab/{cplan['id']}/{word['id']}.svg"
            fetch_twemoji(decision["twemoji"], REPO / "public" / img)
            word["image"] = "/" + img
            word["twemoji"] = decision["twemoji"]
        by_collection.setdefault(row["Collection"], []).append(word)
    for collection, words in by_collection.items():
        cid = plan[collection]["id"] if collection in plan else slugify(collection)
        ids = [w["id"] for w in words]
        assert len(ids) == len(set(ids)), f"duplicate ids in {collection}"
        files = [w["audio_file"] for w in words]
        assert len(files) == len(set(files)), f"duplicate audio file names in {collection}"
        images = [w["image"] for w in words if "image" in w]
        assert len(images) == len(set(images)), f"duplicate image paths in {collection}"
        out = REPO / f"content/vocab/{cid}.json"
        existing = json.loads(out.read_text()) if out.exists() else {}
        # Preserve hand-curated presentation fields (image/swatch) and any
        # already-verified audio paths across re-imports.
        prior = {w["id"]: w for w in existing.get("words", [])}
        for w in words:
            for key in ("image", "swatch", "audio", "audio_source", "audio_voice"):
                if key in prior.get(w["id"], {}) and w.get(key) is None:
                    w[key] = prior[w["id"]][key]
        doc = {"id": cid, "title": collection, "source": "thanh-viet-lessons-import.xlsx (All Words)", "words": words}
        if collection in plan:
            doc["title_vi"] = plan[collection]["title_vi"]
            doc["left_out"] = left_out.get(collection, [])
        out.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
        print(f"wrote {out.relative_to(REPO)}: {len(words)} words" +
              (f", {len(doc['left_out'])} left out" if collection in plan else ""))


if __name__ == "__main__":
    word_list, lessons = sys.argv[1], sys.argv[2]
    build_tone_tuner(word_list)
    build_vocab(lessons)
    print("\nTONE FLAGS (sheet vs syllable_tone):" if flags else "\nno tone flags — every sheet tone matches syllable_tone()")
    for f in flags:
        print("  FLAG", f)
