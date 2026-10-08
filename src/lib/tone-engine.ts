import { createClient } from "@/lib/supabase/server";

/**
 * Server-side access to the tone engine (Modal). The engine URL and shared
 * secret live only in server env vars — never NEXT_PUBLIC_, never sent to
 * the browser. Import this module from server code (route handlers) only. The browser only ever talks to this app's /api/tone/* routes.
 */
export function engineConfig(): { url: string; secret: string } | null {
  const url = process.env.MODAL_TONE_ENGINE_URL?.replace(/\/+$/, "");
  const secret = process.env.TONE_ENGINE_SHARED_SECRET;
  return url && secret ? { url, secret } : null;
}

export const ENGINE_SECRET_HEADER = "X-Tone-Engine-Secret";

/**
 * The proxy already redirects signed-out and not-yet-approved users, but an
 * API route must never rely on that alone — it re-checks here and answers
 * with JSON, failing closed on a missing or errored profile.
 */
export async function requireApprovedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: Response.json({ error: "signed_out" }, { status: 401 }) } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("approval_status")
    .eq("id", user.id)
    .single();
  if (profile?.approval_status !== "approved") {
    return { error: Response.json({ error: "not_approved" }, { status: 403 }) } as const;
  }
  return { supabase, user } as const;
}
