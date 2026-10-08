import { ENGINE_SECRET_HEADER, engineConfig, requireApprovedUser } from "@/lib/tone-engine";

/**
 * Called when the Tone Tuner page opens: starts the engine's GPU container
 * so the learner's first recording doesn't pay the ~40 s cold start. The
 * engine's /warm returns as soon as the container is scheduled.
 */
export async function POST() {
  const auth = await requireApprovedUser();
  if ("error" in auth) return auth.error;

  const engine = engineConfig();
  if (!engine) return Response.json({ error: "engine_not_configured" }, { status: 503 });

  try {
    await fetch(`${engine.url}/warm`, {
      method: "POST",
      headers: { [ENGINE_SECRET_HEADER]: engine.secret },
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    // Best effort — the analyze call still works, just slower when cold.
  }
  return Response.json({ status: "warming" }, { status: 202 });
}
