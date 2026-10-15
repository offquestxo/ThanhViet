import { TONE_INFO, textTones, toneTokens, type ToneKey } from "@/lib/tones";
import { cn } from "@/lib/utils";

/** Tone-letter color per surface. Ngang has no tone mark, so in a word it keeps the text color. */
const GLYPH: Record<"default" | "panel", Record<Exclude<ToneKey, "ngang">, string>> = {
  default: {
    huyen: "text-tone-huyen",
    sac: "text-tone-sac",
    hoi: "text-tone-hoi",
    nga: "text-tone-nga",
    nang: "text-tone-nang",
  },
  panel: {
    huyen: "text-panel-tone-huyen",
    sac: "text-panel-tone-sac",
    hoi: "text-panel-tone-hoi",
    nga: "text-panel-tone-nga",
    nang: "text-panel-tone-nang",
  },
};

export const TONE_TEXT_CLASS: Record<ToneKey, string> = {
  ngang: "text-tone-ngang-text",
  huyen: "text-tone-huyen-text",
  sac: "text-tone-sac-text",
  hoi: "text-tone-hoi-text",
  nga: "text-tone-nga-text",
  nang: "text-tone-nang-text",
};

/**
 * A Vietnamese word or phrase with the tone-carrying letter of each
 * syllable colored by that syllable's tone (tones computed by the TS port
 * of syllable_tone(), src/lib/tones.ts). Color is never the only signal:
 * pass `showToneNames` (or render the names nearby) wherever the tone
 * matters. Size and weight come from `className`.
 */
export function ToneWord({
  text,
  surface = "default",
  showToneNames = false,
  className,
  namesClassName,
}: {
  text: string;
  /** "panel" = on the dark jade tuner panel (light-on-dark tone colors). */
  surface?: "default" | "panel";
  showToneNames?: boolean;
  className?: string;
  namesClassName?: string;
}) {
  const tokens = toneTokens(text);
  const word = (
    <span className={cn("font-bold tracking-tight", className)} lang="vi">
      {tokens.map((t, i) =>
        t.tone && t.tone !== "ngang" && t.markIndex >= 0 ? (
          <span key={i}>
            {[...t.text].map((ch, j) => (
              <span key={j} className={j === t.markIndex ? GLYPH[surface][t.tone as Exclude<ToneKey, "ngang">] : undefined}>
                {ch}
              </span>
            ))}
          </span>
        ) : (
          <span key={i}>{t.text}</span>
        )
      )}
    </span>
  );
  if (!showToneNames) return word;
  return (
    <span className="inline-flex flex-col items-center">
      {word}
      <ToneNames text={text} className={namesClassName} />
    </span>
  );
}

/** "sắc · rising" for one syllable, "sắc + ngang" for several. */
export function ToneNames({ text, className }: { text: string; className?: string }) {
  const tones = textTones(text);
  return (
    <span className={cn("text-sm font-medium text-muted-foreground", className)}>
      {tones.length === 1
        ? `${TONE_INFO[tones[0]].vi} · ${TONE_INFO[tones[0]].en}`
        : tones.map((t) => TONE_INFO[t].vi).join(" + ")}
    </span>
  );
}
