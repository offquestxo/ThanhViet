# Picture-vocabulary image sources

## Food — `public/vocab/food/*.svg`

Twemoji graphics, © Twitter, Inc. and other contributors, licensed under
**CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/). Retrieved
unmodified from the maintained fork, pinned to release 17.0.3:
`https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.3/assets/svg/<codepoint>.svg`
(project: https://github.com/jdecked/twemoji).

| File | Emoji | Codepoint | Note |
|---|---|---|---|
| trai-cay.svg | 🍇 | 1f347 | grapes, standing in for "fruits" |
| dau.svg | 🫘 | 1fad8 | beans |
| le.svg | 🍐 | 1f350 | pear |
| tao.svg | 🍎 | 1f34e | red apple |
| rau-cu.svg | 🥕 | 1f955 | carrot, standing in for "vegetables" |
| dau-tay.svg | 🍓 | 1f353 | strawberry |
| cam.svg | 🍊 | 1f34a | tangerine/orange |
| bap-cai.svg | 🥬 | 1f96c | leafy green, closest available to "cabbage" |
| xa-lach.svg | 🥗 | 1f957 | green salad, standing in for "lettuce" |
| hanh-tay.svg | 🧅 | 1f9c5 | onion |
| lua-gao.svg | 🌾 | 1f33e | sheaf of rice |

## Colors

Generated colour swatches (CSS), no image files and no third-party art.

No images from the JW Language app are used anywhere.

## Audio — `public/audio/vocab/<collection>/*.wav`

**Placeholder computer voice**, until the native speaker's recordings
replace it. Generated with Google Cloud Text-to-Speech, voice
`vi-VN-Chirp3-HD-Leda` (chosen as the most Northern-sounding candidate by
an acoustic check of hỏi / ngã / nặng; awaiting a native speaker's
confirmation), 24 kHz mono. Each clip was synthesized up to five times and
the first take that both ASR models (PhoWhisper and Parakeet) heard as the
target word was kept — all 23 passed. Script:
`tone-analysis/scripts/generate_tts_audio.py`. Each word is marked
`"audio_source": "google-tts"` in `content/vocab/<collection>.json`, and
the collection page says the audio is a computer voice.

Native recordings go through `tone-analysis/scripts/split_collection_recording.py`,
which overwrites these files and sets `"audio_source": "native"` — only
with the speaker's consent to publish.
