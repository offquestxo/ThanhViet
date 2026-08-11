import type { LucideIcon } from "lucide-react";
import { Section } from "@/components/ui/section";
import { AppCard } from "@/components/ui/app-card";
import { CardContent } from "@/components/ui/card";

// Placeholder screen for nav destinations that don't have real content yet
// (Stage 3+). Structural only — demonstrates Section/AppCard, no data.
export function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Section title={title}>
      <AppCard>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </AppCard>
    </Section>
  );
}
