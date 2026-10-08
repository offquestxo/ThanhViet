import Image from "next/image";
import { cn } from "@/lib/utils";

export type SparrowMood = "sleeping" | "thinking" | "happy" | "surprised" | "waving" | "worried";

/**
 * The professor sparrow (UI-UX-Design-System.md Section 3, "Avatar"): a
 * small round bubble beside the message it supports — never the main
 * element on screen. Decorative: the text next to it carries the meaning,
 * so it's hidden from screen readers. Art: public/mascot (built by
 * scripts/mascot/build.mjs); the busts sit flush with the bubble's bottom.
 */
export function Sparrow({
  mood,
  size = 56,
  className,
}: {
  mood: SparrowMood;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-primary/10 animate-in fade-in slide-in-from-bottom-1 duration-500",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={`/mascot/sparrow-${mood}.png`}
        alt=""
        width={160}
        height={160}
        className="absolute bottom-0 left-1/2 h-[104%] w-auto max-w-none -translate-x-1/2"
        unoptimized
        loading="eager"
      />
    </span>
  );
}
