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
        "border border-transparent",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-hover hover:text-hover-foreground",
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

  // Section-aware matching:
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
    <div className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        {/* Left: Brand + primary admin links */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Admin</p>
              <p className="truncate text-[11px] text-muted-foreground">Festival Helper</p>
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
                  "border-border bg-card text-card-foreground",
                  "festival-hover-pressable",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
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
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {initials(displayName)}
                  </div>
                )}

                {/* Name (hide on small) */}
                <div className="hidden max-w-45 md:block">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {isLoaded ? displayName : "…"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">Account</p>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 border-border bg-popover text-popover-foreground"
            >
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
                className="flex items-center gap-2 text-destructive focus:text-destructive"
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
