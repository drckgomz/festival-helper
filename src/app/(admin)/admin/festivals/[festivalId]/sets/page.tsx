// src/app/(admin)/admin/festivals/[festivalId]/sets/page.tsx
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminFestivalSetsPage() {
  return (
    <Card className="border-zinc-200/70 dark:border-zinc-800">
      <CardContent className="p-5">
        <p className="text-sm font-semibold">Sets</p>
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
          Festival-scoped. Edit times, artist, stage, day label. Add bulk editor/import later.
        </p>
      </CardContent>
    </Card>
  );
}
