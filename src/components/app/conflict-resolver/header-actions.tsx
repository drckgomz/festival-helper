// src/components/app/conflict-resolver/header-actions.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shuffle, Save, Undo2 } from "lucide-react";

export function HeaderActions(props: {
  backHref: string;

  onNewPair: () => void;
  onUndo: () => void;
  onSave: () => void;

  disableNewPair?: boolean;
  disableUndo?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error" | "unauthorized";
}) {
  const {
    backHref,
    onNewPair,
    onUndo,
    onSave,
    disableNewPair = false,
    disableUndo = false,
    saveStatus = "idle",
  } = props;

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" className="h-9 rounded-full px-4">
        <Link href={backHref}>Back</Link>
      </Button>

      <Button
        variant="outline"
        className="h-9 rounded-full px-4"
        onClick={onNewPair}
        disabled={disableNewPair}
      >
        <Shuffle className="mr-2 h-4 w-4" />
        New pair
      </Button>

      <Button
        variant="outline"
        className="h-9 rounded-full px-4"
        onClick={onUndo}
        disabled={disableUndo}
      >
        <Undo2 className="mr-2 h-4 w-4" />
        Undo
      </Button>

      <Button
        className="h-9 rounded-full px-4"
        onClick={onSave}
        disabled={saveStatus === "saving"}
      >
        <Save className="mr-2 h-4 w-4" />
        Save
      </Button>
    </div>
  );
}
