import Link from "next/link";
import { Check } from "lucide-react";
import { vocabCollections, type VocabCollection } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";
import { collectionStatus, getVocabProgress } from "@/lib/vocab-progress";
import { collectionTint, sampleWord, shortTitle } from "@/lib/collection-style";
import { pickContinueCollection } from "@/lib/home";
import { TONE_INFO, TONE_ORDER } from "@/lib/tones";
import { ToneWord, TONE_TEXT_CLASS } from "@/components/tone/tone-word";
import { ReportProblem } from "@/components/feedback/report-problem";
import { cn } from "@/lib/utils";

export const metadata = { title: "Collections · Thanh Việt" };

const DOT: Record<string, string> = {
  ngang: "bg-tone-ngang",
  huyen: "bg-tone-huyen",
  sac: "bg-tone-sac",
  hoi: "bg-tone-hoi",
  nga: "bg-tone-nga",
  nang: "bg-tone-nang",
};

/** Collections (showcase design): in-progress collection featured, the rest in a tinted grid. Real counts and progress. */
export default async function CollectionsPage() {
  const progress = await getVocabProgress(await createClient());
  const cont = pickContinueCollection(progress);
  const featured = cont?.label === "Continue" ? cont.collection : null;
  const rest = vocabCollections.filter((c) => c.id !== featured?.id);
  const wordCount = vocabCollections.reduce((n, c) => n + c.words.length, 0);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 md:max-w-2xl">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] leading-tight font-bold tracking-[-0.02em]">Collections</h1>
          <p className="text-[15px] text-muted-foreground">
            {wordCount} words across {vocabCollections.length} collections
          </p>
        </div>
        <ReportProblem className="-mr-2 mt-1 md:hidden" />
      </div>

      {featured && <FeaturedCard collection={featured} status={collectionStatus(featured, progress.get(featured.id))} />}

      <div className="grid grid-cols-2 gap-3">
        {rest.map((c) => (
          <GridCard key={c.id} collection={c} status={collectionStatus(c, progress.get(c.id))} />
        ))}
      </div>

      <div className="flex items-center gap-2.5 px-0.5 pt-1">
        <p className="shrink-0 text-[13px] font-semibold text-muted-foreground">Tone colors</p>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs font-semibold">
          {TONE_ORDER.map((t) => (
            <span key={t} className={cn("flex items-center gap-1", TONE_TEXT_CLASS[t])}>
              <span className={cn("size-2 rounded-full", DOT[t])} />
              {TONE_INFO[t].vi}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

type Status = ReturnType<typeof collectionStatus>;

function FeaturedCard({ collection, status }: { collection: VocabCollection; status: Status }) {
  const tint = collectionTint(collection);
  const sample = sampleWord(collection, tint.tone);
  return (
    <Link href={`/collections/${collection.id}`} className={cn("flex items-center gap-4 rounded-[26px] p-5", tint.bg)}>
      <div className="flex size-[92px] shrink-0 items-center justify-center rounded-[22px] bg-card">
        <ToneWord text={sample.text} className={sample.text.length > 5 ? "text-2xl" : "text-[34px] tracking-[-0.02em]"} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className={cn("text-xs font-bold tracking-[0.08em] uppercase", tint.text)}>In progress</p>
        <h2 className="text-[22px] leading-tight font-bold tracking-[-0.01em]">{shortTitle(collection).vi}</h2>
        <p className="text-sm text-muted-foreground">
          {shortTitle(collection).en} · {status.done.length} of {status.total} activities
        </p>
        <div className={cn("h-2 overflow-hidden rounded-full", tint.track)}>
          <div className={cn("h-full rounded-full", tint.bar)} style={{ width: `${(status.done.length / status.total) * 100}%` }} />
        </div>
      </div>
    </Link>
  );
}

function GridCard({ collection, status }: { collection: VocabCollection; status: Status }) {
  const tint = collectionTint(collection);
  const swatches = collection.words.filter((w) => w.swatch && w.swatch !== "rainbow").slice(0, 4);
  const sample = sampleWord(collection, tint.tone);
  return (
    <Link href={`/collections/${collection.id}`} className={cn("flex min-h-[168px] flex-col gap-2.5 rounded-[22px] p-4", tint.bg)}>
      {swatches.length === 4 ? (
        <div className="flex gap-1.5" aria-hidden>
          {swatches.map((w) => (
            <span key={w.id} className="size-[22px] rounded-[7px] border border-black/5" style={{ background: w.swatch }} />
          ))}
        </div>
      ) : (
        <ToneWord text={sample.text} className="text-[30px] leading-tight tracking-[-0.02em]" />
      )}
      <div className="flex-1" />
      <h2 className="text-[19px] leading-tight font-bold">{shortTitle(collection).vi}</h2>
      <p className="text-[13px] text-muted-foreground">
        {shortTitle(collection).en} · {collection.words.length} words
      </p>
      {status.finished ? (
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-success-strong">
          <Check className="size-3.5" strokeWidth={3} /> Done
        </p>
      ) : status.done.length > 0 ? (
        <div className={cn("h-1.5 overflow-hidden rounded-full", tint.track)} aria-label={`${status.done.length} of ${status.total} activities done`}>
          <div className={cn("h-full", tint.bar)} style={{ width: `${(status.done.length / status.total) * 100}%` }} />
        </div>
      ) : (
        <p className={cn("text-[13px] font-semibold", tint.text)}>Start</p>
      )}
    </Link>
  );
}
