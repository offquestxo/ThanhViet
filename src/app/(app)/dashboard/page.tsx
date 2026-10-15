import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, ChevronRight, Flame, Lock, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { Sparrow } from "@/components/mascot/sparrow";
import { ReportProblem } from "@/components/feedback/report-problem";
import { TodayLabel } from "@/components/home/today-label";
import { ToneWord } from "@/components/tone/tone-word";
import { WordPicture } from "@/components/vocab/word-picture";
import { shortTitle } from "@/lib/collection-style";
import { computeUnitProgression } from "@/lib/lesson-progression";
import { liveStreakDays } from "@/lib/streak";
import { getVocabProgress, nextActivity } from "@/lib/vocab-progress";
import { pickContinueCollection, todayUtc, toneOfTheDay } from "@/lib/home";
import { TONE_INFO, type ToneKey } from "@/lib/tones";
import { TONE_COACHING } from "@/lib/tone-coaching";
import { cn } from "@/lib/utils";

const TONE_BG: Record<ToneKey, string> = {
  ngang: "bg-tone-ngang",
  huyen: "bg-tone-huyen",
  sac: "bg-tone-sac",
  hoi: "bg-tone-hoi",
  nga: "bg-tone-nga",
  nang: "bg-tone-nang",
};

/** Home (showcase design): greeting, Continue, Today's goal, Tone of the day. Real data only. */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: streak }, progress, { data: units }, { data: completedChunkRows }] = await Promise.all([
    supabase.from("profiles").select("name, role").eq("id", user.id).single(),
    supabase.from("user_streaks").select("current_streak, last_activity_date").eq("user_id", user.id).maybeSingle(),
    getVocabProgress(supabase),
    supabase.from("units").select("id, collection_id, title, order, source_reference, chunks(id)").order("order", { ascending: true }),
    supabase.from("user_chunk_progress").select("chunk_id").eq("user_id", user.id),
  ]);

  const isStaff = profile?.role === "admin" || profile?.role === "ceo";
  const streakDays = liveStreakDays(streak);
  const today = todayUtc();
  const firstName = profile?.name?.split(" ")[0];

  const cont = pickContinueCollection(progress);
  const next = cont ? nextActivity(cont.collection, progress.get(cont.collection.id)) : null;
  const continueHref = cont ? (next ? `/collections/${cont.collection.id}/${next}` : `/collections/${cont.collection.id}`) : "/collections";

  // Today's goal: only what the app can actually track.
  const finishedActivityToday = [...progress.values()].some((m) => [...m.values()].some((p) => p.last_completed_at.slice(0, 10) === today));
  const practisedToday = streak?.last_activity_date === today;
  const goals = [
    { label: "Finish one activity", done: finishedActivityToday },
    { label: "Practise today to keep your streak", done: practisedToday },
  ];

  const tod = toneOfTheDay();

  const completed = new Set((completedChunkRows ?? []).map((r) => r.chunk_id));
  const progression = computeUnitProgression(
    (units ?? []).map((u) => ({ id: u.id, collection_id: u.collection_id, order: u.order, chunkIds: u.chunks.map((c) => c.id) })),
    completed
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-[18px] md:max-w-2xl">
      <div className="flex items-center justify-between">
        <TodayLabel />
        <div className="flex items-center gap-1">
          <span
            className="flex items-center gap-1.5 rounded-full bg-gold-pill px-3 py-1.5 text-sm font-bold text-gold-text"
            aria-label={`${streakDays}-day streak`}
          >
            <Flame className="size-4 fill-accent-orange text-accent-orange" />
            {streakDays} ngày
          </span>
          <ReportProblem className="-mr-2 md:hidden" />
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <Sparrow mood="waving" size={60} className="bg-muted" />
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]">Xin chào{firstName ? `, ${firstName}` : ""}</h1>
          <p className="text-[15px] text-muted-foreground">Ready for today&apos;s practice?</p>
        </div>
      </div>

      {cont && (
        <section className="flex flex-col gap-3.5 rounded-[26px] bg-hero p-[22px] text-hero-foreground shadow-[0_10px_30px_rgba(14,127,102,0.25)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold tracking-[0.08em] text-hero-muted uppercase">{cont.label}</p>
              <h2 className="text-[28px] leading-[1.1] font-bold tracking-[-0.02em]">{shortTitle(cont.collection).vi}</h2>
              <p className="text-[15px] text-hero-muted">
                {shortTitle(cont.collection).en} · {cont.status.done.length} of {cont.status.total} activities
              </p>
            </div>
            <div className="grid size-16 shrink-0 grid-cols-2 gap-1 rounded-[18px] bg-white/15 p-1.5" aria-hidden>
              {cont.collection.words.slice(0, 4).map((w) => (
                <div key={w.id} className="overflow-hidden rounded-[7px] bg-white/90 dark:bg-white/85">
                  <WordPicture word={w} className="rounded-none border-0 p-0.5" />
                </div>
              ))}
            </div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-hero-accent" style={{ width: `${(cont.status.done.length / cont.status.total) * 100}%` }} />
          </div>
          <Link
            href={continueHref}
            className="flex h-[52px] items-center justify-center rounded-2xl bg-[#fdfbf6] text-[17px] font-bold text-[#0b6b56]"
          >
            {cont.label === "Start" ? "Start" : cont.label === "Continue" ? "Continue lesson" : "Practise again"}
          </Link>
        </section>
      )}

      <section className="flex flex-col gap-3.5 rounded-[22px] border border-border bg-card p-[18px]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Today&apos;s goal</h2>
          <p className="text-sm font-semibold text-primary">
            {goals.filter((g) => g.done).length} of {goals.length}
          </p>
        </div>
        {goals.map((g) => (
          <div key={g.label} className="flex items-center gap-3">
            {g.done ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-hero text-hero-foreground">
                <Check className="size-4" strokeWidth={3} />
              </span>
            ) : (
              <span className="size-7 shrink-0 rounded-full border-2 border-border" />
            )}
            <p className={cn("flex-1 text-base", g.done ? "text-muted-foreground line-through" : "font-medium")}>{g.label}</p>
          </div>
        ))}
      </section>

      <Link href={`/tone-tuner?tone=${tod.tone}`} className="flex items-center gap-4 rounded-[22px] bg-gold-soft px-[18px] py-4">
        <ToneWord text={tod.word} className="w-[70px] shrink-0 text-center text-[44px] leading-none tracking-[-0.02em]" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-xs font-bold tracking-[0.08em] text-gold-text uppercase">Tone of the day</p>
          <p className="text-base font-semibold">
            {TONE_INFO[tod.tone].vi.charAt(0).toUpperCase() + TONE_INFO[tod.tone].vi.slice(1)} · {TONE_INFO[tod.tone].en}
          </p>
          <p className="text-sm text-muted-foreground">{TONE_COACHING[tod.tone].tagline}</p>
        </div>
        <span
          className={cn("flex size-11 shrink-0 items-center justify-center rounded-full text-background", TONE_BG[tod.tone])}
          aria-label={`Practise ${TONE_INFO[tod.tone].vi}`}
        >
          <Mic className="size-[18px]" strokeWidth={2.4} />
        </span>
      </Link>

      {units && units.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold text-muted-foreground">Lessons</h2>
          {units.map((unit) => {
            const status = progression.get(unit.id) ?? "unlocked";
            const locked = status === "locked" || unit.chunks.length === 0;
            const body = (
              <>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{unit.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {unit.chunks.length} chunk{unit.chunks.length === 1 ? "" : "s"}
                    {status === "completed" && " · Completed"}
                  </p>
                </div>
                {locked ? <Lock className="size-4 text-muted-foreground" /> : <ChevronRight className="size-5 text-muted-foreground" />}
              </>
            );
            return locked ? (
              <div key={unit.id} className="flex items-center gap-3 rounded-[18px] border border-border bg-card px-4 py-3 opacity-60">
                {body}
              </div>
            ) : (
              <Link key={unit.id} href={`/lesson/${unit.id}`} className="flex items-center gap-3 rounded-[18px] border border-border bg-card px-4 py-3">
                {body}
              </Link>
            );
          })}
        </section>
      )}

      <div className="flex items-center justify-center gap-3 pt-2">
        {isStaff && (
          <Link href="/admin" className="text-sm font-semibold text-muted-foreground underline-offset-2 hover:underline">
            Admin
          </Link>
        )}
        <SignOutButton />
      </div>
    </div>
  );
}
