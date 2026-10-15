/** Activity names. Plain module (not "use client"), so server pages get the real values. */
export const ACTIVITY_LABEL = { see: "See it", hear: "Hear it", match: "Match", say: "Say it" } as const;

/** What every collection activity needs to know about where it sits. */
export type ActivityContext = {
  collectionId: string;
  /** Vietnamese collection title, e.g. "Thức ăn". */
  collectionTitle: string;
  /** The collection page (close button, "Back to collection"). */
  backHref: string;
  /** Current day streak, for the Finished screen. */
  streakDays: number;
  /** The next activity in this collection, if any ("Next: Hear it"). */
  next: { href: string; label: string } | null;
};
