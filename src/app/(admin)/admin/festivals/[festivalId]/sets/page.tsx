// src/app/(admin)/admin/festivals/[festivalId]/sets/page.tsx
import Link from "next/link";
import { db } from "@/db";
import { artists, festivalDays, sets, stages } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminFestivalSetsManager } from "@/components/admin/festival/sets/admin-festival-sets-manager";
import { ArrowLeft } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFestivalSetsPage(props: {
  params: Promise<{ festivalId: string }>;
}) {
  const { festivalId } = await props.params;

  const [dayRows, stageRows, artistRows, setRows] = await Promise.all([
    db
      .select()
      .from(festivalDays)
      .where(eq(festivalDays.festivalId, festivalId))
      .orderBy(asc(festivalDays.sortOrder), asc(festivalDays.dayDate)),

    db
      .select()
      .from(stages)
      .where(eq(stages.festivalId, festivalId))
      .orderBy(asc(stages.sortOrder), asc(stages.name)),

    db.select().from(artists).orderBy(asc(artists.name)),

    db
      .select({
        id: sets.id,
        festivalId: sets.festivalId,
        stageId: sets.stageId,
        artistId: sets.artistId,
        startsAt: sets.startsAt,
        endsAt: sets.endsAt,
        dayLabel: sets.dayLabel,
        createdAt: sets.createdAt,
        updatedAt: sets.updatedAt,

        stageName: stages.name,
        artistName: artists.name,
        artistImageUrl: artists.imageUrl,
      })
      .from(sets)
      .where(eq(sets.festivalId, festivalId))
      .leftJoin(stages, eq(sets.stageId, stages.id))
      .leftJoin(artists, eq(sets.artistId, artists.id))
      .orderBy(asc(sets.startsAt)),
  ]);

  return (
    <div className="grid gap-4">
      {/* Header */}
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Sets</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Assign artists to stages/locations at specific times. Conflicts (same stage overlaps) are detected
                automatically.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Festival ID: <span className="font-mono">{festivalId}</span>
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

      <AdminFestivalSetsManager
        festivalId={festivalId}
        days={dayRows.map((d) => ({
          id: d.id,
          dayDate: String(d.dayDate), // drizzle may give Date-like; keep safe string
          label: d.label ?? null,
          sortOrder: d.sortOrder ?? 0,
          groupKey: (d as any).groupKey ?? null,
          groupLabel: (d as any).groupLabel ?? null,
        }))}
        stages={stageRows.map((s) => ({
          id: s.id,
          name: s.name,
          sortOrder: s.sortOrder ?? 0,
        }))}
        artists={artistRows.map((a) => ({
          id: a.id,
          name: a.name,
          imageUrl: a.imageUrl ?? null,
        }))}
        initialSets={setRows.map((r) => ({
          id: r.id,
          festivalId: r.festivalId,
          stageId: r.stageId ?? null,
          stageName: r.stageName ?? null,
          artistId: r.artistId,
          artistName: r.artistName ?? "(missing artist)",
          artistImageUrl: r.artistImageUrl ?? null,
          startsAt:
            r.startsAt instanceof Date
              ? r.startsAt.toISOString()
              : new Date(r.startsAt as any).toISOString(),
          endsAt:
            r.endsAt instanceof Date
              ? r.endsAt.toISOString()
              : new Date(r.endsAt as any).toISOString(),
          dayLabel: r.dayLabel ?? null,
          createdAt:
            r.createdAt instanceof Date
              ? r.createdAt.toISOString()
              : new Date(r.createdAt as any).toISOString(),
          updatedAt:
            r.updatedAt instanceof Date
              ? r.updatedAt.toISOString()
              : new Date(r.updatedAt as any).toISOString(),
        }))}
      />
    </div>
  );
}
