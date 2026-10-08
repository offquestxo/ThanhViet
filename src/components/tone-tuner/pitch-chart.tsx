import type { Acoustic } from "./types";

/**
 * The learner's pitch contour as a line, with glottal voice breaks (creak)
 * shaded. Frames with no pitch are gaps in the line — never interpolated —
 * because a real gap is the signature of ngã/nặng, not noise.
 */
export function PitchChart({ acoustic }: { acoustic: Acoustic }) {
  const frames = acoustic.pitch_contour ?? [];
  const voiced = frames.filter((f) => f.f0_hz !== null) as { t_ms: number; f0_hz: number }[];
  if (voiced.length < 2) return null;

  const W = 320;
  const H = 140;
  const pad = 12;
  const t0 = frames[0].t_ms;
  const t1 = frames[frames.length - 1].t_ms;
  const lo = Math.min(...voiced.map((f) => f.f0_hz)) * 0.9;
  const hi = Math.max(...voiced.map((f) => f.f0_hz)) * 1.1;
  const x = (t: number) => pad + ((t - t0) / Math.max(1, t1 - t0)) * (W - 2 * pad);
  // Semitone-ish (log) vertical scale, so the line reads like heard pitch.
  const y = (f: number) => H - pad - ((Math.log(f) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * (H - 2 * pad);

  // Split into runs at unvoiced frames: each run is one polyline.
  const runs: string[] = [];
  let current: string[] = [];
  for (const f of frames) {
    if (f.f0_hz === null) {
      if (current.length) runs.push(current.join(" "));
      current = [];
    } else {
      current.push(`${x(f.t_ms).toFixed(1)},${y(f.f0_hz).toFixed(1)}`);
    }
  }
  if (current.length) runs.push(current.join(" "));

  const breaks = acoustic.voice_breaks ?? [];
  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Your pitch contour">
        <rect x={0} y={0} width={W} height={H} rx={10} className="fill-muted/50" />
        {breaks.map((b, i) => (
          <rect
            key={i}
            x={x(b.start_ms)}
            y={pad / 2}
            width={Math.max(3, x(b.end_ms) - x(b.start_ms))}
            height={H - pad}
            className="fill-accent-orange/25"
          />
        ))}
        {runs.map((pts, i) =>
          pts.includes(" ") ? (
            <polyline key={i} points={pts} fill="none" className="stroke-primary" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <circle key={i} cx={pts.split(",")[0]} cy={pts.split(",")[1]} r={2} className="fill-primary" />
          )
        )}
      </svg>
      <figcaption className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>Your pitch over time</span>
        {breaks.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-sm bg-accent-orange/40" /> voice break (creak)
          </span>
        )}
      </figcaption>
    </figure>
  );
}
