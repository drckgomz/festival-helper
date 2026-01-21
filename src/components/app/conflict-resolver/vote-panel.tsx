// src/components/app/conflict-resolver/vote-panel.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

import type { SetLite } from "./types";
import { PickCard } from "./pick-card";
import { cn } from "@/lib/utils";

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
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">No conflicts detected</p>
          <p className="mt-1 text-xs text-muted-foreground">
            These sets don’t overlap. Your schedule can include everything.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Voting is complete (or we don't have a valid pair to show)
  if (doneVoting || !a || !b) {
    return (
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-6 text-center">
          <p className="text-sm font-semibold text-foreground">Voting complete</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We used your votes to rank conflicts and generate an optimistic schedule.
          </p>
        </CardContent>
      </Card>
    );
  }

  function VoteCard({ set }: { set: SetLite }) {
    return (
      <Card
        role="button"
        tabIndex={0}
        onClick={() => onVote(set.setId)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onVote(set.setId);
          }
        }}
        className={cn(
          "border-border bg-card text-card-foreground",
          "cursor-pointer transition-colors",
          "hover:bg-muted/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
      >
        <CardContent className="p-4">
          <PickCard set={set} rating={ratings[set.setId] ?? 1000} />

          {/* Button still works; stopPropagation avoids double-trigger */}
          <Button
            className="mt-3 h-10 w-full rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onVote(set.setId);
            }}
          >
            Choose {set.artistName}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Voting UI
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <VoteCard set={a} />
      <VoteCard set={b} />
    </div>
  );
}
