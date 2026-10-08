import { PRESET_TARGETS } from "@/lib/content";
import { bumpDailyStreak } from "@/lib/streak";
import { ENGINE_SECRET_HEADER, engineConfig, requireApprovedUser } from "@/lib/tone-engine";

// A cold engine start (GPU container + model load) measured ~40 s; leave
// headroom so the first recording after an idle spell is slow, not failed.
export const maxDuration = 120;

// Under Vercel's 4.5 MB request-body limit. A few seconds of browser audio
// is tens of KB, so this only stops accidents.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireApprovedUser();
  if ("error" in auth) return auth.error;

  const engine = engineConfig();
  if (!engine) return Response.json({ error: "engine_not_configured" }, { status: 503 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const audio = form.get("audio");
  const target = String(form.get("target_text") ?? "").trim();

  if (!(audio instanceof File) || audio.size === 0) {
    return Response.json({ error: "no_audio" }, { status: 400 });
  }
  if (audio.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "too_large" }, { status: 413 });
  }
  // Preset content only — never free-typed text (TAD 4.3, Decision 6).
  if (!PRESET_TARGETS.has(target)) {
    return Response.json({ error: "unknown_target" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("audio", audio, audio.name || "recording");
  upstream.append("target_text", target);

  let res: Response;
  try {
    res = await fetch(`${engine.url}/analyze`, {
      method: "POST",
      headers: { [ENGINE_SECRET_HEADER]: engine.secret },
      body: upstream,
      signal: AbortSignal.timeout(110_000),
    });
  } catch {
    return Response.json({ error: "engine_unreachable" }, { status: 502 });
  }

  if (res.status === 413 || res.status === 422) {
    // Engine-side validation (unreadable audio, recording too long).
    const body = await res.json().catch(() => ({}));
    return Response.json({ error: "bad_audio", detail: body?.detail ?? null }, { status: 422 });
  }
  if (!res.ok) {
    return Response.json({ error: "engine_error" }, { status: 502 });
  }

  const result = await res.json();

  // Practice counts toward the daily streak; no points (decision 8). A
  // streak write failing must never cost the learner their result.
  try {
    await bumpDailyStreak(auth.supabase, auth.user.id);
  } catch {
    /* non-fatal */
  }

  return Response.json({
    target_text: result.target_text,
    target_syllables: result.target_syllables,
    acoustic: result.acoustic,
    phowhisper: result.phowhisper,
    parakeet: result.parakeet,
    summary: result.summary,
  });
}
