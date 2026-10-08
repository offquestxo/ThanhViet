import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { COLLECTION_TITLES, getCollection } from "@/lib/content";
import { ChoiceQuiz } from "@/components/vocab/choice-quiz";
import { MatchGame } from "@/components/vocab/match-game";
import { SayIt } from "@/components/vocab/say-it";
import { hasEnoughAudio } from "@/components/vocab/audio";

const TITLES: Record<string, string> = { see: "See it", hear: "Hear it", match: "Match", say: "Say it" };

export default async function ActivityPage({ params }: PageProps<"/collections/[collection]/[activity]">) {
  const { collection: id, activity } = await params;
  const collection = getCollection(id);
  if (!collection || !(activity in TITLES)) notFound();

  const backHref = `/collections/${collection.id}`;
  // Picked on the server and passed down, so the shuffle is identical on
  // the server render and in the browser (no hydration mismatch). A server
  // component renders once per request, so a fresh seed per visit is the
  // intent here — not the unstable-across-re-renders case the rule guards.
  // eslint-disable-next-line react-hooks/purity
  const seed = Math.random();

  let body: React.ReactNode;
  if (activity === "see") body = <ChoiceQuiz mode="see" words={collection.words} seed={seed} backHref={backHref} collectionId={collection.id} />;
  else if (activity === "hear") {
    const withAudio = collection.words.filter((w) => w.audio);
    if (!hasEnoughAudio(collection.words)) notFound();
    body = <ChoiceQuiz mode="hear" words={withAudio} seed={seed} backHref={backHref} collectionId={collection.id} />;
  } else if (activity === "match") body = <MatchGame words={collection.words} seed={seed} backHref={backHref} collectionId={collection.id} />;
  else body = <SayIt words={collection.words} backHref={backHref} collectionId={collection.id} />;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link href={backHref} className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> {COLLECTION_TITLES[collection.id] ?? collection.title}
        </Link>
        <h1 className="text-2xl font-semibold">{TITLES[activity]}</h1>
      </div>
      {body}
    </div>
  );
}
