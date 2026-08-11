import { Flame, Star, Target, BookOpen } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StatCard({
  icon: Icon,
  iconClassName,
  value,
  label,
  hint,
  muted = false,
}: {
  icon: React.ElementType;
  iconClassName: string;
  value: string;
  label: string;
  hint: string;
  muted?: boolean;
}) {
  return (
    <AppCard className={cn(muted && "opacity-60")}>
      <CardContent className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            iconClassName
          )}
        >
          <Icon className="size-4.5" strokeWidth={2} />
        </span>
        <div>
          <p className="text-lg font-semibold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
      <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent>
    </AppCard>
  );
}

/**
 * Four compact stat cards (Section 5a). Streak stays placeholder — never
 * fetched anywhere (see WeeklyProgress's note). XP reuses `totalPoints`,
 * already fetched by the Home page's existing profile query — not new
 * wiring. Tone Accuracy and Reading Readiness are genuinely undefined
 * (Tone Tuner engine doesn't exist yet; Reading Readiness has no formula
 * or source table — PRD Section 8) — shown muted with a dash rather than
 * hidden outright, so the four-card rhythm holds without faking numbers.
 */
export function StatCards({ totalPoints }: { totalPoints: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={Flame}
        iconClassName="bg-accent-orange/15 text-accent-orange"
        value="—"
        label="Day Streak"
        hint="Not tracked yet"
      />
      <StatCard
        icon={Star}
        iconClassName="bg-accent/15 text-accent"
        value={String(totalPoints)}
        label="Total XP"
        hint="Real — from your profile"
      />
      <StatCard
        icon={Target}
        iconClassName="bg-secondary/15 text-secondary"
        value="—"
        label="Tone Accuracy"
        hint="Coming in Phase 1b"
        muted
      />
      <StatCard
        icon={BookOpen}
        iconClassName="bg-primary/15 text-primary"
        value="—"
        label="Reading Readiness"
        hint="Not yet defined"
        muted
      />
    </div>
  );
}
