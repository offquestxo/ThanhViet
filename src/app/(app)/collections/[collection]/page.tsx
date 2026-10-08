import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ear, Eye, Mic, Puzzle } from "lucide-react";
import { COLLECTION_TITLES, getCollection, vocabCollections } from "@/lib/content";
import { WordPicture } from "@/components/vocab/word-picture";
import { PlayWord } from "@/components/vocab/play-word";
import { hasEnoughAudio, usesComputerVoice } from "@/components/vocab/audio";

export function generateStaticParams() {
  return vocabCollections.map((c) => ({ collection: c.id }));
}

export default async function CollectionPage({ params }: PageProps<"/collections/[collection]">) {
  const { collection: id } = await params;
  const collection = getCollection(id);
  if (!collection) notFound();

  // "Hear it" only exists once verified audio does (each clip checked against
  // the word by both ASR models) — never faked.
  const activities = [
    { slug: "see", label: "See it", hint: "Picture → pick the word", icon: Eye },
    ...(hasEnoughAudio(collection.words) ? [{ slug: "hear", label: "Hear it", hint: "Listen → pick the picture", icon: Ear }] : []),
    { slug: "match", label: "Match", hint: "Pair pictures and words", icon: Puzzle },
    { slug: "say", label: "Say it", hint: "Each word through the Tone Tuner", icon: Mic },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link href="/collections" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Collections
        </Link>
        <h1 className="text-2xl font-semibold">{COLLECTION_TITLES[collection.id] ?? collection.title}</h1>
        <p className="text-sm text-muted-foreground">{collection.title}</p>
        {usesComputerVoice(collection.words) && (
          <p className="mt-1 text-xs text-muted-foreground">Audio is a computer voice for now — native recordings are coming.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {activities.map((a) => (
          <Link
            key={a.slug}
            href={`/collections/${collection.id}/${a.slug}`}
            className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:bg-muted/50"
          >
            <a.icon className="size-5 text-primary" />
            <span className="font-semibold">{a.label}</span>
            <span className="text-xs text-muted-foreground">{a.hint}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {collection.words.map((w) => (
          <div key={w.id} className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-border bg-card p-3">
            <div className="w-full max-w-28">
              <WordPicture word={w} />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{w.text}</p>
              <p className="text-xs text-muted-foreground">{w.meaning}</p>
            </div>
            {w.audio && <PlayWord src={w.audio} />}
          </div>
        ))}
      </div>
    </div>
  );
}
