"use client";

import { useState } from "react";
import { TunerPractice } from "@/components/tone-tuner/tuner-practice";
import { useWarmEngine } from "@/hooks/use-warm-engine";
import type { VocabWord } from "@/lib/content";
import { Finished } from "./finished";
import { WordPicture } from "./word-picture";
import { LessonTopBar } from "./lesson-chrome";
import type { ActivityContext } from "./activity-context";

/** Say each word through the Tone Tuner (same engine, same tuner panel). */
export function SayIt({ words, ctx }: { words: VocabWord[]; ctx: ActivityContext }) {
  const [index, setIndex] = useState(0);
  useWarmEngine();
  if (index >= words.length)
    return (
      <Finished
        activity="say"
        collectionTitle={ctx.collectionTitle}
        wordsCount={words.length}
        streakDays={ctx.streakDays}
        next={ctx.next}
        backHref={ctx.backHref}
        onRestart={() => setIndex(0)}
        completion={{ collectionId: ctx.collectionId, activity: "say" }}
      />
    );
  const w = words[index];
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <LessonTopBar closeHref={ctx.backHref} current={index} total={words.length} />
      <div className="flex items-center gap-3">
        <div className="w-16 shrink-0">
          <WordPicture word={w} className={w.swatch ? "rounded-[14px]" : "p-0"} />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-[13px] font-bold tracking-[0.08em] text-primary uppercase">Say it</p>
          <p className="text-[17px] text-muted-foreground">Say the word, then check it.</p>
        </div>
      </div>
      <TunerPractice
        key={w.id}
        text={w.text}
        meaning={w.meaning}
        referenceAudio={w.audio}
        onNext={() => setIndex((i) => i + 1)}
        nextLabel={index + 1 < words.length ? "Next word" : "Finish"}
      />
    </div>
  );
}
