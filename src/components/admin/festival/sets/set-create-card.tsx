// src/components/admin/festival/sets/set-create-card.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";

import type { ArtistRow, DayOption, StageRow } from "./types";
import { fromDatetimeLocalValue, norm } from "./types";

function SelectField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const { label, value, onChange, children } = props;

  return (
    <div className="grid gap-1">
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

export function SetCreateCard(props: {
  days: DayOption[];
  stages: StageRow[];
  artists: ArtistRow[];
  defaultDayKey: string;
  busy: boolean;
  onCreate: (input: {
    artistId: string;
    stageId: string | null;
    startsAtIso: string;
    endsAtIso: string;
    dayLabel: string | null;
  }) => Promise<void> | void;
}) {
  const [artistQuery, setArtistQuery] = React.useState("");
  const [artistId, setArtistId] = React.useState<string>("");
  const [stageId, setStageId] = React.useState<string>("");
  const [dayKey, setDayKey] = React.useState<string>(props.defaultDayKey);

  const [startsLocal, setStartsLocal] = React.useState<string>("");
  const [endsLocal, setEndsLocal] = React.useState<string>("");

  const filteredArtists = React.useMemo(() => {
    const q = norm(artistQuery);
    if (!q) return props.artists.slice(0, 50);
    return props.artists.filter((a) => norm(a.name).includes(q)).slice(0, 50);
  }, [props.artists, artistQuery]);

  function pickArtist(id: string) {
    setArtistId(id);
    const a = props.artists.find((x) => x.id === id);
    if (a) setArtistQuery(a.name);
  }

  async function create() {
    if (!artistId) return;
    const startsIso = fromDatetimeLocalValue(startsLocal);
    const endsIso = fromDatetimeLocalValue(endsLocal);
    if (!startsIso || !endsIso) return;

    await props.onCreate({
      artistId,
      stageId: stageId || null,
      startsAtIso: startsIso,
      endsAtIso: endsIso,
      dayLabel: dayKey === "all" ? null : dayKey,
    });

    setArtistId("");
    setArtistQuery("");
  }

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-foreground">Add set</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick artist + stage + start/end. Conflicts will show automatically.
        </p>

        <div className="mt-4 grid gap-3">
          {/* Artist */}
          <div className="grid gap-1">
            <label className="text-xs font-medium text-foreground">Artist</label>
            <Input
              value={artistQuery}
              onChange={(e) => {
                setArtistQuery(e.target.value);
                setArtistId("");
              }}
              className="h-10"
              placeholder="Search artist…"
            />

            <div className="mt-2 grid gap-1">
              {filteredArtists.map((a) => {
                const on = a.id === artistId;

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => pickArtist(a.id)}
                    className={cn(
                      "festival-hover-pressable",
                      "flex w-full items-center justify-between gap-2 rounded-md border p-2 text-left text-sm",
                      "border-border bg-background",
                      on && "ring-2 ring-ring/40"
                    )}
                  >
                    <span className="truncate font-medium text-foreground">{a.name}</span>
                    <span className="text-xs text-muted-foreground">Pick</span>
                  </button>
                );
              })}

              {!filteredArtists.length ? (
                <p className="text-xs text-muted-foreground">No matches.</p>
              ) : null}
            </div>
          </div>

          {/* Day / Stage / Create */}
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField label="Day" value={dayKey} onChange={setDayKey}>
              {props.days
                .filter((d) => d.key !== "all")
                .map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
            </SelectField>

            <SelectField label="Stage" value={stageId} onChange={setStageId}>
              <option value="">Unassigned</option>
              {props.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>

            <div className="flex items-end justify-end">
              <Button
                type="button"
                onClick={create}
                disabled={props.busy || !artistId || !startsLocal || !endsLocal}
                className="h-10 rounded-full px-4"
              >
                {props.busy ? "Working…" : "Create set"}
              </Button>
            </div>
          </div>

          {/* Times */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs font-medium text-foreground">Starts</label>
              <Input
                type="datetime-local"
                value={startsLocal}
                onChange={(e) => setStartsLocal(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-medium text-foreground">Ends</label>
              <Input
                type="datetime-local"
                value={endsLocal}
                onChange={(e) => setEndsLocal(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
