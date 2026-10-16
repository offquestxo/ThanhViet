"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useWarmEngine } from "@/hooks/use-warm-engine";
import { TunerPractice } from "@/components/tone-tuner/tuner-practice";
import { ToneWord } from "@/components/tone/tone-word";
import { ReportProblem } from "@/components/feedback/report-problem";
import type { ToneTunerItem } from "@/lib/content";
import { TONE_INFO, TONE_ORDER, textTones, type ToneKey } from "@/lib/tones";
import { cn } from "@/lib/utils";

const SELECTED: Record<ToneKey, string> = {
  ngang: "border-tone-ngang bg-tone-ngang-soft text-tone-ngang-text",
  huyen: "border-tone-huyen bg-tone-huyen-soft text-tone-huyen-text",
  sac: "border-tone-sac bg-tone-sac-soft text-tone-sac-text",
  hoi: "border-tone-hoi bg-tone-hoi-soft text-tone-hoi-text",
  nga: "border-tone-nga bg-tone-nga-soft text-tone-nga-text",
  nang: "border-tone-nang bg-tone-nang-soft text-tone-nang-text",
};
const IDLE: Record<ToneKey, string> = {
  ngang: "text-tone-ngang",
  huyen: "text-tone-huyen",
  sac: "text-tone-sac",
  hoi: "text-tone-hoi",
  nga: "text-tone-nga",
  nang: "text-tone-nang",
};

/**
 * Tone Tuner, tuner style. Like a guitar tuner's string selector: pick a
 * tone (a à á ả ã ạ) and practise that tone's words; phrases live under a
 * separate "Phrases" switch because the dial (one tone) doesn't apply to
 * them. `?tone=` preselects a tone, `?item=` a specific word or phrase.
 */
export function ToneTunerClient({
  items,
  initialId,
  initialTone,
}: {
  items: ToneTunerItem[];
  initialId?: string;
  initialTone?: ToneKey;
}) {
  useWarmEngine();

  const words = useMemo(() => items.filter((i) => i.kind === "word"), [items]);
  const phrases = useMemo(() => items.filter((i) => i.kind !== "word"), [items]);
  const initialItem = items.find((i) => i.id === initialId);

  const [mode, setMode] = useState<"words" | "phrases">(initialItem && initialItem.kind !== "word" ? "phrases" : "words");
  const [tone, setTone] = useState<ToneKey>(
    initialItem?.kind === "word" ? textTones(initialItem.text)[0] : (initialTone ?? "sac")
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(initialItem?.id);

  const list = mode === "phrases" ? phrases : words.filter((w) => textTones(w.text)[0] === tone);
  const current = list.find((i) => i.id === selectedId) ?? list[0];
  const index = current ? list.indexOf(current) : 0;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2.5">
      <header className="flex h-11 items-center justify-between">
        <Link href="/dashboard" aria-label="Back" className="-ml-2.5 flex size-11 items-center justify-center rounded-full">
          <ChevronLeft className="size-6" strokeWidth={2.2} />
        </Link>
        <h1 className="text-[17px] font-bold">Tone Tuner</h1>
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-gold-pill px-2.5 py-1 text-xs font-bold text-gold-text">BETA</span>
          <ReportProblem className="-mr-2 md:hidden" />
        </div>
      </header>

      <div className="-mb-1 flex items-end justify-between">
        <p className="text-[13px] font-semibold text-muted-foreground">{mode === "words" ? "Tone" : "Phrases"}</p>
        <div className="flex rounded-full bg-muted p-1 text-[13px] font-semibold" role="tablist" aria-label="Practise">
          {(["words", "phrases"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setSelectedId(undefined);
              }}
              className={cn("h-8 rounded-full px-3.5 capitalize", mode === m ? "bg-card shadow-sm" : "text-muted-foreground")}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "words" ? (
        <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Tone">
          {TONE_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tone === t}
              aria-label={`${TONE_INFO[t].vi}, ${TONE_INFO[t].en}`}
              onClick={() => {
                setTone(t);
                setSelectedId(undefined);
              }}
              className={cn(
                "h-12 rounded-[14px] text-[22px] transition-colors",
                tone === t ? cn("border-[2.5px] font-extrabold", SELECTED[t]) : cn("border-[1.5px] border-border bg-card font-bold", IDLE[t])
              )}
              lang="vi"
            >
              {TONE_INFO[t].letter}
            </button>
          ))}
        </div>
      ) : null}

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="listbox" aria-label="Word">
        {list.map((i) => (
          <button
            key={i.id}
            type="button"
            role="option"
            aria-selected={i.id === current?.id}
            onClick={() => setSelectedId(i.id)}
            className={cn(
              "flex h-9 shrink-0 items-center rounded-full border px-3.5",
              i.id === current?.id ? "border-foreground/70 bg-card" : "border-border bg-card/60"
            )}
          >
            <ToneWord text={i.text} className="text-[15px] font-semibold" />
          </button>
        ))}
      </div>

      {current && (
        <TunerPractice
          key={current.id}
          text={current.text}
          meaning={current.meaning}
          referenceAudio={current.reference_audio}
          onNext={() => setSelectedId(list[(index + 1) % list.length].id)}
          nextLabel={mode === "words" ? "Next word" : "Next phrase"}
        />
      )}
    </div>
  );
}
