import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Day-level daily-activity streak (PRD Section 7, "daily practice
 * streak"): bumps at most once per UTC calendar day, no matter how much
 * practice happens that day. One shared streak for every kind of practice
 * — lessons and the Tone Tuner (decision: Tone Tuner practice counts toward
 * the streak, awards no points).
 *
 * Runs through the caller's own RLS-scoped session: user_streaks already has
 * own-row insert/update policies, so no admin client is needed.
 */
export async function bumpDailyStreak(
  supabase: SupabaseClient<Database>,
  userId: string,
  now: Date = new Date()
): Promise<number> {
  const today = now.toISOString().slice(0, 10);
  const { data: streak, error: readError } = await supabase
    .from("user_streaks")
    .select("current_streak, longest_streak, last_activity_date")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  let currentStreak = streak?.current_streak ?? 0;
  let longestStreak = streak?.longest_streak ?? 0;

  if (streak?.last_activity_date !== today) {
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    currentStreak = streak?.last_activity_date === yesterdayStr ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);

    const { error: writeError } = await supabase.from("user_streaks").upsert(
      {
        user_id: userId,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
      },
      { onConflict: "user_id" }
    );
    if (writeError) throw new Error(writeError.message);
  }

  return currentStreak;
}

/**
 * The streak to display: only "live" if the last active day is today or
 * yesterday (UTC) — otherwise it has lapsed and shows 0, even though the
 * stored current_streak is only reset on the next practice.
 */
export function liveStreakDays(
  row: { current_streak: number; last_activity_date: string | null } | null,
  now: Date = new Date()
): number {
  if (!row?.last_activity_date) return 0;
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const live = row.last_activity_date === today || row.last_activity_date === yesterday.toISOString().slice(0, 10);
  return live ? row.current_streak : 0;
}
