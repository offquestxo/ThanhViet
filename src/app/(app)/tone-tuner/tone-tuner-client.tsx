"use client";

import { useMemo, useState } from "react";
import { useWarmEngine } from "@/hooks/use-warm-engine";
import { TonePractice } from "@/components/tone-tuner/tone-practice";
import { TONE_LABELS, type ToneKey, type ToneTunerItem } from "@/lib/content";
import { cn } from "@/lib/utils";

const TONE_ORDER: ToneKey[] = ["ngang", "huyen", "sac", "hoi", "nga", "nang"];

export function ToneTunerClient({ items, initialId }: { items: ToneTunerItem[]; initialId?: string }) {
  const [selectedId, setSelectedId] = useState(initialId ?? items[0]?.id);
  const selectedIndex = Math.max(0, items.findIndex((i) => i.id === selectedId));
  const selected = items[selectedIndex];

  useWarmEngine();

  const groups = useMemo(() => {
    const words = items.filter((i) => i.kind === "word");
    return [
      ...TONE_ORDER.map((tone) => ({
        key: tone,
        label: `${TONE_LABELS[tone].vi} · ${TONE_LABELS[tone].en}`,
        items: words.filter((w) => w.syllables[0].tone === tone),
      })),
      { key: "phrases", label: "Phrases", items: items.filter((i) => i.kind !== "word") },
    ].filter((g) => g.items.length > 0);
  }, [items]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          Tone Tuner <span className="align-middle text-xs font-medium text-accent-orange">beta</span>
        </h1>
      </div>

      <section className="rounded-[var(--radius-card)] border border-border bg-card px-4 py-8 shadow-[var(--shadow-card)]">
        {selected && (
          <TonePractice
            key={selected.id}
            text={selected.text}
            meaning={selected.meaning}
            syllables={selected.syllables}
            referenceAudio={selected.reference_audio}
            onNext={() => setSelectedId(items[(selectedIndex + 1) % items.length].id)}
          />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">Pick a word or phrase</h2>
        {groups.map((g) => (
          <div key={g.key} className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">{g.label}</p>
            <div className="flex flex-wrap gap-2">
              {g.items.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(i.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    i.id === selected?.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  {i.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
