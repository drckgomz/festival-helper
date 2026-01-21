// src/components/app/conflict-resolver/pick-card.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatTimeRange } from "@/lib/time";
import type { SetLite } from "./types";

export function PickCard({ set, rating }: { set: SetLite; rating: number }) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "h-20 w-24 shrink-0 overflow-hidden rounded-xl border",
          "border-border bg-muted"
        )}
      >
        {set.artistImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={set.artistName}
            src={set.artistImageUrl}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] opacity-70">
            no image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-current">{set.artistName}</p>

        <p className="mt-1 text-xs opacity-80">Stage: {set.stageName}</p>

        <p className="mt-1 text-xs opacity-80">
          Time: {formatTimeRange(set.startsAt, set.endsAt)}
        </p>

        <p className="mt-2 text-[11px] opacity-70">Elo: {rating.toFixed(0)}</p>
      </div>
    </div>
  );
}
