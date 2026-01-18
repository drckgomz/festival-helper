// src/app/(admin)/admin/layout.tsx
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminGuard } from "@/components/admin/admin-guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </AdminGuard>
  );
}
