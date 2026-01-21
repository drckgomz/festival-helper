// src/components/app/conflict-resolver/schedule-page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save, ArrowLeft } from "lucide-react";

import type { Pair, SetInput, SetLite, Vote } from "./types";
import { buildScheduleOptimisticWithTrace } from "./schedule";
import { explainExclusions, makeDebugLogger } from "./debug";
import { FinalScheduleCard } from "./final-schedule";

type PersistedStateV1 = {
  version: 1;
  festivalId: string;
  daysKey: string;
  setIdsKey: string;
  votes: Vote[];
  ratings: Record<string, number>;
  pairCounts: Record<string, number>;
  currentPair: Pair | null;
};

function buildDaysKey(days: string[]) {
  return days.slice().sort().join(",");
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
function fmtSet(s: SetLite, elo: number) {
  return {
    setId: s.setId,
    artist: s.artistName,
    stage: s.stageName,
    start: s.startsAt.toISOString(),
    end: s.endsAt.toISOString(),
    elo: Number.isFinite(elo) ? Math.round(elo) : elo,
  };
}

export function ConflictSchedulePage({
  festivalSlug,
  festivalId,
  days,
  sets,
}: {
  festivalSlug: string;
  festivalId: string;
  days: string[];
  sets: SetInput[];
}) {
  const router = useRouter();

  const bufferMin = 5;
  const allowedOverlapMin = 5;
  const K = 24;

  const debugEnabled =
    typeof window !== "undefined" && window.localStorage.getItem("conflict_debug") === "1";
  const dbg = React.useMemo(() => makeDebugLogger(debugEnabled), [debugEnabled]);

  const parsedSets = React.useMemo<SetLite[]>(() => {
    return sets
      .map((s) => ({ ...s, startsAt: new Date(s.startsAt), endsAt: new Date(s.endsAt) }))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }, [sets]);

  const daysKey = React.useMemo(() => buildDaysKey(days), [days]);
  const setIdsKey = React.useMemo(
    () => buildSetIdsKey(parsedSets.map((s) => s.setId)),
    [parsedSets]
  );
  const lsKey = React.useMemo(
    () => storageKey({ festivalId, daysKey, setIdsKey }),
    [festivalId, daysKey, setIdsKey]
  );

  const buildBaseRatings = React.useCallback(() => {
    const r: Record<string, number> = {};
    for (const s of parsedSets) r[s.setId] = 1000;
    return r;
  }, [parsedSets]);

  const [ratings, setRatings] = React.useState<Record<string, number>>(() => buildBaseRatings());
  const [votes, setVotes] = React.useState<Vote[]>([]);
  const [pairCounts, setPairCounts] = React.useState<Record<string, number>>({});
  const [saveStatus, setSaveStatus] = React.useState<
    "idle" | "saving" | "saved" | "error" | "unauthorized"
  >("idle");

  // hydrate from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const persisted = safeParseJSON<PersistedStateV1>(window.localStorage.getItem(lsKey));
    const validSetIds = new Set(parsedSets.map((s) => s.setId));

    if (!persisted || persisted.version !== 1) {
      setVotes([]);
      setPairCounts({});
      setRatings(buildBaseRatings());
      return;
    }

    const cleanedVotes = (persisted.votes ?? []).filter(
      (v) =>
        validSetIds.has(v.aId) &&
        validSetIds.has(v.bId) &&
        validSetIds.has(v.winnerId) &&
        validSetIds.has(v.loserId)
    );

    const nextRatings = buildBaseRatings();
    for (const [k, v] of Object.entries(persisted.ratings ?? {})) {
      if (validSetIds.has(k) && Number.isFinite(v)) nextRatings[k] = v;
    }

    setVotes(cleanedVotes);
    setPairCounts(persisted.pairCounts ?? {});
    setRatings(nextRatings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lsKey]);

  // schedule build
  const { schedule, trace } = React.useMemo(() => {
    return buildScheduleOptimisticWithTrace({
      sets: parsedSets,
      ratings,
      bufferMin,
      allowedOverlapMin,
    });
  }, [parsedSets, ratings, bufferMin, allowedOverlapMin]);

  const hasConflictsRemaining = schedule.length < parsedSets.length;

  React.useEffect(() => {
    const end = dbg.group(
      `[SchedulePage] schedule build (included ${schedule.length}/${parsedSets.length}) buffer=${bufferMin} allowedOverlap=${allowedOverlapMin}`
    );

    dbg.log(
      "Input sets:",
      parsedSets.map((s) => fmtSet(s, ratings[s.setId] ?? 1000))
    );
    dbg.log("DP trace (decision per interval):", trace);
    dbg.log(
      "Final schedule:",
      schedule.map((s) => fmtSet(s, ratings[s.setId] ?? 1000))
    );

    const exclusions = explainExclusions({
      all: parsedSets,
      chosen: schedule,
      bufferMin,
      allowedOverlapMin,
      ratings,
    });
    dbg.log("Excluded sets + why:", exclusions);

    end?.();
  }, [dbg, schedule, parsedSets, trace, bufferMin, allowedOverlapMin, ratings]);

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          festivalId,
          festivalSlug,
          days,
          inputSetIds: parsedSets.map((s) => s.setId),
          votes,
          ratings,
          schedule: schedule.map((s) => ({
            setId: s.setId,
            startsAt: s.startsAt.toISOString(),
            endsAt: s.endsAt.toISOString(),
          })),
          bufferMin,
          allowedOverlapMin,
          kFactor: K,
        }),
      });

      if (res.status === 401) {
        setSaveStatus("unauthorized");
        const returnUrl =
          typeof window !== "undefined" ? window.location.href : `/festival/${festivalSlug}/schedule`;
        router.push(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
        return;
      }

      if (!res.ok) {
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  const setsCsv = React.useMemo(() => parsedSets.map((s) => s.setId).sort().join(","), [parsedSets]);
  const qsSets = encodeURIComponent(setsCsv);
  const voteHref = `/festival/${festivalSlug}/vote?days=${encodeURIComponent(daysKey)}&sets=${qsSets}`;

  const saveLabel =
    saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Save";

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Review your schedule</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap a set card to toggle “arrive late” / “leave early” when transitions are tight.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-9 rounded-full px-4">
            <Link href={voteHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to voting
            </Link>
          </Button>

          <Button
            className="h-9 rounded-full px-4"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
          >
            <Save className="mr-2 h-4 w-4" />
            {saveLabel}
          </Button>
        </div>

        {saveStatus === "error" ? (
          <p className="w-full text-right text-xs text-destructive">Could not save. Try again.</p>
        ) : saveStatus === "unauthorized" ? (
          <p className="w-full text-right text-xs text-muted-foreground">Sign in to save.</p>
        ) : saveStatus === "saved" ? (
          <p className="w-full text-right text-xs text-muted-foreground">Saved!</p>
        ) : null}
      </div>

      {/* Final schedule + adjustments */}
      <FinalScheduleCard
        schedule={schedule}
        allSetsCount={parsedSets.length}
        hasConflictsRemaining={hasConflictsRemaining}
        allowedOverlapMin={allowedOverlapMin}
        ratings={ratings}
        saveStatus={saveStatus}
        days={days}
        timeZone="America/Chicago"
        tightGapMin={0}
      />

      {/* Optional: show a small “state” card */}
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-4 text-xs text-muted-foreground">
          Votes used: <span className="font-medium text-foreground">{votes.length}</span>
          <span className="mx-2 opacity-60">•</span>
          Rated sets:{" "}
          <span className="font-medium text-foreground">{Object.keys(ratings).length}</span>
        </CardContent>
      </Card>
    </div>
  );
}
