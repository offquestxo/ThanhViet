import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, Ear, Eye, Mic, Puzzle } from "lucide-react";
import { COLLECTION_TITLES, getCollection, vocabCollections } from "@/lib/content";
import { WordPicture } from "@/components/vocab/word-picture";
import { PlayWord } from "@/components/vocab/play-word";
import { usesComputerVoice } from "@/components/vocab/audio";
import { ToneWord, ToneNames } from "@/components/tone/tone-word";
import { ReportProblem } from "@/components/feedback/report-problem";
import { createClient } from "@/lib/supabase/server";
import { availableActivities, getVocabProgress, type VocabActivity } from "@/lib/vocab-progress";
import { collectionTint } from "@/lib/collection-style";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return vocabCollections.map((c) => ({ collection: c.id }));
}

const ACTIVITIES: Record<VocabActivity, { label: string; hint: string; icon: typeof Eye }> = {
  see: { label: "See it", hint: "Word → pick the picture", icon: Eye },
  hear: { label: "Hear it", hint: "Listen → pick the picture", icon: Ear },
  match: { label: "Match", hint: "Pair pictures and words", icon: Puzzle },
  say: { label: "Say it", hint: "Each word through the Tone Tuner", icon: Mic },
};

export default async function CollectionPage({ params }: PageProps<"/collections/[collection]">) {
  const { collection: id } = await params;
  const collection = getCollection(id);
  if (!collection) notFound();

  // "Hear it" only exists once verified audio does (each clip checked against
  // the word by both ASR models) — never faked.
  const activities = availableActivities(collection);
  const done = (await getVocabProgress(await createClient())).get(collection.id);
  const tint = collectionTint(collection);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-3xl">
      <header className="flex h-11 items-center justify-between">
        <Link href="/collections" aria-label="Back to collections" className="-ml-2.5 flex size-11 items-center justify-center rounded-full">
          <ChevronLeft className="size-6" strokeWidth={2.2} />
        </Link>
        <ReportProblem className="-mr-2 md:hidden" />
      </header>

      <div className={cn("flex flex-col gap-1 rounded-[26px] p-5", tint.bg)}>
        <h1 className="text-[30px] leading-tight font-bold tracking-[-0.02em]">{COLLECTION_TITLES[collection.id] ?? collection.title}</h1>
        <p className="text-[15px] text-muted-foreground">
          {collection.title} · {collection.words.length} words · {activities.filter((a) => done?.has(a)).length} of {activities.length} activities
        </p>
        {usesComputerVoice(collection.words) && (
          <p className="mt-1 text-xs text-muted-foreground">Audio is a computer voice for now — native recordings are coming.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {activities.map((slug) => {
          const a = ACTIVITIES[slug];
          const p = done?.get(slug);
          return (
            <Link
              key={slug}
              href={`/collections/${collection.id}/${slug}`}
              className="relative flex min-h-[104px] flex-col gap-1 rounded-[22px] border border-border bg-card p-4 transition-colors active:bg-muted"
            >
              {p && (
                <span className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-hero text-hero-foreground" aria-label="Done">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
              <a.icon className="size-5 text-primary" />
              <span className="text-[17px] font-bold">{a.label}</span>
              <span className="text-xs text-muted-foreground">{p?.best_score != null && p.total ? `Best ${p.best_score} / ${p.total}` : a.hint}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {collection.words.map((w) => (
          <div key={w.id} className="flex flex-col items-center gap-2 rounded-[22px] border border-border bg-card p-3">
            <div className="w-full max-w-24">
              <WordPicture word={w} className={w.swatch ? "rounded-[18px]" : undefined} />
            </div>
            <div className="flex flex-col items-center text-center">
              <ToneWord text={w.text} className="text-xl" />
              <ToneNames text={w.text} className="text-xs" />
              <p className="text-xs text-muted-foreground">{w.meaning}</p>
            </div>
            {w.audio && <PlayWord src={w.audio} />}
          </div>
        ))}
      </div>
    </div>
  );
}
