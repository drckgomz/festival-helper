// src/components/app/conflict-resolver/vote-panel.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

import type { SetLite } from "./types";
import { PickCard } from "./pick-card";

export function VotePanel(props: {
  totalPairs: number;
  doneVoting: boolean;

  a: SetLite | null;
  b: SetLite | null;

  ratings: Record<string, number>;

  onVote: (winnerId: string) => void;
}) {
  const { totalPairs, doneVoting, a, b, ratings, onVote } = props;

  // No conflicts at all
  if (totalPairs === 0) {
    return (
      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 opacity-70" />
          <p className="mt-3 text-sm font-semibold">No conflicts detected</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            These sets don’t overlap. Your schedule can include everything.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Voting is complete (or we don't have a valid pair to show)
  if (doneVoting || !a || !b) {
    return (
      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-6 text-center">
          <p className="text-sm font-semibold">Voting complete</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            We used your votes to rank conflicts and generate an optimistic schedule.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Voting UI
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-4">
          <PickCard set={a} rating={ratings[a.setId] ?? 1000} />
          <Button className="mt-3 h-10 w-full rounded-full" onClick={() => onVote(a.setId)}>
            Choose {a.artistName}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-4">
          <PickCard set={b} rating={ratings[b.setId] ?? 1000} />
          <Button className="mt-3 h-10 w-full rounded-full" onClick={() => onVote(b.setId)}>
            Choose {b.artistName}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
