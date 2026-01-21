// src/components/app/conflict-resolver/vote-page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Shuffle, Undo2, RotateCcw, ArrowRight } from "lucide-react";

import type { Pair, SetInput, SetLite, Vote } from "./types";
import { updateElo } from "./elo";
import { buildConflictPairs, chooseNextPair, safeKey } from "./pairs";
import { makeDebugLogger } from "./debug";
import { PickCard } from "./pick-card";
import { ProgressCard } from "./progress-card";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

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

export function ConflictVotePage({
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

  // tuning knobs
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

  const byId = React.useMemo(() => {
    const m = new Map<string, SetLite>();
    for (const s of parsedSets) m.set(s.setId, s);
    return m;
  }, [parsedSets]);

  const conflictPairs = React.useMemo(
    () => buildConflictPairs(parsedSets, bufferMin, allowedOverlapMin),
    [parsedSets, bufferMin, allowedOverlapMin]
  );
  const totalPairs = conflictPairs.length;
  const voteTarget = React.useMemo(() => clamp(Math.floor(totalPairs * 2), 10, 30), [totalPairs]);

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
  const [pairCounts, setPairCounts] = React.useState<Record<string, number>>({});
  const [votes, setVotes] = React.useState<Vote[]>([]);
  const [currentPair, setCurrentPair] = React.useState<Pair | null>(null);
  const [shownInSession, setShownInSession] = React.useState<Set<string>>(new Set());

  // rehydrate
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const persisted = safeParseJSON<PersistedStateV1>(window.localStorage.getItem(lsKey));
    if (!persisted || persisted.version !== 1) {
      setVotes([]);
      setPairCounts({});
      setRatings(buildBaseRatings());
      setCurrentPair(null);
      setShownInSession(new Set());
      return;
    }

    const validSetIds = new Set(parsedSets.map((s) => s.setId));
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

    const cp = persisted.currentPair;
    if (cp && validSetIds.has(cp.aId) && validSetIds.has(cp.bId)) setCurrentPair(cp);
    else setCurrentPair(null);

    setShownInSession(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lsKey]);

  // persist
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const payload: PersistedStateV1 = {
      version: 1,
      festivalId,
      daysKey,
      setIdsKey,
      votes,
      ratings,
      pairCounts,
      currentPair,
    };

    window.localStorage.setItem(lsKey, JSON.stringify(payload));
  }, [festivalId, daysKey, setIdsKey, votes, ratings, pairCounts, currentPair, lsKey]);

  const votedPairKeys = React.useMemo(() => {
    const s = new Set<string>();
    for (const v of votes) s.add(safeKey(v.aId, v.bId));
    return s;
  }, [votes]);

  const doneVoting = votes.length >= voteTarget;

  // init current pair
  React.useEffect(() => {
    if (totalPairs === 0) {
      setCurrentPair(null);
      return;
    }
    if (doneVoting) return;

    setCurrentPair((prev) => {
      if (prev && byId.has(prev.aId) && byId.has(prev.bId)) return prev;

      const next = chooseNextPair({
        pairs: conflictPairs,
        ratings,
        pairCounts,
        shownInSession,
        excludedKeys: votedPairKeys,
      });

      if (debugEnabled) {
        const end = dbg.group(`[VotePage] init chooseNextPair`);
        dbg.log("excludedKeys (voted):", Array.from(votedPairKeys));
        dbg.log("chosen pair:", next);
        end?.();
      }

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPairs, doneVoting]);

  React.useEffect(() => {
    if (totalPairs === 0) return;
    if (doneVoting) return;

    setCurrentPair((prev) => {
      if (!prev) {
        return chooseNextPair({
          pairs: conflictPairs,
          ratings,
          pairCounts,
          shownInSession,
          excludedKeys: votedPairKeys,
        });
      }
      if (!byId.has(prev.aId) || !byId.has(prev.bId)) {
        return chooseNextPair({
          pairs: conflictPairs,
          ratings,
          pairCounts,
          shownInSession,
          excludedKeys: votedPairKeys,
        });
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratings, votes.length, doneVoting, totalPairs, votedPairKeys]);

  function pickNextPairAfterShowing(nextPair: Pair | null) {
    setCurrentPair(nextPair);
    if (!nextPair) return;

    const k = safeKey(nextPair.aId, nextPair.bId);
    setShownInSession((prev) => {
      const n = new Set(prev);
      n.add(k);
      if (n.size > 12) {
        const first = n.values().next().value as string | undefined;
        if (first) n.delete(first);
      }
      return n;
    });
  }

  function handleVote(winnerId: string) {
    if (!currentPair) return;

    const aId = currentPair.aId;
    const bId = currentPair.bId;

    const winner = winnerId === aId ? "A" : "B";
    const loserId = winnerId === aId ? bId : aId;

    const rA = ratings[aId] ?? 1000;
    const rB = ratings[bId] ?? 1000;

    const { nextA, nextB } = updateElo(rA, rB, winner, K);
    const nextRatings = { ...ratings, [aId]: nextA, [bId]: nextB };

    const pairKey = safeKey(aId, bId);
    const nextPairCounts = { ...pairCounts, [pairKey]: (pairCounts[pairKey] ?? 0) + 1 };

    const nextVotedKeys = new Set(votedPairKeys);
    nextVotedKeys.add(pairKey);

    const nextPair = chooseNextPair({
      pairs: conflictPairs,
      ratings: nextRatings,
      pairCounts: nextPairCounts,
      shownInSession,
      excludedKeys: nextVotedKeys,
    });

    setRatings(nextRatings);
    setPairCounts(nextPairCounts);
    setVotes((prev) => [...prev, { aId, bId, winnerId, loserId, ts: Date.now() }]);
    pickNextPairAfterShowing(nextPair);
  }

  function handleUndo() {
    if (votes.length === 0) return;

    const nextVotes = votes.slice(0, -1);

    const baseRatings: Record<string, number> = {};
    for (const s of parsedSets) baseRatings[s.setId] = 1000;

    const baseCounts: Record<string, number> = {};

    for (const v of nextVotes) {
      const rA = baseRatings[v.aId] ?? 1000;
      const rB = baseRatings[v.bId] ?? 1000;
      const winner = v.winnerId === v.aId ? "A" : "B";
      const { nextA, nextB } = updateElo(rA, rB, winner, K);
      baseRatings[v.aId] = nextA;
      baseRatings[v.bId] = nextB;

      const k = safeKey(v.aId, v.bId);
      baseCounts[k] = (baseCounts[k] ?? 0) + 1;
    }

    setVotes(nextVotes);
    setRatings(baseRatings);
    setPairCounts(baseCounts);

    const votedKeysAfterUndo = new Set<string>();
    for (const v of nextVotes) votedKeysAfterUndo.add(safeKey(v.aId, v.bId));

    const nextPair = chooseNextPair({
      pairs: conflictPairs,
      ratings: baseRatings,
      pairCounts: baseCounts,
      shownInSession: new Set(),
      excludedKeys: votedKeysAfterUndo,
    });

    setShownInSession(new Set());
    setCurrentPair(nextPair);
  }

  function handleRestartVote() {
    if (typeof window !== "undefined") window.localStorage.removeItem(lsKey);

    setVotes([]);
    setPairCounts({});
    setRatings(buildBaseRatings());
    setShownInSession(new Set());

    const nextPair =
      totalPairs === 0
        ? null
        : chooseNextPair({
            pairs: conflictPairs,
            ratings: buildBaseRatings(),
            pairCounts: {},
            shownInSession: new Set(),
            excludedKeys: new Set(),
          });

    setCurrentPair(nextPair);
  }

  const setsCsv = React.useMemo(() => parsedSets.map((s) => s.setId).sort().join(","), [parsedSets]);
  const qsSets = encodeURIComponent(setsCsv);

  const backHref = `/festival/${festivalSlug}/artists?days=${encodeURIComponent(daysKey)}`;
  const scheduleHref = `/festival/${festivalSlug}/schedule?days=${encodeURIComponent(
    daysKey
  )}&sets=${qsSets}`;

  const a = currentPair ? byId.get(currentPair.aId) : null;
  const b = currentPair ? byId.get(currentPair.bId) : null;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Vote between conflicts</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick which overlapping set you’d rather see. We’ll use this to rank your choices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-9 rounded-full px-4">
            <Link href={backHref}>Back</Link>
          </Button>

          <Button
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={() => {
              const nextPair = chooseNextPair({
                pairs: conflictPairs,
                ratings,
                pairCounts,
                shownInSession: new Set(),
                excludedKeys: votedPairKeys,
              });
              setShownInSession(new Set());
              setCurrentPair(nextPair);
            }}
            disabled={totalPairs === 0 || doneVoting}
          >
            <Shuffle className="mr-2 h-4 w-4" />
            New pair
          </Button>

          <Button
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={handleUndo}
            disabled={votes.length === 0}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Undo
          </Button>

          {doneVoting ? (
            <Button variant="outline" className="h-9 rounded-full px-4" onClick={handleRestartVote}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restart vote
            </Button>
          ) : null}

          <Button
            className="h-9 rounded-full px-4"
            onClick={() => router.push(scheduleHref)}
            disabled={!doneVoting && totalPairs !== 0}
            title={!doneVoting && totalPairs !== 0 ? "Finish your votes first" : "Go to final schedule"}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress (use your themed ProgressCard) */}
      <ProgressCard
        totalPairs={totalPairs}
        votesCount={votes.length}
        voteTarget={voteTarget}
        bufferMin={bufferMin}
        allowedOverlapMin={allowedOverlapMin}
        kFactor={K}
      />

      {/* Voting UI */}
      {totalPairs === 0 ? (
        <Card className="border-border bg-card text-card-foreground">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">No conflicts detected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              These sets don’t overlap. You can include everything.
            </p>
            <Button className="mt-4 rounded-full" onClick={() => router.push(scheduleHref)}>
              Go to schedule <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : doneVoting || !currentPair || !a || !b ? (
        <Card className="border-border bg-card text-card-foreground">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-semibold text-foreground">Voting complete</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Next up: review your schedule and adjust transitions.
            </p>
            <Button className="mt-4 rounded-full" onClick={() => router.push(scheduleHref)}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* A */}
          <Card className="border-border bg-card text-card-foreground transition-colors hover:bg-muted/50">
            <CardContent className="p-4">
              <PickCard set={a} rating={ratings[a.setId] ?? 1000} />
              <Button className="mt-3 h-10 w-full rounded-full" onClick={() => handleVote(a.setId)}>
                Choose {a.artistName}
              </Button>
            </CardContent>
          </Card>

          {/* B */}
          <Card className="border-border bg-card text-card-foreground transition-colors hover:bg-muted/50">
            <CardContent className="p-4">
              <PickCard set={b} rating={ratings[b.setId] ?? 1000} />
              <Button className="mt-3 h-10 w-full rounded-full" onClick={() => handleVote(b.setId)}>
                Choose {b.artistName}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
