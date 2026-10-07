#!/usr/bin/env python
"""
Generates the six synthetic placeholder audio files (one per pilot tone)
used to mechanically exercise the extraction pipeline before real
native-speaker recordings exist. See src/tone_analysis/synth.py for what
"synthetic" means here and why it's not a substitute for real data.

Usage (from tone-analysis/, with the venv active):
    python scripts/generate_test_audio.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from tone_analysis.synth import SAMPLE_RATE, TONE_SPECS, synthesize_tone  # noqa: E402

OUT_DIR = Path(__file__).resolve().parent.parent / "sample_audio"


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    print(f"Writing synthetic placeholder audio to {OUT_DIR}/\n")
    for i, (key, spec) in enumerate(TONE_SPECS.items()):
        samples = synthesize_tone(spec, sr=SAMPLE_RATE, seed=1000 + i)
        out_path = OUT_DIR / f"synthetic_{key}.wav"
        sf.write(out_path, samples, SAMPLE_RATE, subtype="PCM_16")
        creaky = f", creaky region(s) {spec.creaky_regions}" if spec.creaky_regions else ""
        print(f"  {out_path.name:24s} {spec.label}{creaky}")

    print(
        "\nThese are synthetic (source-filter synthesis), not real speech. "
        "Swap in real recordings once the parallel recording effort produces "
        "them."
    )


if __name__ == "__main__":
    main()
