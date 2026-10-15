"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { recordActivityCompletion, type VocabActivity } from "@/app/(app)/collections/actions";
import { ToneWord } from "@/components/tone/tone-word";
import type { VocabWord } from "@/lib/content";
import { TONE_INFO, textTones } from "@/lib/tones";
import { TONE_COACHING } from "@/lib/tone-coaching";
import { ACTIVITY_LABEL } from "./activity-context";

/**
 * End of an activity (showcase "Finished" design). Every number is real:
 * this run's score (See it / Hear it), how many words it covered, and the
 * current day streak. Vocabulary activities award no XP today, so the
 * comp's XP tile shows the word count instead.
 */
export function Finished({
  activity,
  collectionTitle,
  score,
  total,
  wordsCount,
  missed,
  streakDays,
  next,
  backHref,
  onRestart,
  completion,
}: {
  activity: VocabActivity;
  collectionTitle: string;
  score?: number;
  total?: number;
  wordsCount: number;
  missed?: VocabWord | null;
  streakDays: number;
  next?: { href: string; label: string } | null;
  backHref: string;
  onRestart: () => void;
  /** Records this run in the user's collection progress, once per end screen. */
  completion?: { collectionId: string; activity: VocabActivity };
}) {
  const recorded = useRef(false);
  const [notSaved, setNotSaved] = useState(false);
  useEffect(() => {
    if (!completion || recorded.current) return;
    recorded.current = true; // StrictMode runs effects twice in dev
    recordActivityCompletion(completion.collectionId, completion.activity, score, total)
      .then((r) => setNotSaved(!r.saved))
      .catch(() => setNotSaved(true));
  }, [completion, score, total]);

  const scored = score !== undefined && total !== undefined;
  const great = !scored || score / total >= 0.8;
  const missedTone = missed ? textTones(missed.text) : [];

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col gap-6 pt-6">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <div className="flex size-[200px] items-end justify-center overflow-hidden rounded-full bg-success-soft">
          <Image src="/mascot/sparrow-main.png" alt="" width={184} height={184} className="h-[184px] w-auto" unoptimized priority />
        </div>
        <p className="mt-2 text-[13px] font-bold tracking-[0.08em] text-primary uppercase">
          {ACTIVITY_LABEL[activity]} · {collectionTitle}
        </p>
        <h1 className="text-[40px] leading-tight font-extrabold tracking-[-0.03em]">{great ? "Giỏi lắm!" : "Cố lên!"}</h1>
        <p className="text-base text-muted-foreground">{great ? "Great work." : "Keep going — it sticks with practice."}</p>
      </div>

      <div className={scored ? "grid grid-cols-3 gap-2.5" : "grid grid-cols-2 gap-2.5"}>
        {scored && <Tile value={`${score}/${total}`} label="correct" className="text-primary" />}
        <Tile value={String(wordsCount)} label="words" className="text-gold-text" />
        <Tile value={String(streakDays)} label="day streak" className="text-tone-sac-text" />
      </div>

      {missed && (
        <div className="flex items-center gap-3 rounded-[20px] bg-gold-soft px-4 py-3.5">
          <ToneWord
            text={missed.text}
            className={`min-w-14 shrink-0 text-center tracking-[-0.02em] whitespace-nowrap ${missed.text.length > 6 ? "text-2xl" : "text-[30px]"}`}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-[15px] font-bold">Review this one</p>
            <p className="text-sm text-muted-foreground">
              {missed.text} · {missed.meaning} · {missedTone.map((t) => TONE_INFO[t].vi).join(" + ")}
              {missedTone.length === 1 ? `, ${TONE_COACHING[missedTone[0]].tagline.toLowerCase()}` : ""}
            </p>
          </div>
        </div>
      )}

      {notSaved && <p className="text-center text-xs text-muted-foreground">Your progress couldn&apos;t be saved this time.</p>}

      <div className="flex-1" />

      <div className="flex flex-col gap-2.5 pb-[env(safe-area-inset-bottom)]">
        {next ? (
          <Link
            href={next.href}
            className="flex h-14 items-center justify-center rounded-[18px] bg-primary text-[17px] font-bold text-primary-foreground shadow-[0_8px_20px_rgba(14,127,102,0.28)]"
          >
            Next: {next.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onRestart}
            className="flex h-14 items-center justify-center rounded-[18px] bg-primary text-[17px] font-bold text-primary-foreground"
          >
            Again
          </button>
        )}
        <div className="flex gap-2">
          {next && (
            <button type="button" onClick={onRestart} className="flex h-[52px] flex-1 items-center justify-center rounded-[18px] text-base font-semibold">
              Again
            </button>
          )}
          <Link href={backHref} className="flex h-[52px] flex-1 items-center justify-center rounded-[18px] text-base font-semibold">
            Back to collection
          </Link>
        </div>
      </div>
    </div>
  );
}

function Tile({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[20px] border border-border bg-card px-2 py-3.5">
      <p className={`text-[26px] font-extrabold ${className ?? ""}`}>{value}</p>
      <p className="text-[13px] text-muted-foreground">{label}</p>
    </div>
  );
}
