import { Trophy } from "lucide-react";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { AppCard } from "@/components/ui/app-card";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Structural placeholder — styled per Section 1's "Friends Leaderboard"
// visual language but sourced from the real group-wide `leaderboard` view
// once wired (not a friends/social graph, which doesn't exist). Reading
// from that view is real-data work for a later pass ("Real leaderboard/
// progress data" in the feature-first roadmap) — not this one.
export function LeaderboardCard() {
  return (
    <Section title="Leaderboard">
      <AppCard>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Trophy className="size-6 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            Not reading real standings yet — the group-wide leaderboard view
            already exists in the database.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/leaderboard">View leaderboard</Link>
          </Button>
        </CardContent>
      </AppCard>
    </Section>
  );
}
