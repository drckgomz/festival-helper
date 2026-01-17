// src/components/app/top-nav.tsx
import Link from "next/link";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

export async function TopNav() {
  const { userId } = await auth();

  // Signed out
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

  // Signed in (fetch user server-side so avatar appears immediately)
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const imageUrl = user.imageUrl;
  const displayName =
    user.fullName ??
    user.username ??
    user.primaryEmailAddress?.emailAddress ??
    "Account";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-black/40">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-semibold tracking-tight">
          Festival Helper
        </Link>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/artists">Artists</Link>
          </Button>

          <Link
            href="/account"
            className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            aria-label="Account"
          >
            <img
              src={imageUrl}
              alt={displayName}
              className="h-8 w-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
