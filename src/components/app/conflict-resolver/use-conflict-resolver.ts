// src/components/app/conflict-resolver/use-conflict-resolver.ts
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { Pair, SetInput, SetLite, Vote } from "./types";
import { updateElo } from "./elo";
import { buildConflictPairs, chooseNextPair, safeKey } from "./pairs";
import { buildScheduleOptimisticWithTrace } from "./schedule";
import { explainExclusions, makeDebugLogger } from "./debug";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

export function useConflictResolver(args: {
  festivalSlug: string;
  festivalId: string;
  days: string[];
  sets: SetInput[];
}) {
  const { festivalSlug, festivalId, days, sets } = args;
  const router = useRouter();

  // --- Tuning knobs (keep here or later make them params) ---
  const bufferMin = 5;
  const allowedOverlapMin = 5;
  const K = 24;

  // Enable logs with: localStorage.setItem("conflict_debug", "1")
  const debugEnabled =
    typeof window !== "undefined" &&
    window.localStorage.getItem("conflict_debug") === "1";

  const dbg = React.useMemo(() => makeDebugLogger(debugEnabled), [debugEnabled]);

  const parsedSets = React.useMemo<SetLite[]>(() => {
    return sets
      .map((s) => ({
        ...s,
        startsAt: new Date(s.startsAt),
        endsAt: new Date(s.endsAt),
      }))
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

  const voteTarget = React.useMemo(
    () => clamp(Math.floor(totalPairs * 2), 10, 30),
    [totalPairs]
  );

  const [ratings, setRatings] = React.useState<Record<string, number>>(() => {
    const r: Record<string, number> = {};
    for (const s of parsedSets) r[s.setId] = 1000;
    return r;
  });

  // If sets change (new festival/day selection), re-seed ratings to include all ids
  React.useEffect(() => {
    setRatings((prev) => {
      const next = { ...prev };
      for (const s of parsedSets) {
        if (typeof next[s.setId] !== "number") next[s.setId] = 1000;
      }
      // optional: prune removed ids
      for (const k of Object.keys(next)) {
        if (!byId.has(k)) delete next[k];
      }
      return next;
    });
  }, [parsedSets, byId]);

  const [pairCounts, setPairCounts] = React.useState<Record<string, number>>({});
  const [votes, setVotes] = React.useState<Vote[]>([]);
  const [currentPair, setCurrentPair] = React.useState<Pair | null>(null);
  const [shownInSession, setShownInSession] = React.useState<Set<string>>(
    () => new Set()
  );

  const [saveStatus, setSaveStatus] = React.useState<
    "idle" | "saving" | "saved" | "error" | "unauthorized"
  >("idle");

  const votedPairKeys = React.useMemo(() => {
    const s = new Set<string>();
    for (const v of votes) s.add(safeKey(v.aId, v.bId));
    return s;
  }, [votes]);

  const { schedule, trace } = React.useMemo(() => {
    return buildScheduleOptimisticWithTrace({
      sets: parsedSets,
      ratings,
      bufferMin,
      allowedOverlapMin,
    });
  }, [parsedSets, ratings, bufferMin, allowedOverlapMin]);

  const hasConflictsRemaining = schedule.length < parsedSets.length;
  const doneVoting = votes.length >= voteTarget;

  // ---- LOG THE PROCESS (schedule build trace + exclusions) ----
  React.useEffect(() => {
    const end = dbg.group(
      `[ConflictResolver] schedule build (included ${schedule.length}/${parsedSets.length}) buffer=${bufferMin} allowedOverlap=${allowedOverlapMin}`
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
  }, [
    dbg,
    schedule,
    parsedSets,
    trace,
    bufferMin,
    allowedOverlapMin,
    ratings,
  ]);

  // init current pair
  React.useEffect(() => {
    if (totalPairs === 0) {
      setCurrentPair(null);
      return;
    }

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
        const end = dbg.group(`[ConflictResolver] init chooseNextPair`);
        dbg.log("excludedKeys (voted):", Array.from(votedPairKeys));
        dbg.log("chosen pair:", next);
        end?.();
      }

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPairs]);

  // keep current pair valid as ratings/votes update
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

  function logRound(args: {
    round: number;
    pair: Pair;
    winnerId: string;
    loserId: string;
    rA: number;
    rB: number;
    nextA: number;
    nextB: number;
    nextPairCounts: Record<string, number>;
    nextPair: Pair | null;
    scheduleNow: SetLite[];
  }) {
    if (!debugEnabled) return;

    const {
      round,
      pair,
      winnerId,
      loserId,
      rA,
      rB,
      nextA,
      nextB,
      nextPairCounts,
      nextPair,
      scheduleNow,
    } = args;

    const a = byId.get(pair.aId);
    const b = byId.get(pair.bId);

    const end = dbg.group(`[Round ${round}] vote`);

    dbg.log("Pair:", {
      a: a ? fmtSet(a, rA) : { setId: pair.aId, missing: true, elo: Math.round(rA) },
      b: b ? fmtSet(b, rB) : { setId: pair.bId, missing: true, elo: Math.round(rB) },
    });

    dbg.log("Winner/Loser:", {
      winnerId,
      winnerName: winnerId === pair.aId ? a?.artistName : b?.artistName,
      loserId,
      loserName: loserId === pair.aId ? a?.artistName : b?.artistName,
    });

    dbg.log("Elo update:", {
      before: { [pair.aId]: Math.round(rA), [pair.bId]: Math.round(rB) },
      after: { [pair.aId]: Math.round(nextA), [pair.bId]: Math.round(nextB) },
      delta: { [pair.aId]: Math.round(nextA - rA), [pair.bId]: Math.round(nextB - rB) },
      K,
    });

    const k = safeKey(pair.aId, pair.bId);
    dbg.log("pairCounts:", { key: k, count: nextPairCounts[k] ?? 0 });

    dbg.log(
      "Schedule after this vote:",
      scheduleNow.map((s) => fmtSet(s, ratings[s.setId] ?? 1000))
    );

    const exclusions = explainExclusions({
      all: parsedSets,
      chosen: scheduleNow,
      bufferMin,
      allowedOverlapMin,
      ratings,
    });

    dbg.log("Exclusions after this vote:", exclusions);
    dbg.log("Next pair:", nextPair);

    end?.();
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
    const nextPairCounts = {
      ...pairCounts,
      [pairKey]: (pairCounts[pairKey] ?? 0) + 1,
    };

    const round = votes.length + 1;

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

    const { schedule: scheduleNow } = buildScheduleOptimisticWithTrace({
      sets: parsedSets,
      ratings: nextRatings,
      bufferMin,
      allowedOverlapMin,
    });

    logRound({
      round,
      pair: currentPair,
      winnerId,
      loserId,
      rA,
      rB,
      nextA,
      nextB,
      nextPairCounts,
      nextPair,
      scheduleNow,
    });

    pickNextPairAfterShowing(nextPair);
  }

  function handleUndo() {
    if (votes.length === 0) return;

    const end = dbg.group(`[Undo] reverting last vote (round ${votes.length})`);

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

    dbg.log("votes now:", nextVotes.length);
    dbg.log("excludedKeys now:", Array.from(votedKeysAfterUndo));
    dbg.log("nextPair:", nextPair);

    setShownInSession(new Set());
    setCurrentPair(nextPair);

    end?.();
  }

  function handleNewPair() {
    const nextPair = chooseNextPair({
      pairs: conflictPairs,
      ratings,
      pairCounts,
      shownInSession: new Set(),
      excludedKeys: votedPairKeys,
    });

    if (debugEnabled) {
      const end = dbg.group(`[Manual] New pair`);
      dbg.log("excludedKeys (voted):", Array.from(votedPairKeys));
      dbg.log("nextPair:", nextPair);
      end?.();
    }

    setShownInSession(new Set());
    setCurrentPair(nextPair);
  }

  async function handleSave() {
    setSaveStatus("idle");
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
          typeof window !== "undefined"
            ? window.location.href
            : `/festival/${festivalSlug}/review`;
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

  const a = currentPair ? byId.get(currentPair.aId) ?? null : null;
  const b = currentPair ? byId.get(currentPair.bId) ?? null : null;

  const backHref = `/festival/${festivalSlug}/artists?days=${encodeURIComponent(
    days.slice().sort().join(",")
  )}`;

  return {
    // knobs
    bufferMin,
    allowedOverlapMin,
    kFactor: K,

    // computed
    parsedSets,
    byId,
    conflictPairs,
    totalPairs,
    voteTarget,
    doneVoting,
    hasConflictsRemaining,
    schedule,

    // state
    ratings,
    votes,
    pairCounts,
    currentPair,
    a,
    b,
    saveStatus,
    backHref,

    // actions
    handleVote,
    handleUndo,
    handleNewPair,
    handleSave,
  };
}
