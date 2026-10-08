# test-audio — sources, licenses, attribution

Openly licensed Vietnamese speech used **only** to test the tone engine. The
audio files in this folder are gitignored: never commit them, bundle them in
the app, or upload them anywhere other than the project's own Modal engine
(which forwards clips to NVIDIA's hosted Parakeet API for transcription —
approved for these licenses on 2026-10-07). This file is the only tracked
item here.

No jw.org audio is used anywhere in this pipeline: jw.org's Terms of Use bar
"uploading such materials to a server for use by a software application".

Exact files, sizes and source URLs: `manifest-commons.json`,
`manifest-fleurs.json` (both gitignored alongside the audio).

## A. Lingua Libre (via Wikimedia Commons) — `lingualibre/`

- **License:** CC0 1.0 (public domain dedication). No attribution required;
  credited here anyway.
- **Speakers:** "Jessica Nguyen" (recorded by Pamputt) — 19 words;
  "Penn Zero MSSJ" — 17 words.
- **Format:** isolated single words, ~1 s each, 48 kHz 16-bit mono WAV.
- **Source pages:** `https://commons.wikimedia.org/wiki/File:LL-Q9199_(vie)-<speaker>-<word>.wav`
- **Accent:** unknown — not confirmed Northern.

## B. Wikimedia Commons "Vi-hanoi" recordings — `vi-hanoi/`

- **License:** CC BY-SA 3.0 / GFDL (multi-licensed by the author).
- **Attribution:** recorded by Trần Thế Trung
  ([User:Tttrung](https://commons.wikimedia.org/wiki/User:Tttrung)) with
  Audacity on Linux.
- **Format:** isolated words, Ogg Vorbis (lossy), 25 files.
- **Source pages:** `https://commons.wikimedia.org/wiki/File:Vi-hanoi-<…>.ogg`
- **Accent:** labelled Hanoi by the uploader — still needs native-speaker
  confirmation.

## C. Google FLEURS, Vietnamese dev split — `fleurs/`

- **License:** CC BY 4.0.
- **Attribution:** Conneau et al., "FLEURS: Few-shot Learning Evaluation of
  Universal Representations of Speech" (2022), Google. Dataset:
  https://huggingface.co/datasets/google/fleurs
- **Format:** read sentences, 16 kHz 32-bit float mono WAV, 4 clips (male
  readers; FLEURS publishes no speaker IDs). Reference transcripts in
  `manifest-fleurs.json`.
- **Retrieved:** streamed from
  `https://huggingface.co/datasets/google/fleurs/resolve/main/data/vi_vn/audio/dev.tar.gz`;
  only the 4 approved clips were written to disk.
- **Accent:** unknown — not confirmed Northern.

Only audio a native speaker confirms as Northern may later count toward
reference data.
