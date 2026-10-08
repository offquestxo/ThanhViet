import type { Syllable } from "@/lib/content";

export type SyllableCheck = {
  expected: string;
  heard: string | null;
  expected_tone: string;
  heard_tone: string | null;
  verdict: "match" | "tone_mismatch" | "different_word" | "missing";
};

export type ModelOpinion =
  | { status: "ok"; transcript: string; verdict: string; syllables: SyllableCheck[] }
  | { status: "unavailable"; reason?: string };

export type Agreement =
  | "both_match"
  | "both_tone_mismatch_same"
  | "both_tone_mismatch_different"
  | "both_same_other_word"
  | "disagree"
  | "unclear"
  | "partial_unavailable";

export type Acoustic = {
  status: "ok" | "skipped_multisyllable" | "invalid_audio" | "error";
  calibrated: false;
  pitch_contour?: { t_ms: number; f0_hz: number | null }[];
  voice_breaks?: { start_ms: number; end_ms: number }[];
  issues?: { code: string; message: string }[];
};

export type AnalyzeResult = {
  target_text: string;
  target_syllables: Pick<Syllable, "text" | "tone">[];
  acoustic: Acoustic;
  phowhisper: ModelOpinion;
  parakeet: ModelOpinion;
  summary: { heard_as: string | null; agreement: Agreement; flag_for_review: boolean };
};
