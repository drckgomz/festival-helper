// src/app/(auth)/layout.tsx
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      {/* Auth Navbar */}
      <header className="flex h-16 items-center justify-center border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-black/40">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight hover:opacity-80"
        >
          Festival Helper
        </Link>
      </header>

      {/* Auth Content */}
      <main className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
