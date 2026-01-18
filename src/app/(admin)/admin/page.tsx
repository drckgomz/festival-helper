// src/app/(admin)/admin/page.tsx
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-4">
      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-5">
          <p className="text-sm font-semibold">Dashboard</p>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
            Coming next: stats, recent edits, publishing status, import/export tools.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
