// src/app/(admin)/admin/festivals/[festivalId]/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function AdminFestivalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { festivalId: string };
}) {
  const festivalId = params.festivalId;
  const base = `/admin/festivals/${festivalId}`;

  return (
    <div className="grid gap-4">
      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-5">
          <p className="text-sm font-semibold">Festival admin</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            festivalId: <span className="font-medium">{festivalId}</span>
          </p>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            <Link
              href={`${base}`}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Overview
            </Link>

            <Link
              href={`${base}/days`}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Days
            </Link>

            <Link
              href={`${base}/stages`}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Stages
            </Link>

            <Link
              href={`${base}/sets`}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Sets
            </Link>
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  );
}
