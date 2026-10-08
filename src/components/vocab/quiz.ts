// Every shuffle is seeded. The seed is drawn once on the server and passed
// down, so the server render and the browser's hydration produce the same
// order (an unseeded Math.random() here caused a hydration mismatch).
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const a = [...items];
  let s = Math.floor(seed * 2 ** 31) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A distinct, deterministic seed in [0, 1) for sub-step `k` of `seed`. */
export function subSeed(seed: number, k: number): number {
  return (seed * 9301 + k * 0.6180339887) % 1;
}

/** The answer plus up to (n-1) other items, in seeded random order. */
export function choicesFor<T extends { id: string }>(answer: T, pool: readonly T[], n: number, seed: number): T[] {
  const others = shuffle(pool.filter((p) => p.id !== answer.id), subSeed(seed, 1)).slice(0, n - 1);
  return shuffle([answer, ...others], subSeed(seed, 2));
}
