// src/app/(site)/festival/[slug]/vote/page.tsx
import { notFound } from "next/navigation";
import { getFestivalBySlug } from "@/db/queries/festivals";
import { getSetsByIds } from "@/db/queries/sets";
import { ConflictVotePage } from "@/components/app/conflict-resolver/vote-page";

function parseCsv(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) value = value[0];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

type PageProps = {
  params: Promise<{ slug?: string }> | { slug?: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function FestivalVotePage(props: PageProps) {
  const params = await Promise.resolve(props.params);
  const searchParams = await Promise.resolve(props.searchParams ?? {});
  const slug = (params?.slug ?? "").trim();
  if (!slug) return notFound();

  const festival = await getFestivalBySlug(slug);
  if (!festival) return notFound();

  const days = parseCsv(searchParams.days);
  const setIds = parseCsv(searchParams.sets);

  // Vote page needs the chosen sets (same as review page)
  if (days.length === 0 || setIds.length === 0) return notFound();

  const sets = await getSetsByIds({ festivalId: festival.id, setIds });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <ConflictVotePage
        festivalSlug={festival.slug}
        festivalId={festival.id}
        days={days}
        sets={sets.map((s) => ({
          setId: s.setId,
          artistId: s.artistId,
          artistName: s.artistName,
          artistImageUrl: s.artistImageUrl,
          stageName: s.stageName ?? "TBD Stage",
          startsAt: s.startsAt.toISOString(),
          endsAt: s.endsAt.toISOString(),
        }))}
      />
    </div>
  );
}
