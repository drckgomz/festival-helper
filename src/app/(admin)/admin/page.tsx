// src/app/(admin)/admin/page.tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { db } from "@/db";
import {
  festivals,
  artists,
  sets,
  stages,
  festivalDays,
  groups,
  users,
  userFestivalArtistFavorites,
} from "@/db/schema";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { eq, gte, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function MetricCard(props: { href: string; label: string; value: string | number; sub?: string }) {
  const { href, label, value, sub } = props;
  return (
    <Link href={href} className="block">
      <Card className="border-zinc-200/70 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950/60">
        <CardContent className="p-5">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {sub ? <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">{sub}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}

type Point = { label: string; value: number };

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  // postgres-js can return timestamps as strings depending on config/driver
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}


function fillDays(rows: { day: string; value: number }[], days: number): Point[] {
  const map = new Map(rows.map((r) => [r.day, Number(r.value || 0)]));
  const out: Point[] = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;

    out.push({ label: `${mm}/${dd}`, value: map.get(key) ?? 0 });
  }
  return out;
}

export default async function AdminDashboardPage() {
  // Use a JS date cutoff instead of interval strings (portable + safe)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  // 1) Headline counts + last updates (safe Drizzle queries)
  const [
    festivalsTotalRow,
    festivalsPublishedRow,
    artistsRow,
    setsRow,
    stagesRow,
    daysRow,
    groupsRow,
    usersRow,
    lastFestivalUpdateRow,
    lastSetUpdateRow,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(festivals),
    db.select({ count: sql<number>`count(*)` }).from(festivals).where(eq(festivals.isPublished, true)),
    db.select({ count: sql<number>`count(*)` }).from(artists),
    db.select({ count: sql<number>`count(*)` }).from(sets),
    db.select({ count: sql<number>`count(*)` }).from(stages),
    db.select({ count: sql<number>`count(*)` }).from(festivalDays),
    db.select({ count: sql<number>`count(*)` }).from(groups),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ max: sql<Date | null>`max(${festivals.updatedAt})` }).from(festivals),
    db.select({ max: sql<Date | null>`max(${sets.updatedAt})` }).from(sets),
  ]);

  const festivalsTotal = Number(festivalsTotalRow[0]?.count ?? 0);
  const festivalsPublished = Number(festivalsPublishedRow[0]?.count ?? 0);
  const festivalsDrafts = Math.max(0, festivalsTotal - festivalsPublished);

  const artistsCount = Number(artistsRow[0]?.count ?? 0);
  const setsCount = Number(setsRow[0]?.count ?? 0);
  const stagesCount = Number(stagesRow[0]?.count ?? 0);
  const daysCount = Number(daysRow[0]?.count ?? 0);
  const groupsCount = Number(groupsRow[0]?.count ?? 0);
  const usersCount = Number(usersRow[0]?.count ?? 0);

  const lastFestivalUpdate = toDate(lastFestivalUpdateRow[0]?.max);
  const lastSetUpdate = toDate(lastSetUpdateRow[0]?.max);


  const lastUpdate =
  lastSetUpdate && lastFestivalUpdate
    ? new Date(Math.max(lastSetUpdate.getTime(), lastFestivalUpdate.getTime()))
    : lastSetUpdate ?? lastFestivalUpdate;


  const lastUpdateLabel = lastUpdate
    ? lastUpdate.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  // 2) Charts (last 30 days) — use date_trunc via sql(), but still in Drizzle select()
  const [usersDailyDb, setsDailyDb, favsDailyDb] = await Promise.all([
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${users.createdAt}), 'YYYY-MM-DD')`,
        value: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(gte(users.createdAt, cutoff))
      .groupBy(sql`1`)
      .orderBy(sql`1`),

    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${sets.createdAt}), 'YYYY-MM-DD')`,
        value: sql<number>`count(*)::int`,
      })
      .from(sets)
      .where(gte(sets.createdAt, cutoff))
      .groupBy(sql`1`)
      .orderBy(sql`1`),

    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${userFestivalArtistFavorites.createdAt}), 'YYYY-MM-DD')`,
        value: sql<number>`count(*)::int`,
      })
      .from(userFestivalArtistFavorites)
      .where(gte(userFestivalArtistFavorites.createdAt, cutoff))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
  ]);

  const usersDaily = fillDays(usersDailyDb, 30);
  const setsDaily = fillDays(setsDailyDb, 30);
  const favoritesDaily = fillDays(favsDailyDb, 30);

  const festivalStatus = [
    { name: "Published", value: festivalsPublished },
    { name: "Drafts", value: festivalsDrafts },
  ];

  return (
    <div className="grid gap-4">
      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Dashboard</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                Quick snapshot. Click any tile to jump into that section.
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Last content update</p>
              <p className="mt-1 text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {lastUpdateLabel}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          href="/admin/festivals"
          label="Festivals"
          value={festivalsTotal}
          sub={`${festivalsPublished} published • ${festivalsDrafts} drafts`}
        />
        <MetricCard href="/admin/artists" label="Artists" value={artistsCount} sub="Global catalog" />
        <MetricCard href="/admin/festivals" label="Sets" value={setsCount} sub="All festivals" />
        <MetricCard href="/admin/festivals" label="Stages" value={stagesCount} sub="All festivals" />
        <MetricCard href="/admin/festivals" label="Festival days" value={daysCount} sub="Weekend grouping" />
        <MetricCard href="/admin/festivals" label="Groups" value={groupsCount} sub="Planning groups" />
        <MetricCard href="/admin" label="Users" value={usersCount} sub="Signed up accounts" />
        <MetricCard href="/admin/account" label="Your account" value="Settings" sub="Profile + security" />
      </div>


      <DashboardCharts
        usersDaily={usersDaily}
        setsDaily={setsDaily}
        favoritesDaily={favoritesDaily}
        festivalStatus={festivalStatus}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="border-zinc-200/70 dark:border-zinc-800">
          <CardContent className="p-5">
            <p className="text-sm font-semibold">What to do next</p>
            <Separator className="my-4" />
            <ul className="grid gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <li>• Create / publish a festival (slug, dates, timezone).</li>
              <li>• Add days + stages, then bulk import sets.</li>
              <li>• Verify site schedule + vote flow.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/70 dark:border-zinc-800">
          <CardContent className="p-5">
            <p className="text-sm font-semibold">Admin glance</p>
            <Separator className="my-4" />
            <div className="grid gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Published festivals</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{festivalsPublished}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Draft festivals</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{festivalsDrafts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Users</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{usersCount}</span>
              </div>
              <p className="pt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                Next upgrade: “recently edited”, “missing stage assignments”, “overlap warnings”.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
