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
 * This component now redirects to /vote and lets that page decide when to finish.
 * It keeps compatibility with existing code that renders <ConflictResolver />.
 */
export function ConflictResolver(props: {
  festivalSlug: string;
  festivalId: string;
  days: string[];
  sets: SetInput[];
}) {
  const { festivalSlug, days, sets } = props;
  const router = useRouter();

  function buildDaysKey(daysIn: string[]) {
    return daysIn.slice().sort().join(",");
  }

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const parsedSets = sets
      .map((s) => ({ ...s, startsAt: new Date(s.startsAt), endsAt: new Date(s.endsAt) }))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    const daysKey = buildDaysKey(days);
    const setsCsv = parsedSets.map((s) => s.setId).sort().join(",");

    router.replace(
      `/festival/${festivalSlug}/vote?days=${encodeURIComponent(daysKey)}&sets=${encodeURIComponent(setsCsv)}`
    );
  }, [router, festivalSlug, days, sets]);

  return null;
}
