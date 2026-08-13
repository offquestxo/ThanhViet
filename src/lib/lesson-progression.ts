/**
 * Derived Unit unlock/progression — Track 2, approved design (zero new
 * schema; see chat record for the full proposal this implements).
 *
 * A unit is "completed" for a user when every one of its chunks has a
 * `user_chunk_progress` row for that user — any row, since `completeChunk`
 * (src/app/lesson/actions.ts) only ever writes one after a full
 * Encounter→Review pass, so existence alone means "completed at least
 * once." A unit is "unlocked" when it's the first unit (lowest `order`)
 * in its Collection, or the immediately-preceding unit (by `order`) is
 * completed. "Completed" implies accessible too — only "locked" blocks
 * entry.
 *
 * Units with no `collection_id` aren't part of any sequential Collection,
 * so they're always unlocked — there's no sequence to gate them within
 * (an interpretation, not something the spec states explicitly — flagged
 * when this was proposed).
 *
 * A unit with zero chunks is never "completed" — vacuous completion would
 * let an empty placeholder unit silently unlock the next one. It's
 * unlocked-but-empty or locked, never completed.
 *
 * Collections themselves are never locked — only Units within one are
 * gated, per the approved scope boundary.
 */

export type UnitForProgression = {
  id: string;
  collection_id: string | null;
  order: number;
  chunkIds: string[];
};

export type UnitProgressionStatus = "locked" | "unlocked" | "completed";

const NO_COLLECTION_KEY = "__no_collection__";

export function computeUnitProgression(
  units: UnitForProgression[],
  completedChunkIds: ReadonlySet<string>
): Map<string, UnitProgressionStatus> {
  const result = new Map<string, UnitProgressionStatus>();

  const isUnitComplete = (unit: UnitForProgression) =>
    unit.chunkIds.length > 0 && unit.chunkIds.every((id) => completedChunkIds.has(id));

  const groups = new Map<string, UnitForProgression[]>();
  for (const unit of units) {
    const key = unit.collection_id ?? NO_COLLECTION_KEY;
    const group = groups.get(key);
    if (group) {
      group.push(unit);
    } else {
      groups.set(key, [unit]);
    }
  }

  for (const [key, groupUnits] of groups) {
    const sorted = groupUnits.slice().sort((a, b) => a.order - b.order);

    if (key === NO_COLLECTION_KEY) {
      for (const unit of sorted) {
        result.set(unit.id, isUnitComplete(unit) ? "completed" : "unlocked");
      }
      continue;
    }

    let previousAccessible = true; // first unit in a real collection is always unlocked
    for (const unit of sorted) {
      const complete = isUnitComplete(unit);
      if (complete) {
        result.set(unit.id, "completed");
      } else if (previousAccessible) {
        result.set(unit.id, "unlocked");
      } else {
        result.set(unit.id, "locked");
      }
      previousAccessible = complete;
    }
  }

  return result;
}
