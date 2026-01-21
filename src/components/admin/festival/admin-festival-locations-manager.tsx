// src/components/admin/festivals/admin-festival-locations-manager.tsx
"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LocationRowMenu } from "@/components/admin/location-row-menu";
import { cn } from "@/lib/utils";

type LocationRow = {
  id: string;
  festivalId: string;
  name: string;
  type: string;
  description: string | null;
  groupKey: string | null;
  groupLabel: string | null;
  sortOrder: number;
  isActive: boolean;
  lat: string | null;
  lng: string | null;
  meta: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const LOCATION_TYPES = [
  "all",
  "stage",
  "merch",
  "restroom",
  "entrance",
  "food",
  "medical",
  "parking",
  "transportation",
  "other",
] as const;

type LocationType = (typeof LOCATION_TYPES)[number];

function groupTitle(groupLabel: string | null, groupKey: string | null) {
  if (groupLabel?.trim()) return groupLabel.trim();
  if (groupKey?.trim()) return groupKey.trim();
  return "Ungrouped";
}

function groupKeyForMap(groupKey: string | null, groupLabel: string | null) {
  return `${groupKey ?? ""}::${groupLabel ?? ""}`;
}

const selectClass = cn(
  "h-10 w-full rounded-md border px-3 text-sm shadow-sm outline-none",
  "border-border bg-background text-foreground",
  "focus-visible:ring-2 focus-visible:ring-ring/40",
  // ✅ prevent dark-mode hover text issues
  "hover:bg-hover hover:text-hover-foreground"
);

const toggleClass = cn(
  "h-10 w-full rounded-md border px-3 text-xs font-medium shadow-sm",
  "border-border bg-background text-foreground",
  "hover:bg-hover hover:text-hover-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
);

export function AdminFestivalLocationsManager(props: { festivalId: string; rows: LocationRow[] }) {
  const { festivalId, rows } = props;

  const [typeFilter, setTypeFilter] = React.useState<LocationType>("all");
  const [groupFilter, setGroupFilter] = React.useState<string>("all");
  const [q, setQ] = React.useState<string>("");
  const [showInactive, setShowInactive] = React.useState<boolean>(false);

  const groups = React.useMemo(() => {
    const map = new Map<string, LocationRow[]>();
    for (const r of rows) {
      const k = groupKeyForMap(r.groupKey, r.groupLabel);
      const list = map.get(k) ?? [];
      list.push(r);
      map.set(k, list);
    }
    return map;
  }, [rows]);

  const groupOptions = React.useMemo(() => {
    const opts = Array.from(groups.entries()).map(([k, items]) => {
      const first = items[0];
      return {
        key: k,
        title: groupTitle(first.groupLabel, first.groupKey),
        count: items.length,
      };
    });
    opts.sort((a, b) => a.title.localeCompare(b.title));
    return opts;
  }, [groups]);

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();

    return rows.filter((r) => {
      if (!showInactive && !r.isActive) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;

      const gk = groupKeyForMap(r.groupKey, r.groupLabel);
      if (groupFilter !== "all" && gk !== groupFilter) return false;

      if (query) {
        const hay = `${r.name} ${r.type} ${r.groupKey ?? ""} ${r.groupLabel ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }

      return true;
    });
  }, [rows, showInactive, typeFilter, groupFilter, q]);

  const filteredGroups = React.useMemo(() => {
    const map = new Map<string, LocationRow[]>();
    for (const r of filtered) {
      const k = groupKeyForMap(r.groupKey, r.groupLabel);
      const list = map.get(k) ?? [];
      list.push(r);
      map.set(k, list);
    }
    return map;
  }, [filtered]);

  return (
    <div className="grid gap-4">
      {/* Header */}
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Locations</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage map pins: stages, restrooms, merch, entrances, transportation, etc.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{rows.length}</span> total •{" "}
                <span className="font-medium text-foreground">{filtered.length}</span> showing
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" className="h-9 rounded-full px-4">
                <Link href={`/admin/festivals/${festivalId}/locations`}>Open full page</Link>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 grid gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="text-xs font-medium text-foreground">Search</label>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, type, group…"
                className="mt-2 h-10"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-medium text-foreground">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as LocationType)}
                className={cn("mt-2", selectClass)}
              >
                {LOCATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All types" : t}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="text-xs font-medium text-foreground">Group</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className={cn("mt-2", selectClass)}
              >
                <option value="all">All groups</option>
                {groupOptions.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.title} ({g.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1 flex items-end">
              <button
                type="button"
                onClick={() => setShowInactive((v) => !v)}
                className={toggleClass}
                aria-pressed={showInactive}
                title="Toggle inactive"
              >
                {showInactive ? "All" : "Active"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create */}
      <LocationsCreateForm festivalId={festivalId} />

      <Separator />

      {/* List */}
      <LocationsList festivalId={festivalId} groups={filteredGroups} allRowsCount={rows.length} />
    </div>
  );
}

/* ===========================
   Create Form
   =========================== */

function LocationsCreateForm(props: { festivalId: string }) {
  const { festivalId } = props;

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardContent className="p-5">
        <form action={`/api/admin/festivals/${festivalId}/locations`} method="post" className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs font-medium text-foreground">Name *</label>
              <Input name="name" required placeholder="T-Mobile Stage" className="h-10" />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-foreground">Type</label>
              <select name="type" defaultValue="stage" className={selectClass}>
                {LOCATION_TYPES.filter((t) => t !== "all").map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-foreground">Group key</label>
              <Input name="groupKey" placeholder="main-grounds" className="h-10" />
              <p className="text-[11px] text-muted-foreground">Used for grouping + sorting.</p>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-foreground">Group label</label>
              <Input name="groupLabel" placeholder="Main Grounds" className="h-10" />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-foreground">Latitude</label>
              <Input name="lat" placeholder="30.2672" className="h-10" />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-foreground">Longitude</label>
              <Input name="lng" placeholder="-97.7431" className="h-10" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button className="h-9 rounded-full px-4">Add location</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ===========================
   Grouped List
   =========================== */

function LocationsList(props: {
  festivalId: string;
  groups: Map<string, LocationRow[]>;
  allRowsCount: number;
}) {
  const { festivalId, groups, allRowsCount } = props;

  const entries = Array.from(groups.entries()).sort((a, b) => {
    const a0 = a[1][0];
    const b0 = b[1][0];
    return groupTitle(a0.groupLabel, a0.groupKey).localeCompare(groupTitle(b0.groupLabel, b0.groupKey));
  });

  if (allRowsCount === 0) {
    return (
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground">No locations yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add your first stage / restroom / merch booth above.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground">No matches</p>
          <p className="mt-1 text-xs text-muted-foreground">Try clearing filters or changing the search.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {entries.map(([key, items]) => (
        <LocationsGroupCard key={key} festivalId={festivalId} items={items} />
      ))}
    </div>
  );
}

function LocationsGroupCard(props: { festivalId: string; items: LocationRow[] }) {
  const { festivalId, items } = props;
  const first = items[0];
  const title = groupTitle(first.groupLabel, first.groupKey);

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {items.length} location{items.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {items.map((loc) => (
            <div
              key={loc.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-2 rounded-md border p-3",
                "border-border bg-background text-foreground"
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {loc.name}
                  {!loc.isActive ? (
                    <span
                      className={cn(
                        "ml-2 rounded-full border px-2 py-0.5 text-[11px]",
                        "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      inactive
                    </span>
                  ) : null}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{loc.type}</span>
                  {loc.lat && loc.lng ? (
                    <>
                      {" "}
                      • {loc.lat}, {loc.lng}
                    </>
                  ) : (
                    " • no GPS yet"
                  )}
                </p>
              </div>

              <LocationRowMenu festivalId={festivalId} locationId={loc.id} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
