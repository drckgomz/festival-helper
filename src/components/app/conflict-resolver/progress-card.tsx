// src/components/app/conflict-resolver/progress-card.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function ProgressCard(props: {
  totalPairs: number;
  votesCount: number;
  voteTarget: number;
  bufferMin: number;
  allowedOverlapMin: number;
  kFactor: number;
}) {
  const { totalPairs, votesCount, voteTarget, bufferMin, allowedOverlapMin, kFactor } = props;

  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
        <div className="text-xs text-muted-foreground">
          Conflicts found:{" "}
          <span className="font-medium text-foreground">{totalPairs}</span>
          <span className="mx-2 opacity-60">•</span>
          Votes:{" "}
          <span className="font-medium text-foreground">{votesCount}</span> / {voteTarget}
        </div>

        <div className="text-xs text-muted-foreground">
          Buffer:{" "}
          <span className="font-medium text-foreground">{bufferMin} min</span>
          <span className="mx-2 opacity-60">•</span>
          Allowed overlap:{" "}
          <span className="font-medium text-foreground">{allowedOverlapMin} min</span>
          <span className="mx-2 opacity-60">•</span>
          Elo K: <span className="font-medium text-foreground">{kFactor}</span>
        </div>
      </CardContent>
    </Card>
  );
}
