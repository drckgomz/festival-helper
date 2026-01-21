// src/components/admin/festival/sets/sets-timeline.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { type SetRow, findStageConflicts, getDayKey, isInvalidInterval } from "./conflict";
import { fmtAdminTime } from "./types";

type StageRow = { id: string; name: string; sortOrder: number };
type Tick = { minute: number; label: string };

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function roundDown(n: number, step: number) {
  return Math.floor(n / step) * step;
}
function roundUp(n: number, step: number) {
  return Math.ceil(n / step) * step;
}
function minutesSinceMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}
function parseIso(iso: string) {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}
function formatTickLabel(minute: number) {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  const hh = ((h % 24) + 24) % 24;
  const ampm = hh >= 12 ? "PM" : "AM";
  const hr12 = hh % 12 === 0 ? 12 : hh % 12;
  return m === 0 ? `${hr12}${ampm}` : `${hr12}:${String(m).padStart(2, "0")}${ampm}`;
}

type Zoom = "auto" | "6h" | "12h" | "full";
const ZOOM_LABEL: Record<Zoom, string> = {
  auto: "Auto",
  "6h": "6 hours",
  "12h": "12 hours",
  full: "Full range",
};

export function SetsTimeline(props: {
  rows: SetRow[];
  stages: StageRow[];
  dayFilterKey?: string; // "all" or day label
  selectedId?: string | null;
  onSelect?: (setId: string) => void;

  /**
   * UX options:
   * - "all" = show all stages stacked (scroll vertically)
   * - "single" = show one stage at a time with prev/next
   */
  stageMode?: "all" | "single";
}) {
  const dayKey = props.dayFilterKey ?? "all";
  const stageMode = props.stageMode ?? "single";

  const rows = React.useMemo(() => {
    if (dayKey === "all") return props.rows;
    return props.rows.filter((r) => getDayKey(r) === dayKey);
  }, [props.rows, dayKey]);

  const conflicts = React.useMemo(() => findStageConflicts(rows), [rows]);

  const conflictSetIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const c of conflicts) {
      ids.add(c.a.id);
      ids.add(c.b.id);
    }
    return ids;
  }, [conflicts]);

  const stagesInView = React.useMemo(() => {
    const bySort = [...props.stages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const hasUnassigned = rows.some((r) => !r.stageId);

    const out = bySort.filter((st) => rows.some((r) => r.stageId === st.id));
    if (hasUnassigned) out.push({ id: "__unassigned__", name: "Unassigned", sortOrder: 9_999_999 });
    return out;
  }, [props.stages, rows]);

  const [stageIndex, setStageIndex] = React.useState(0);
  React.useEffect(() => {
    setStageIndex((i) => clamp(i, 0, Math.max(0, stagesInView.length - 1)));
  }, [stagesInView.length]);

  const [zoom, setZoom] = React.useState<Zoom>("auto");

  const timeDomain = React.useMemo(() => {
    let minMinute = Number.POSITIVE_INFINITY;
    let maxMinute = Number.NEGATIVE_INFINITY;

    for (const s of rows) {
      const a = parseIso(s.startsAt);
      const b = parseIso(s.endsAt);
      if (!a || !b) continue;
      minMinute = Math.min(minMinute, minutesSinceMidnight(a));
      maxMinute = Math.max(maxMinute, minutesSinceMidnight(b));
    }

    if (!Number.isFinite(minMinute) || !Number.isFinite(maxMinute)) {
      const start = 12 * 60;
      const end = 24 * 60;
      return { start, end, span: end - start };
    }

    const start0 = roundDown(minMinute, 30);
    const end0 = roundUp(maxMinute, 30);
    const span0 = Math.max(end0 - start0, 180);

    if (zoom === "auto") return { start: start0, end: start0 + span0, span: span0 };
    if (zoom === "6h") {
      const span = 360;
      return { start: start0, end: start0 + span, span };
    }
    if (zoom === "12h") {
      const span = 720;
      return { start: start0, end: start0 + span, span };
    }
    return { start: start0, end: end0, span: Math.max(end0 - start0, 180) };
  }, [rows, zoom]);

  const ticks = React.useMemo<Tick[]>(() => {
    const start = timeDomain.start;
    const end = timeDomain.end;

    const out: Tick[] = [];
    const seen = new Set<number>();

    if (start % 60 === 0) {
      seen.add(start);
      out.push({ minute: start, label: formatTickLabel(start) });
    }

    const first = roundUp(start, 60);
    for (let m = first; m <= end; m += 60) {
      if (seen.has(m)) continue;
      seen.add(m);
      out.push({ minute: m, label: formatTickLabel(m) });
    }

    out.sort((a, b) => a.minute - b.minute);
    return out;
  }, [timeDomain]);

  function leftPct(minute: number) {
    const x = (minute - timeDomain.start) / timeDomain.span;
    return `${clamp(x, 0, 1) * 100}%`;
  }
  function widthPct(startMinute: number, endMinute: number) {
    const w = (endMinute - startMinute) / timeDomain.span;
    return `${clamp(w, 0, 1) * 100}%`;
  }

  const stagesToRender = React.useMemo(() => {
    if (stageMode === "all") return stagesInView;
    const one = stagesInView[stageIndex];
    return one ? [one] : [];
  }, [stageMode, stagesInView, stageIndex]);

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Timeline</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {dayKey === "all" ? "All days" : `Day: ${dayKey}`} • Lanes by stage • Click a block to inspect
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {rows.length} set{rows.length === 1 ? "" : "s"} • {conflicts.length} conflict pair
              {conflicts.length === 1 ? "" : "s"}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground">Zoom</label>
              <select
                value={zoom}
                onChange={(e) => setZoom(e.target.value as Zoom)}
                className={cn(
                  "h-8 rounded-md border bg-background px-2 text-xs text-foreground",
                  "border-border focus:outline-none focus:ring-2 focus:ring-ring/40"
                )}
              >
                {(Object.keys(ZOOM_LABEL) as Zoom[]).map((z) => (
                  <option key={z} value={z}>
                    {ZOOM_LABEL[z]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground">Stage view</label>
              <select
                value={stageMode}
                onChange={() => {}}
                disabled
                className={cn(
                  "h-8 rounded-md border bg-background px-2 text-xs text-foreground opacity-60",
                  "border-border"
                )}
              >
                <option value={stageMode}>{stageMode === "single" ? "Single stage" : "All stages"}</option>
              </select>
            </div>
          </div>
        </div>

        {stageMode === "single" ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Stage{" "}
              <span className="font-medium text-foreground">{stagesInView[stageIndex]?.name ?? "—"}</span>{" "}
              <span className="text-muted-foreground">
                ({stagesInView.length ? stageIndex + 1 : 0}/{stagesInView.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-full px-3"
                onClick={() => setStageIndex((i) => clamp(i - 1, 0, Math.max(0, stagesInView.length - 1)))}
                disabled={stagesInView.length <= 1 || stageIndex === 0}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-full px-3"
                onClick={() => setStageIndex((i) => clamp(i + 1, 0, Math.max(0, stagesInView.length - 1)))}
                disabled={stagesInView.length <= 1 || stageIndex >= stagesInView.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-245">
            {/* tick bar */}
            <div className="relative mb-4 h-10 rounded-md border border-border bg-background">
              {ticks.map((t, idx) => (
                <div
                  key={`${t.minute}-${idx}`}
                  className="absolute top-0 h-full"
                  style={{ left: leftPct(t.minute) }}
                >
                  <div className="h-full w-px bg-border" />
                  <div className="absolute top-1 -translate-x-1/2 text-[11px] text-muted-foreground">
                    {t.label}
                  </div>
                </div>
              ))}
            </div>

            <div className={cn("grid gap-4", stageMode === "all" ? "max-h-[70vh] overflow-y-auto pr-2" : "")}>
              {stagesToRender.length === 0 ? (
                <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
                  No sets to display for this filter.
                </div>
              ) : null}

              {stagesToRender.map((stage) => {
                const laneRows = rows
                  .filter((r) => (stage.id === "__unassigned__" ? !r.stageId : r.stageId === stage.id))
                  .slice()
                  .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

                return (
                  <div key={stage.id} className="grid gap-2">
                    {stageMode === "all" ? (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-foreground">{stage.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {laneRows.length} set{laneRows.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    ) : null}

                    {/* Taller lane */}
                    <div className="relative h-40 overflow-hidden rounded-md border border-border bg-background">
                      {/* hour grid lines */}
                      {ticks.map((t, idx) => (
                        <div
                          key={`${stage.id}-grid-${t.minute}-${idx}`}
                          className="absolute top-0 h-full w-px bg-muted/40"
                          style={{ left: leftPct(t.minute) }}
                        />
                      ))}

                      {laneRows.map((s) => {
                        const a = parseIso(s.startsAt);
                        const b = parseIso(s.endsAt);
                        if (!a || !b) return null;

                        const startM = minutesSinceMidnight(a);
                        const endM = minutesSinceMidnight(b);

                        const invalid = isInvalidInterval(s);
                        const hasConflict = conflictSetIds.has(s.id);
                        const selected = props.selectedId === s.id;

                        const clampedStart = clamp(startM, timeDomain.start, timeDomain.end);
                        const clampedEnd = clamp(endM, timeDomain.start, timeDomain.end);

                        const minWidthMinutes = 10;
                        const safeEnd = Math.max(clampedEnd, clampedStart + minWidthMinutes);

                        const status = invalid ? "invalid" : hasConflict ? "conflict" : "ok";

                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => props.onSelect?.(s.id)}
                            className={cn(
                              "absolute left-0 top-4 h-28 overflow-hidden rounded-2xl border px-3 py-2 text-left transition",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                              selected && "ring-2 ring-ring/50",
                              status !== "ok"
                                ? "border-destructive/40 bg-destructive/10 text-foreground"
                                : "border-border bg-muted/40 text-foreground hover:bg-muted/60"
                            )}
                            style={{
                              left: leftPct(clampedStart),
                              width: widthPct(clampedStart, safeEnd),
                            }}
                            title={`${s.artistName} • ${fmtAdminTime(s.startsAt)}–${fmtAdminTime(s.endsAt)}`}
                          >
                            <p className="truncate text-sm font-semibold">{s.artistName}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {fmtAdminTime(s.startsAt)}–{fmtAdminTime(s.endsAt)}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {stageMode === "single" ? (stage.name || "") : ""}
                              {stage.id === "__unassigned__" ? " • No stage" : ""}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                              {status === "invalid" ? (
                                <span className="rounded-full bg-destructive px-2 py-0.5 text-destructive-foreground">
                                  Invalid
                                </span>
                              ) : status === "conflict" ? (
                                <span className="rounded-full bg-destructive px-2 py-0.5 text-destructive-foreground">
                                  Conflict
                                </span>
                              ) : (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">OK</span>
                              )}

                              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-muted-foreground">
                                {s.dayLabel?.trim() ? s.dayLabel : getDayKey(s)}
                              </span>
                            </div>
                          </button>
                        );
                      })}

                      {laneRows.length === 0 ? (
                        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                          No sets on this stage
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-1">OK</span>
              <span className="rounded-full bg-destructive px-2 py-1 text-destructive-foreground">
                Conflict / Invalid
              </span>
              <span className="rounded-full border border-border bg-background px-2 py-1">
                Click block → inspector
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
