// src/components/app/conflict-resolver/debug.ts
import type { SetLite } from "./types";
import { overlaps } from "./pairs";

export function makeDebugLogger(enabled: boolean) {
	function log(...args: unknown[]) {
		if (!enabled) return;
		// eslint-disable-next-line no-console
		console.log(...args);
	}
	function group(title: string) { 
		if (!enabled) return null;
		// eslint-disable-next-line no-console
		console.groupCollapsed(title);
		return () => {
			// eslint-disable-next-line no-console
			console.groupEnd();
		};
	}
	return { log, group };
}

export function explainExclusions(args: {
  all: SetLite[];
  chosen: SetLite[];
  bufferMin: number;
  allowedOverlapMin: number;
  ratings: Record<string, number>;
}) {
  const { all, chosen, bufferMin, allowedOverlapMin, ratings } = args;

  const chosenIds = new Set(chosen.map((s) => s.setId));
  const excluded = all.filter((s) => !chosenIds.has(s.setId));

  return excluded.map((s) => {
    const blockers = chosen.filter((c) =>
      overlaps(s.startsAt, s.endsAt, c.startsAt, c.endsAt, bufferMin, allowedOverlapMin)
    );

    return {
      excludedSetId: s.setId,
      excludedArtist: s.artistName,
      excludedTime: [s.startsAt.toISOString(), s.endsAt.toISOString()],
      excludedElo: ratings[s.setId] ?? 1000,
      blockedBy: blockers.map((b) => ({
        setId: b.setId,
        artist: b.artistName,
        time: [b.startsAt.toISOString(), b.endsAt.toISOString()],
        elo: ratings[b.setId] ?? 1000,
      })),
    };
  });
}