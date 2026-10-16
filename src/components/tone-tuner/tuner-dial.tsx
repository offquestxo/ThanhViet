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
 *   idle        — parked at the centre, dimmed
 *   listening   — follows the live pitch tracker (`needle`), or a gentle
 *                 sweep until any voice is heard
 *   checking    — a slower sweep while the engine analyses
 *   in-tune     — snaps into the green zone, needle and zone turn green
 *   rest        — settles at `needle` (from the engine's pitch line), or
 *                 centre-dimmed when there's no pitch reading
 * `needle` is -1 (left) … +1 (right), mapped onto the ±60° arc.
 */
export function TunerDial({
  tone,
  state,
  label,
  needle = null,
}: {
  tone: ToneKey;
  state: DialState;
  label: string;
  needle?: number | null;
}) {
  const inTune = state === "in-tune";
  const tracked = !inTune && needle !== null && (state === "listening" || state === "rest");
  const color = inTune ? "var(--in-tune)" : NEEDLE_COLOR[tone];
  const tip = polar(0, NEEDLE);
  return (
    <svg viewBox="0 0 330 196" className="block h-auto w-full max-w-[290px]" role="img" aria-label={label}>
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
          state === "listening" && !tracked && "tuner-needle--sweep",
          state === "listening" && tracked && "tuner-needle--live",
          state === "checking" && "tuner-needle--sweep-slow",
          inTune && "tuner-needle--in-tune"
        )}
        style={{
          opacity: state === "idle" || (state === "rest" && !tracked) ? 0.45 : 1,
          ...(tracked ? { transform: `rotate(${(needle * 60).toFixed(1)}deg)` } : {}),
        }}
      >
        <line x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke={color} strokeWidth={4} strokeLinecap="round" className="transition-[stroke] duration-500" />
        <circle cx={CX} cy={CY} r={11} fill={color} className="transition-[fill] duration-500" />
        <circle cx={CX} cy={CY} r={4} fill="var(--panel)" />
      </g>
    </svg>
  );
}
