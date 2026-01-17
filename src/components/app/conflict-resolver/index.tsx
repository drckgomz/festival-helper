// src/components/app/conflict-resolver/index.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { SetInput } from "./types";

/**
 * Legacy wrapper:
 * We split the flow into separate pages:
 *  - /festival/[slug]/vote      (pair voting)
 *  - /festival/[slug]/schedule  (final schedule + adjustments + save)
 *
 * This component now redirects to the right page based on whether voting is complete.
 * It keeps compatibility with existing code that renders <ConflictResolver />.
 */
export function ConflictResolver(props: {
  festivalSlug: string;
  festivalId: string;
  days: string[];
  sets: SetInput[];
}) {
  const { festivalSlug, festivalId, days, sets } = props;
  const router = useRouter();

  // keys must match your existing logic so state persists across pages
  function buildDaysKey(daysIn: string[]) {
    return daysIn.slice().sort().join(",");
  }
  function buildSetIdsKey(setIds: string[]) {
    return setIds.slice().sort().join("|");
  }
  function storageKey(args: { festivalId: string; daysKey: string; setIdsKey: string }) {
    return `festival-helper:conflict-resolver:v1:${args.festivalId}:${args.daysKey}:${args.setIdsKey}`;
  }
  function safeParseJSON<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const parsedSets = sets
      .map((s) => ({ ...s, startsAt: new Date(s.startsAt), endsAt: new Date(s.endsAt) }))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    const daysKey = buildDaysKey(days);
    const setIdsKey = buildSetIdsKey(parsedSets.map((s) => s.setId));
    const lsKey = storageKey({ festivalId, daysKey, setIdsKey });

    // Persisted shape (only what we need here)
    type PersistedStateV1 = {
      version: 1;
      votes: Array<any>;
    };

    const persisted = safeParseJSON<PersistedStateV1>(window.localStorage.getItem(lsKey));
    const votesLen = persisted?.version === 1 ? (persisted.votes?.length ?? 0) : 0;

    // We need totalPairs to compute voteTarget. We can cheaply approximate by reusing your buildConflictPairs logic,
    // but this wrapper should stay lightweight. We'll redirect optimistically:
    // - if user has any votes, send them to /vote (they can continue) unless they already finished (handled inside /vote)
    // - if user has 0 votes, send them to /vote
    //
    // The /vote page will show "continue" or "finish" CTA and can push to /schedule.
    // This avoids duplicating your whole conflict calculation here.
    void votesLen;

    const setsCsv = parsedSets.map((s) => s.setId).sort().join(",");
    router.replace(
      `/festival/${festivalSlug}/vote?days=${encodeURIComponent(daysKey)}&sets=${encodeURIComponent(setsCsv)}`
    );

  }, [router, festivalSlug, festivalId, days, sets]);

  return null;
}
