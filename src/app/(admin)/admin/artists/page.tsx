// src/app/(admin)/admin/artists/page.tsx

import { db } from "@/db";
import { artists } from "@/db/schema";
import { asc } from "drizzle-orm";

import { Card, CardContent } from "@/components/ui/card";
import { AdminArtistsManager } from "@/components/admin/artists/admin-artists-manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminArtistsPage() {
  const initial = await db
    .select()
    .from(artists)
    .orderBy(asc(artists.name));

  return (
    <div className="grid gap-4">
      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-5">
          <p className="text-sm font-semibold">Artists (global)</p>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
            Shared across all festivals. Search existing artists first; if not found, create a new one.
            Edit name, image, Spotify, website.
          </p>
        </CardContent>
      </Card>

      <AdminArtistsManager initialArtists={initial} />
    </div>
  );
}
