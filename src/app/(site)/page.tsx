// src/app/page.tsx
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="grid gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Festival Helper
        </h1>

        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Pick artists, resolve conflicts, and generate a clean schedule.
        </p>
      </div>

      <Card className="festival-hover-pressable border-border text-center">
        <CardHeader className="items-center">
          {/* inherit readable hover text */}
          <CardTitle className="text-current text-base">Start</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          {/* don’t hardcode muted here or it may become unreadable on hover */}
          <p className="text-sm opacity-80">
            Go to the artist selector to begin building your lineup.
          </p>

          <Button asChild variant="outline">
            <Link href="/festival/acl-2024/days">Start!</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
