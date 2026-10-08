import type { VocabWord } from "@/lib/content";

/** "Hear it" needs at least four words with verified audio (four choices). */
export function hasEnoughAudio(words: VocabWord[]) {
  return words.filter((w) => w.audio).length >= 4;
}

/** True while any word's audio is still the placeholder computer voice. */
export function usesComputerVoice(words: VocabWord[]) {
  return words.some((w) => w.audio && w.audio_source === "google-tts");
}
