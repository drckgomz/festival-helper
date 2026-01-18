// src/app/(admin)/admin/festivals/page.tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { festivalDays, festivals, sets, stages } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FestivalRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  timezone: string;
  startDate: Date | null;
  endDate: Date | null;
  isPublished: boolean;
  updatedAt: Date;

  daysCount: number;
  stagesCount: number;
  setsCount: number;
};

function fmtDateRange(start: Date | null, end: Date | null) {
  if (!start && !end) return "—";
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "2-digit" };
  const s = start ? start.toLocaleDateString(undefined, opts) : "—";
  const e = end ? end.toLocaleDateString(undefined, opts) : "—";
  return `${s} → ${e}`;
}

export default async function AdminFestivalsPage() {
  // One query that returns festivals + lightweight counts.
  // (Counts are correlated subqueries: simple + reliable.)
  const rows = await db
    .select({
      id: festivals.id,
      name: festivals.name,
      slug: festivals.slug,
      city: festivals.city,
      timezone: festivals.timezone,
      startDate: festivals.startDate,
      endDate: festivals.endDate,
      isPublished: festivals.isPublished,
      updatedAt: festivals.updatedAt,

      daysCount: sql<number>`(
        select count(*)::int
        from ${festivalDays}
        where ${festivalDays.festivalId} = ${festivals.id}
      )`,
      stagesCount: sql<number>`(
        select count(*)::int
        from ${stages}
        where ${stages.festivalId} = ${festivals.id}
      )`,
      setsCount: sql<number>`(
        select count(*)::int
        from ${sets}
        where ${sets.festivalId} = ${festivals.id}
      )`,
    })
    .from(festivals)
    .orderBy(desc(festivals.updatedAt));

  const festivalsList = rows as FestivalRow[];

  return (
    <div className="grid gap-4">
      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Festivals</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                Create and manage festivals. Jump into days, stages, and sets from one place.
              </p>
            </div>

            {/* If you want “Create” later, keep disabled for now. */}
            <Button className="h-9 rounded-full px-4">
                <Link href="/admin/festivals/new">+ New festival</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {festivalsList.length === 0 ? (
        <Card className="border-zinc-200/70 dark:border-zinc-800">
          <CardContent className="p-5">
            <p className="text-sm font-semibold">No festivals yet</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              Create your first festival to start adding days, stages, and sets.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {festivalsList.map((f) => {
            const base = `/admin/festivals/${f.id}`;
            const updatedLabel = f.updatedAt
              ? f.updatedAt.toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—";

            return (
              <Card key={f.id} className="border-zinc-200/70 dark:border-zinc-800">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{f.name}</p>
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[11px] font-medium " +
                            (f.isPublished
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")
                          }
                        >
                          {f.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-1 text-xs text-zinc-600 dark:text-zinc-300">
                        <p>
                          slug: <span className="font-medium text-zinc-900 dark:text-zinc-100">{f.slug}</span>
                        </p>
                        <p>
                          location:{" "}
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {f.city ?? "—"}
                          </span>{" "}
                          • tz:{" "}
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{f.timezone}</span>
                        </p>
                        <p>
                          dates:{" "}
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {fmtDateRange(f.startDate, f.endDate)}
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Updated {updatedLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button asChild variant="outline" className="h-9 rounded-full px-4">
                          <Link href={base}>Manage</Link>
                        </Button>

                        <Button asChild className="h-9 rounded-full px-4">
                          <Link href={`${base}/sets`}>Manage sets</Link>
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{f.daysCount}</span> days
                        </span>
                        <span>•</span>
                        <span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{f.stagesCount}</span>{" "}
                          stages
                        </span>
                        <span>•</span>
                        <span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{f.setsCount}</span> sets
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick links row */}
                  <div className="mt-4 flex flex-wrap gap-2">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
