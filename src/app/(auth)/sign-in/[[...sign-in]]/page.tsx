// src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign In for Festival",
};

export default function SignInPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="items-center text-center">
          <header className="text-base">Sign in</header>
        </div>

        <div className="flex flex-col items-center text-center justify-center gap-4">
          <SignIn
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
      </div>
    </div>
  );
}
