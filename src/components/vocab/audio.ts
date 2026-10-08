import type { VocabWord } from "@/lib/content";

/** "Hear it" needs at least four words with verified audio (four choices). */
export function hasEnoughAudio(words: VocabWord[]) {
  return words.filter((w) => w.audio).length >= 4;
}
