"use client";

import { useMemo, useState } from "react";
import { Check, Volume2, X } from "lucide-react";
import { ToneWord, ToneNames } from "@/components/tone/tone-word";
import type { VocabWord } from "@/lib/content";
import { cn } from "@/lib/utils";
import { choicesFor, shuffle, subSeed } from "./quiz";
import { WordPicture } from "./word-picture";
import { Finished } from "./finished";
import { FeedbackSheet, LessonTopBar } from "./lesson-chrome";
import type { ActivityContext } from "./activity-context";

const play = (src: string | null) => {
  if (src) void new Audio(src).play().catch(() => {});
};

/**
 * "See it" (read the word → pick its picture) and "Hear it" (hear the word →
 * pick its picture), in the showcase lesson layout: progress bar, big
 * prompt, 2×2 pictures, bottom feedback sheet. One round per word.
 */
export function ChoiceQuiz({
  mode,
  words,
  seed,
  ctx,
}: {
  mode: "see" | "hear";
  words: VocabWord[];
  seed: number;
  ctx: ActivityContext;
}) {
  const rounds = useMemo(
    () => shuffle(words, seed).map((w, i) => ({ answer: w, choices: choicesFor(w, words, 4, subSeed(seed, i + 3)), key: `${w.id}-${i}` })),
    [words, seed]
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<VocabWord[]>([]);

  if (index >= rounds.length) {
    return (
      <Finished
        activity={mode}
        collectionTitle={ctx.collectionTitle}
        score={score}
        total={rounds.length}
        wordsCount={rounds.length}
        missed={missed[0] ?? null}
        streakDays={ctx.streakDays}
        next={ctx.next}
        backHref={ctx.backHref}
        onRestart={() => {
          setIndex(0);
          setScore(0);
          setPicked(null);
          setMissed([]);
        }}
        completion={{ collectionId: ctx.collectionId, activity: mode }}
      />
    );
  }

  const round = rounds[index];
  const correct = picked === round.answer.id;

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    if (id === round.answer.id) setScore((s) => s + 1);
    else setMissed((m) => [...m, round.answer]);
    // Hear the word with the answer, so sound and meaning arrive together.
    if (mode === "see") play(round.answer.audio);
  };

  const advance = () => {
    setPicked(null);
    setIndex((i) => i + 1);
    // The Continue tap is a user gesture, so iOS lets the next word play.
    if (mode === "hear" && index + 1 < rounds.length) play(rounds[index + 1].answer.audio);
  };

  return (
    <div className={cn("mx-auto flex w-full max-w-md flex-col gap-5", picked && "pb-48")}>
      <LessonTopBar closeHref={ctx.backHref} current={index + (picked ? 1 : 0)} total={rounds.length} />

      <div className="flex flex-col gap-2.5">
        <p className="text-[13px] font-bold tracking-[0.08em] text-primary uppercase">{mode === "see" ? "See it" : "Hear it"}</p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-[17px] text-muted-foreground">{mode === "see" ? "Which one is" : picked ? "You heard" : "Which one did you hear?"}</p>
            {(mode === "see" || picked) && (
              <ToneWord
                text={round.answer.text}
                className={cn(
                  "leading-[1.05] tracking-[-0.03em]",
                  round.answer.text.length > 9 ? "text-[34px]" : round.answer.text.length > 6 ? "text-[42px]" : "text-[52px]"
                )}
              />
            )}
            {(mode === "see" || picked) && <ToneNames text={round.answer.text} />}
          </div>
          {round.answer.audio && (
            <button
              type="button"
              onClick={() => play(round.answer.audio)}
              aria-label={`Play ${mode === "see" ? round.answer.text : "the word"}`}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-hero text-hero-foreground shadow-[0_8px_20px_rgba(14,127,102,0.28)] active:scale-95",
                mode === "hear" && !picked ? "size-20" : "size-16"
              )}
            >
              <Volume2 className={mode === "hear" && !picked ? "size-9" : "size-7"} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {round.choices.map((c) => {
          const isAnswer = c.id === round.answer.id;
          const state = !picked ? "idle" : isAnswer ? "right" : c.id === picked ? "wrong" : "dim";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => choose(c.id)}
              disabled={!!picked}
              aria-label={picked ? `${c.meaning}${isAnswer ? ", correct" : c.id === picked ? ", your answer" : ""}` : c.meaning}
              className={cn(
                "relative flex h-[150px] items-center justify-center rounded-[22px] bg-card p-0 transition-colors",
                state === "idle" && "border-2 border-border active:bg-muted",
                state === "right" && "border-[3px] border-primary bg-success-soft",
                state === "wrong" && "border-[3px] border-tone-nga bg-danger-soft",
                state === "dim" && "border-2 border-border opacity-50"
              )}
            >
              <div className="w-[76px]">
                <WordPicture word={c} className={c.swatch ? "rounded-[18px]" : "p-0"} />
              </div>
              {(state === "right" || state === "wrong") && (
                <span
                  className={cn(
                    "absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full text-primary-foreground",
                    state === "right" ? "bg-primary" : "bg-tone-nga text-background"
                  )}
                >
                  {state === "right" ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {picked && (
        <FeedbackSheet
          correct={correct}
          title={correct ? "Đúng rồi!" : "Chưa đúng"}
          detail={
            correct ? (
              <>
                {round.answer.text} means {round.answer.meaning}
              </>
            ) : (
              <>
                This one is {round.answer.text} · {round.answer.meaning}
              </>
            )
          }
          onContinue={advance}
          continueLabel={index + 1 < rounds.length ? "Continue" : "Finish"}
        />
      )}
    </div>
  );
}
