"use server";

import { createClient } from "@/lib/supabase/server";

export type FeedbackResult = { ok: true } | { ok: false; error: string };

/**
 * "Report a problem" (beta). Saves a short note, the page path and a short
 * device description — never audio, screenshots or the full user-agent.
 * Runs through the caller's own session: RLS (migration 0008) only lets a
 * signed-in user insert a row with their own user_id.
 */
export async function submitFeedback(note: string, pagePath: string, device: string): Promise<FeedbackResult> {
  const text = note.trim();
  if (!text) return { ok: false, error: "Write a short note first." };
  if (text.length > 1000) return { ok: false, error: "Keep it under 1000 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has ended — sign in again to send a report." };

  const { error } = await supabase.from("beta_feedback").insert({
    user_id: user.id,
    note: text,
    page_path: pagePath.slice(0, 300) || "/",
    device: device.slice(0, 200) || null,
  });
  if (error) {
    console.warn("beta feedback insert failed", { code: error.code, message: error.message });
    return { ok: false, error: "Couldn't send that — try again in a moment." };
  }
  return { ok: true };
}
