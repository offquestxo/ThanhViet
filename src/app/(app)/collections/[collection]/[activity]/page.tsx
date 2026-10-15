import { notFound } from "next/navigation";
import { COLLECTION_TITLES, getCollection } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";
import { liveStreakDays } from "@/lib/streak";
import { availableActivities, type VocabActivity } from "@/lib/vocab-progress";
import { ChoiceQuiz } from "@/components/vocab/choice-quiz";
import { MatchGame } from "@/components/vocab/match-game";
import { SayIt } from "@/components/vocab/say-it";
import { ACTIVITY_LABEL, type ActivityContext } from "@/components/vocab/activity-context";

export default async function ActivityPage({ params }: PageProps<"/collections/[collection]/[activity]">) {
  const { collection: id, activity: raw } = await params;
  const collection = getCollection(id);
  const available = collection ? availableActivities(collection) : [];
  if (!collection || !available.includes(raw as VocabActivity)) notFound();
  const activity = raw as VocabActivity;

  // Picked on the server and passed down, so the shuffle is identical on
  // the server render and in the browser (no hydration mismatch). A server
  // component renders once per request, so a fresh seed per visit is the
  // intent here — not the unstable-across-re-renders case the rule guards.
  // eslint-disable-next-line react-hooks/purity
  const seed = Math.random();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: streak } = user
    ? await supabase.from("user_streaks").select("current_streak, last_activity_date").eq("user_id", user.id).maybeSingle()
    : { data: null };

  const nextKey = available[available.indexOf(activity) + 1];
  const ctx: ActivityContext = {
    collectionId: collection.id,
    collectionTitle: COLLECTION_TITLES[collection.id] ?? collection.title,
    backHref: `/collections/${collection.id}`,
    streakDays: liveStreakDays(streak),
    next: nextKey ? { href: `/collections/${collection.id}/${nextKey}`, label: ACTIVITY_LABEL[nextKey] } : null,
  };

  if (activity === "see") return <ChoiceQuiz key={activity} mode="see" words={collection.words} seed={seed} ctx={ctx} />;
  if (activity === "hear")
    return <ChoiceQuiz key={activity} mode="hear" words={collection.words.filter((w) => w.audio)} seed={seed} ctx={ctx} />;
  if (activity === "match") return <MatchGame words={collection.words} seed={seed} ctx={ctx} />;
  return <SayIt words={collection.words} ctx={ctx} />;
}
