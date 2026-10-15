import type { ToneKey } from "@/lib/tones";
import { cn } from "@/lib/utils";

// Geometry from the approved comp (TunerListening.dc.html): a 120° arc
// (±60° from vertical) centred on the hub at (165,180), ticks every 5°,
// majors every 15°, and a ±10° green "in tune" zone just outside the arc.
const CX = 165;
const CY = 180;
const R = 140;
const NEEDLE = 134;

const NEEDLE_COLOR: Record<ToneKey, string> = {
  ngang: "var(--panel-tone-ngang)",
  huyen: "var(--panel-tone-huyen)",
  sac: "var(--panel-tone-sac)",
  hoi: "var(--panel-tone-hoi)",
  nga: "var(--panel-tone-nga)",
  nang: "var(--panel-tone-nang)",
};

// Rounded to 0.1px: server and browser can differ in the last float digits
// of sin/cos, which would otherwise cause a hydration mismatch.
const round1 = (n: number) => Math.round(n * 10) / 10;

function polar(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return { x: round1(CX + r * Math.sin(a)), y: round1(CY - r * Math.cos(a)) };
}

function arc(fromDeg: number, toDeg: number, r: number) {
  const a = polar(fromDeg, r);
  const b = polar(toDeg, r);
  return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
}

const TICKS = Array.from({ length: 25 }, (_, i) => -60 + i * 5);

export type DialState = "idle" | "listening" | "checking" | "in-tune" | "rest";

/**
 * The tuner dial on the dark jade panel. `state` drives the needle:
 *   idle / rest — parked at the centre, dimmed
 *   listening   — a gentle sweep while the learner speaks
 *   checking    — a slower sweep while the engine analyses
 *   in-tune     — snaps into the green zone, needle and zone turn green
 * (A position for "not in tune yet" waits on the needle decision — see
 * docs/design/showcase-2026-10/BUILD-PLAN.md §4.)
 */
export function TunerDial({ tone, state, label }: { tone: ToneKey; state: DialState; label: string }) {
  const inTune = state === "in-tune";
  const color = inTune ? "var(--in-tune)" : NEEDLE_COLOR[tone];
  const tip = polar(0, NEEDLE);
  return (
    <svg viewBox="0 0 330 196" className="block h-auto w-full max-w-[330px]" role="img" aria-label={label}>
      <path d={arc(-60, 60, R)} fill="none" stroke="rgba(207,229,221,0.18)" strokeWidth={10} strokeLinecap="round" />
      <path
        d={arc(-10, 10, 150)}
        fill="none"
        stroke={inTune ? "var(--in-tune)" : "rgba(63,209,154,0.35)"}
        strokeWidth={8}
        strokeLinecap="round"
        className="transition-[stroke] duration-500"
      />
      <g stroke="var(--panel-muted)" strokeLinecap="round">
        {TICKS.map((deg) => {
          const major = deg % 15 === 0;
          const centre = deg === 0;
          const outer = polar(deg, R);
          const inner = polar(deg, R - (centre ? 18 : major ? 18 : 10));
          return (
            <line
              key={deg}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              strokeWidth={centre ? 3 : major ? 2.5 : 1.5}
              stroke={centre ? "var(--in-tune)" : undefined}
            />
          );
        })}
      </g>
      <g
        className={cn(
          "tuner-needle",
          state === "listening" && "tuner-needle--sweep",
          state === "checking" && "tuner-needle--sweep-slow",
          inTune && "tuner-needle--in-tune"
        )}
        style={{ opacity: state === "idle" || state === "rest" ? 0.45 : 1 }}
      >
        <line x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke={color} strokeWidth={4} strokeLinecap="round" className="transition-[stroke] duration-500" />
        <circle cx={CX} cy={CY} r={11} fill={color} className="transition-[fill] duration-500" />
        <circle cx={CX} cy={CY} r={4} fill="var(--panel)" />
      </g>
    </svg>
  );
}
