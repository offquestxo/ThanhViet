import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { Section } from "@/components/ui/section";
import { AppCard } from "@/components/ui/app-card";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeroCard } from "@/components/home/hero-card";
import { StatCards } from "@/components/home/stat-cards";
import { CollectionsGrid } from "@/components/home/collections-grid";
import { RecentlyPracticed } from "@/components/home/recently-practiced";
import { TodayGoal } from "@/components/home/today-goal";
import { LeaderboardCard } from "@/components/home/leaderboard-card";
import { WeakWordsCard } from "@/components/home/weak-words-card";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Proves RLS is wired correctly: this reads the caller's own profile row
  // through the anon-key client, scoped by the "profiles visible to self,
  // approved members, and staff" policy — no service_role needed.
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, total_points, accent_pref, role")
    .eq("id", user.id)
    .single();

  const isStaff = profile?.role === "admin" || profile?.role === "ceo";

  // Only chunk *counts* here now, not the chunks themselves — showing full
  // vietnamese_text/english_text pairs on the dashboard (the old behavior)
  // spoiled every chunk's translation before the learner ever hit
  // "Encounter," working directly against the concept-first design (Section
  // 1a: no English shown before context). Real content only loads inside
  // the actual lesson flow now (/lesson/[unitId]).
  const { data: units } = await supabase
    .from("units")
    .select("id, title, order, source_reference, chunks(id)")
    .order("order", { ascending: true });

  // Hero's "current journey" — real, reused data: the first unit with
  // chunks to actually practice, falling back to the first unit overall.
  // Not the real i+1/next-unit-selection algorithm (unbuilt) — just the
  // simplest honest choice from what's already fetched.
  const heroUnit =
    units?.find((u) => u.chunks.length > 0) ?? units?.[0] ?? null;

  // Real Collections — same RLS-gated read path as units/chunks. Nested
  // embed verified against the live schema before wiring it up here (same
  // discipline as the lesson page's units->chunks->chunk_words->words
  // query). Only a real unit *count* per collection, not a fabricated
  // completion percentage — no per-user progress-through-a-collection is
  // computed anywhere yet.
  const { data: collectionsData } = await supabase
    .from("collections")
    .select("id, title, icon_key, theme_key, units(id)")
    .order("order", { ascending: true });

  const collections =
    collectionsData?.map((c) => ({
      id: c.id,
      title: c.title,
      unitCount: c.units.length,
      iconKey: c.icon_key,
      themeKey: c.theme_key,
    })) ?? [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      {/* Greeting row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Xin chào{profile?.name ? `, ${profile.name}` : ""}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Ready to continue your Vietnamese journey?
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isStaff && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">Admin</Link>
            </Button>
          )}
          <SignOutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Center column */}
        <div className="flex min-w-0 flex-col gap-8">
          {heroUnit ? (
            <HeroCard
              unitTitle={heroUnit.title}
              unitHref={`/lesson/${heroUnit.id}`}
              sourceReference={heroUnit.source_reference}
            />
          ) : (
            <AppCard>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No units yet — add one with{" "}
                <code className="text-xs">npm run seed -- &lt;file&gt;</code>.
              </CardContent>
            </AppCard>
          )}

          <StatCards totalPoints={profile?.total_points ?? 0} />

          {units && units.length > 0 && (
            <Section title="Lessons">
              <ul className="flex flex-col gap-4">
                {units.map((unit) => (
                  <li key={unit.id}>
                    <AppCard>
                      <CardContent className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{unit.title}</p>
                          {unit.source_reference && (
                            <p className="text-xs text-muted-foreground">
                              {unit.source_reference}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {unit.chunks.length} chunk
                            {unit.chunks.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        {unit.chunks.length > 0 ? (
                          <Button size="sm" asChild>
                            <Link href={`/lesson/${unit.id}`}>Start lesson</Link>
                          </Button>
                        ) : (
                          <span className="text-xs whitespace-nowrap text-muted-foreground">
                            No chunks yet
                          </span>
                        )}
                      </CardContent>
                    </AppCard>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section
            title="Your Collections"
            action={
              <Link
                href="/collections"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View all collections →
              </Link>
            }
          >
            <CollectionsGrid collections={collections} />
          </Section>

          <Section title="Recently Practiced">
            <RecentlyPracticed />
          </Section>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-8">
          <TodayGoal />
          <LeaderboardCard />
          <WeakWordsCard />
        </div>
      </div>
    </div>
  );
}
