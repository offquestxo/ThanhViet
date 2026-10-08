import { TONE_LABELS, type Syllable } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * A Vietnamese word/phrase with each syllable's tone-bearing letter
 * highlighted, and the tone names underneath. Tones and mark positions come
 * from the content files (computed by syllable_tone() at build time).
 */
export function ToneWord({
  syllables,
  size = "lg",
  showToneNames = true,
}: {
  syllables: Syllable[];
  size?: "md" | "lg";
  showToneNames?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-2">
      {syllables.map((s, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className={cn("font-semibold tracking-tight", size === "lg" ? "text-5xl" : "text-3xl")}>
            {[...s.text].map((ch, j) => (
              <span key={j} className={j === s.mark_index ? "text-primary" : undefined}>
                {ch}
              </span>
            ))}
          </span>
          {showToneNames && (
            <span className="mt-1 text-xs text-muted-foreground">
              {TONE_LABELS[s.tone].vi} · {TONE_LABELS[s.tone].en}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
