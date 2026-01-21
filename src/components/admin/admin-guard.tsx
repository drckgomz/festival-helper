// src/components/admin/admin-guard.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

/**
 * Scaffold guard.
 * Wire this to Clerk later (roles/claims) and redirect to /sign-in if needed.
 */
async function isAdmin(): Promise<boolean> {
  // TODO (future):
  // const { auth } = await import("@clerk/nextjs/server");
  // const { userId, sessionClaims } = await auth();
  //
  // if (!userId) return false;
  // return sessionClaims?.publicMetadata?.role === "admin";

  // For now: allow all in dev, block in prod
  return process.env.NODE_ENV !== "production";
}

export async function AdminGuard({ children }: { children: ReactNode }) {
  const allowed = await isAdmin();

  if (!allowed) {
    redirect("/");
  }

  return <>{children}</>;
}
