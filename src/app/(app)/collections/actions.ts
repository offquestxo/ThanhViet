"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@/lib/content";

import type { VocabActivity } from "@/lib/vocab-progress";

export type { VocabActivity };
const ACTIVITIES: readonly VocabActivity[] = ["see", "hear", "match", "say"];

/**
 * Called once when a picture-collection activity reaches its end screen.
 * Own-row upsert through the caller's session (RLS, migration 0009): counts
 * completions and keeps the best See it / Hear it score. Never throws to
 * the UI — progress is a nice-to-have, finishing the activity isn't. Returns
 * whether the database confirmed the write, so the end screen can say when
 * progress wasn't saved instead of failing silently.
 */
export async function recordActivityCompletion(
  collectionId: string,
  activity: VocabActivity,
  score?: number,
  total?: number
): Promise<{ saved: boolean }> {
  if (!getCollection(collectionId) || !ACTIVITIES.includes(activity)) return { saved: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { saved: false };

  const { data: prior } = await supabase
    .from("vocab_activity_progress")
    .select("times_completed, best_score")
    .eq("user_id", user.id)
    .eq("collection_id", collectionId)
    .eq("activity", activity)
    .maybeSingle();

  const hasScore = typeof score === "number" && typeof total === "number" && total > 0;
  const best = hasScore ? Math.max(score, prior?.best_score ?? 0) : (prior?.best_score ?? null);
  const { error, count } = await supabase.from("vocab_activity_progress").upsert(
    {
      user_id: user.id,
      collection_id: collectionId,
      activity,
      times_completed: (prior?.times_completed ?? 0) + 1,
      best_score: best,
      total: hasScore ? total : null,
      last_completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,collection_id,activity", count: "exact" }
  );
  if (error || count !== 1) {
    console.warn("vocab progress not saved", { code: error?.code, message: error?.message, count });
    return { saved: false };
  }
  revalidatePath("/collections");
  revalidatePath(`/collections/${collectionId}`);
  return { saved: true };
}
