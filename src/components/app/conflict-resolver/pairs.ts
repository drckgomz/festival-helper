// src/components/app/conflict-resolver/pairs.ts
import type { Pair, SetLite } from "./types";

export function safeKey(a: string, b: string) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

/**
 * Conflict definition that matches schedule feasibility:
 *
 * Two sets are a "conflict" if you cannot attend BOTH in either order,
 * given bufferMin and allowedOverlapMin.
 *
 * This avoids "double buffer" behavior and keeps conflicts aligned with the DP.
 */
export function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
  bufferMin = 5,
  allowedOverlapMin = 0
) {
  const bufferMs = bufferMin * 60_000;
  const allowedMs = allowedOverlapMin * 60_000;

  const a0 = aStart.getTime();
  const a1 = aEnd.getTime();
  const b0 = bStart.getTime();
  const b1 = bEnd.getTime();

  // "A can follow B" if A starts after B ends, plus required buffer,
  // minus what overlap we allow (arrive late / leave early).
  const aCanFollowB = a0 >= b1 + bufferMs - allowedMs;
  const bCanFollowA = b0 >= a1 + bufferMs - allowedMs;

  // If either ordering works, they don't conflict.
  return !(aCanFollowB || bCanFollowA);
}

export function buildConflictPairs(
  sets: SetLite[],
  bufferMin = 5,
  allowedOverlapMin = 0
): Pair[] {
  const pairs: Pair[] = [];
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const a = sets[i]!;
      const b = sets[j]!;
      if (overlaps(a.startsAt, a.endsAt, b.startsAt, b.endsAt, bufferMin, allowedOverlapMin)) {
        pairs.push({ aId: a.setId, bId: b.setId });
      }
    }
  }
  return pairs;
}

/**
 * Picks the next pair to ask the user.
 *
 * NOTE:
 * - This does NOT automatically prevent repeats unless you pass excludedKeys,
 *   or filter pairs before calling.
 */
export function chooseNextPair(args: {
  pairs: Pair[];
  ratings: Record<string, number>;
  pairCounts: Record<string, number>;
  shownInSession: Set<string>;
  excludedKeys?: Set<string>; // <-- optional hard block
}): Pair | null {
  const { pairs, ratings, pairCounts, shownInSession, excludedKeys } = args;
  if (pairs.length === 0) return null;

  let best: { p: Pair; score: number } | null = null;

  for (const p of pairs) {
    const key = safeKey(p.aId, p.bId);

    // HARD BLOCK (use this to ensure "ask once per pair")
    if (excludedKeys?.has(key)) continue;

    const rA = ratings[p.aId] ?? 1000;
    const rB = ratings[p.bId] ?? 1000;

    // prefer close ratings (more informative)
    const diff = Math.abs(rA - rB);

    // penalize repeats across runs / sessions if you persist pairCounts
    const seen = pairCounts[key] ?? 0;

    // penalize repeats in the current session
    const repeatPenalty = shownInSession.has(key) ? 2000 : 0;

    // lower is better
    const score = diff * 1.0 + seen * 150 + repeatPenalty;

    if (!best || score < best.score) best = { p, score };
  }

  return best?.p ?? null;
}
