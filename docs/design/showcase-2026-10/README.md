# Showcase redesign — design reference (Oct 15, 2026)

Static design comps for the showcase redesign. Each `.dc.html` is one phone screen (390×844).
They are **reference only**: read the inline styles for exact colors, sizes, radii and layout,
then rebuild in the app's real components and design tokens. Do not ship these files.

| File | Screen |
|---|---|
| Welcome.dc.html | Welcome / sign-in entry |
| Main.dc.html | Home |
| Collections.dc.html | Collections |
| Lesson.dc.html | Lesson — See it (correct-answer state + feedback sheet) |
| Finished.dc.html | Activity finished |
| ToneTuner.dc.html | Tone Tuner result (pitch-line version, superseded by the tuner below) |
| TunerListening.dc.html | Tone Tuner — tuner dial, listening |
| TunerInTune.dc.html | Tone Tuner — tuner dial, in tune |

Image references use canvas upload URLs (`/_blob/...`). Map them to the app's real files:

| `/_blob/` id | Real file |
|---|---|
| 1db64f428ae191848ee31faf1a29f1a3 | public/mascot/sparrow-waving.png |
| e55ece5b6d16f72959344b356f318f0c | public/mascot/sparrow-happy.png |
| ed03105929c0aa9ea3ff5d56c30db040 | public/mascot/sparrow-thinking.png |
| 4c1def2ada3deb0d8393312785727802 | public/mascot/sparrow-main.png |
| faba6318de713770bdab3285a602c95c | public/mascot/sparrow-surprised.png |
| cef56e24e9330f823a4d76b4d381b8d9 | public/vocab/food/tao.svg |
| c0c788bac6c8e01941792dcf9faea284 | public/vocab/food/le.svg |
| 9e23672cc55578db5d7dd251b8b6504d | public/vocab/food/cam.svg |
| 0f30b9d115b27c4635bd169611e788b1 | public/vocab/food/dau-tay.svg |

Numbers on the comps (5-day streak, 8 of 11 words, 11/12, +110 XP) are sample data. Use real data.

## Tone colors

| Tone | Light | Dark mode / on the jade tuner panel | Meaning |
|---|---|---|---|
| ngang | `#5f6b66` | `#dfe6e2` | level |
| huyền | `#2b6cb0` | `#9cc6f2` | falling |
| sắc | `#d9731f` (big glyphs only; `#9a4b0c` for small text) | `#f5b26e` | rising |
| hỏi | `#7a52c7` | `#c9b1f2` | dipping |
| ngã | `#c4473b` | `#f29a8f` | broken rising |
| nặng | `#14524a` | `#9fe0c4` | heavy, cut off |

Color is never the only signal. Wherever the tone matters, its name is shown as text too.

## Tone Tuner copy (draft, needs a native speaker's check)

This is what's in `src/lib/tone-coaching.ts`.

| Tone | Dial left | Dial right | Tip |
|---|---|---|---|
| ngang | Drifting down | Drifting up | Keep it flat and steady, like a held note. |
| huyền | Fall more | Too high | Start mid, then let it sink gently. |
| sắc | Rise more | Too much | Start low, then glide up, like asking "huh?" |
| hỏi | Dip more | Too much | Dip down, then come back up a little. |
| ngã | Add the break | Too much | Rise, catch in the middle, rise again. |
| nặng | Drop and cut | Too long | Drop low and cut it short. |
