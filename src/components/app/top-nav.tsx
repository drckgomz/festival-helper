// src/components/app/top-nav.tsx
import Link from "next/link";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, Settings, LogOut } from "lucide-react";

// ✅ add this
import { ensureUser } from "@/db/queries/users";

// ✅ add this (recommended for sign-out, see below)
import { SignOutButton } from "@clerk/nextjs";

function isAdminFromUser(user: { publicMetadata?: unknown }) {
  const pm = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const role = pm.role;
  return role === "admin" || role === "ADMIN" || role === true;
}

export async function TopNav() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-black/40">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold tracking-tight">
            Festival Helper
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // ✅ ALWAYS upsert into your DB
  await ensureUser({
    clerkUserId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    displayName: user.fullName ?? user.username ?? null,
  });

  const imageUrl = user.imageUrl;
  const displayName =
    user.fullName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? "Account";

  const isAdmin = isAdminFromUser(user);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-black/40">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-semibold tracking-tight">
          Festival Helper
        </Link>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Button asChild variant="outline" className="h-9 rounded-full px-4">
              <Link href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </Button>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                aria-label="Account menu"
              >
                <img
                  src={imageUrl}
                  alt={displayName}
                  className="h-8 w-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/account" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Account settings
                </Link>
              </DropdownMenuItem>

              {isAdmin ? (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />

              {/* ✅ Sign out without needing /sign-out route */}
              <DropdownMenuItem asChild>
                <SignOutButton redirectUrl="/">
                  <button className="flex w-full items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </SignOutButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
