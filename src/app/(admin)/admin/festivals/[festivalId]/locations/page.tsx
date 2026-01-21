// src/app/(admin)/festivals/[festivalId]/locations/page.tsx
import Link from "next/link";
import { db } from "@/db";
import { festivalLocations } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationRowMenu } from "@/components/admin/location-row-menu";
import { ArrowLeft } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOCATION_TYPES = [
  "stage",
  "merch",
  "restroom",
  "entrance",
  "food",
  "medical",
  "parking",
  "other",
] as const;

function groupTitle(groupLabel: string | null, groupKey: string | null) {
  if (groupLabel?.trim()) return groupLabel.trim();
  if (groupKey?.trim()) return groupKey.trim();
  return "Ungrouped";
}

function groupKeyForMap(groupKey: string | null, groupLabel: string | null) {
  return `${groupKey ?? ""}::${groupLabel ?? ""}`;
}

export default async function FestivalLocationsPage(props: {
  params: Promise<{ festivalId: string }>;
}) {
  const { festivalId } = await props.params;

  const rows = await db
    .select()
    .from(festivalLocations)
    .where(eq(festivalLocations.festivalId, festivalId))
    .orderBy(
      asc(festivalLocations.groupKey),
      asc(festivalLocations.sortOrder),
      asc(festivalLocations.type),
      asc(festivalLocations.name)
    );

  // group in-memory
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = groupKeyForMap(r.groupKey ?? null, r.groupLabel ?? null);
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }

  const entries = Array.from(groups.entries()).sort((a, b) => {
    const a0 = a[1][0];
    const b0 = b[1][0];
    return groupTitle(a0?.groupLabel ?? null, a0?.groupKey ?? null).localeCompare(
      groupTitle(b0?.groupLabel ?? null, b0?.groupKey ?? null)
    );
  });

  return (
    <div className="grid gap-4">
      {/* Header */}
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Locations</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage map pins: stages, merch booths, restrooms, entrances, food, etc.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {rows.length} total
              </p>
            </div>

            <Button asChild variant="outline" className="h-9 rounded-full px-4">
              <Link href={`/admin/festivals/${festivalId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create */}
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-5">
          <form
            action={`/api/admin/festivals/${festivalId}/locations`}
            method="post"
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-xs font-medium text-foreground">Name *</label>
                <Input name="name" required placeholder="T-Mobile Stage" className="h-10" />
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-medium text-foreground">Type</label>
                {/* native select on server pages */}
                <select
                  name="type"
                  defaultValue="stage"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm
                             outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  {LOCATION_TYPES.map((t) => (
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

      <Separator />

      {/* List */}
      {rows.length === 0 ? (
        <Card className="border-border bg-card text-card-foreground">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground">No locations yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your first stage / restroom / merch booth above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {entries.map(([key, items]) => {
            const first = items[0];
            const title = groupTitle(first?.groupLabel ?? null, first?.groupKey ?? null);

            return (
              <Card key={key} className="border-border bg-card text-card-foreground">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
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
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {loc.name}
                            {!loc.isActive ? (
                              <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                                inactive
                              </span>
                            ) : null}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/90">{loc.type}</span>
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
          })}
        </div>
      )}
    </div>
  );
}
