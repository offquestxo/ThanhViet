import { TONE_INFO, TONE_ORDER, type ToneKey } from "@/lib/tones";
import { cn } from "@/lib/utils";

const ON_JADE: Record<ToneKey, string> = {
  ngang: "text-panel-tone-ngang",
  huyen: "text-panel-tone-huyen",
  sac: "text-panel-tone-sac",
  hoi: "text-panel-tone-hoi",
  nga: "text-panel-tone-nga",
  nang: "text-panel-tone-nang",
};

/**
 * The dark jade screen behind Welcome, Log in and Sign up (showcase
 * "Welcome" design). Dark jade in both light and dark mode, so it uses the
 * light-on-dark tone colors. Pads for the notch and home indicator.
 */
export function JadeScreen({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main
      className={cn(
        "flex min-h-dvh flex-col bg-[#14524a] px-7 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+2.5rem)] text-[#fdfbf6]",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-7">{children}</div>
    </main>
  );
}

/** a à á ả ã ạ, each in its tone color. */
export function ToneRow({ size = "lg" }: { size?: "lg" | "sm" }) {
  return (
    <div className="flex justify-center gap-2.5" aria-label="The six tones: a, à, á, ả, ã, ạ" lang="vi">
      {TONE_ORDER.map((t) => (
        <span
          key={t}
          aria-hidden
          className={cn(
            "flex items-center justify-center rounded-[14px] bg-white/10 font-bold",
            size === "lg" ? "h-[54px] w-[46px] text-[30px]" : "h-10 w-9 text-xl",
            ON_JADE[t]
          )}
          title={TONE_INFO[t].vi}
        >
          {TONE_INFO[t].letter}
        </span>
      ))}
    </div>
  );
}

export const jadeInput =
  "h-14 w-full rounded-2xl border-0 bg-[#fdfbf6] px-4 text-base text-[#1f2a27] placeholder:text-[#6b7268] outline-none focus-visible:ring-4 focus-visible:ring-[#3fd19a]/50";
export const jadePrimary =
  "flex h-[58px] w-full items-center justify-center rounded-[18px] bg-[#fdfbf6] text-[17px] font-bold text-[#14524a] disabled:opacity-60";
export const jadeSecondary =
  "flex h-[52px] w-full items-center justify-center rounded-[18px] border-[1.5px] border-white/35 text-base font-semibold text-[#fdfbf6]";
