// src/app/(admin)/admin/festivals/[festivalId]/stages/page.tsx
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminFestivalStagesPage() {
  return (
    <Card className="border-zinc-200/70 dark:border-zinc-800">
      <CardContent className="p-5">
        <p className="text-sm font-semibold">Stages</p>
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
          Festival-scoped. Rename stages and edit sortOrder.
        </p>
      </CardContent>
    </Card>
  );
}
