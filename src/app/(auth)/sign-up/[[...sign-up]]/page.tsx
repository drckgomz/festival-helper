// src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a Festival Helper account",
};

export default function SignUpPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md border-zinc-200/70 dark:border-zinc-800">
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-4 text-center">
            <p className="text-sm font-semibold">Create an account</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              Sign up to manage festivals and schedules.
            </p>
          </div>

          {/* Clerk SignUp */}
          <div className="flex flex-col items-center justify-center gap-4">
            <SignUp
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
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Already have an account?{" "}
              <Button
                asChild
                variant="link"
                className="h-auto p-0 text-xs font-medium"
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
