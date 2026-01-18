// src/app/(site)/account/page.tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Full takeover: Clerk renders the entire settings experience */}
      <UserProfile routing="hash" />
    </div>
  );
}
