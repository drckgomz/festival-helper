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
    <Card className="border-zinc-200/70 dark:border-zinc-800">
      <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
        <div className="text-xs text-zinc-600 dark:text-zinc-300">
          Conflicts found: <span className="font-medium">{totalPairs}</span>
          <span className="mx-2">•</span>
          Votes: <span className="font-medium">{votesCount}</span> / {voteTarget}
        </div>

        <div className="text-xs text-zinc-600 dark:text-zinc-300">
          Buffer: <span className="font-medium">{bufferMin} min</span>
          <span className="mx-2">•</span>
          Allowed overlap: <span className="font-medium">{allowedOverlapMin} min</span>
          <span className="mx-2">•</span>
          Elo K: <span className="font-medium">{kFactor}</span>
        </div>
      </CardContent>
    </Card>
  );
}
