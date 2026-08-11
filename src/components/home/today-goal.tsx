import { BookOpen, AudioWaveform, Volume2, Flag } from "lucide-react";
import { Section } from "@/components/ui/section";
import { AppCard } from "@/components/ui/app-card";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GOAL_ITEMS = [
  { label: "Learn 12 New Words", icon: BookOpen, accent: "bg-primary/15 text-primary" },
  // Hidden/degraded per the Phase 1a/1b split (UI-UX §1, PRD §5) — Tone
  // Tuner's engine doesn't exist yet, so this stays visibly disabled
  // rather than a fake checkmark.
  {
    label: "Practice Tone Tuner",
    icon: AudioWaveform,
    accent: "bg-muted text-muted-foreground",
    disabled: true,
  },
  { label: "Read Today's Scripture", icon: Volume2, accent: "bg-accent/15 text-accent" },
  { label: "Complete Journey", icon: Flag, accent: "bg-secondary/15 text-secondary" },
] as const;

export function TodayGoal() {
  return (
    <Section title="Today's Goal">
      <AppCard>
        <CardContent className="flex flex-col gap-3">
          {GOAL_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-3 text-sm",
                  "disabled" in item && item.disabled && "opacity-50"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    item.accent
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <span className="flex-1">{item.label}</span>
                <span className="size-4 shrink-0 rounded-full border-2 border-border" />
              </div>
            );
          })}
        </CardContent>
      </AppCard>
    </Section>
  );
}
