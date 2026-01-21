// src/app/(admin)/admin/festivals/[festivalId]/stages/page.tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFestivalStagesPage(props: {
  params: Promise<{ festivalId: string }>;
}) {
  const { festivalId } = await props.params;

  return (
    <div className="grid gap-4">
      {/* Header */}
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Stages</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Festival-scoped. Rename stages and edit sortOrder.
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

      {/* Placeholder content */}
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground">Coming soon</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Next: list stages, inline rename, sortOrder controls, and “Add stage”.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
