// src/app/(admin)/admin/festivals/[festivalId]/page.tsx
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminFestivalOverviewPage({
  params,
}: {
  params: { festivalId: string };
}) {
  const { festivalId } = params;

  return (
    <Card className="border-zinc-200/70 dark:border-zinc-800">
      <CardContent className="p-5">
        <p className="text-sm font-semibold">Overview</p>

        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Festival ID: <span className="font-mono">{festivalId}</span>
        </p>

        <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
          Coming next:
          <br />• publish toggle  
          <br />• timezone  
          <br />• date range  
          <br />• counts (days / stages / sets)  
          <br />• quick tools
        </p>
      </CardContent>
    </Card>
  );
}
