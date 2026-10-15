"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Sparrow } from "@/components/mascot/sparrow";
import { cn } from "@/lib/utils";

/** Close button + progress bar + "5/12", as in the Lesson comp. */
export function LessonTopBar({ closeHref, current, total }: { closeHref: string; current: number; total: number }) {
  return (
    <div className="flex items-center gap-3.5">
      <Link
        href={closeHref}
        aria-label="Close lesson"
        className="-ml-2.5 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground"
      >
        <X className="size-6" strokeWidth={2.2} />
      </Link>
      <div
        className="h-3 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label="Progress"
      >
        <div className="h-full rounded-full bg-hero transition-[width] duration-300" style={{ width: `${(current / total) * 100}%` }} />
      </div>
      <p className="min-w-10 text-right text-sm font-bold text-muted-foreground">
        {current}/{total}
      </p>
    </div>
  );
}

/** Bottom feedback sheet: green "Đúng rồi!" or the wrong-answer version with the surprised sparrow. */
export function FeedbackSheet({
  correct,
  title,
  detail,
  onContinue,
  continueLabel = "Continue",
}: {
  correct: boolean;
  title: string;
  detail: React.ReactNode;
  onContinue: () => void;
  continueLabel?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex flex-col gap-4 rounded-t-[28px] px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] animate-in slide-in-from-bottom-4 duration-200 md:left-60",
        correct ? "bg-success-soft" : "bg-danger-soft"
      )}
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-3">
        <Sparrow mood={correct ? "happy" : "surprised"} size={56} className="bg-card" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className={cn("text-[22px] font-bold", correct ? "text-success-strong" : "text-danger-strong")}>{title}</p>
          <div className="text-[15px] text-foreground/75">{detail}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onContinue}
        autoFocus
        className="mx-auto flex h-14 w-full max-w-md items-center justify-center rounded-[18px] bg-primary text-[17px] font-bold text-primary-foreground"
      >
        {continueLabel}
      </button>
    </div>
  );
}
