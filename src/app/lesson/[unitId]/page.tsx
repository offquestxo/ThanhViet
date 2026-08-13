import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { selectChunksForLesson } from "@/lib/chunk-selection";
import { LessonFlow, type LessonChunk } from "./lesson-flow";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Nested embed confirmed against the live schema before wiring this up:
  // units -> chunks -> chunk_words -> words. Ordering is done in JS below
  // rather than via nested `.order({ referencedTable })` calls, since
  // PostgREST's support for ordering two levels deep in one query isn't
  // something to assume — same caution as dashboard/page.tsx's chunk sort.
  const { data: unit } = await supabase
    .from("units")
    .select(
      "id, title, source_reference, chunks(id, vietnamese_text, english_text, source_context, audio_url, structural_concept, display_order, chunk_words(display_order, words(id, vietnamese_text, tone_pattern, audio_url)))"
    )
    .eq("id", unitId)
    .single();

  const allChunks: LessonChunk[] = (unit?.chunks ?? [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((chunk) => ({
      ...chunk,
      chunk_words: chunk.chunk_words.slice().sort((a, b) => a.display_order - b.display_order),
    }));

  if (!unit || allChunks.length === 0) {
    return (
      <main className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-lg text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            This unit doesn&apos;t have any chunks yet.
          </p>
          <Link href="/dashboard" className="text-sm text-primary underline">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  // Due-chunks-first selection (approved mechanism, PRD Section 2b's
  // "Warm-up recall") — scoped to this unit's chunks only (Rule 6). Not
  // i+1 (Rule 7): pure next_review_at ordering against data
  // src/app/lesson/actions.ts already writes correctly.
  const { data: progressRows } = await supabase
    .from("user_chunk_progress")
    .select("chunk_id, next_review_at")
    .eq("user_id", user.id)
    .in(
      "chunk_id",
      allChunks.map((c) => c.id)
    );

  const progressByChunkId = new Map(
    (progressRows ?? []).map((row) => [row.chunk_id, { next_review_at: row.next_review_at }])
  );

  const chunks = selectChunksForLesson(allChunks, progressByChunkId, new Date());

  // Deliberately NOT branching on chunks.length === 0 here, even though a
  // unit can have real chunks but nothing due/new for this user right now
  // (guaranteed the moment someone re-enters a just-finished unit) — see
  // the "found a real bug" note in LessonFlow. A page-level branch here
  // re-evaluates on every Server Action revalidation (completeChunk causes
  // one on this very route), so it can flip mid-session and unmount the
  // active lesson out from under a user who's mid-Review on their last
  // chunk. The empty/zero-eligible check lives inside LessonFlow instead,
  // protected by the same mount-time snapshot that protects `chunks`
  // itself — see there for why. What UX the "nothing due" state deserves
  // beyond a plain status message (a countdown, hiding the entry point on
  // the dashboard, a "practice anyway" override) is a separate open
  // question, flagged not decided, independent of this fix.
  return <LessonFlow unitTitle={unit.title} chunks={chunks} />;
}
