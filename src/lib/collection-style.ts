import { COLLECTION_TITLES, type VocabCollection } from "./content";
import { textTones, type ToneKey } from "./tones";

/**
 * Each collection's soft tint on the Collections screen (showcase design),
 * borrowed from a tone color so the page doubles as a tone-color key.
 * Classes are spelled out in full so Tailwind can see them.
 */
const TINT: Record<string, ToneKey> = { food: "sac", colors: "nga", body: "huyen", clothing: "hoi", home: "nang" };

const CLASSES: Record<ToneKey, { bg: string; bar: string; track: string; text: string }> = {
  ngang: { bg: "bg-tone-ngang-soft", bar: "bg-tone-ngang", track: "bg-tone-ngang/15", text: "text-tone-ngang-text" },
  huyen: { bg: "bg-tone-huyen-soft", bar: "bg-tone-huyen", track: "bg-tone-huyen/15", text: "text-tone-huyen-text" },
  sac: { bg: "bg-tone-sac-soft", bar: "bg-tone-sac", track: "bg-tone-sac/15", text: "text-tone-sac-text" },
  hoi: { bg: "bg-tone-hoi-soft", bar: "bg-tone-hoi", track: "bg-tone-hoi/15", text: "text-tone-hoi-text" },
  nga: { bg: "bg-tone-nga-soft", bar: "bg-tone-nga", track: "bg-tone-nga/15", text: "text-tone-nga-text" },
  nang: { bg: "bg-tone-nang-soft", bar: "bg-tone-nang", track: "bg-tone-nang/15", text: "text-tone-nang-text" },
};

export function collectionTint(collection: VocabCollection) {
  const tone = TINT[collection.id] ?? "ngang";
  return { tone, ...CLASSES[tone] };
}

/** A short sample word for the card: the first one-syllable word in the tint's tone, else the shortest word. */
export function sampleWord(collection: VocabCollection, tone: ToneKey) {
  const singles = collection.words.filter((w) => textTones(w.text).length === 1);
  return (
    singles.find((w) => textTones(w.text)[0] === tone) ??
    singles[0] ??
    [...collection.words].sort((a, b) => a.text.length - b.text.length)[0]
  );
}

/** Short card titles (the comps' "Quần áo · Clothing"); full titles stay on the collection page. */
const SHORT: Record<string, { vi: string; en: string }> = {
  body: { vi: "Cơ thể", en: "Body" },
  clothing: { vi: "Quần áo", en: "Clothing" },
  home: { vi: "Nhà cửa", en: "Home" },
};

export function shortTitle(collection: VocabCollection) {
  return SHORT[collection.id] ?? { vi: COLLECTION_TITLES[collection.id] ?? collection.title, en: collection.title };
}
