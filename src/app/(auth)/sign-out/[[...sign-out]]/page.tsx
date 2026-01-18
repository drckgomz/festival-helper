// src/app/(auth)/sign-out/[[...sign-out]]/page.tsx
"use client";

import * as React from "react";
import { useClerk } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignOutPage() {
  const { signOut } = useClerk();
  const sp = useSearchParams();

  // Clerk uses redirect_url sometimes; normalize it
  const redirectUrl = sp.get("redirect_url") ?? "/";

  React.useEffect(() => {
    // fire-and-forget (Clerk will handle navigation)
    void signOut({ redirectUrl });
  }, [signOut, redirectUrl]);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <p className="text-sm font-semibold">Signing you out…</p>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
        Redirecting to <span className="font-medium">{redirectUrl}</span>
      </p>
    </div>
  );
}
