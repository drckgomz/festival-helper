// src/components/admin/festival/sets/sets-table.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

import { findStageConflicts, getDayKey, isInvalidInterval, type SetRow } from "./conflict";
import { fmtAdminDateTime } from "./types";

export function SetsTable(props: {
  rows: SetRow[];
  selectedId: string | null;
  conflicts: ReturnType<typeof findStageConflicts>;
  onSelect: (id: string) => void;
}) {
  const conflictSetIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const c of props.conflicts) {
      ids.add(c.a.id);
      ids.add(c.b.id);
    }
    return ids;
  }, [props.conflicts]);

  return (
    <div className="grid gap-2">
      {props.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sets for these filters.</p>
      ) : null}

      {props.rows.map((s) => {
        const selected = props.selectedId === s.id;
        const hasConflict = conflictSetIds.has(s.id);
        const invalid = isInvalidInterval(s);

        const status = invalid ? "invalid" : hasConflict ? "conflict" : "ok";

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => props.onSelect(s.id)}
            className={cn(
              "flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left transition-colors",
              "border-border bg-card text-card-foreground hover:bg-hover",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              selected && "ring-2 ring-ring/50",
              status !== "ok" && "border-destructive/40"
            )}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{s.artistName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {getDayKey(s)} • {s.stageName ?? "Unassigned stage"}
              </p>

              {/* deterministic formatting to avoid hydration mismatch */}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {fmtAdminDateTime(s.startsAt)} → {fmtAdminDateTime(s.endsAt)}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {status === "invalid" ? (
                <span className="rounded-full bg-destructive px-2 py-1 text-[11px] font-medium text-destructive-foreground">
                  Invalid time
                </span>
              ) : status === "conflict" ? (
                <span className="rounded-full bg-destructive px-2 py-1 text-[11px] font-medium text-destructive-foreground">
                  Conflict
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  OK
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
