"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Volume2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sparrow } from "@/components/mascot/sparrow";
import type { VocabWord } from "@/lib/content";
import { cn } from "@/lib/utils";
import { choicesFor, shuffle, subSeed } from "./quiz";
import { WordPicture } from "./word-picture";
import { Finished } from "./finished";

/**
 * "See it" (picture → pick the word) and "Hear it" (audio → pick the
 * picture). One round per word, four choices, immediate feedback.
 */
export function ChoiceQuiz({
  mode,
  words,
  seed,
  backHref,
}: {
  mode: "see" | "hear";
  words: VocabWord[];
  seed: number;
  backHref: string;
}) {
  const rounds = useMemo(
    () => shuffle(words, seed).map((w, i) => ({ answer: w, choices: choicesFor(w, words, 4, subSeed(seed, i + 3)), key: `${w.id}-${i}` })),
    [words, seed]
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  if (index >= rounds.length) {
    return <Finished score={score} total={rounds.length} backHref={backHref} onRestart={() => { setIndex(0); setScore(0); setPicked(null); }} />;
  }
  const round = rounds[index];
  const play = () => round.answer.audio && new Audio(round.answer.audio).play();

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    if (id === round.answer.id) setScore((s) => s + 1);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
      <p className="text-xs text-muted-foreground">
        {index + 1} / {rounds.length}
      </p>

      {mode === "see" ? (
        <div className="w-40">
          <WordPicture word={round.answer} />
        </div>
      ) : (
        <button
          type="button"
          onClick={play}
          className="flex size-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95"
          aria-label="Play the word"
        >
          <Volume2 className="size-10" />
        </button>
      )}

      <div className={cn("grid w-full gap-3", mode === "see" ? "grid-cols-1" : "grid-cols-2")}>
        {round.choices.map((c) => {
          const isAnswer = c.id === round.answer.id;
          const state = !picked ? "idle" : isAnswer ? "right" : c.id === picked ? "wrong" : "idle";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => choose(c.id)}
              className={cn(
                "relative flex items-center justify-center gap-2 rounded-xl border-2 bg-card p-3 text-lg font-medium transition-colors",
                state === "idle" && "border-border hover:bg-muted",
                state === "right" && "border-success bg-success/10",
                state === "wrong" && "border-destructive bg-destructive/10"
              )}
            >
              {mode === "see" ? (
                c.text
              ) : (
                // Fixed-size box: a swatch is an empty div with no intrinsic width.
                <div className="w-full max-w-28">
                  <WordPicture word={c} />
                </div>
              )}
              {state === "right" && (
                <CheckCircle2 className={cn("size-5 shrink-0 text-success", mode === "hear" && "absolute right-2 top-2")} />
              )}
              {state === "wrong" && (
                <XCircle className={cn("size-5 shrink-0 text-destructive", mode === "hear" && "absolute right-2 top-2")} />
              )}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="flex flex-col items-center gap-3">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparrow key={`${round.key}-${picked}`} mood={picked === round.answer.id ? "happy" : "surprised"} size={36} />
            {round.answer.text} — {round.answer.meaning}
          </p>
          <Button size="lg" onClick={() => { setPicked(null); setIndex((i) => i + 1); }}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
