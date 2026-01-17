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
					"h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30"
				)}
			>
				{set.artistImageUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img alt={set.artistName} src={set.artistImageUrl} className="h-full w-full object-cover" />
				) : null}
			</div>

			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold">{set.artistName}</p>
				<p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Stage: {set.stageName}</p>
				<p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
					Time: {formatTimeRange(set.startsAt, set.endsAt)}
				</p>
				<p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">Elo: {rating.toFixed(0)}</p>
			</div>
		</div>
	);
}
