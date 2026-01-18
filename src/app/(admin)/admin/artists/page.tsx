// src/app/(admin)/admin/artists/page.tsx
import { Card, CardContent } from "@/components/ui/card";

export default function AdminArtistsPage() {
  return (
    <Card className="border-zinc-200/70 dark:border-zinc-800">
      <CardContent className="p-5">
        <p className="text-sm font-semibold">Artists (global)</p>
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
          Shared across all festivals. Create/edit artist name, image, Spotify, website.
        </p>
      </CardContent>
    </Card>
  );
}
