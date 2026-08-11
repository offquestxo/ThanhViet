import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reserved slot for the sparrow mascot's speech-bubble moment (Section 5a:
 * "Xin chào, Jay! / You're doing great!"). Real reference art exists now
 * but integration is explicitly deferred to the later polish pass — this
 * renders nothing on purpose. Swap the `null` for the real component when
 * that pass starts; the slot/prop shape stays the same either way.
 */
function MascotBubble() {
  return null;
}

/**
 * Hero card — Section 5a: solid emerald fill (not the earlier photo/ambient
 * treatment, which assumed imagery that doesn't exist yet), large title,
 * progress bar, dual CTAs. The clear dominant visual element on the page.
 *
 * `unitTitle`/`unitHref`/`sourceReference` are real, already-fetched data
 * (the Home page's existing `units` query) — reused here, not a new fetch.
 * `progressPercent` stays a fixed placeholder: per-user progress toward a
 * unit isn't computed anywhere yet (no page queries user_chunk_progress),
 * so this shows an honest empty bar rather than a fabricated percentage.
 */
export function HeroCard({
  unitTitle,
  unitHref,
  sourceReference,
}: {
  unitTitle: string;
  unitHref: string;
  sourceReference?: string | null;
}) {
  const progressPercent = 0;

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-primary p-8 text-primary-foreground shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold tracking-wide uppercase opacity-80">
        Continue your journey
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{unitTitle}</h1>
      {sourceReference && (
        <p className="mt-1 text-sm opacity-80">{sourceReference}</p>
      )}

      <div className="mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-primary-foreground/20">
        <div
          className="h-full rounded-full bg-primary-foreground transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          asChild
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          <Link href={unitHref}>
            <Play className="size-4" strokeWidth={2} />
            Continue Journey
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Link href={unitHref}>View Journey</Link>
        </Button>
      </div>

      <MascotBubble />
    </div>
  );
}
