// src/components/app/top-nav.tsx
import Link from "next/link";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
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

import { ensureUser } from "@/db/queries/users";

function isAdminFromUser(user: { publicMetadata?: unknown }) {
  const pm = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const role = pm.role;
  return role === "admin" || role === "ADMIN" || role === true;
}

export async function TopNav() {
  const { userId } = await auth();

  // shared shell styles (theme-token based)
  const headerClass =
    "sticky top-0 z-50 border-b border-border bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60";

  if (!userId) {
    return (
      <header className={headerClass}>
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-semibold tracking-tight text-foreground hover:opacity-90"
          >
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

  // ALWAYS upsert into your DB
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
    <header className={headerClass}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-semibold tracking-tight text-foreground hover:opacity-90"
        >
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
                className="festival-hover flex items-center gap-2 rounded-full p-1.5 text-foreground"
                aria-label="Account menu"
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-border">
                  <img
                    src={imageUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </button>
            </DropdownMenuTrigger>


            <DropdownMenuContent
              align="end"
              className="w-56 border-border bg-popover text-popover-foreground"
            >
              <DropdownMenuLabel className="truncate text-foreground">
                {displayName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem asChild className="focus:bg-hover focus:text-hover-foreground">
                <Link href="/account" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Account settings
                </Link>
              </DropdownMenuItem>

              {isAdmin ? (
                <DropdownMenuItem
                  asChild
                  className="focus:bg-hover focus:text-hover-foreground"
                >
                  <Link href="/admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem asChild className="focus:bg-hover focus:text-hover-foreground">
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
