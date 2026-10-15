/**
 * Vietnamese tone parsing — a TypeScript port of syllable_tone() and
 * strip_tone() in tone-analysis/src/tone_analysis/phowhisper_service.py, so
 * the app colors exactly the tones the engine scores. Same rule: decompose
 * to NFD and look for one of the five tone marks; vowel-quality marks
 * (â, ă, ơ, ư — circumflex, breve, horn) and đ are not tones.
 */

export type ToneKey = "ngang" | "huyen" | "sac" | "hoi" | "nga" | "nang";

export const TONE_ORDER: readonly ToneKey[] = ["ngang", "huyen", "sac", "hoi", "nga", "nang"];

const TONE_MARKS: Record<string, ToneKey> = {
  "̀": "huyen", // grave       à
  "́": "sac", // acute       á
  "̉": "hoi", // hook above  ả
  "̃": "nga", // tilde       ã
  "̣": "nang", // dot below   ạ
};

export const TONE_INFO: Record<ToneKey, { vi: string; en: string; letter: string }> = {
  ngang: { vi: "ngang", en: "level", letter: "a" },
  huyen: { vi: "huyền", en: "falling", letter: "à" },
  sac: { vi: "sắc", en: "rising", letter: "á" },
  hoi: { vi: "hỏi", en: "dipping", letter: "ả" },
  nga: { vi: "ngã", en: "broken rising", letter: "ã" },
  nang: { vi: "nặng", en: "heavy", letter: "ạ" },
};

/** Tone of a single syllable; "ngang" when it carries no tone mark. */
export function syllableTone(syllable: string): ToneKey {
  for (const ch of syllable.normalize("NFD")) {
    const tone = TONE_MARKS[ch];
    if (tone) return tone;
  }
  return "ngang";
}

/** Remove only the tone mark, keeping vowel-quality marks and đ. */
export function stripTone(syllable: string): string {
  return [...syllable.normalize("NFD")].filter((ch) => !TONE_MARKS[ch]).join("").normalize("NFC");
}

/**
 * Index (in code points of the NFC string) of the letter carrying the tone
 * mark, or -1 for ngang. Works for either mark placement (khoá / khóa).
 */
export function toneMarkIndex(syllable: string): number {
  const chars = [...syllable.normalize("NFC")];
  return chars.findIndex((ch) => [...ch.normalize("NFD")].some((c) => TONE_MARKS[c]));
}

export type ToneToken = { text: string; tone: ToneKey | null; markIndex: number };

/**
 * Split text into syllables and the separators between them (spaces,
 * hyphens, punctuation), keeping everything so the text renders exactly as
 * written. Hyphenated loanwords split per syllable (cà-vạt = cà + vạt), like
 * the engine's own cleaning. Separators carry tone null.
 */
export function toneTokens(text: string): ToneToken[] {
  const out: ToneToken[] = [];
  for (const part of text.normalize("NFC").split(/([^\p{L}\p{N}]+)/u)) {
    if (!part) continue;
    if (/^[^\p{L}\p{N}]+$/u.test(part)) out.push({ text: part, tone: null, markIndex: -1 });
    else out.push({ text: part, tone: syllableTone(part), markIndex: toneMarkIndex(part) });
  }
  return out;
}

/** Tones of each syllable in a word or phrase, in order. */
export function textTones(text: string): ToneKey[] {
  return toneTokens(text).flatMap((t) => (t.tone ? [t.tone] : []));
}
