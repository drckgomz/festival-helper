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
  day: string;
  setId: string;
  artistId: string;
  artistName: string;
  artistImageUrl: string | null;
  stageName: string;
  startsAt: string;
  endsAt: string;
};

type Tile = {
  artistId: string;
  artistName: string;
  artistImageUrl: string | null;
  stageName: string;
  startsAt: Date;
  endsAt: Date;
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

      // keep "latest" set as the primary displayed time/stage
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
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{sortedTiles.length}</span> artists
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 rounded-full px-3">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {SORT_LABEL[sortMode]}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-52 border-border bg-popover text-popover-foreground"
          >
            <DropdownMenuLabel className="text-foreground">Sort artists by</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            {(Object.keys(SORT_LABEL) as SortMode[]).map((mode) => (
              <DropdownMenuItem
                key={mode}
                onClick={() => setSortMode(mode)}
                className="focus:bg-hover focus:text-hover-foreground"
              >
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
          <p className="col-span-full text-center text-sm text-muted-foreground">
            No artists found for the selected days.
          </p>
        ) : (
          sortedTiles.map((t) => {
            const isOn = selectedArtistIds.has(t.artistId);

            return (
              <Card
                key={t.artistId}
                onClick={() => toggleArtist(t.artistId)}
                className={cn(
                  "group cursor-pointer select-none overflow-hidden border border-border bg-card text-card-foreground transition-colors",
                  "focus-within:ring-2 focus-within:ring-ring/40",
                  // Unselected hover = safe hover surface tokens
                  !isOn && "festival-hover-pressable",
                  // Selected = primary festival emphasis (no unreadable flips)
                  isOn &&
                    "bg-primary text-primary-foreground border-primary/40 hover:opacity-[0.98]"
                )}
              >
                <CardContent className="p-4">
                  {/* Big square image */}
                  <div
                    className={cn(
                      "mb-4 aspect-square w-full overflow-hidden rounded-2xl border",
                      isOn
                        ? "border-primary-foreground/25 bg-primary-foreground/10"
                        : "border-border bg-muted"
                    )}
                  >
                    {t.artistImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={t.artistName}
                        src={t.artistImageUrl}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs opacity-70">
                        no image
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* Artist name: inherit container color on hover/selected */}
                      <p className="truncate text-sm font-semibold text-current">
                        {t.artistName}
                      </p>

                      {/* Secondary lines: use opacity so they remain readable when text color changes */}
                      <p className="mt-1 text-xs opacity-80">
                        Stage: {t.stageName}
                      </p>

                      <p className="mt-1 text-xs opacity-80">
                        Time: {formatTimeRange(t.startsAt, t.endsAt)}
                      </p>

                      {t.sets.length > 1 ? (
                        <p className="mt-2 text-[11px] opacity-75">
                          {t.sets.length} performances in selected days
                        </p>
                      ) : null}
                    </div>

                    {isOn ? (
                      <span className="rounded-full bg-primary-foreground/15 px-2 py-1 text-[11px] font-medium text-primary-foreground">
                        Selected
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground group-hover:bg-transparent group-hover:text-current">
                        Tap
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Warning */}
      {warning ? (
        <p className="text-center text-xs text-destructive">{warning}</p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
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
