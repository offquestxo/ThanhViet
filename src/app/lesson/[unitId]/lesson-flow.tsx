"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { completeChunk } from "../actions";

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

export function LessonFlow({
  unitTitle,
  chunks,
}: {
  unitTitle: string;
  chunks: LessonChunk[];
}) {
  const router = useRouter();
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
    <main className="min-h-screen p-8">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-baseline mb-1">
          <p className="text-xs text-gray-400">{unitTitle}</p>
          <p className="text-xs text-gray-400">
            Chunk {chunkIndex + 1} / {chunks.length}
          </p>
        </div>
        <div className="flex gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded ${
                i <= stepIndex ? "bg-foreground" : "bg-gray-200 dark:bg-gray-800"
              }`}
            />
          ))}
        </div>

        {step === "encounter" && (
          <section>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
              Encounter
            </p>
            <p className="text-2xl mb-3">{chunk.vietnamese_text}</p>
            {chunk.source_context && (
              <p className="text-sm text-gray-500 mb-4">{chunk.source_context}</p>
            )}
            {chunk.audio_url ? (
              <audio controls src={chunk.audio_url} className="mb-6 w-full" />
            ) : (
              <p className="text-xs text-gray-400 mb-6">
                (native audio coming soon for this chunk)
              </p>
            )}
            <button
              onClick={() => setStep("notice")}
              className="border rounded-md px-4 py-2 text-sm"
            >
              Continue
            </button>
          </section>
        )}

        {step === "notice" && (
          <section>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
              Notice
            </p>
            <p className="text-xl mb-4">{chunk.vietnamese_text}</p>
            <p className="text-sm text-gray-500 mb-4">
              What pattern do you notice in this chunk?
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {CONCEPT_OPTIONS.map((opt) => {
                const isSelected = noticeSelection === opt.value;
                const showFeedback = noticeSelection !== null;
                const isThisCorrect = opt.value === chunk.structural_concept;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setNoticeSelection(opt.value)}
                    disabled={noticeSelection !== null}
                    className={`text-left text-sm border rounded-md px-3 py-2 ${
                      isSelected ? "border-foreground" : ""
                    } ${
                      showFeedback && isThisCorrect
                        ? "border-green-600"
                        : showFeedback && isSelected
                          ? "border-red-600"
                          : ""
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {noticeSelection !== null && (
              <p className="text-sm mb-4">
                {noticeCorrect ? "Right — nicely noticed." : "Not quite — keep an eye out for this pattern."}
              </p>
            )}
            <button
              onClick={() => setStep("check")}
              disabled={noticeSelection === null}
              className="border rounded-md px-4 py-2 text-sm disabled:opacity-40"
            >
              Continue
            </button>
          </section>
        )}

        {step === "check" && (
          <section>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">Check</p>
            <p className="text-xl mb-4">{chunk.vietnamese_text}</p>
            {meaningRevealed ? (
              <p className="text-lg text-gray-500 mb-6">{chunk.english_text}</p>
            ) : (
              <button
                onClick={() => setMeaningRevealed(true)}
                className="border rounded-md px-4 py-2 text-sm mb-6"
              >
                Reveal meaning
              </button>
            )}
            <div>
              <button
                onClick={() => setStep("speak")}
                disabled={!meaningRevealed}
                className="border rounded-md px-4 py-2 text-sm disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === "speak" && (
          <section>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">Speak</p>
            <p className="text-xl mb-4">{chunk.vietnamese_text}</p>
            <p className="text-sm text-gray-500 mb-4">
              Say it out loud, then compare your recording with the native audio.
              This isn&apos;t scored — it&apos;s just for your own ear.
            </p>

            {chunk.audio_url ? (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">Native audio</p>
                <audio controls src={chunk.audio_url} className="w-full" />
              </div>
            ) : (
              <p className="text-xs text-gray-400 mb-4">
                (native audio coming soon for this chunk)
              </p>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1">Your recording</p>
              {recorder.audioUrl ? (
                <audio controls src={recorder.audioUrl} className="w-full" />
              ) : (
                <button
                  onClick={
                    recorder.isRecording ? recorder.stopRecording : recorder.startRecording
                  }
                  className="border rounded-md px-4 py-2 text-sm"
                >
                  {recorder.isRecording ? "Stop recording" : "Record yourself"}
                </button>
              )}
              {recorder.audioUrl && (
                <button
                  onClick={recorder.reset}
                  className="ml-2 text-xs underline text-gray-500"
                >
                  Re-record
                </button>
              )}
              {recorder.error && (
                <p className="text-xs text-red-600 mt-2">{recorder.error}</p>
              )}
            </div>

            <button
              onClick={() => setStep("produce")}
              className="border rounded-md px-4 py-2 text-sm"
            >
              {recorder.audioUrl ? "Continue" : "Skip"}
            </button>
          </section>
        )}

        {step === "produce" && (
          <section>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
              Produce
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Key words from this chunk:
            </p>
            <ul className="flex flex-col gap-2 mb-4">
              {chunk.chunk_words
                .slice()
                .sort((a, b) => a.display_order - b.display_order)
                .slice(0, 2)
                .map((cw) => (
                  <li key={cw.words.id} className="border rounded-md px-3 py-2 text-sm">
                    {cw.words.vietnamese_text}
                    {cw.words.tone_pattern && (
                      <span className="text-gray-400"> · {cw.words.tone_pattern}</span>
                    )}
                  </li>
                ))}
            </ul>
            <p className="text-xs text-gray-400 mb-6">
              Tone Tuner check coming in Phase 1b — this step doesn&apos;t block your
              progress yet.
            </p>
            <button
              onClick={() => {
                setStep("review");
                void handleReviewEntered();
              }}
              className="border rounded-md px-4 py-2 text-sm"
            >
              Continue
            </button>
          </section>
        )}

        {step === "review" && (
          <section>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">Review</p>
            {reviewState.status === "saving" && (
              <p className="text-sm text-gray-500">Saving your progress…</p>
            )}
            {reviewState.status === "error" && (
              <div>
                <p className="text-sm text-red-600 mb-4">{reviewState.message}</p>
                <button
                  onClick={() => void handleReviewEntered()}
                  className="border rounded-md px-4 py-2 text-sm"
                >
                  Try again
                </button>
              </div>
            )}
            {reviewState.status === "done" && (
              <div>
                <p className="text-lg mb-1">
                  +{reviewState.pointsAwarded} points
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {reviewState.currentStreak}-day streak
                </p>
                <button
                  onClick={goToNextChunk}
                  className="border rounded-md px-4 py-2 text-sm"
                >
                  {isLastChunk ? "Finish lesson" : "Next chunk"}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
