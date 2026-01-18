// src/app/(admin)/admin/festivals/page.tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Scaffold only:
 * Later you’ll load festivals from DB + allow create/edit.
 */
const mockFestivals = [
  { id: "acl-2024-id", name: "Austin City Limits 2024", slug: "acl-2024" },
];

export default function AdminFestivalsPage() {
  return (
    <div className="grid gap-4">
      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Festivals</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                Pick a festival to manage its days, stages, and sets.
              </p>
            </div>

            <Button className="h-9 rounded-full px-4" disabled>
              + New festival (soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {mockFestivals.map((f) => (
          <Card key={f.id} className="border-zinc-200/70 dark:border-zinc-800">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-semibold">{f.name}</p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                  slug: <span className="font-medium">{f.slug}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="h-9 rounded-full px-4">
                  <Link href={`/admin/festivals/${f.id}?festivalId=${encodeURIComponent(f.id)}`}>
                    Manage
                  </Link>
                </Button>

                <Button asChild className="h-9 rounded-full px-4">
                  <Link href={`/admin?festivalId=${encodeURIComponent(f.id)}`}>Set as current</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
