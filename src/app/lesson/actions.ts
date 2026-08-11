"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Fixed award per completed chunk (Section 10: "production > recognition"
// isn't yet reflected as a variable weight — this session's Review step is
// the first thing that actually writes points, so it starts flat. Revisit
// once Speak/Produce have real pass/fail signals worth weighting on.)
const POINTS_PER_CHUNK = 10;

/**
 * Runs on the Review step (Section 5.4, step 6) — the one point in the
 * lesson flow that actually persists anything. Everything here runs
 * through the caller's own RLS-scoped session (not the admin client):
 * every table touched already has "own row" insert/update policies from
 * migrations 0001–0003, so there's no need to bypass RLS for a user
 * writing their own progress/points/streak.
 *
 * `noticeCorrect` threads through the Notice step's (non-gating) guess so
 * recognition_accuracy reflects something real instead of being a
 * hardcoded 1 — see the Notice step in lesson-flow.tsx.
 */
export async function completeChunk(chunkId: string, noticeCorrect: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  // --- SRS update (HLR-simplified — see migration 0003's flag comment:
  // interval_days IS the current half-life estimate; next_review_at falls
  // out of it directly since recall probability hits 50% at t = half-life.
  // ease_factor is a per-item growth multiplier, not a trained HLR weight —
  // real HLR needs a logistic-regression model over real interaction
  // volume, which is Section 1d's deferred "Layer 2.")
  const { data: existingProgress, error: readProgressError } = await supabase
    .from("user_chunk_progress")
    .select("interval_days, ease_factor, consecutive_correct")
    .eq("user_id", user.id)
    .eq("chunk_id", chunkId)
    .maybeSingle();
  if (readProgressError) throw new Error(readProgressError.message);

  const easeFactor = existingProgress?.ease_factor ?? 2.5;
  const consecutiveCorrect = (existingProgress?.consecutive_correct ?? 0) + 1;
  const nextIntervalDays = existingProgress
    ? Math.max(existingProgress.interval_days, 1) * easeFactor
    : 1;
  const now = new Date();
  const nextReviewAt = new Date(
    now.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000
  );

  const { error: progressError } = await supabase
    .from("user_chunk_progress")
    .upsert(
      {
        user_id: user.id,
        chunk_id: chunkId,
        mastery_level: Math.min(consecutiveCorrect, 5),
        recognition_accuracy: noticeCorrect ? 1 : 0,
        last_practiced_at: now.toISOString(),
        interval_days: nextIntervalDays,
        ease_factor: easeFactor,
        next_review_at: nextReviewAt.toISOString(),
        consecutive_correct: consecutiveCorrect,
      },
      { onConflict: "user_id,chunk_id" }
    );
  if (progressError) throw new Error(progressError.message);

  // --- Points: read-then-write, not an atomic increment. Fine at this
  // group's scale (20-50 users, not many concurrent completions of the
  // *same* chunk by the *same* user); revisit with a Postgres RPC if that
  // stops being true.
  const { data: profile, error: readProfileError } = await supabase
    .from("profiles")
    .select("total_points")
    .eq("id", user.id)
    .single();
  if (readProfileError) throw new Error(readProfileError.message);

  const newTotalPoints = (profile?.total_points ?? 0) + POINTS_PER_CHUNK;
  const { error: pointsError } = await supabase
    .from("profiles")
    .update({ total_points: newTotalPoints })
    .eq("id", user.id);
  if (pointsError) throw new Error(pointsError.message);

  // --- Streak: day-level (Section 10 — "daily practice streak"), so this
  // only bumps once per calendar day no matter how many chunks get
  // completed that day. UTC date, matching the DB's `date` column type.
  const today = now.toISOString().slice(0, 10);
  const { data: streak, error: readStreakError } = await supabase
    .from("user_streaks")
    .select("current_streak, longest_streak, last_activity_date")
    .eq("user_id", user.id)
    .maybeSingle();
  if (readStreakError) throw new Error(readStreakError.message);

  let currentStreak = streak?.current_streak ?? 0;
  let longestStreak = streak?.longest_streak ?? 0;

  if (streak?.last_activity_date !== today) {
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    currentStreak =
      streak?.last_activity_date === yesterdayStr ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);

    const { error: streakError } = await supabase.from("user_streaks").upsert(
      {
        user_id: user.id,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
      },
      { onConflict: "user_id" }
    );
    if (streakError) throw new Error(streakError.message);
  }

  revalidatePath("/dashboard");

  return {
    pointsAwarded: POINTS_PER_CHUNK,
    totalPoints: newTotalPoints,
    currentStreak,
  };
}
