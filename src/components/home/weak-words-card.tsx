import { Sparkles } from "lucide-react";
import { Section } from "@/components/ui/section";
import { AppCard } from "@/components/ui/app-card";
import { CardContent } from "@/components/ui/card";

// Structural placeholder — real rows need both per-user word-level
// performance data (not tracked anywhere yet) and an SRS flashcard review
// destination for the "Practice" button (Section 1's resolved routing —
// not the Tone Tuner — but that screen doesn't exist yet either).
export function WeakWordsCard() {
  return (
    <Section title="Weak Words">
      <AppCard>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Sparkles className="size-6 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            Fills in once word-level performance tracking and the SRS
            flashcard review screen both exist.
          </p>
        </CardContent>
      </AppCard>
    </Section>
  );
}
