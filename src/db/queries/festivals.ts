// src/db/queries/festivals.ts
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { festivals, festivalDays } from "@/db/schema";

export async function getFestivalBySlug(slug: string) {
  const rows = await db
    .select()
    .from(festivals)
    .where(eq(festivals.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

export async function getActiveFestivalDays(festivalId: string) {
  return db
    .select({
      dayDate: festivalDays.dayDate,
      label: festivalDays.label,
      sortOrder: festivalDays.sortOrder,
      groupKey: festivalDays.groupKey,
      groupLabel: festivalDays.groupLabel,
    })
    .from(festivalDays)
    .where(and(eq(festivalDays.festivalId, festivalId), eq(festivalDays.isActive, true)))
    .orderBy(asc(festivalDays.sortOrder), asc(festivalDays.dayDate));
}
