// src/components/admin/admin-nav.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LogOut, Settings, Shield, User } from "lucide-react";

// Clerk
import { useClerk, useUser } from "@clerk/nextjs";

function NavLink(props: { href: string; label: string; active: boolean }) {
  const { href, label, active } = props;
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const a = parts[0]?.[0] ?? "U";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function stripTrailingSlash(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function AdminNav() {
  const rawPathname = usePathname();
  const pathname = stripTrailingSlash(rawPathname);

  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "Account";

  const avatarUrl = user?.imageUrl || null;

  // ✅ Section-aware matching:
  // - Dashboard should ONLY match "/admin"
  // - Others should match exact or nested paths
  const isActiveExact = (href: string) => pathname === stripTrailingSlash(href);

  const isActiveSection = (href: string) => {
    const h = stripTrailingSlash(href);
    return pathname === h || pathname.startsWith(h + "/");
  };

  const dashboardActive = isActiveExact("/admin");
  const festivalsActive = isActiveSection("/admin/festivals");
  const artistsActive = isActiveSection("/admin/artists");

  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        {/* Left: Brand + primary admin links */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Admin</p>
              <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                Festival Helper
              </p>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden h-7 md:block" />

          <div className="hidden flex-wrap items-center gap-2 md:flex">
            <NavLink href="/admin" label="Dashboard" active={dashboardActive} />
            <NavLink href="/admin/festivals" label="Festivals" active={festivalsActive} />
            <NavLink href="/admin/artists" label="Artists" active={artistsActive} />
          </div>
        </div>

        {/* Right: Account dropdown */}
        <div className="flex items-center gap-2">
          {/* Mobile quick links */}
          <div className="flex items-center gap-2 md:hidden">
            <Button asChild variant="outline" className="h-9 rounded-full px-3">
              <Link href="/admin">Home</Link>
            </Button>
            <Button asChild variant="outline" className="h-9 rounded-full px-3">
              <Link href="/admin/festivals">Festivals</Link>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={[
                  "flex items-center gap-2 rounded-full border px-2 py-1.5",
                  "border-zinc-200/70 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 dark:focus-visible:ring-zinc-600/60",
                ].join(" ")}
                aria-label="Open account menu"
              >
                {/* Avatar */}
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white dark:bg-white dark:text-zinc-900">
                    {initials(displayName)}
                  </div>
                )}

                {/* Name (hide on small) */}
                <div className="hidden max-w-45 md:block">
                  <p className="truncate text-xs font-semibold">{isLoaded ? displayName : "…"}</p>
                  <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">Account</p>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {isLoaded ? displayName : "Account"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/admin/account" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Account settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="flex items-center gap-2 text-red-600 focus:text-red-600"
                onSelect={async (e) => {
                  e.preventDefault();
                  await signOut({ redirectUrl: "/" });
                }}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Secondary nav row for small screens */}
      <div className="mx-auto w-full max-w-6xl px-4 pb-3 md:hidden">
        <div className="flex flex-wrap gap-2">
          <NavLink href="/admin" label="Dashboard" active={dashboardActive} />
          <NavLink href="/admin/festivals" label="Festivals" active={festivalsActive} />
          <NavLink href="/admin/artists" label="Artists" active={artistsActive} />
        </div>
      </div>
    </div>
  );
}
