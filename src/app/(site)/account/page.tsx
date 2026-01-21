export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { UserProfile } from "@clerk/nextjs"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/app/theme-toggle"
import { BackButton } from "@/components/app/back-button"

export default async function AccountPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Account settings</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage your profile, security, and app preferences.
          </p>
        </div>

        <BackButton />
      </div>

      <div className="grid gap-6">
        {/* App Preferences */}
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-base">App Preferences</CardTitle>
          </CardHeader>

          <CardContent className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">
                Switch between light and dark mode.
              </p>
            </div>

            <ThemeToggle />
          </CardContent>
        </Card>

        {/* Clerk Settings */}
        <div className="rounded-xl border border-border bg-card p-4 flex justify-center text-card-foreground shadow-sm">
          <UserProfile routing="hash" />
        </div>
      </div>
    </div>
  )
}
