// src/app/(auth)/sign-out/[[...sign-out]]/page.tsx
"use client";

import * as React from "react";
import { useClerk } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";

export default function SignOutPage() {
  const { signOut } = useClerk();
  const sp = useSearchParams();

  // Clerk sometimes passes redirect_url
  const redirectUrl = sp.get("redirect_url") ?? "/";

  React.useEffect(() => {
    // fire-and-forget; Clerk will handle navigation
    void signOut({ redirectUrl });
  }, [signOut, redirectUrl]);

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-6 text-center">
          <p className="text-sm font-semibold">Signing you out…</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            Redirecting to{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {redirectUrl}
            </span>
          </p>

          {/* Optional subtle spinner placeholder */}
          <div className="mt-4 flex justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
