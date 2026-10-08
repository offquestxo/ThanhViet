"use client";

import { useMemo, useState } from "react";
import type { VocabWord } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Finished } from "./finished";
import { shuffle, subSeed } from "./quiz";
import { WordPicture } from "./word-picture";

const PAIRS_PER_ROUND = 6;

/** Match pictures to words: tap a picture, then its word. */
export function MatchGame({
  words,
  seed,
  backHref,
  collectionId,
}: {
  words: VocabWord[];
  seed: number;
  backHref: string;
  collectionId: string;
}) {
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
        backHref={backHref}
        onRestart={() => { setRound(0); setMatched(new Set()); }}
        completion={{ collectionId, activity: "match" }}
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
      <p className="text-center text-sm text-muted-foreground">
        Tap a picture, then its word. Round {round + 1} / {rounds.length}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {pictures.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={matched.has(p.id)}
            onClick={() => setSelectedPicture(p.id)}
            className={cn(
              "rounded-xl border-2 bg-card p-2 transition",
              matched.has(p.id) ? "border-success opacity-40" : selectedPicture === p.id ? "border-primary" : "border-border"
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
              "rounded-xl border-2 bg-card px-3 py-3 text-lg font-medium transition",
              matched.has(w.id) && "border-success opacity-40",
              wrong === w.id && "border-destructive bg-destructive/10",
              !matched.has(w.id) && wrong !== w.id && "border-border hover:bg-muted"
            )}
          >
            {w.text}
          </button>
        ))}
      </div>
    </div>
  );
}
