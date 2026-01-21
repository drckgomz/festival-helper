// src/app/(admin)/layout.tsx
import type { ReactNode } from "react";

export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  // This group layout applies theming to ALL routes under (admin)
  // The actual admin nav/header can still live under /admin/layout.tsx if you have it.
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
