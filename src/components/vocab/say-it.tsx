"use client";

import { useState } from "react";
import { TonePractice } from "@/components/tone-tuner/tone-practice";
import { useWarmEngine } from "@/hooks/use-warm-engine";
import type { VocabWord } from "@/lib/content";
import { Finished } from "./finished";
import { WordPicture } from "./word-picture";

/** Say each word through the Tone Tuner (same engine, same results screen). */
export function SayIt({ words, backHref }: { words: VocabWord[]; backHref: string }) {
  const [index, setIndex] = useState(0);
  useWarmEngine();
  if (index >= words.length) return <Finished backHref={backHref} onRestart={() => setIndex(0)} />;
  const w = words[index];
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4">
      <p className="text-xs text-muted-foreground">
        {index + 1} / {words.length}
      </p>
      <div className="w-28">
        <WordPicture word={w} />
      </div>
      <TonePractice
        key={w.id}
        text={w.text}
        meaning={w.meaning}
        syllables={w.syllables}
        referenceAudio={w.audio}
        onNext={() => setIndex((i) => i + 1)}
        nextLabel={index + 1 < words.length ? "Next word" : "Finish"}
      />
    </div>
  );
}
