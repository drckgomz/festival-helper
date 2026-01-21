// src/app/(site)/festival/[slug]/artists/page.tsx
import { notFound } from "next/navigation";
import { getFestivalBySlug } from "@/db/queries/festivals";
import { getSetsForFestivalDays } from "@/db/queries/sets";
import { ArtistPicker } from "@/components/app/artist-picker";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Select Artists",
  description: "Pick artists you want to see",
};

type PageProps = {
  params: Promise<{ slug?: string }> | { slug?: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function parseDays(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) value = value[0];
  const s = String(value);
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default async function FestivalArtistsPage(props: PageProps) {
  const params = await Promise.resolve(props.params);
  const searchParams = await Promise.resolve(props.searchParams ?? {});
  const slug = (params?.slug ?? "").trim();
  if (!slug) return notFound();

  const festival = await getFestivalBySlug(slug);
  if (!festival) return notFound();

  const days = parseDays(searchParams.days);
  if (days.length === 0) return notFound();

  const rows = await getSetsForFestivalDays({
    festivalId: festival.id,
    days,
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Select artists
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose who you want to see for{" "}
          <span className="font-medium text-foreground">{festival.name}</span>.
        </p>
      </div>

      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="pt-6">
          <ArtistPicker
            festivalSlug={festival.slug}
            days={days}
            rows={rows.map((r) => ({
              day: r.day,
              stageName: r.stageName ?? "TBD Stage",
              setId: r.setId,
              artistId: r.artistId,
              artistName: r.artistName,
              artistImageUrl: r.artistImageUrl,
              startsAt: r.startsAt.toISOString(),
              endsAt: r.endsAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
