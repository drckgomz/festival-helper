// src/app/(admin)/admin/festivals/[festivalId]/days/page.tsx
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminFestivalDaysPage() {
  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardContent className="p-5">
        <p className="text-sm font-semibold text-foreground">Days</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Festival-scoped. Edit label, groupKey/groupLabel, sortOrder, active.
        </p>
      </CardContent>
    </Card>
  );
}
