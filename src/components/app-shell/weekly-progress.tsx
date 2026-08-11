import { Flame, Star, Award, Medal } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { CardContent } from "@/components/ui/card";

// Sidebar bottom module (Section 5a: "This Week" weekly-progress module
// pinned at the bottom of the compact sidebar). Placeholder-only, same
// boundary as TopBar's streak/XP — this renders on every page under the
// (app) group, including pages with no data fetch of their own, so making
// it real means adding a query at the shared-layout level, not just
// reusing something a single page already fetches. That's real data
// wiring, deliberately out of scope for this pass.
export function WeeklyProgress() {
  return (
    <AppCard className="mt-auto">
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          This Week
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex size-6 items-center justify-center rounded-full bg-accent-orange/15">
            <Flame className="size-3.5 text-accent-orange" strokeWidth={2} />
          </span>
          <span className="text-muted-foreground">Day Streak</span>
          <span className="ml-auto font-medium">—</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex size-6 items-center justify-center rounded-full bg-accent/15">
            <Star className="size-3.5 text-accent" strokeWidth={2} />
          </span>
          <span className="text-muted-foreground">Total XP</span>
          <span className="ml-auto font-medium">—</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/15">
            <Medal className="size-3.5 text-primary" strokeWidth={2} />
          </span>
          <span className="text-muted-foreground">Journeys Completed</span>
          <span className="ml-auto font-medium">—</span>
        </div>
        <div className="mt-1 flex items-center gap-2 border-t border-border pt-3 text-xs">
          <Award className="size-4 text-accent" strokeWidth={1.75} />
          <span className="text-muted-foreground">Next badge: Confident Reader</span>
        </div>
      </CardContent>
    </AppCard>
  );
}
