// src/app/(site)/festival/[slug]/days/page.tsx
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayPicker } from "@/components/app/day-picker";
import { getFestivalBySlug, getActiveFestivalDays } from "@/db/queries/festivals";

export const metadata = {
  title: "Select Days",
  description: "Choose which days you’re attending",
};

function normalizeDayDate(d: unknown) {
  if (typeof d === "string") return d;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d);
}

type PageProps = {
  params: Promise<{ slug?: string }> | { slug?: string };
};

export default async function FestivalDaysPage(props: PageProps) {
  const params = await Promise.resolve(props.params);

  const slug = (params?.slug ?? "").trim();
  if (!slug) return notFound();

  const festival = await getFestivalBySlug(slug);
  if (!festival) return notFound();

  const daysRaw = await getActiveFestivalDays(festival.id);

  const days = daysRaw.map((d) => ({
    dayDate: normalizeDayDate(d.dayDate),
    label: d.label ?? null,
    groupKey: d.groupKey ?? null,
    groupLabel: d.groupLabel ?? null,
    sortOrder: d.sortOrder ?? 0,
  }));


  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Select days</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Choose which days you’re attending for{" "}
          <span className="font-medium">{festival.name}</span>.
        </p>
      </div>

      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-base">Days</CardTitle>
        </CardHeader>
        <CardContent>
          <DayPicker festivalSlug={festival.slug} days={days} />
        </CardContent>
      </Card>
    </div>
  );
}
