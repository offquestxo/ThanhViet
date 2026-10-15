import type { ToneKey } from "./tones";

/**
 * Per-tone coaching copy for the Tone Tuner. DRAFT — every line here needs a
 * native speaker's check before it's final (showcase handoff, Oct 2026).
 *
 * dial: what the left and right ends of the tuner dial mean for this tone.
 * tip:  one line shown beside the sparrow while practising.
 * tagline: short description for "Tone of the day".
 */
export const TONE_COACHING: Record<ToneKey, { dial: [string, string]; tip: string; tagline: string }> = {
  ngang: { dial: ["Drifting down", "Drifting up"], tip: "Keep it flat and steady, like a held note.", tagline: "Flat and steady" },
  huyen: { dial: ["Fall more", "Too high"], tip: "Start mid, then let it sink gently.", tagline: "Start mid, sink gently" },
  sac: { dial: ["Rise more", "Too much"], tip: "Start low, then glide up, like asking “huh?”", tagline: "Glide up" },
  hoi: { dial: ["Dip more", "Too much"], tip: "Dip down, then come back up a little.", tagline: "Dip, then up a little" },
  nga: { dial: ["Add the break", "Too much"], tip: "Rise, catch in the middle, rise again.", tagline: "Rise, catch, rise again" },
  nang: { dial: ["Drop and cut", "Too long"], tip: "Drop low and cut it short.", tagline: "Drop low, cut short" },
};
