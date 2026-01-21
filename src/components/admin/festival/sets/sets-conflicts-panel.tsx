// src/components/admin/festival/sets/sets-conflicts-panel.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { findStageConflicts } from "./conflict";
import { fmtAdminTime } from "./types";

function StatusBanner(props: { variant: "danger" | "success"; children: React.ReactNode }) {
  const { variant, children } = props;
  return (
    <div
      className={[
        "rounded-md border p-3 text-xs",
        variant === "danger"
          ? "border-destructive/30 bg-destructive/10 text-foreground"
          : "border-emerald-500/25 bg-emerald-500/10 text-foreground",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function SetsConflictsPanel(props: {
  conflicts: ReturnType<typeof findStageConflicts>;
  onJump: (setId: string) => void;
}) {
  if (!props.conflicts.length) {
    return (
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground">No conflicts 🎉</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No overlapping sets on the same stage for the current filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  const groups = new Map<string, typeof props.conflicts>();
  for (const c of props.conflicts) {
    const k = `${c.dayKey}::${c.stageName}`;
    const list = groups.get(k) ?? [];
    list.push(c);
    groups.set(k, list);
  }

  return (
    <div className="grid gap-3">
      {Array.from(groups.entries()).map(([k, list]) => {
        const [dayKey, stageName] = k.split("::");

        return (
          <Card key={k} className="border-border bg-card text-card-foreground">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-foreground">
                {dayKey} • {stageName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {list.length} overlapping pair{list.length === 1 ? "" : "s"}
              </p>

              <div className="mt-3 grid gap-2">
                {list.map((c, idx) => (
                  <StatusBanner key={`${c.a.id}-${c.b.id}-${idx}`} variant="danger">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {c.a.artistName} overlaps {c.b.artistName}
                        </p>

                        <p className="mt-1 text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {fmtAdminTime(c.a.startsAt)}–{fmtAdminTime(c.a.endsAt)}
                          </span>{" "}
                          vs{" "}
                          <span className="font-medium text-foreground">
                            {fmtAdminTime(c.b.startsAt)}–{fmtAdminTime(c.b.endsAt)}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 rounded-full px-3"
                          onClick={() => props.onJump(c.a.id)}
                        >
                          View A
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 rounded-full px-3"
                          onClick={() => props.onJump(c.b.id)}
                        >
                          View B
                        </Button>
                      </div>
                    </div>
                  </StatusBanner>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
