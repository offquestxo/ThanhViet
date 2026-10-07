# Thanh Việt — Tone Tuner Pilot Recording Brief

> **SUPERSEDED.** This six-word, 2–3-take brief has been replaced by the 44-item word list (35 single words + 9 multi-syllable expressions/sentences) and its 4-speaker recording worksheet (`tone-tuner-word-list.xlsx`, `tone-tuner-worksheet-4-speakers.xlsx`, kept outside the repo). Use the worksheet's recording order and setup notes, not this document. Kept for history only.

**Purpose:** Collect a small set of clean, real reference recordings from native Northern (Hanoi) Vietnamese speakers, to validate the acoustic-analysis approach before designing the scoring model. This is a research pilot, not production content — these recordings will not be shown to learners directly, and no scoring exists yet or is being built from this pilot. These six words are different lexical items (different consonants, vowels, and syllable shapes), not controlled minimal pairs — so this pilot validates that the pipeline works correctly on real speech, not yet that it isolates tone specifically. A controlled tone corpus (same syllable produced across multiple tones) comes later, once this pipeline-validation stage succeeds.

---

## Who we need

**3–4 native speakers of Northern (Hanoi-accent) Vietnamese.** Ideally a mix of voice types (not all the same gender/age/vocal range) — this helps confirm the pipeline works across natural voice variation, not just one voice.

No professional recording experience needed. Clear, natural speech is exactly what's wanted — not theatrical or exaggerated pronunciation.

---

## The six words

One word per Vietnamese tone. These happen to be the tone names themselves — a natural, well-known set that each demonstrates its own tone.

| # | Word | Tone | Notes |
|---|------|------|-------|
| 1 | **ngang** | Level (ngang) | Flat, mid pitch |
| 2 | **huyền** | Falling (huyền) | Low, gently falling |
| 3 | **sắc** | Rising (sắc) | Sharp rise |
| 4 | **hỏi** | Dipping-rising (hỏi) | Dips then rises |
| 5 | **ngã** | Broken/glottalized rising (ngã) | Rises with a creaky "break" in the middle — **this word matters most**, say it naturally, don't try to add or remove the break artificially |
| 6 | **nặng** | Heavy/glottalized (nặng) | Short, low, creaky/constricted — **this word matters most** for the same reason as ngã |

For **ngã** and **nặng** specifically: please just say them the way you naturally would — don't over-emphasize or soften the creaky quality. Natural pronunciation is exactly what the pipeline needs to be tested against.

---

## Recording setup

- **Environment:** Any reasonably quiet room. A closet, small carpeted room, or anywhere without echo/background noise works well — you don't need a professional studio.
- **Device:** A smartphone voice recorder app is fine. If a better external mic is available, even better, but not required.
- **Distance:** Hold the phone/mic roughly 6 inches (15 cm) from your mouth — close enough for a clear signal, far enough to avoid breath pops.
- **Format:** WAV preferred if your recording app supports it (44.1kHz or higher, mono is fine). If your app only does other formats (e.g., M4A from a phone voice memo), that's okay too — just let us know what format it saved as.

---

## What to record

For **each of the 6 words**, please record **2–3 separate, clean takes** — say the word, pause briefly (1–2 seconds), say it again, pause, say it a third time if you can. Natural speaking voice and pace, as if teaching someone the word — not rushed, not overly slow or exaggerated.

If you make a mistake or laugh mid-word, that's fine — just pause and try that take again; you don't need to edit anything out, just record a few more clean attempts.

**Total per speaker:** 6 words × 2–3 takes = roughly 12–18 short recordings (or one continuous recording working through the list, whichever is easier for you).

---

## File naming (if recording separate files)

`[your initials]_[word]_[take number].wav`

Example: `hl_nga_1.wav`, `hl_nga_2.wav`, `hl_nang_1.wav`, etc.

If it's easier to record one continuous take through the whole list with pauses between words, that's completely fine too — just let us know the order you said them in.

---

## Before you record

Please confirm you're comfortable with your voice being used for this internal app-development purpose (analyzing pronunciation patterns to build a learning tool for the community) — these recordings are for development/testing use, not public distribution.

---

## Getting the files back

Send the recordings however's easiest — AirDrop, a shared folder, email, or a messaging app. Once received, they'll be organized into the project's `tone-analysis/reference-audio/` folder for the pipeline to be tested against.

Thank you — this small set of real recordings is the key piece needed to move from "the pipeline works on synthetic test data" to "the pipeline works on real human voices," which is the actual bar the Tone Tuner needs to clear before it ever reaches a learner.
