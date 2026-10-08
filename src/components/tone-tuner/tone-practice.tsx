"use client";

import { useRef, useState } from "react";
import { Loader2, Mic, Square, Volume2, RotateCcw, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { Button } from "@/components/ui/button";
import { TONE_LABELS, type Syllable, type ToneKey } from "@/lib/content";
import { cn } from "@/lib/utils";
import { PitchChart } from "./pitch-chart";
import { ToneWord } from "./tone-word";
import type { AnalyzeResult, ModelOpinion } from "./types";

const MAX_RECORD_MS = { single: 6_000, multi: 10_000 };

type Phase =
  | { kind: "idle" }
  | { kind: "recording" }
  | { kind: "analyzing"; startedAt: number }
  | { kind: "result"; result: AnalyzeResult }
  | { kind: "error"; message: string };

function toneName(tone: string | null | undefined) {
  return tone && tone in TONE_LABELS ? TONE_LABELS[tone as ToneKey].vi : "?";
}

function heardTones(op: ModelOpinion) {
  if (op.status !== "ok") return "";
  return op.syllables
    .filter((s) => s.heard)
    .map((s) => toneName(s.heard_tone))
    .join(" + ");
}

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

export function TonePractice({
  text,
  meaning,
  syllables,
  referenceAudio,
  onNext,
  nextLabel = "Next word",
}: {
  text: string;
  meaning: string;
  syllables: Syllable[];
  referenceAudio?: string | null;
  onNext?: () => void;
  nextLabel?: string;
}) {
  // Callers key this component by word, so a new word always starts fresh.
  const recorder = useAudioRecorder();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [slow, setSlow] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyze = async (blob: Blob) => {
    setPhase({ kind: "analyzing", startedAt: Date.now() });
    // "First try can be slow" hint once analysis passes 5 s (cold engine).
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
    const limit = syllables.length > 1 ? MAX_RECORD_MS.multi : MAX_RECORD_MS.single;
    stopTimer.current = setTimeout(stop, limit);
  };

  const reset = () => {
    recorder.reset();
    setPhase({ kind: "idle" });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <ToneWord syllables={syllables} />
        <p className="text-sm text-muted-foreground">{meaning}</p>
        {referenceAudio && (
          <Button variant="outline" size="sm" onClick={() => new Audio(referenceAudio).play()}>
            <Volume2 /> Hear it
          </Button>
        )}
      </div>

      {(phase.kind === "idle" || phase.kind === "recording") && (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={phase.kind === "recording" ? stop : start}
            className={cn(
              "flex size-20 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-transform active:scale-95",
              phase.kind === "recording" ? "animate-pulse bg-destructive" : "bg-primary"
            )}
            aria-label={phase.kind === "recording" ? "Stop recording" : "Start recording"}
          >
            {phase.kind === "recording" ? <Square className="size-7" /> : <Mic className="size-8" />}
          </button>
          <p className="text-sm text-muted-foreground">
            {phase.kind === "recording" ? "Recording… tap to stop" : "Tap and say it"}
          </p>
        </div>
      )}

      {phase.kind === "analyzing" && (
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p>Listening…</p>
          {slow && <p className="max-w-xs text-center text-xs">The engine is waking up — the first try can take up to a minute.</p>}
        </div>
      )}

      {phase.kind === "error" && (
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <AlertTriangle className="size-6 text-accent-orange" />
          <p className="text-sm">{phase.message}</p>
          <Button onClick={reset} variant="outline">
            <RotateCcw /> Try again
          </Button>
        </div>
      )}

      {phase.kind === "result" && <Result result={phase.result} />}

      {phase.kind === "result" && (
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={reset}>
            <RotateCcw /> Try again
          </Button>
          {onNext && (
            <Button size="lg" onClick={onNext}>
              {nextLabel} <ArrowRight />
            </Button>
          )}
        </div>
      )}

      <p className="max-w-sm text-center text-[11px] leading-snug text-muted-foreground">
        Beta. Recordings are analyzed by our tone engine and NVIDIA&apos;s speech-recognition service; Thanh Việt
        doesn&apos;t store them.
      </p>
    </div>
  );
}

function Result({ result }: { result: AnalyzeResult }) {
  const { summary, phowhisper, parakeet, acoustic } = result;
  const agreed = summary.agreement === "both_match" || summary.agreement === "both_tone_mismatch_same" || summary.agreement === "both_same_other_word";
  const matched = summary.agreement === "both_match";

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-4">
        {agreed && summary.heard_as ? (
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm text-muted-foreground">Heard as</p>
            <p className="text-3xl font-semibold">{summary.heard_as}</p>
            <p className="text-xs text-muted-foreground">{heardTones(phowhisper.status === "ok" ? phowhisper : parakeet)}</p>
            <p className={cn("mt-2 flex items-center gap-1.5 text-sm font-medium", matched ? "text-success" : "text-accent-orange")}>
              {matched ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
              {matched
                ? "Both models heard the word you were aiming for."
                : summary.agreement === "both_tone_mismatch_same"
                  ? "Both models heard a different tone."
                  : "Both models heard a different word."}
            </p>
          </div>
        ) : summary.agreement === "unclear" ? (
          <p className="text-center text-sm">Neither model could make out a word. Try again a little louder and closer.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm font-medium">
              {summary.agreement === "partial_unavailable" ? "Only one model answered:" : "The two models heard different things:"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Opinion name="PhoWhisper" op={phowhisper} />
              <Opinion name="Parakeet" op={parakeet} />
            </div>
          </div>
        )}
      </div>

      {acoustic.status === "ok" ? (
        <PitchChart acoustic={acoustic} />
      ) : acoustic.status === "skipped_multisyllable" ? (
        <p className="text-center text-xs text-muted-foreground">Pitch line for phrases is coming — model feedback only for now.</p>
      ) : acoustic.status === "invalid_audio" ? (
        <p className="text-center text-xs text-muted-foreground">
          The recording was too quiet, too short or distorted to draw a pitch line.
        </p>
      ) : null}

      <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        Tone score: calibrating — needs native reference data
      </p>
    </div>
  );
}

function Opinion({ name, op }: { name: string; op: ModelOpinion }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-md bg-muted/60 p-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{name}</p>
      {op.status === "ok" ? (
        <>
          <p className="text-xl font-semibold">{op.transcript.replace(/[.,?!]+$/g, "").trim() || "—"}</p>
          <p className="text-xs text-muted-foreground">{heardTones(op)}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">unavailable</p>
      )}
    </div>
  );
}
