// src/components/admin/festival/sets/set-inspector.tsx
"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { findStageConflicts, getDayKey, isInvalidInterval, type SetRow } from "./conflict";
import type { ArtistRow, DayOption, StageRow } from "./types";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "./types";

function SelectField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const { label, value, onChange, children } = props;

  return (
    <div className="grid gap-2">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "h-10 w-full rounded-md border px-3 text-sm shadow-sm outline-none",
          "border-border bg-background text-foreground",
          "focus:ring-2 focus:ring-ring/40 focus:border-ring",
        ].join(" ")}
      >
        {children}
      </select>
    </div>
  );
}

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

export function SetInspector(props: {
  setRow: SetRow;
  stages: StageRow[];
  artists: ArtistRow[];
  dayOptions: DayOption[];
  busy: boolean;
  conflicts: ReturnType<typeof findStageConflicts>;
  onSave: (patch: Partial<{
    artistId: string;
    stageId: string | null;
    startsAt: string;
    endsAt: string;
    dayLabel: string | null;
  }>) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}) {
  const [artistId, setArtistId] = React.useState(props.setRow.artistId);
  const [stageId, setStageId] = React.useState(props.setRow.stageId ?? "");
  const [dayLabel, setDayLabel] = React.useState(props.setRow.dayLabel ?? getDayKey(props.setRow));

  const [startsLocal, setStartsLocal] = React.useState(toDatetimeLocalValue(props.setRow.startsAt));
  const [endsLocal, setEndsLocal] = React.useState(toDatetimeLocalValue(props.setRow.endsAt));

  React.useEffect(() => {
    setArtistId(props.setRow.artistId);
    setStageId(props.setRow.stageId ?? "");
    setDayLabel(props.setRow.dayLabel ?? getDayKey(props.setRow));
    setStartsLocal(toDatetimeLocalValue(props.setRow.startsAt));
    setEndsLocal(toDatetimeLocalValue(props.setRow.endsAt));
  }, [props.setRow.id]); // rebind when selection changes

  const stageConflictsForThis = React.useMemo(() => {
    const ids = new Set<string>();
    for (const c of props.conflicts) {
      ids.add(c.a.id);
      ids.add(c.b.id);
    }
    return ids.has(props.setRow.id);
  }, [props.conflicts, props.setRow.id]);

  const invalid = isInvalidInterval({
    ...props.setRow,
    startsAt: fromDatetimeLocalValue(startsLocal) ?? props.setRow.startsAt,
    endsAt: fromDatetimeLocalValue(endsLocal) ?? props.setRow.endsAt,
  });

  async function save() {
    const startsIso = fromDatetimeLocalValue(startsLocal);
    const endsIso = fromDatetimeLocalValue(endsLocal);
    if (!startsIso || !endsIso) return;

    await props.onSave({
      artistId,
      stageId: stageId || null,
      startsAt: startsIso,
      endsAt: endsIso,
      dayLabel: dayLabel?.trim() ? dayLabel.trim() : null,
    });
  }

  const artist = props.artists.find((a) => a.id === artistId) ?? null;

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Edit set</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set ID: <span className="font-mono text-foreground">{props.setRow.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full px-4"
              onClick={props.onDelete}
              disabled={props.busy}
            >
              Delete
            </Button>
            <Button
              type="button"
              className="h-9 rounded-full px-4"
              onClick={save}
              disabled={props.busy}
            >
              {props.busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Status */}
        <div className="grid gap-2">
          {invalid ? <StatusBanner variant="danger">Invalid time range (end ≤ start).</StatusBanner> : null}

          {stageConflictsForThis ? (
            <StatusBanner variant="danger">This set overlaps another set on the same stage.</StatusBanner>
          ) : (
            <StatusBanner variant="success">No stage conflicts detected.</StatusBanner>
          )}
        </div>

        {/* Artist */}
        <div className="mt-4 grid gap-2">
          <SelectField label="Artist" value={artistId} onChange={setArtistId}>
            {props.artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </SelectField>

          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl border border-border bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {artist?.imageUrl ? (
                <img src={artist.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                  none
                </div>
              )}
            </div>
            <p className="min-w-0 truncate text-sm font-medium text-foreground">
              {artist?.name ?? "Unknown"}
            </p>
          </div>
        </div>

        {/* Stage + Day */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SelectField label="Stage" value={stageId} onChange={setStageId}>
            <option value="">Unassigned</option>
            {props.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>

          <div className="grid gap-2">
            <label className="text-xs font-medium text-foreground">Day label</label>
            <Input
              value={dayLabel}
              onChange={(e) => setDayLabel(e.target.value)}
              className="h-10"
              placeholder="Fri / Sat / 2026-10-10"
            />
            <p className="text-[11px] text-muted-foreground">
              Used for filtering/grouping. If blank, we derive from startsAt date.
            </p>
          </div>
        </div>

        {/* Times */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs font-medium text-foreground">Starts</label>
            <Input
              type="datetime-local"
              value={startsLocal}
              onChange={(e) => setStartsLocal(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-medium text-foreground">Ends</label>
            <Input
              type="datetime-local"
              value={endsLocal}
              onChange={(e) => setEndsLocal(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
