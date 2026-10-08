"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparrow } from "@/components/mascot/sparrow";
import { recordActivityCompletion, type VocabActivity } from "@/app/(app)/collections/actions";

export function Finished({
  score,
  total,
  backHref,
  onRestart,
  completion,
}: {
  score?: number;
  total?: number;
  backHref: string;
  onRestart: () => void;
  /** Records this run in the user's collection progress, once per end screen. */
  completion?: { collectionId: string; activity: VocabActivity };
}) {
  const recorded = useRef(false);
  useEffect(() => {
    if (!completion || recorded.current) return;
    recorded.current = true; // StrictMode runs effects twice in dev
    void recordActivityCompletion(completion.collectionId, completion.activity, score, total);
  }, [completion, score, total]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 py-8 text-center">
      <Sparrow mood="happy" size={88} />
      <p className="text-xl font-semibold">Nice work!</p>
      {score !== undefined && total !== undefined && (
        <p className="text-muted-foreground">
          {score} / {total} right
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onRestart}>
          Again
        </Button>
        <Button asChild>
          <Link href={backHref}>Back to words</Link>
        </Button>
      </div>
    </div>
  );
}
