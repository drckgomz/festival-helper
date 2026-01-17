// src/components/app/artist-picker.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowUpDown, Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { formatTimeRange } from "@/lib/time";

type Row = {
  day: string; // YYYY-MM-DD
  setId: string;

  artistId: string;
  artistName: string;
  artistImageUrl: string | null;

  stageName: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
};

type Tile = {
  // "unique artist" tile, but we still keep all performances for conflict detection later
  artistId: string;
  artistName: string;
  artistImageUrl: string | null;

  // display fields (we pick ONE set to display)
  stageName: string;
  startsAt: Date;
  endsAt: Date;

  // all sets for this artist within selected days
  sets: Array<{
    setId: string;
    stageName: string;
    startsAt: Date;
    endsAt: Date;
  }>;
};

type SortMode = "time_desc" | "time_asc" | "name_asc" | "stage_asc";

const SORT_LABEL: Record<SortMode, string> = {
  time_desc: "Time (Latest first)",
  time_asc: "Time (Earliest first)",
  name_asc: "Artist (A → Z)",
  stage_asc: "Stage (A → Z)",
};

function tileKeyFromRow(r: Row) {
  // DB duplicates will share these, so the UI will collapse them.
  return `${r.artistId}|${r.startsAt}|${r.endsAt}|${r.stageName}`;
}

export function ArtistPicker({
  festivalSlug,
  days,
  rows,
}: {
  festivalSlug: string;
  days: string[];
  rows: Row[];
}) {
  const router = useRouter();

  // 1) De-dupe identical rows first (handles duplicate DB inserts)
  const dedupedRows = React.useMemo(() => {
    const seen = new Set<string>();
    const out: Row[] = [];
    for (const r of rows) {
      const k = tileKeyFromRow(r);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
    }
    return out;
  }, [rows]);

  // 2) Build unique-artist tiles
  const tiles = React.useMemo<Tile[]>(() => {
    const map = new Map<string, Tile>();

    for (const r of dedupedRows) {
      const startsAt = new Date(r.startsAt);
      const endsAt = new Date(r.endsAt);

      const existing = map.get(r.artistId);
      if (!existing) {
        map.set(r.artistId, {
          artistId: r.artistId,
          artistName: r.artistName,
          artistImageUrl: r.artistImageUrl,
          stageName: r.stageName,
          startsAt,
          endsAt,
          sets: [{ setId: r.setId, stageName: r.stageName, startsAt, endsAt }],
        });
        continue;
      }

      existing.sets.push({ setId: r.setId, stageName: r.stageName, startsAt, endsAt });

      // pick the LATEST set as the display info (so latest-first sorting makes sense)
      if (startsAt > existing.startsAt) {
        existing.startsAt = startsAt;
        existing.endsAt = endsAt;
        existing.stageName = r.stageName;
      }

      if (!existing.artistImageUrl && r.artistImageUrl) {
        existing.artistImageUrl = r.artistImageUrl;
      }
    }

    return Array.from(map.values());
  }, [dedupedRows]);

  const [sortMode, setSortMode] = React.useState<SortMode>("time_desc");

  const sortedTiles = React.useMemo(() => {
    const arr = [...tiles];

    switch (sortMode) {
      case "time_desc":
        return arr.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
      case "time_asc":
        return arr.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
      case "name_asc":
        return arr.sort((a, b) => a.artistName.localeCompare(b.artistName));
      case "stage_asc":
        return arr.sort((a, b) => a.stageName.localeCompare(b.stageName));
      default:
        return arr;
    }
  }, [tiles, sortMode]);

  // Selection is by ARTIST (unique)
  const [selectedArtistIds, setSelectedArtistIds] = React.useState<Set<string>>(new Set());
  const [warning, setWarning] = React.useState<string | null>(null);

  function toggleArtist(artistId: string) {
    setWarning(null);
    setSelectedArtistIds((prev) => {
      const next = new Set(prev);
      if (next.has(artistId)) next.delete(artistId);
      else next.add(artistId);
      return next;
    });
  }

  function handleNext() {
    if (selectedArtistIds.size === 0) {
      setWarning("Please select at least one artist");
      return;
    }

    // Expand to all setIds for those artists (so conflict detection can use sets/times)
    const selectedSetIds: string[] = [];
    for (const t of tiles) {
      if (!selectedArtistIds.has(t.artistId)) continue;
      for (const s of t.sets) selectedSetIds.push(s.setId);
    }

    const qsDays = encodeURIComponent(days.slice().sort().join(","));
    const qsSets = encodeURIComponent(selectedSetIds.sort().join(","));
    router.push(`/festival/${festivalSlug}/vote?days=${qsDays}&sets=${qsSets}`);
  }

  const backHref = `/festival/${festivalSlug}/days`;

  return (
    <div className="grid gap-6">
      {/* Sort */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-zinc-600 dark:text-zinc-300">
          Showing <span className="font-medium">{sortedTiles.length}</span> artists
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 rounded-full px-3">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {SORT_LABEL[sortMode]}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Sort artists by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(SORT_LABEL) as SortMode[]).map((mode) => (
              <DropdownMenuItem key={mode} onClick={() => setSortMode(mode)}>
                <span className="flex-1">{SORT_LABEL[mode]}</span>
                {sortMode === mode ? <Check className="h-4 w-4 opacity-70" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedTiles.length === 0 ? (
          <p className="col-span-full text-center text-sm text-zinc-600 dark:text-zinc-300">
            No artists found for the selected days.
          </p>
        ) : (
          sortedTiles.map((t) => {
            const isOn = selectedArtistIds.has(t.artistId);
            return (
              <Card
                key={t.artistId}
                className={cn(
                  "cursor-pointer select-none overflow-hidden border-zinc-200/70 transition",
                  "hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/40",
                  isOn && "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                )}
                onClick={() => toggleArtist(t.artistId)}
              >
                <CardContent className="p-4">
                  {/* Image placeholder (swap to real img later) */}
                  <div
                    className={cn(
                      "mb-3 h-28 w-full rounded-xl border",
                      isOn
                        ? "border-white/30 bg-white/10 dark:border-black/20 dark:bg-black/5"
                        : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30"
                    )}
                  >
                    {t.artistImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={t.artistName}
                        src={t.artistImageUrl}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{t.artistName}</p>

                      <p
                        className={cn(
                          "mt-1 text-xs",
                          isOn ? "text-white/80 dark:text-black/70" : "text-zinc-600 dark:text-zinc-300"
                        )}
                      >
                        Stage: {t.stageName}
                      </p>

                      <p
                        className={cn(
                          "mt-1 text-xs",
                          isOn ? "text-white/80 dark:text-black/70" : "text-zinc-600 dark:text-zinc-300"
                        )}
                      >
                        Time: {formatTimeRange(t.startsAt, t.endsAt)}
                      </p>

                      {t.sets.length > 1 ? (
                        <p
                          className={cn(
                            "mt-2 text-[11px]",
                            isOn ? "text-white/70 dark:text-black/60" : "text-zinc-500 dark:text-zinc-400"
                          )}
                        >
                          {t.sets.length} performances in selected days
                        </p>
                      ) : null}
                    </div>

                    {isOn ? (
                      <span className="rounded-full bg-white/15 px-2 py-1 text-[11px] font-medium text-white dark:bg-black/10 dark:text-black">
                        Selected
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Warning */}
      {warning ? (
        <p className="text-center text-xs text-red-600">{warning}</p>
      ) : (
        <p className="text-center text-xs text-zinc-600 dark:text-zinc-300">
          Tap tiles to select. You can pick multiple artists.
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-3">
        <Button asChild variant="outline" className="h-11 rounded-full px-8">
          <Link href={backHref}>Back</Link>
        </Button>

        <Button onClick={handleNext} className="h-11 rounded-full px-8">
          Next
        </Button>
      </div>
    </div>
  );
}
