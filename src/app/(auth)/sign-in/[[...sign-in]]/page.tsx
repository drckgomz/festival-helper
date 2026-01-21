// src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Festival Helper",
};

export default function SignInPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-4 text-center">
            <p className="text-sm font-semibold">Welcome back</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              Sign in to continue to Festival Helper.
            </p>
          </div>

          {/* Clerk SignIn */}
          <div className="flex flex-col items-center justify-center gap-4">
            <SignIn
              appearance={{
                elements: {
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  footerAction: "hidden",
                  card: "shadow-none border-0 bg-transparent p-0",
                },
              }}
            />
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-center text-xs text-zinc-600 dark:text-zinc-300">
              Don&apos;t have an account?{" "}
              <Button
                asChild
                variant="link"
                className="h-auto p-0 text-xs font-medium"
              >
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
