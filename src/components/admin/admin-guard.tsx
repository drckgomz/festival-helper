// src/components/admin/admin-guard.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

/**
 * Scaffold guard.
 * Wire this to Clerk later (roles/claims) and redirect to /sign-in if needed.
 */
function isAdmin(): boolean {
  // TODO:
  // - fetch current user via Clerk auth()
  // - check role claim (e.g. publicMetadata.role === "admin")
  // For now: allow all in dev.
  return process.env.NODE_ENV !== "production";
}

export function AdminGuard({ children }: { children: ReactNode }) {
  if (!isAdmin()) redirect("/");
  return <>{children}</>;
}
