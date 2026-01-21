// src/app/(admin)/admin/festivals/[festivalId]/page.tsx
import Link from "next/link";
import { db } from "@/db";
import { festivalLocations } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { AdminFestivalLocationsManager } from "@/components/admin/festival/admin-festival-locations-manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFestivalOverviewPage(props: {
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

  return (
    <div className="grid gap-4">
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Manage festival</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Overview + tools for this festival.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" className="h-9 rounded-full px-4">
                <Link href="/admin/festivals">Back</Link>
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <p className="text-xs text-muted-foreground">
            Festival ID: <span className="font-mono text-foreground">{festivalId}</span>
          </p>
        </CardContent>
      </Card>

      {/* Locations section (componentized) */}
      <AdminFestivalLocationsManager festivalId={festivalId} rows={rows} />
    </div>
  );
}
