// src/components/admin/festival/sets/admin-festival-sets-manager.tsx
"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { findStageConflicts, getDayKey, isInvalidInterval, type SetRow } from "./conflict";
import type { DayOption, DayRow, ViewMode } from "./types";
import { norm } from "./types";

import { SetsHeaderBar } from "./sets-header-bar";
import { SetCreateCard } from "./set-create-card";
import { SetsTable } from "./sets-table";
import { SetsConflictsPanel } from "./sets-conflicts-panel";
import { SetsTimeline } from "./sets-timeline";
import { SetInspector } from "./set-inspector";

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

export function AdminFestivalSetsManager(props: {
  festivalId: string;
  days: DayRow[];
  stages: { id: string; name: string; sortOrder: number }[];
  artists: { id: string; name: string; imageUrl: string | null }[];
  initialSets: SetRow[];
}) {
  const [view, setView] = React.useState<ViewMode>("table");

  const [sets, setSets] = React.useState<SetRow[]>(props.initialSets);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    props.initialSets[0]?.id ?? null
  );

  const [dayFilter, setDayFilter] = React.useState<string>(() => {
    const first = props.days[0];
    return first?.label?.trim() || first?.dayDate || "all";
  });

  const [stageFilter, setStageFilter] = React.useState<string>("all");
  const [q, setQ] = React.useState("");

  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const selected = React.useMemo(
    () => sets.find((s) => s.id === selectedId) ?? null,
    [sets, selectedId]
  );

  const dayOptions = React.useMemo<DayOption[]>(() => {
    const out: DayOption[] = [{ key: "all", label: "All days" }];
    for (const d of props.days) {
      const label = d.label?.trim() || d.dayDate;
      out.push({ key: label, label });
    }
    return out;
  }, [props.days]);

  const filteredSets = React.useMemo(() => {
    const qq = norm(q);
    return sets.filter((s) => {
      const dk = getDayKey(s);
      if (dayFilter !== "all" && dk !== dayFilter) return false;
      if (stageFilter !== "all" && s.stageId !== stageFilter) return false;

      if (!qq) return true;
      return norm(s.artistName).includes(qq) || norm(s.stageName ?? "").includes(qq);
    });
  }, [sets, q, dayFilter, stageFilter]);

  const conflicts = React.useMemo(() => findStageConflicts(filteredSets), [filteredSets]);
  const invalids = React.useMemo(() => filteredSets.filter((s) => isInvalidInterval(s)), [filteredSets]);

  async function reload() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/festivals/${props.festivalId}/sets`, { method: "GET" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to reload sets");
      }
      const j = await res.json();
      const rows: SetRow[] = j.sets ?? j.rows ?? [];
      setSets(rows);
      setMsg("Reloaded.");
    } catch (e: any) {
      setErr(e?.message || "Reload failed");
    } finally {
      setBusy(false);
    }
  }

  async function createSet(input: {
    artistId: string;
    stageId: string | null;
    startsAtIso: string;
    endsAtIso: string;
    dayLabel: string | null;
  }) {
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/festivals/${props.festivalId}/sets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          artistId: input.artistId,
          stageId: input.stageId,
          startsAt: input.startsAtIso,
          endsAt: input.endsAtIso,
          dayLabel: input.dayLabel,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to create set");
      }

      const j = await res.json();
      const created: SetRow = j.set ?? j.row ?? j;

      setSets((prev) => {
        const next = [created, ...prev];
        next.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        return next;
      });
      setSelectedId(created.id);
      setMsg("Created.");
    } catch (e: any) {
      setErr(e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function patchSet(
    setId: string,
    patch: Partial<{
      artistId: string;
      stageId: string | null;
      startsAt: string;
      endsAt: string;
      dayLabel: string | null;
    }>
  ) {
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/festivals/${props.festivalId}/sets/${setId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save");
      }

      const j = await res.json();
      const updated: SetRow = j.set ?? j.row ?? j;

      setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)));
      setMsg("Saved.");
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSet(setId: string) {
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/festivals/${props.festivalId}/sets/${setId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to delete");
      }

      setSets((prev) => prev.filter((s) => s.id !== setId));
      setSelectedId((prev) => {
        if (prev !== setId) return prev;
        return sets.find((s) => s.id !== setId)?.id ?? null;
      });
      setMsg("Deleted.");
    } catch (e: any) {
      setErr(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const showInspector = view !== "timeline"; // give timeline the space

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Left */}
      <Card
        className={[
          "border-border bg-card text-card-foreground",
          showInspector ? "lg:col-span-7" : "lg:col-span-12",
        ].join(" ")}
      >
        <CardContent className="p-5">
          <SetsHeaderBar
            view={view}
            onView={setView}
            conflictsCount={conflicts.length}
            busy={busy}
            onReload={reload}
          />

          {/* Filters */}
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField label="Day" value={dayFilter} onChange={setDayFilter}>
              {dayOptions.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </SelectField>

            <SelectField label="Stage" value={stageFilter} onChange={setStageFilter}>
              <option value="all">All stages</option>
              {props.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>

            <div className="grid gap-1">
              <label className="text-xs font-medium text-foreground">Search</label>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-10"
                placeholder="Artist or stage…"
              />
            </div>
          </div>

          {/* Create */}
          <div className="mt-4">
            <SetCreateCard
              days={dayOptions}
              stages={props.stages}
              artists={props.artists}
              defaultDayKey={dayFilter !== "all" ? dayFilter : dayOptions[1]?.key ?? "all"}
              onCreate={createSet}
              busy={busy}
            />
          </div>

          <Separator className="my-4" />

          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          {msg ? <p className="text-xs text-emerald-600">{msg}</p> : null}

          {invalids.length ? (
            <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {invalids.length} set(s) have invalid times (end ≤ start). Fix them in the inspector.
            </div>
          ) : null}

          {/* Content */}
          <div className="mt-4">
            {view === "table" ? (
              <SetsTable
                rows={filteredSets}
                selectedId={selectedId}
                conflicts={conflicts}
                onSelect={setSelectedId}
              />
            ) : view === "conflicts" ? (
              <SetsConflictsPanel
                conflicts={conflicts}
                onJump={(id) => {
                  setView("table");
                  setSelectedId(id);
                }}
              />
            ) : (
              <SetsTimeline
                rows={filteredSets}
                stages={props.stages}
                dayFilterKey={dayFilter}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
                stageMode="single"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right (Inspector) */}
      {showInspector ? (
        <div className="lg:col-span-5">
          {selected ? (
            <SetInspector
              key={selected.id}
              setRow={selected}
              stages={props.stages}
              artists={props.artists}
              dayOptions={dayOptions}
              busy={busy}
              conflicts={findStageConflicts(sets)}
              onSave={(patch) => patchSet(selected.id, patch)}
              onDelete={() => deleteSet(selected.id)}
            />
          ) : (
            <Card className="border-border bg-card text-card-foreground">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-foreground">Select a set</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick a row in the table to edit stage/artist/time.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
