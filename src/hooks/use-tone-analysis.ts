"use client";

import { useRef, useState } from "react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import type { AnalyzeResult } from "@/components/tone-tuner/types";

const MAX_RECORD_MS = { single: 6_000, multi: 10_000 };

export type TonePhase =
  | { kind: "idle" }
  | { kind: "recording" }
  | { kind: "analyzing" }
  | { kind: "result"; result: AnalyzeResult }
  | { kind: "error"; message: string };

function errorMessage(status: number, body: { error?: string }) {
  switch (body.error) {
    case "signed_out":
    case "not_approved":
      return "Your session has ended — please sign in again.";
    case "bad_audio":
      return "Couldn't read that recording. Try again, a little closer to the mic.";
    case "engine_not_configured":
    case "engine_unreachable":
    case "engine_error":
      return "The tone engine isn't responding right now. Try again in a minute.";
    case "too_large":
      return "That recording was too long. Keep it to the word or phrase itself.";
    default:
      return status >= 500 ? "The tone engine isn't responding right now. Try again in a minute." : "Something went wrong — try again.";
  }
}

/**
 * Record one attempt at `text` and send it to the tone engine
 * (/api/tone/analyze). State moves through idle → recording → analyzing →
 * result | error, driven by handlers (no effects). `slow` turns on once an
 * analysis passes 5 s — the engine waking from cold. Callers key the
 * component by target, so a new target always starts fresh.
 */
export function useToneAnalysis(text: string, syllableCount: number) {
  const recorder = useAudioRecorder();
  const [phase, setPhase] = useState<TonePhase>({ kind: "idle" });
  const [slow, setSlow] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyze = async (blob: Blob) => {
    setPhase({ kind: "analyzing" });
    setSlow(false);
    slowTimer.current = setTimeout(() => setSlow(true), 5_000);
    const ext = blob.type.includes("mp4") || blob.type.includes("aac") ? "m4a" : "webm";
    const form = new FormData();
    form.append("audio", blob, `recording.${ext}`);
    form.append("target_text", text);
    try {
      const res = await fetch("/api/tone/analyze", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setPhase({ kind: "error", message: errorMessage(res.status, body) });
      const result = body as AnalyzeResult;
      if (result.phowhisper.status !== "ok" && result.parakeet.status !== "ok") {
        return setPhase({ kind: "error", message: "The tone engine isn't responding right now. Try again in a minute." });
      }
      setPhase({ kind: "result", result });
    } catch {
      setPhase({ kind: "error", message: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      setSlow(false);
    }
  };

  const stop = async () => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    const blob = await recorder.stopRecording();
    if (blob && blob.size > 0) await analyze(blob);
    else setPhase({ kind: "error", message: "Nothing was recorded — try again." });
  };

  const start = async () => {
    recorder.reset();
    const started = await recorder.startRecording();
    if (!started.ok) return setPhase({ kind: "error", message: started.message });
    setPhase({ kind: "recording" });
    stopTimer.current = setTimeout(stop, syllableCount > 1 ? MAX_RECORD_MS.multi : MAX_RECORD_MS.single);
  };

  const reset = () => {
    recorder.reset();
    setPhase({ kind: "idle" });
  };

  return { phase, slow, start, stop, reset, micBlocked: recorder.errorKind === "permission_denied" };
}
