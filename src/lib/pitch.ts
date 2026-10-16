import type { ToneKey } from "./tones";

/**
 * Pitch for the Tone Tuner needle — small, dependency-free.
 *
 * 1. detectPitch(): YIN pitch estimate (de Cheveigné & Kawahara, 2002) for
 *    one frame of microphone audio, 70–500 Hz (adult speaking range).
 * 2. toneDeflection(): where the needle points for a tone, -1 (left) … +1
 *    (right), from a pitch trace. The same explainable measure is used live
 *    (trace from detectPitch) and after analysis (the engine's pitch line).
 *    It is a hint, not a score: left = "not enough of this tone's movement
 *    yet", right = "too much", centre = about right.
 */

const MIN_HZ = 70;
const MAX_HZ = 500; // women's sắc can peak above 400 Hz
const YIN_THRESHOLD = 0.2;
const YIN_FALLBACK = 0.35; // accept the best dip if nothing beats the threshold
const SILENCE_RMS = 0.01;

/** Fundamental frequency of one frame (Hz), or null for silence / unvoiced. */
export function detectPitch(frame: Float32Array, sampleRate: number): number | null {
  let energy = 0;
  for (let i = 0; i < frame.length; i++) energy += frame[i] * frame[i];
  if (Math.sqrt(energy / frame.length) < SILENCE_RMS) return null;

  const tauMin = Math.floor(sampleRate / MAX_HZ);
  const tauMax = Math.min(Math.floor(sampleRate / MIN_HZ), Math.floor(frame.length / 2));
  const window = frame.length - tauMax;
  if (window < tauMin) return null;

  // Difference function + cumulative mean normalisation, in one pass.
  const d = new Float32Array(tauMax + 1);
  let running = 0;
  d[0] = 1;
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let j = 0; j < window; j++) {
      const diff = frame[j] - frame[j + tau];
      sum += diff * diff;
    }
    running += sum;
    d[tau] = running > 0 ? (sum * tau) / running : 1;
  }

  // First dip under the threshold (then walk to its local minimum); if none,
  // the deepest dip, as long as it is still clearly periodic.
  let tau = tauMin;
  for (; tau <= tauMax; tau++) {
    if (d[tau] < YIN_THRESHOLD) {
      while (tau + 1 <= tauMax && d[tau + 1] < d[tau]) tau++;
      break;
    }
  }
  if (tau > tauMax) {
    let best = tauMin;
    for (let t = tauMin + 1; t <= tauMax; t++) if (d[t] < d[best]) best = t;
    if (d[best] >= YIN_FALLBACK) return null;
    tau = best;
  }

  // Parabolic interpolation around the minimum for sub-sample accuracy.
  const a = d[tau - 1] ?? d[tau];
  const b = d[tau];
  const c = d[tau + 1] ?? d[tau];
  const shift = a + c - 2 * b === 0 ? 0 : (a - c) / (2 * (a + c - 2 * b));
  const hz = sampleRate / (tau + shift);
  return hz >= MIN_HZ && hz <= MAX_HZ ? hz : null;
}

export type PitchPoint = { tMs: number; hz: number | null };

const median = (xs: number[]) => {
  const s = [...xs].sort((p, q) => p - q);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const clamp = (x: number) => Math.max(-1, Math.min(1, x));

/**
 * True if voicing stops and restarts mid-word (unvoiced readings between
 * voiced ones, away from the edges) — the ngã "break". Works for any frame
 * rate: the live tracker (~25 ms) and the engine's line (~10 ms).
 */
export function hasMidBreak(trace: PitchPoint[]): boolean {
  const first = trace.findIndex((p) => p.hz !== null);
  const last = trace.length - 1 - [...trace].reverse().findIndex((p) => p.hz !== null);
  if (first < 0 || last - first < 4) return false;
  const span = trace[last].tMs - trace[first].tMs;
  let gapStart: number | null = null;
  for (let i = first + 1; i <= last; i++) {
    if (trace[i].hz === null) {
      if (gapStart === null) gapStart = trace[i - 1].tMs;
    } else if (gapStart !== null) {
      const gap = trace[i].tMs - gapStart;
      const at = (gapStart - trace[first].tMs) / span;
      // One frame step plus 20 ms: at 40 readings/s a ~70 ms break shows as a
      // single unvoiced reading, because each 43 ms window overlaps it.
      if (gap >= 20 + (trace[i].tMs - trace[i - 1].tMs) && at > 0.1 && at < 0.9) return true;
      gapStart = null;
    }
  }
  return false;
}

/**
 * Needle position for `tone` from a pitch trace, in [-1, 1], or null when
 * there isn't enough voiced audio yet. Everything is in semitones relative
 * to the start of the syllable, so it works for any voice:
 *   ngang: drift from level (±4 st = full scale)   left "Drifting down" / right "Drifting up"
 *   huyền: how far it falls      (target 2.5 st)    left "Fall more" / right "Too high"
 *   sắc:   how far it rises      (target 6.5 st)    left "Rise more" / right "Too much"
 *   hỏi:   how deep it dips      (target 3 st)      left "Dip more" / right "Too much"
 *   ngã:   rise (target 6 st), and a mid-word break left "Add the break" / right "Too much"
 *   nặng:  drop, and being cut short               left "Drop and cut" / right "Too long"
 * Targets are the median movement in 60 real isolated words (Lingua Libre +
 * Wikimedia Vi-hanoi, Oct 2026), scaled so the middle half of those
 * correctly-pronounced words lands within ±0.5 of centre. Provisional:
 * recalibrate when the native reference recordings arrive.
 */
export function toneDeflection(tone: ToneKey, trace: PitchPoint[], breakDetected?: boolean): number | null {
  const voiced = trace.filter((p): p is { tMs: number; hz: number } => p.hz !== null);
  if (voiced.length < 4) return null;
  const st = voiced.map((p) => 12 * Math.log2(p.hz / voiced[0].hz));
  const n = st.length;
  const edge = Math.max(2, Math.round(n * 0.2));
  const start = median(st.slice(0, edge));
  const end = median(st.slice(n - edge));
  const low = Math.min(...st.slice(1, n - 1));
  const change = end - start;
  const amount = (value: number, target: number, scale: number) => clamp((value - target) / scale);

  switch (tone) {
    case "ngang":
      return clamp(change / 4);
    case "huyen":
      return amount(-change, 2.5, 2.5);
    case "sac":
      return amount(end - Math.min(start, low), 6.5, 5);
    case "hoi":
      return amount(start - low, 3, 3);
    case "nga": {
      const rise = amount(end - Math.min(start, low), 6, 5);
      const broke = breakDetected ?? hasMidBreak(trace);
      // No break yet: stay on the "Add the break" side however much it rose.
      return broke ? rise : Math.min(rise, -0.4);
    }
    case "nang": {
      // Real nặng barely falls (median 0.6 st) — it is short and creaky. So
      // the drop counts gently, and being cut short counts as much.
      const drop = amount(start - end, 0.5, 4);
      const voicedMs = voiced[n - 1].tMs - voiced[0].tMs;
      if (voicedMs > 450) return Math.max(drop, 0.5); // held on: "Too long"
      return voicedMs <= 300 ? drop / 2 : drop;
    }
  }
}

/**
 * Final needle after analysis. Green belongs to IN TUNE (both models heard
 * the word and tone), so without it the needle settles outside the green
 * zone (|value| ≥ 0.25), on the side the pitch line points to.
 */
export function settledDeflection(raw: number | null): number {
  const v = raw ?? -0.5;
  if (Math.abs(v) >= 0.25) return v;
  return v < 0 ? -0.25 : 0.25;
}
