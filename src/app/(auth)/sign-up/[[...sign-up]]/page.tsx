// src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a Festival account",
};

export default function SignUpPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="items-center text-center">
          <header className="text-base">Sign up</header>
        </div>

        <div className="flex flex-col items-center text-center justify-center gap-4">
          <SignUp
            appearance={{
              elements: {
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                footerAction: "hidden",
              },
            }}
          />

          <div className="h-px w-full" />
        </div>

        <div className="flex justify-center">
          <p className="text-center text-xs text-zinc-600 dark:text-zinc-300">
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
      </div>
    </div>
  );
}
