/**
 * Due-chunks-first lesson selection — the approved content-selection
 * mechanism (PRD Section 2b's "Warm-up recall": retrieval before new
 * input). Deliberately NOT i+1/word-coverage matching (explicitly
 * deferred until a real UserWordProgress model exists) — this is pure
 * SRS-date ordering against data already proven to write correctly
 * end-to-end (src/app/lesson/actions.ts's completeChunk).
 *
 * Rules (exact, as approved):
 * 1. A chunk is due only when next_review_at <= now.
 * 2. Due chunks first, oldest next_review_at first.
 * 3. A new chunk has no UserChunkProgress row for this user.
 * 4. New chunks follow due chunks, in the unit's existing display_order.
 * 5. Chunks with a future next_review_at are excluded entirely — not
 *    shown in the current lesson at all.
 * 6. Scoped to one unit's chunks only — no cross-unit/cross-collection
 *    review here.
 */

export type SelectableChunk = {
  id: string;
  display_order: number;
};

export type ChunkProgressLookup = ReadonlyMap<string, { next_review_at: string | null }>;

export function selectChunksForLesson<T extends SelectableChunk>(
  chunks: T[],
  progressByChunkId: ChunkProgressLookup,
  now: Date
): T[] {
  const due: { chunk: T; nextReviewAtMs: number }[] = [];
  const freshChunks: T[] = [];

  for (const chunk of chunks) {
    const progress = progressByChunkId.get(chunk.id);

    if (!progress) {
      freshChunks.push(chunk); // Rule 3: no progress row = new
      continue;
    }

    if (!progress.next_review_at) {
      // Defensive only — completeChunk always sets next_review_at, so a
      // progress row without one shouldn't happen. Treated conservatively
      // as "not due" (excluded) rather than guessed at, same as a
      // future-scheduled chunk.
      continue;
    }

    const nextReviewAtMs = new Date(progress.next_review_at).getTime();
    if (nextReviewAtMs <= now.getTime()) {
      due.push({ chunk, nextReviewAtMs }); // Rule 1
    }
    // else: future-scheduled — Rule 5, excluded entirely, not deferred
    // within the session, not shown at all.
  }

  due.sort((a, b) => a.nextReviewAtMs - b.nextReviewAtMs); // Rule 2: oldest first
  freshChunks.sort((a, b) => a.display_order - b.display_order); // Rule 4

  return [...due.map((d) => d.chunk), ...freshChunks]; // due first, then new
}
