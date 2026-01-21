// src/components/admin/location-row-menu.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function LocationRowMenu(props: { festivalId: string; locationId: string }) {
  const { festivalId, locationId } = props;
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function onDelete() {
    if (busy) return;
    const ok = window.confirm("Delete this location? This cannot be undone.");
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/festivals/${festivalId}/locations/${locationId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        alert(j?.error ?? "Failed to delete");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 rounded-full px-3"
          disabled={busy}
          aria-label="Open location menu"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-44 border-border bg-popover text-popover-foreground"
      >
        <DropdownMenuItem asChild>
          <Link href={`/admin/festivals/${festivalId}/locations/${locationId}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void onDelete();
          }}
          disabled={busy}
          className="text-destructive focus:bg-destructive/15 focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
