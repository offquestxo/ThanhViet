import type { VocabWord } from "@/lib/content";
import { cn } from "@/lib/utils";

/** A word's picture: an openly licensed icon (Food) or a generated colour swatch (Colors). */
export function WordPicture({ word, className }: { word: VocabWord; className?: string }) {
  if (word.swatch) {
    const style =
      word.swatch === "rainbow"
        ? { background: "conic-gradient(#E53935, #FB8C00, #FDD835, #43A047, #1E88E5, #8E24AA, #E53935)" }
        : { background: word.swatch };
    return (
      <div
        role="img"
        aria-label={word.meaning}
        className={cn("aspect-square w-full rounded-2xl border border-border/70 shadow-inner", className)}
        style={style}
      />
    );
  }
  if (word.image) {
    // eslint-disable-next-line @next/next/no-img-element -- tiny local SVGs; next/image adds nothing here
    return <img src={word.image} alt={word.meaning} className={cn("aspect-square w-full object-contain p-2", className)} />;
  }
  return null;
}
