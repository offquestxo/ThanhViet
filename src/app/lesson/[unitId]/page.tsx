import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const chunks: LessonChunk[] = (unit?.chunks ?? [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((chunk) => ({
      ...chunk,
      chunk_words: chunk.chunk_words.slice().sort((a, b) => a.display_order - b.display_order),
    }));

  if (!unit || chunks.length === 0) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-sm text-gray-500 mb-4">
            This unit doesn&apos;t have any chunks yet.
          </p>
          <Link href="/dashboard" className="text-sm underline">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return <LessonFlow unitTitle={unit.title} chunks={chunks} />;
}
