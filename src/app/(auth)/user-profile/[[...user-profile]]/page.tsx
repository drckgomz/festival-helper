// src/app/(auth)/user-profile/[[...user-profile]]/page.tsx
import { UserProfile } from "@clerk/nextjs";

import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function UserProfilePage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-4xl border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-4">
            <p className="text-sm font-semibold">Account settings</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              Manage your profile, security, and connected accounts.
            </p>
          </div>

          {/* Clerk Profile */}
          <div className="rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm">
            <UserProfile routing="path" path="/user-profile" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
