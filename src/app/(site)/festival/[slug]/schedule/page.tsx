// src/app/(site)/festival/[slug]/schedule/page.tsx
import { notFound } from "next/navigation";
import { getFestivalBySlug } from "@/db/queries/festivals";
import { getSetsByIds } from "@/db/queries/sets";
import { ConflictSchedulePage } from "@/components/app/conflict-resolver/schedule-page";

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

export default async function FestivalSchedulePage(props: PageProps) {
  const params = await Promise.resolve(props.params);
  const searchParams = await Promise.resolve(props.searchParams ?? {});
  const slug = (params?.slug ?? "").trim();
  if (!slug) return notFound();

  const festival = await getFestivalBySlug(slug);
  if (!festival) return notFound();

  const days = parseCsv(searchParams.days);
  const setIds = parseCsv(searchParams.sets);

  if (days.length === 0 || setIds.length === 0) return notFound();

  const sets = await getSetsByIds({ festivalId: festival.id, setIds });

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Optional: consistent header styling across the flow */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Your schedule
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here’s your conflict-free plan for{" "}
          <span className="font-medium text-foreground">{festival.name}</span>.
        </p>
      </div>

      <ConflictSchedulePage
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
