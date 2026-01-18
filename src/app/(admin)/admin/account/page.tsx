// src/app/(admin)/account/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default async function AdminAccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex justify-center">
      <UserProfile routing="hash" />
    </div>
  );
}
