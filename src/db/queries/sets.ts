// src/db/queries/sets.ts
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { artists, sets, stages } from "@/db/schema";

// days: ["2024-10-04", "2024-10-05"]
export async function getSetsForFestivalDays(params: { festivalId: string; days: string[] }) {
  const { festivalId, days } = params;

  const results: Array<{
    day: string;
    stageName: string | null;
    stageSort: number | null;
    artistId: string;
    artistName: string;
    artistImageUrl: string | null;
    startsAt: Date;
    endsAt: Date;
    setId: string;
  }> = [];

  for (const day of days) {
    const start = new Date(`${day}T00:00:00`);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const rows = await db
      .select({
        setId: sets.id,
        startsAt: sets.startsAt,
        endsAt: sets.endsAt,

        stageName: stages.name,
        stageSort: stages.sortOrder,

        artistId: artists.id,
        artistName: artists.name,
        artistImageUrl: artists.imageUrl,
      })
      .from(sets)
      .innerJoin(artists, eq(sets.artistId, artists.id))
      .leftJoin(stages, eq(sets.stageId, stages.id))
      .where(and(eq(sets.festivalId, festivalId), gte(sets.startsAt, start), lt(sets.startsAt, end)))
      .orderBy(asc(stages.sortOrder), asc(sets.startsAt));

    for (const r of rows) {
      results.push({
        day,
        stageName: r.stageName ?? null,
        stageSort: r.stageSort ?? null,
        artistId: r.artistId,
        artistName: r.artistName,
        artistImageUrl: r.artistImageUrl ?? null,
        startsAt: r.startsAt,
        endsAt: r.endsAt,
        setId: r.setId,
      });
    }
  }

  return results;
}

export type GetSetsByIdsRow = {
  setId: string;
  startsAt: Date;
  endsAt: Date;
  stageName: string | null;
  stageSort: number | null;
  artistId: string;
  artistName: string;
  artistImageUrl: string | null;
};

export async function getSetsByIds(params: { festivalId: string; setIds: string[] }) {
	const { festivalId, setIds } = params;

	if (setIds.length === 0) return [];

	const rows = await db
		.select({
			setId: sets.id,
			startsAt: sets.startsAt,
			endsAt: sets.endsAt,

			stageName: stages.name,
			stageSort: stages.sortOrder,

			artistId: artists.id,
			artistName: artists.name,
			artistImageUrl: artists.imageUrl,
		})
		.from(sets)
		.innerJoin(artists, eq(sets.artistId, artists.id))
		.leftJoin(stages, eq(sets.stageId, stages.id))
		.where(and(eq(sets.festivalId, festivalId), inArray(sets.id, setIds)))
		.orderBy(asc(sets.startsAt));

	return rows.map((r) => ({
		setId: r.setId,
		startsAt: r.startsAt,
		endsAt: r.endsAt,
		stageName: r.stageName ?? null,
		stageSort: r.stageSort ?? null,
		artistId: r.artistId,
		artistName: r.artistName,
		artistImageUrl: r.artistImageUrl ?? null,
	}));
}