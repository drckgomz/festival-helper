// src/app/(admin)/admin/layout.tsx
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminGuard } from "@/components/admin/admin-guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background text-foreground">
        {/* Top nav shell */}
        <div className="border-b border-border bg-card text-card-foreground">
          <AdminNav />
        </div>

        {/* Main content */}
        <main className="mx-auto w-full max-w-6xl px-4 py-6">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
