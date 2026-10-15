"use client";

import { useMemo, useState } from "react";
import type { VocabWord } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Finished } from "./finished";
import { ToneWord } from "@/components/tone/tone-word";
import { shuffle, subSeed } from "./quiz";
import { WordPicture } from "./word-picture";
import { LessonTopBar } from "./lesson-chrome";
import type { ActivityContext } from "./activity-context";

const PAIRS_PER_ROUND = 6;

/** Match pictures to words: tap a picture, then its word. */
export function MatchGame({ words, seed, ctx }: { words: VocabWord[]; seed: number; ctx: ActivityContext }) {
  const rounds = useMemo(() => {
    const order = shuffle(words, seed);
    const out: VocabWord[][] = [];
    for (let i = 0; i < order.length; i += PAIRS_PER_ROUND) out.push(order.slice(i, i + PAIRS_PER_ROUND));
    // Avoid a lonely 1-pair final round: fold it into the previous one.
    if (out.length > 1 && out[out.length - 1].length < 2) out[out.length - 2].push(...out.pop()!);
    return out.map((r, i) => ({ pictures: r, labels: shuffle(r, subSeed(seed, i + 1)) }));
  }, [words, seed]);

  const [round, setRound] = useState(0);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedPicture, setSelectedPicture] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);

  if (round >= rounds.length) {
    return (
      <Finished
        activity="match"
        collectionTitle={ctx.collectionTitle}
        wordsCount={words.length}
        streakDays={ctx.streakDays}
        next={ctx.next}
        backHref={ctx.backHref}
        onRestart={() => { setRound(0); setMatched(new Set()); }}
        completion={{ collectionId: ctx.collectionId, activity: "match" }}
      />
    );
  }
  const { pictures, labels } = rounds[round];

  const pickLabel = (id: string) => {
    if (!selectedPicture || matched.has(id)) return;
    if (id === selectedPicture) {
      const next = new Set(matched).add(id);
      setMatched(next);
      setSelectedPicture(null);
      if (pictures.every((p) => next.has(p.id))) {
        setTimeout(() => { setRound((r) => r + 1); setMatched(new Set()); }, 600);
      }
    } else {
      setWrong(id);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <LessonTopBar
        closeHref={ctx.backHref}
        current={rounds.slice(0, round).reduce((n, r) => n + r.pictures.length, 0) + matched.size}
        total={words.length}
      />
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-bold tracking-[0.08em] text-primary uppercase">Match</p>
        <p className="text-[17px] text-muted-foreground">Tap a picture, then its word.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {pictures.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={matched.has(p.id)}
            onClick={() => setSelectedPicture(p.id)}
            className={cn(
              "rounded-[20px] bg-card p-2.5 transition",
              matched.has(p.id)
                ? "border-[3px] border-primary bg-success-soft opacity-50"
                : selectedPicture === p.id
                  ? "border-[3px] border-primary"
                  : "border-2 border-border"
            )}
            aria-label={matched.has(p.id) ? `${p.meaning}, matched` : p.meaning}
          >
            <WordPicture word={p} />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {labels.map((w) => (
          <button
            key={w.id}
            type="button"
            disabled={matched.has(w.id)}
            onClick={() => pickLabel(w.id)}
            className={cn(
              "flex min-h-14 items-center justify-center rounded-[18px] bg-card px-3 py-3 transition",
              matched.has(w.id) && "border-[3px] border-primary bg-success-soft opacity-50",
              wrong === w.id && "border-[3px] border-tone-nga bg-danger-soft",
              !matched.has(w.id) && wrong !== w.id && "border-2 border-border active:bg-muted"
            )}
          >
            <ToneWord text={w.text} className="text-xl font-bold" />
          </button>
        ))}
      </div>
    </div>
  );
}
