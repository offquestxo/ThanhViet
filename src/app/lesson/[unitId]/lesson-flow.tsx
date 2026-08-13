"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { completeChunk } from "../actions";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/ui/app-card";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StructuralConcept =
  | "classifier"
  | "topic_comment"
  | "particle"
  | "tone_identity"
  | "none";

type ChunkWord = {
  display_order: number;
  words: {
    id: string;
    vietnamese_text: string;
    tone_pattern: string | null;
    audio_url: string | null;
  };
};

export type LessonChunk = {
  id: string;
  vietnamese_text: string;
  english_text: string;
  source_context: string | null;
  audio_url: string | null;
  structural_concept: StructuralConcept;
  display_order: number;
  chunk_words: ChunkWord[];
};

const CONCEPT_OPTIONS: { value: StructuralConcept; label: string }[] = [
  {
    value: "classifier",
    label: "Classifier — a noun gets sorted into a category before being named",
  },
  {
    value: "topic_comment",
    label: "Topic-comment — states the topic, then comments on it",
  },
  {
    value: "particle",
    label: "Particle — a standalone word carries grammar English puts in verb endings",
  },
  {
    value: "tone_identity",
    label: "Tone identity — a different tone makes this a different word",
  },
  { value: "none", label: "No specific pattern highlighted here" },
];

type Step = "encounter" | "notice" | "check" | "speak" | "produce" | "review";
const STEPS: Step[] = ["encounter", "notice", "check", "speak", "produce", "review"];

const STEP_LABELS: Record<Step, string> = {
  encounter: "Encounter",
  notice: "Notice",
  check: "Check",
  speak: "Speak",
  produce: "Produce",
  review: "Review",
};

export function LessonFlow({
  unitTitle,
  chunks: chunksProp,
}: {
  unitTitle: string;
  chunks: LessonChunk[];
}) {
  const router = useRouter();
  // Snapshot the chunk list once, on mount — deliberately NOT reading
  // chunksProp directly on every render. Server Actions called from within
  // this tree (completeChunk, below) cause Next.js to automatically
  // re-render this route's Server Component (page.tsx) as part of the
  // action round-trip, which recomputes the due/new selection with
  // freshly-updated data — including the chunk that action JUST
  // rescheduled, which now drops out of the due set. Without this
  // snapshot, that fresh (shorter) array gets pushed into this
  // already-mounted component while `chunkIndex` stays put, silently
  // shifting every chunk after it by one and skipping one entirely.
  // A lesson session's chunk list is decided once, at entry — not
  // continuously re-evaluated while you're mid-walk through it.
  const [chunks] = useState(chunksProp);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [step, setStep] = useState<Step>("encounter");
  const [noticeSelection, setNoticeSelection] = useState<StructuralConcept | null>(null);
  const [meaningRevealed, setMeaningRevealed] = useState(false);
  const [reviewState, setReviewState] = useState<
    | { status: "idle" }
    | { status: "saving" }
    | { status: "done"; pointsAwarded: number; currentStreak: number }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const recorder = useAudioRecorder();

  // A unit can have real chunks but nothing due/new for this user right
  // now (every chunk already practiced and future-scheduled) — guaranteed
  // to happen the moment someone re-enters a just-finished unit. Handled
  // here, inside the snapshotted component, rather than as a branch in
  // page.tsx — see the note there for why that distinction is load-
  // bearing, not stylistic. What UX this deserves beyond a plain status
  // message is a separate open question, not decided here.
  if (chunks.length === 0) {
    return (
      <main className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-lg text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Nothing to practice right now — every chunk in this unit is already
            scheduled for a later review.
          </p>
          <Link href="/dashboard" className="text-sm text-primary underline">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const chunk = chunks[chunkIndex];
  const isLastChunk = chunkIndex === chunks.length - 1;
  const stepIndex = STEPS.indexOf(step);
  const noticeCorrect = noticeSelection === chunk.structural_concept;

  function resetPerChunkState() {
    setStep("encounter");
    setNoticeSelection(null);
    setMeaningRevealed(false);
    setReviewState({ status: "idle" });
    recorder.reset();
  }

  function goToNextChunk() {
    if (isLastChunk) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setChunkIndex((i) => i + 1);
    resetPerChunkState();
  }

  async function handleReviewEntered() {
    if (reviewState.status !== "idle") return;
    setReviewState({ status: "saving" });
    try {
      const result = await completeChunk(chunk.id, noticeCorrect);
      setReviewState({
        status: "done",
        pointsAwarded: result.pointsAwarded,
        currentStreak: result.currentStreak,
      });
    } catch (err) {
      setReviewState({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-xs text-muted-foreground">{unitTitle}</p>
          <p className="text-xs text-muted-foreground">
            Chunk {chunkIndex + 1} / {chunks.length}
          </p>
        </div>
        <div className="mb-8 flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= stepIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {step === "encounter" && (
          <AppCard>
            <CardContent className="flex flex-col gap-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {STEP_LABELS.encounter}
              </p>
              <p className="text-2xl">{chunk.vietnamese_text}</p>
              {chunk.source_context && (
                <p className="text-sm text-muted-foreground">{chunk.source_context}</p>
              )}
              {chunk.audio_url ? (
                <audio controls src={chunk.audio_url} className="w-full" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  (native audio coming soon for this chunk)
                </p>
              )}
              <div>
                <Button onClick={() => setStep("notice")}>Continue</Button>
              </div>
            </CardContent>
          </AppCard>
        )}

        {step === "notice" && (
          <AppCard>
            <CardContent className="flex flex-col gap-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {STEP_LABELS.notice}
              </p>
              <p className="text-xl">{chunk.vietnamese_text}</p>
              <p className="text-sm text-muted-foreground">
                What pattern do you notice in this chunk?
              </p>
              <div className="flex flex-col gap-2">
                {CONCEPT_OPTIONS.map((opt) => {
                  const isSelected = noticeSelection === opt.value;
                  const showFeedback = noticeSelection !== null;
                  const isThisCorrect = opt.value === chunk.structural_concept;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setNoticeSelection(opt.value)}
                      disabled={noticeSelection !== null}
                      className={cn(
                        "rounded-[var(--radius-md)] border border-border px-3 py-2 text-left text-sm transition-colors",
                        isSelected && "border-foreground",
                        showFeedback && isThisCorrect && "border-success",
                        showFeedback && isSelected && !isThisCorrect && "border-destructive"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {noticeSelection !== null && (
                <p
                  className={cn(
                    "text-sm",
                    noticeCorrect ? "text-success" : "text-muted-foreground"
                  )}
                >
                  {noticeCorrect
                    ? "Right — nicely noticed."
                    : "Not quite — keep an eye out for this pattern."}
                </p>
              )}
              <div>
                <Button onClick={() => setStep("check")} disabled={noticeSelection === null}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </AppCard>
        )}

        {step === "check" && (
          <AppCard>
            <CardContent className="flex flex-col gap-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {STEP_LABELS.check}
              </p>
              <p className="text-xl">{chunk.vietnamese_text}</p>
              {meaningRevealed ? (
                <p className="text-lg text-muted-foreground">{chunk.english_text}</p>
              ) : (
                <div>
                  <Button variant="outline" onClick={() => setMeaningRevealed(true)}>
                    Reveal meaning
                  </Button>
                </div>
              )}
              <div>
                <Button onClick={() => setStep("speak")} disabled={!meaningRevealed}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </AppCard>
        )}

        {step === "speak" && (
          <AppCard>
            <CardContent className="flex flex-col gap-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {STEP_LABELS.speak}
              </p>
              <p className="text-xl">{chunk.vietnamese_text}</p>
              <p className="text-sm text-muted-foreground">
                Say it out loud, then compare your recording with the native audio. This
                isn&apos;t scored — it&apos;s just for your own ear.
              </p>

              {chunk.audio_url ? (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Native audio</p>
                  <audio controls src={chunk.audio_url} className="w-full" />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  (native audio coming soon for this chunk)
                </p>
              )}

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Your recording</p>
                {recorder.audioUrl ? (
                  <audio controls src={recorder.audioUrl} className="w-full" />
                ) : (
                  <Button
                    variant="outline"
                    onClick={
                      recorder.isRecording ? recorder.stopRecording : recorder.startRecording
                    }
                  >
                    {recorder.isRecording ? "Stop recording" : "Record yourself"}
                  </Button>
                )}
                {recorder.audioUrl && (
                  <button
                    onClick={recorder.reset}
                    className="ml-2 text-xs text-muted-foreground underline"
                  >
                    Re-record
                  </button>
                )}
                {recorder.error && (
                  <p className="mt-2 text-xs text-destructive">{recorder.error}</p>
                )}
              </div>

              <div>
                <Button onClick={() => setStep("produce")}>
                  {recorder.audioUrl ? "Continue" : "Skip"}
                </Button>
              </div>
            </CardContent>
          </AppCard>
        )}

        {step === "produce" && (
          <AppCard>
            <CardContent className="flex flex-col gap-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {STEP_LABELS.produce}
              </p>
              <p className="text-sm text-muted-foreground">Key words from this chunk:</p>
              <ul className="flex flex-col gap-2">
                {chunk.chunk_words
                  .slice()
                  .sort((a, b) => a.display_order - b.display_order)
                  .slice(0, 2)
                  .map((cw) => (
                    <li
                      key={cw.words.id}
                      className="rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm"
                    >
                      {cw.words.vietnamese_text}
                      {cw.words.tone_pattern && (
                        <span className="text-muted-foreground"> · {cw.words.tone_pattern}</span>
                      )}
                    </li>
                  ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Tone Tuner check coming in Phase 1b — this step doesn&apos;t block your progress
                yet.
              </p>
              <div>
                <Button
                  onClick={() => {
                    setStep("review");
                    void handleReviewEntered();
                  }}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </AppCard>
        )}

        {step === "review" && (
          <AppCard>
            <CardContent className="flex flex-col gap-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {STEP_LABELS.review}
              </p>
              {reviewState.status === "saving" && (
                <p className="text-sm text-muted-foreground">Saving your progress…</p>
              )}
              {reviewState.status === "error" && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-destructive">{reviewState.message}</p>
                  <div>
                    <Button variant="outline" onClick={() => void handleReviewEntered()}>
                      Try again
                    </Button>
                  </div>
                </div>
              )}
              {reviewState.status === "done" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-lg font-semibold text-primary">
                      +{reviewState.pointsAwarded} points
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reviewState.currentStreak}-day streak
                    </p>
                  </div>
                  <div>
                    <Button onClick={goToNextChunk}>
                      {isLastChunk ? "Finish lesson" : "Next chunk"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </AppCard>
        )}
      </div>
    </main>
  );
}
