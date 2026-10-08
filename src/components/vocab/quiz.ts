export function shuffle<T>(items: readonly T[], seed = Math.random()): T[] {
  const a = [...items];
  let s = Math.floor(seed * 2 ** 31) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The answer plus up to (n-1) other items, in random order. */
export function choicesFor<T extends { id: string }>(answer: T, pool: readonly T[], n = 4): T[] {
  const others = shuffle(pool.filter((p) => p.id !== answer.id)).slice(0, n - 1);
  return shuffle([answer, ...others]);
}
