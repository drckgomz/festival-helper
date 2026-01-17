// src/components/app/conflict-resolver/final-schedule.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimeRange } from "@/lib/time";
import type { SetLite } from "./types";

function dayKeyInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dayLabel(index: number) {
  const words = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN"];
  return words[index] ? `DAY ${words[index]}` : `DAY ${index + 1}`;
}

function minutesBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 60_000;
}

type TransitionChoice = "leaveEarly" | "arriveLate";
type TransitionKey = string;

function transitionKey(prevId: string, nextId: string): TransitionKey {
  return `${prevId}→${nextId}`;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function fmtGap(min: number | null) {
  if (min === null) return "—";
  const v = Math.round(min);
  if (v === 0) return "0m";
  if (v > 0) return `+${v}m`;
  return `${v}m`; // negative means overlap
}

function gapLabel(min: number | null) {
  if (min === null) return "—";
  const v = Math.round(min);
  if (v < 0) return `OVERLAP ${Math.abs(v)}m`;
  return `${v}m`;
}

export function FinalScheduleCard({
  schedule,
  allSetsCount,
  hasConflictsRemaining,
  allowedOverlapMin,
  ratings, // kept for now to avoid changing parent props; not used in UI
  saveStatus,
  days,
  timeZone = "America/Chicago",
  tightGapMin = 0,
}: {
  schedule: SetLite[];
  allSetsCount: number;
  hasConflictsRemaining: boolean;
  allowedOverlapMin: number;
  ratings: Record<string, number>;
  saveStatus: "idle" | "saving" | "saved" | "error" | "unauthorized";
  days?: string[];
  timeZone?: string;
  tightGapMin?: number;
}) {
  const [choices, setChoices] = React.useState<Record<TransitionKey, TransitionChoice>>({});

  const toggleChoice = React.useCallback((key: TransitionKey, value: TransitionChoice) => {
    setChoices((prev) => {
      if (prev[key] === value) {
        const { [key]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const grouped = React.useMemo(() => {
    const m = new Map<string, SetLite[]>();

    for (const s of schedule) {
      const key = dayKeyInTimeZone(s.startsAt, timeZone);
      const arr = m.get(key) ?? [];
      arr.push(s);
      m.set(key, arr);
    }

    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
      m.set(k, arr);
    }

    const keys = Array.from(m.keys());
    const orderedKeys = days?.length ? days.filter((d) => m.has(d)) : keys.sort();

    return orderedKeys.map((day) => ({ day, sets: m.get(day)! }));
  }, [schedule, days, timeZone]);

  return (
    <Card className="border-zinc-200/70 dark:border-zinc-800">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Your schedule</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              Optimistic build: max shows first, then your votes as tie-breakers.
              {allowedOverlapMin > 0 ? " (Small overlaps allowed.)" : " (Non-overlapping only.)"}
            </p>
          </div>

          <div className="text-xs text-zinc-600 dark:text-zinc-300">
            Included: <span className="font-medium">{schedule.length}</span> / {allSetsCount}
            {hasConflictsRemaining ? (
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                conflicts resolved by ranking
              </span>
            ) : (
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                no conflicts
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-5">
          {grouped.map((g, dayIndex) => {
            const sets = g.sets;

            return (
              <div key={g.day} className="grid gap-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-200">
                    {dayLabel(dayIndex)} — {g.day}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {plural(sets.length, "set")}
                  </p>
                </div>

                <div className="grid gap-3">
                  {sets.map((s, i) => {
                    const prev = i > 0 ? sets[i - 1]! : null;
                    const next = i < sets.length - 1 ? sets[i + 1]! : null;

                    const keyFromPrev = prev ? transitionKey(prev.setId, s.setId) : null;
                    const keyToNext = next ? transitionKey(s.setId, next.setId) : null;

                    const gapFromPrevMin = prev ? minutesBetween(prev.endsAt, s.startsAt) : null; // can be negative if overlap
                    const gapToNextMin = next ? minutesBetween(s.endsAt, next.startsAt) : null;

                    const tightFromPrev =
                      gapFromPrevMin !== null && gapFromPrevMin >= 0 && gapFromPrevMin <= tightGapMin;

                    const tightToNext =
                      gapToNextMin !== null && gapToNextMin >= 0 && gapToNextMin <= tightGapMin;

                    const chosenFromPrev = keyFromPrev ? choices[keyFromPrev] : undefined;
                    const chosenToNext = keyToNext ? choices[keyToNext] : undefined;

                    const showArriveLate = tightFromPrev && chosenFromPrev !== "leaveEarly";
                    const showLeaveEarly = tightToNext && chosenToNext !== "arriveLate";

                    const arriveSelected = chosenFromPrev === "arriveLate";
                    const leaveSelected = chosenToNext === "leaveEarly";

                    // ✅ card click toggles the "most relevant" action (arriveLate preferred)
                    const onCardClick = () => {
                      if (showArriveLate && keyFromPrev) {
                        toggleChoice(keyFromPrev, "arriveLate");
                        return;
                      }
                      if (showLeaveEarly && keyToNext) {
                        toggleChoice(keyToNext, "leaveEarly");
                      }
                    };

                    // only clickable if there’s something to toggle
                    const clickable = (showArriveLate && !!keyFromPrev) || (showLeaveEarly && !!keyToNext);

                    return (
                      <div
                        key={s.setId}
                        role={clickable ? "button" : undefined}
                        tabIndex={clickable ? 0 : -1}
                        onClick={clickable ? onCardClick : undefined}
                        onKeyDown={
                          clickable
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onCardClick();
                                }
                              }
                            : undefined
                        }
                        className={[
                          "group relative overflow-hidden rounded-xl border border-zinc-200/70 p-3 dark:border-zinc-800",
                          "transition-shadow hover:shadow-sm",
                          clickable ? "cursor-pointer" : "cursor-default",
                          clickable
                            ? "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-400/60 dark:focus-visible:ring-zinc-600/60"
                            : "",
                        ].join(" ")}
                      >
                        {/* BUTTONS (TOP LAYER) */}
                        <div className="relative z-30 flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-semibold">{s.artistName}</p>

                          <div className="flex shrink-0 items-center gap-2">
                            {showArriveLate && keyFromPrev ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation(); // ✅ prevent double toggle
                                  toggleChoice(keyFromPrev, "arriveLate");
                                }}
                                className={[
                                  "rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wider",
                                  "text-white shadow-sm",
                                  "bg-red-600 hover:bg-red-600/90",
                                  arriveSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                  "transition-opacity",
                                ].join(" ")}
                                title="You’ll arrive late to this set to stay longer at the previous one."
                              >
                                ARRIVE LATE
                              </button>
                            ) : null}

                            {showLeaveEarly && keyToNext ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation(); // ✅ prevent double toggle
                                  toggleChoice(keyToNext, "leaveEarly");
                                }}
                                className={[
                                  "rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wider",
                                  "text-white shadow-sm",
                                  "bg-red-600 hover:bg-red-600/90",
                                  leaveSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                  "transition-opacity",
                                ].join(" ")}
                                title="You’ll leave this set early to get to the next one."
                              >
                                LEAVE EARLY
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {/* GRADIENTS (MIDDLE LAYER) */}
                        {showArriveLate ? (
                          <div
                            className={[
                              "pointer-events-none absolute inset-x-0 top-0 h-16 z-20",
                              "bg-linear-to-b from-red-500/70 via-red-500/15 to-transparent",
                              arriveSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                              "transition-opacity",
                            ].join(" ")}
                          />
                        ) : null}

                        {showLeaveEarly ? (
                          <div
                            className={[
                              "pointer-events-none absolute inset-x-0 bottom-0 h-16 z-20",
                              "bg-linear-to-t from-red-500/70 via-red-500/15 to-transparent",
                              leaveSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                              "transition-opacity",
                            ].join(" ")}
                          />
                        ) : null}

                        {/* REST OF CONTENT (BOTTOM LAYER) */}
                        <div className="relative z-10">
                          <p className="text-xs text-zinc-600 dark:text-zinc-300">Stage: {s.stageName}</p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-300">
                            Time: {formatTimeRange(s.startsAt, s.endsAt)}
                          </p>

                          {/* ALWAYS show time between sets */}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                              FROM PREV: <span className="font-semibold">{prev ? gapLabel(gapFromPrevMin) : "—"}</span>
                            </span>

                            <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                              TO NEXT: <span className="font-semibold">{next ? gapLabel(gapToNextMin) : "—"}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {saveStatus === "saved" ? (
          <p className="mt-3 text-center text-xs text-emerald-600">Saved!</p>
        ) : saveStatus === "error" ? (
          <p className="mt-3 text-center text-xs text-red-600">Could not save. Try again.</p>
        ) : saveStatus === "unauthorized" ? (
          <p className="mt-3 text-center text-xs text-zinc-600 dark:text-zinc-300">
            Please sign in to save.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
