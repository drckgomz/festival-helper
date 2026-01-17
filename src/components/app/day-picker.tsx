// src/components/app/day-picker.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Day = {
  dayDate: string; // YYYY-MM-DD
  label: string | null;
  groupKey: string | null; // e.g. "w1"
  groupLabel: string | null; // e.g. "WEEKEND ONE"
  sortOrder?: number | null;
};

function formatFallbackLabel(iso: string) {
  // iso is YYYY-MM-DD
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
  });
}

function normalizeKey(k: string | null | undefined) {
  const key = (k ?? "").trim();
  return key.length ? key : "default";
}

function normalizeLabel(l: string | null | undefined, key: string) {
  const label = (l ?? "").trim();
  if (label) return label;
  return key === "default" ? "DAYS" : key.toUpperCase();
}

export function DayPicker({
  festivalSlug,
  days,
}: {
  festivalSlug: string;
  days: Day[];
}) {
  const router = useRouter();

  const [selected, setSelected] = React.useState<string[]>(
    days.length === 1 ? [days[0]!.dayDate] : []
  );
  const [warning, setWarning] = React.useState<string | null>(null);

  const groups = React.useMemo(() => {
    const map = new Map<
      string,
      { key: string; title: string; days: Day[] }
    >();

    for (const d of days) {
      const key = normalizeKey(d.groupKey);
      const title = normalizeLabel(d.groupLabel, key);

      if (!map.has(key)) map.set(key, { key, title, days: [] });
      map.get(key)!.days.push(d);
    }

    // Sort days inside each group
    for (const g of map.values()) {
      g.days.sort((a, b) => {
        const ao = a.sortOrder ?? 0;
        const bo = b.sortOrder ?? 0;
        if (ao !== bo) return ao - bo;
        return a.dayDate.localeCompare(b.dayDate);
      });
    }

    // Sort groups (w1, w2 first, then others, default last)
    const rank = (k: string) =>
      k === "w1" ? 1 : k === "w2" ? 2 : k === "default" ? 99 : 50;

    return Array.from(map.values()).sort((a, b) => {
      const ra = rank(a.key);
      const rb = rank(b.key);
      if (ra !== rb) return ra - rb;
      return a.key.localeCompare(b.key);
    });
  }, [days]);

  function toggle(iso: string) {
    setWarning(null);
    setSelected((prev) =>
      prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]
    );
  }

  function handleNext() {
    if (selected.length === 0) {
      setWarning("Please select at least one day");
      return;
    }
    const qs = encodeURIComponent(selected.sort().join(","));
    router.push(`/festival/${festivalSlug}/artists?days=${qs}`);
  }

  return (
    <div className="grid gap-6">
      {/* Group columns */}
      <div className="grid gap-6 sm:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.key} className="border-zinc-200/70 dark:border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs font-medium tracking-wide text-zinc-600 dark:text-zinc-300">
                {g.title}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {g.days.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    No days available.
                  </p>
                ) : (
                  g.days.map((d) => {
                    const isOn = selected.includes(d.dayDate);
                    return (
                      <Button
                        key={d.dayDate}
                        type="button"
                        variant={isOn ? "default" : "outline"}
                        className="h-10 rounded-full px-4"
                        onClick={() => toggle(d.dayDate)}
                      >
                        {d.label ?? formatFallbackLabel(d.dayDate)}
                      </Button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warning */}
      {warning ? (
        <p className="text-center text-xs text-red-600">{warning}</p>
      ) : (
        <p className="text-center text-xs text-zinc-600 dark:text-zinc-300">
          You can pick one or multiple days.
        </p>
      )}

      {/* Next button */}
      <div className="flex justify-center">
        <Button onClick={handleNext} className="h-11 px-8 rounded-full">
          Next!
        </Button>
      </div>
    </div>
  );
}
