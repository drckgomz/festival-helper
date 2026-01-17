// src/components/app/conflict-resolver/schedule.ts
import type { SetLite } from "./types";

/**
 * Returns true if `next` can be attended after `prev`.
 * We enforce a "gap" of bufferMin, but allow arriving late / leaving early
 * via allowedOverlapMin.
 *
 * Example:
 *  bufferMin=5, allowedOverlapMin=10  => you can be up to 5 minutes "negative gap"
 *  (i.e., overlap) and still consider it feasible.
 */
function canFollow(prev: SetLite, next: SetLite, bufferMin: number, allowedOverlapMin: number) {
  const bufferMs = bufferMin * 60_000;
  const allowedOverlapMs = allowedOverlapMin * 60_000;
  return next.startsAt.getTime() >= prev.endsAt.getTime() + bufferMs - allowedOverlapMs;
}

export function buildScheduleOptimisticWithTrace(args: {
  sets: SetLite[];
  ratings: Record<string, number>;
  bufferMin: number;
  allowedOverlapMin?: number;
}) {
  const { sets, ratings, bufferMin, allowedOverlapMin = 0 } = args;

  const trace: Array<Record<string, unknown>> = [];

  // Sort by end time (DP)
  const sorted = [...sets].sort((a, b) => {
    const e = a.endsAt.getTime() - b.endsAt.getTime();
    if (e !== 0) return e;
    return a.startsAt.getTime() - b.startsAt.getTime();
  });

  const n = sorted.length;
  if (n === 0) return { schedule: [], trace };

  const ends = sorted.map((s) => s.endsAt.getTime());

  /**
   * Find latest index j < i such that sorted[j] can be followed by sorted[i].
   *
   * canFollow(sorted[j], sorted[i]) means:
   *   sorted[i].start >= sorted[j].end + buffer - allowedOverlap
   *
   * Rearranged for binary search:
   *   sorted[j].end <= sorted[i].start - buffer + allowedOverlap
   */
  function latestCompatibleIndex(i: number) {
    const target =
      sorted[i]!.startsAt.getTime() - bufferMin * 60_000 + allowedOverlapMin * 60_000;

    let lo = 0;
    let hi = i - 1;
    let ans = -1;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (ends[mid]! <= target) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return ans;
  }

  const p = new Array<number>(n);
  for (let i = 0; i < n; i++) p[i] = latestCompatibleIndex(i);

  // BIG makes "maximize number of sets" dominate, ratings break ties.
  const BIG = 1_000_000;
  const weightOf = (s: SetLite) => BIG + (ratings[s.setId] ?? 1000);

  const dp = new Array<number>(n);
  const take = new Array<boolean>(n);

  for (let i = 0; i < n; i++) {
    const wTake = weightOf(sorted[i]!) + (p[i] >= 0 ? dp[p[i]!] : 0);
    const wSkip = i > 0 ? dp[i - 1]! : 0;

    const decision = wTake > wSkip ? "TAKE" : "SKIP";
    take[i] = decision === "TAKE";
    dp[i] = take[i] ? wTake : wSkip;

    trace.push({
      i,
      setId: sorted[i]!.setId,
      artist: sorted[i]!.artistName,
      startsAt: sorted[i]!.startsAt.toISOString(),
      endsAt: sorted[i]!.endsAt.toISOString(),
      pIndex: p[i],
      wTake,
      wSkip,
      decision,
      bufferMin,
      allowedOverlapMin,
    });
  }

  // Reconstruct
  const chosen: SetLite[] = [];
  let i = n - 1;
  while (i >= 0) {
    if (take[i]) {
      chosen.push(sorted[i]!);
      i = p[i]!;
    } else {
      i--;
    }
  }
  chosen.reverse();

  // Final sanity pass: enforce feasibility sequentially
  const final: SetLite[] = [];
  for (const s of chosen) {
    if (final.length === 0) {
      final.push(s);
      continue;
    }

    const prev = final[final.length - 1]!;
    if (canFollow(prev, s, bufferMin, allowedOverlapMin)) {
      final.push(s);
    } else {
      trace.push({
        type: "SANITY_DROP",
        setId: s.setId,
        artist: s.artistName,
        reason: "Failed canFollow() in sanity pass",
        prevSetId: prev.setId,
        prevArtist: prev.artistName,
        bufferMin,
        allowedOverlapMin,
        prevEndsAt: prev.endsAt.toISOString(),
        nextStartsAt: s.startsAt.toISOString(),
      });
    }
  }

  return { schedule: final, trace };
}
