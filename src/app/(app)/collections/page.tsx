import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { COLLECTION_TITLES, vocabCollections } from "@/lib/content";
import { WordPicture } from "@/components/vocab/word-picture";

export const metadata = { title: "Collections · Thanh Việt" };

export default function CollectionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Collections</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {vocabCollections.map((c) => (
          <Link
            key={c.id}
            href={`/collections/${c.id}`}
            className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:bg-muted/50"
          >
            <div className="grid w-20 shrink-0 grid-cols-2 gap-1">
              {c.words.slice(1, 5).map((w) => (
                <WordPicture key={w.id} word={w} className="rounded-md p-0.5" />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold">{COLLECTION_TITLES[c.id] ?? c.title}</p>
              <p className="text-sm text-muted-foreground">
                {c.title} · {c.words.length} words
              </p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
