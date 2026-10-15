import { toneTunerItems, vocabCollections, type VocabCollection } from "./content";
import { TONE_ORDER, textTones, type ToneKey } from "./tones";
import { collectionStatus, type ActivityProgress, type VocabActivity } from "./vocab-progress";

/** Today's date (UTC, YYYY-MM-DD) — the same day boundary the streak uses. */
export function todayUtc(now: Date = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** One tone per day, cycling through all six, with a practice word for it. */
export function toneOfTheDay(now: Date = new Date()): { tone: ToneKey; word: string } {
  const day = Math.floor(now.getTime() / 86_400_000);
  const tone = TONE_ORDER[day % TONE_ORDER.length];
  const words = toneTunerItems.filter((i) => i.kind === "word" && textTones(i.text)[0] === tone);
  return { tone, word: words[0]?.text ?? "ma" };
}

/**
 * The collection for Home's "Continue" card: the one practised most recently
 * that still has activities left; otherwise the first one not started;
 * otherwise (everything done) the most recently practised.
 */
export function pickContinueCollection(progress: Map<string, Map<VocabActivity, ActivityProgress>>): {
  collection: VocabCollection;
  status: ReturnType<typeof collectionStatus>;
  label: "Continue" | "Start" | "Practise again";
} | null {
  const rows = vocabCollections.map((c) => ({ collection: c, status: collectionStatus(c, progress.get(c.id)) }));
  const byRecent = (a: (typeof rows)[number], b: (typeof rows)[number]) => (b.status.last ?? "").localeCompare(a.status.last ?? "");
  const inProgress = rows.filter((r) => r.status.done.length > 0 && !r.status.finished).sort(byRecent)[0];
  if (inProgress) return { ...inProgress, label: "Continue" };
  const fresh = rows.find((r) => r.status.done.length === 0);
  if (fresh) return { ...fresh, label: "Start" };
  const recent = rows.sort(byRecent)[0];
  return recent ? { ...recent, label: "Practise again" } : null;
}
