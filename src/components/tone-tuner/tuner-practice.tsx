"use client";

import { Check, ChevronDown, Mic, RotateCcw, Volume2 } from "lucide-react";
import { useToneAnalysis } from "@/hooks/use-tone-analysis";
import { Sparrow, type SparrowMood } from "@/components/mascot/sparrow";
import { ToneWord } from "@/components/tone/tone-word";
import { TONE_INFO, textTones, type ToneKey } from "@/lib/tones";
import { TONE_COACHING } from "@/lib/tone-coaching";
import { cn } from "@/lib/utils";
import { PitchChart } from "./pitch-chart";
import { TunerDial, type DialState } from "./tuner-dial";
import { settledDeflection, toneDeflection } from "@/lib/pitch";
import type { AnalyzeResult, ModelOpinion } from "./types";

const AGREED = new Set(["both_match", "both_tone_mismatch_same", "both_same_other_word"]);

const PANEL_TONE_TEXT: Record<ToneKey, string> = {
  ngang: "text-panel-tone-ngang",
  huyen: "text-panel-tone-huyen",
  sac: "text-panel-tone-sac",
  hoi: "text-panel-tone-hoi",
  nga: "text-panel-tone-nga",
  nang: "text-panel-tone-nang",
};

function heardTones(op: ModelOpinion) {
  if (op.status !== "ok") return "";
  return op.syllables
    .filter((s) => s.heard)
    .map((s) => (s.heard_tone && s.heard_tone in TONE_INFO ? TONE_INFO[s.heard_tone as ToneKey].vi : "?"))
    .join(" + ");
}

const clean = (t: string) => t.replace(/[.,?!]+$/g, "").trim();

/**
 * One Tone Tuner attempt in the tuner style (showcase design): the dark jade
 * panel with the dial (single syllables) or the tone names (phrases), the
 * sparrow and a status line underneath, and the record / again / next
 * controls. "In tune" = both speech models heard the target syllable with
 * the target tone (`both_match`, 34/35 right on real speech) — a hint, not a
 * score; the score itself stays "calibrating" until native data exists.
 */
export function TunerPractice({
  text,
  meaning,
  referenceAudio,
  onNext,
  nextLabel = "Next word",
}: {
  text: string;
  meaning: string;
  referenceAudio?: string | null;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const tones = textTones(text);
  const single = tones.length === 1;
  const tone = tones[0] ?? "ngang";
  const { phase, slow, start, stop, reset, micBlocked, liveNeedle } = useToneAnalysis(text, tones.length, tone);

  const result = phase.kind === "result" ? phase.result : null;
  const agreement = result?.summary.agreement;
  const inTune = agreement === "both_match";
  const dialState: DialState =
    phase.kind === "recording" ? "listening" : phase.kind === "analyzing" ? "checking" : inTune ? "in-tune" : phase.kind === "idle" ? "idle" : "rest";

  const [left, right] = TONE_COACHING[tone].dial;

  // After analysis (not in tune): settle the needle from the engine's pitch
  // line — a hint, not a score — always outside the green zone.
  let settled: number | null = null;
  if (result && !inTune && single && result.acoustic.status === "ok" && result.acoustic.pitch_contour?.length) {
    const trace = result.acoustic.pitch_contour.map((f) => ({ tMs: f.t_ms, hz: f.f0_hz }));
    const raw = toneDeflection(tone, trace, (result.acoustic.voice_breaks?.length ?? 0) > 0);
    if (raw !== null) settled = settledDeflection(raw);
  }
  const needle = phase.kind === "recording" ? liveNeedle : settled;
  const side = (v: number) => (v < -0.17 ? left : v > 0.17 ? right : "In tune");
  const dialLabel = inTune
    ? "Tuner needle in the green centre zone: in tune"
    : phase.kind === "recording"
      ? needle === null
        ? "Tuner needle waiting for your voice"
        : `Tuner needle following your voice: ${side(needle)}`
      : needle !== null
        ? `Tuner needle: ${side(needle)}`
        : "Tuner needle at rest";

  return (
    <div className="flex w-full flex-col gap-2.5">
      {/* The jade panel */}
      <div
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-[28px] bg-panel px-4 pt-3 pb-3 text-panel-foreground transition-shadow duration-500",
          inTune && "shadow-[0_0_0_4px_rgba(63,209,154,0.25)]"
        )}
      >
        <div className="flex w-full items-center justify-between gap-2" aria-live="polite">
          <PanelStatus phase={phase.kind} inTune={inTune} agreement={agreement} />
          <div className={cn("text-sm font-semibold", single ? PANEL_TONE_TEXT[tone] : "text-panel-muted")}>
            {single ? `${capitalize(TONE_INFO[tone].vi)} · ${TONE_INFO[tone].en}` : tones.map((t) => TONE_INFO[t].vi).join(" + ")}
          </div>
        </div>

        {single ? (
          <>
            <TunerDial tone={tone} state={dialState} label={dialLabel} needle={needle} />
            <div className="-mt-2.5 flex w-full justify-between text-[13px] font-semibold text-panel-faint">
              <span>{left}</span>
              <span className="text-in-tune">In tune</span>
              <span>{right}</span>
            </div>
          </>
        ) : (
          <div className="h-4" />
        )}

        <ToneWord
          text={text}
          surface="panel"
          className={cn("mt-0.5 text-center leading-[1.1] tracking-[-0.03em]", single ? "text-[52px]" : text.length > 14 ? "text-4xl" : "text-5xl")}
        />
        <div className="text-sm text-panel-muted">{meaning}</div>
        {referenceAudio && (
          <button
            type="button"
            onClick={() => new Audio(referenceAudio).play()}
            className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-panel-foreground"
          >
            <Volume2 className="size-4" /> Hear it
          </button>
        )}
      </div>

      {/* Sparrow + what's happening */}
      <Feedback phase={phase} slow={slow} tone={tone} target={text} micBlocked={micBlocked} />

      {result && <PitchDetail result={result} />}

      {/* Controls */}
      {phase.kind === "idle" || phase.kind === "recording" ? (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={phase.kind === "recording" ? stop : start}
            aria-label={phase.kind === "recording" ? "Stop recording" : "Start recording"}
            className={cn(
              "flex size-[72px] items-center justify-center rounded-full text-hero-foreground transition-transform active:scale-95",
              phase.kind === "recording"
                ? "bg-tone-nga shadow-[0_0_0_10px_rgba(196,71,59,0.15),0_10px_24px_rgba(196,71,59,0.3)] dark:bg-[#c4473b]"
                : "bg-hero shadow-[0_0_0_10px_rgba(14,127,102,0.12),0_10px_24px_rgba(14,127,102,0.3)]"
            )}
          >
            {phase.kind === "recording" ? <span className="size-[26px] rounded-[6px] bg-background" /> : <Mic className="size-9" strokeWidth={2.2} />}
          </button>
          <p className="text-sm font-semibold text-muted-foreground">{phase.kind === "recording" ? "Tap to stop" : "Tap and say it"}</p>
        </div>
      ) : phase.kind === "analyzing" ? null : (
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={reset}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[18px] bg-muted text-[17px] font-bold"
          >
            <RotateCcw className="size-4" /> Again
          </button>
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="flex h-14 flex-[1.4] items-center justify-center rounded-[18px] bg-primary text-[17px] font-bold text-primary-foreground shadow-[0_8px_20px_rgba(14,127,102,0.28)]"
            >
              {nextLabel}
            </button>
          )}
        </div>
      )}

      <p className="text-center text-[11px] leading-snug text-muted-foreground">
        Beta. Recordings are analyzed by our tone engine and NVIDIA&apos;s speech-recognition service; Thanh Việt
        doesn&apos;t store them. Tone score: calibrating.
      </p>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function PanelStatus({ phase, inTune, agreement }: { phase: string; inTune: boolean; agreement?: string }) {
  if (inTune)
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-in-tune px-3 py-1.5 text-[13px] font-extrabold tracking-[0.06em] text-in-tune-foreground">
        <Check className="size-3.5" strokeWidth={3.2} /> IN TUNE
      </span>
    );
  const text =
    phase === "recording"
      ? "Listening…"
      : phase === "analyzing"
        ? "Checking…"
        : phase === "result"
          ? agreement === "unclear"
            ? "Couldn't hear a word"
            : "Not quite yet"
          : phase === "error"
            ? "Something went wrong"
            : "Ready";
  return (
    <span className="flex items-center gap-2 text-sm font-semibold text-panel-muted">
      {phase === "recording" && <span className="size-2.5 animate-pulse rounded-full bg-[#f2786b] shadow-[0_0_0_4px_rgba(242,120,107,0.25)]" />}
      {text}
    </span>
  );
}

function SparrowRow({ mood, tone = "plain", title, children }: { mood: SparrowMood; tone?: "plain" | "good" | "warn" | "bad"; title?: string; children?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[18px]",
        tone === "plain" ? "px-1" : "px-3 py-2.5",
        tone === "good" && "bg-success-soft",
        tone === "warn" && "bg-gold-soft",
        tone === "bad" && "bg-danger-soft"
      )}
    >
      <Sparrow mood={mood} size={tone === "plain" ? 44 : 48} className={tone === "plain" ? "bg-muted" : "bg-card"} />
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        {title && (
          <p
            className={cn(
              "text-base font-bold",
              tone === "good" && "text-success-strong",
              tone === "warn" && "text-gold-text",
              tone === "bad" && "text-danger-strong"
            )}
          >
            {title}
          </p>
        )}
        <div className={cn("text-[15px]", tone === "plain" ? "text-foreground/80" : "text-foreground/75")}>{children}</div>
      </div>
    </div>
  );
}

function Feedback({
  phase,
  slow,
  tone,
  target,
  micBlocked,
}: {
  phase: ReturnType<typeof useToneAnalysis>["phase"];
  slow: boolean;
  tone: ToneKey;
  target: string;
  micBlocked: boolean;
}) {
  if (phase.kind === "idle" || phase.kind === "recording") {
    return <SparrowRow mood="thinking">{TONE_COACHING[tone].tip}</SparrowRow>;
  }
  if (phase.kind === "analyzing") {
    return slow ? (
      <SparrowRow mood="sleeping">The engine is waking up — the first try can take up to a minute.</SparrowRow>
    ) : (
      <SparrowRow mood="thinking">Listening back…</SparrowRow>
    );
  }
  if (phase.kind === "error") {
    return (
      <SparrowRow mood="worried" tone="bad" title={micBlocked ? "Microphone is blocked" : "That didn't work"}>
        {phase.message}
      </SparrowRow>
    );
  }
  const { summary, phowhisper, parakeet } = phase.result;
  const heard = summary.heard_as ? clean(summary.heard_as) : null;
  if (summary.agreement === "both_match" && heard) {
    return (
      <SparrowRow mood="happy" tone="good" title={`Heard as “${heard}”`}>
        Both listeners agree.
      </SparrowRow>
    );
  }
  if (AGREED.has(summary.agreement) && heard) {
    const why =
      summary.agreement === "both_tone_mismatch_same"
        ? `Both heard ${heardTones(phowhisper.status === "ok" ? phowhisper : parakeet)} instead of ${textTones(target).map((t) => TONE_INFO[t].vi).join(" + ")}.`
        : "Both heard a different word.";
    return (
      <SparrowRow mood="surprised" tone="warn" title={`Heard as “${heard}”`}>
        {why}
      </SparrowRow>
    );
  }
  if (summary.agreement === "unclear") {
    return (
      <SparrowRow mood="surprised" tone="warn" title="Couldn't make out a word">
        Try again a little louder and closer.
      </SparrowRow>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-[18px] bg-gold-soft px-3 py-2.5">
      <SparrowRow mood="surprised" title={summary.agreement === "partial_unavailable" ? "Only one listener answered" : "The listeners heard different things"} />
      <div className="grid grid-cols-2 gap-2">
        <Opinion name="PhoWhisper" op={phowhisper} />
        <Opinion name="Parakeet" op={parakeet} />
      </div>
    </div>
  );
}

function Opinion({ name, op }: { name: string; op: ModelOpinion }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-card p-2.5 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{name}</p>
      {op.status === "ok" ? (
        <>
          <ToneWord text={clean(op.transcript) || "—"} className="text-xl" />
          <p className="text-xs text-muted-foreground">{heardTones(op)}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">unavailable</p>
      )}
    </div>
  );
}

/** The pitch line with creak shading, folded away under the dial. */
function PitchDetail({ result }: { result: AnalyzeResult }) {
  const a = result.acoustic;
  if (a.status !== "ok" && a.status !== "invalid_audio") return null;
  return (
    <details className="group rounded-[18px] border border-border bg-card px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        Pitch detail
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3">
        {a.status === "ok" ? (
          <PitchChart acoustic={a} />
        ) : (
          <p className="text-xs text-muted-foreground">The recording was too quiet, too short or distorted to draw a pitch line.</p>
        )}
      </div>
    </details>
  );
}
