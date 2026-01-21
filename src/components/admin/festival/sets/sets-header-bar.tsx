// src/components/admin/festival/sets/sets-header-bar.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import type { ViewMode } from "./types";

export function SetsHeaderBar(props: {
  view: ViewMode;
  onView: (v: ViewMode) => void;
  conflictsCount: number;
  busy: boolean;
  onReload: () => void;
}) {
  const { view, onView, conflictsCount, busy, onReload } = props;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Manage schedule</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Table editing + conflict detection (same stage overlaps).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={view === "table" ? "default" : "outline"}
            className="h-9 rounded-full px-4"
            onClick={() => onView("table")}
          >
            Table
          </Button>

          <Button
            type="button"
            variant={view === "conflicts" ? "default" : "outline"}
            className="h-9 rounded-full px-4"
            onClick={() => onView("conflicts")}
          >
            Conflicts{" "}
            {conflictsCount ? (
              <span
                className={[
                  "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  // readable on both default + outline buttons
                  view === "conflicts"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {conflictsCount}
              </span>
            ) : null}
          </Button>

          <Button
            type="button"
            variant={view === "timeline" ? "default" : "outline"}
            className="h-9 rounded-full px-4"
            onClick={() => onView("timeline")}
          >
            Timeline
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={onReload}
            disabled={busy}
          >
            {busy ? "Working…" : "Reload"}
          </Button>
        </div>
      </div>

      <Separator className="my-4" />
    </>
  );
}
