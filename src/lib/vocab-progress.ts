import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { VocabCollection } from "@/lib/content";
import { hasEnoughAudio } from "@/components/vocab/audio";

export type VocabActivity = "see" | "hear" | "match" | "say";
export type ActivityProgress = {
  times_completed: number;
  best_score: number | null;
  total: number | null;
  last_completed_at: string;
};

/** The activities a collection actually offers (Hear it needs verified audio). */
export function availableActivities(collection: VocabCollection): VocabActivity[] {
  return hasEnoughAudio(collection.words) ? ["see", "hear", "match", "say"] : ["see", "match", "say"];
}

/**
 * The signed-in user's finished activities, by collection (migration 0009,
 * own rows via RLS). Returns an empty map on any error — e.g. before the
 * migration is applied — so pages still render, just without progress.
 */
export async function getVocabProgress(
  supabase: SupabaseClient<Database>
): Promise<Map<string, Map<VocabActivity, ActivityProgress>>> {
  const out = new Map<string, Map<VocabActivity, ActivityProgress>>();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return out;
  const { data, error } = await supabase
    .from("vocab_activity_progress")
    .select("collection_id, activity, times_completed, best_score, total, last_completed_at")
    .eq("user_id", user.id);
  if (error || !data) return out;
  for (const row of data) {
    if (!out.has(row.collection_id)) out.set(row.collection_id, new Map());
    out.get(row.collection_id)!.set(row.activity, row);
  }
  return out;
}

/** Activities finished in a collection, and when the latest one was. */
export function collectionStatus(collection: VocabCollection, progress: Map<VocabActivity, ActivityProgress> | undefined) {
  const available = availableActivities(collection);
  const done = available.filter((a) => progress?.has(a));
  const last = [...(progress?.values() ?? [])].map((p) => p.last_completed_at).sort().at(-1) ?? null;
  return { available, done, total: available.length, last, finished: done.length === available.length };
}

/** The first activity not done yet, in the order the collection page lists them. */
export function nextActivity(collection: VocabCollection, progress: Map<VocabActivity, ActivityProgress> | undefined) {
  return availableActivities(collection).find((a) => !progress?.has(a)) ?? null;
}
