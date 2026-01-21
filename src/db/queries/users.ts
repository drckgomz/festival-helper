// src/db/queries/users.ts
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserByClerkId(clerkUserId: string) {
  const rows = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return rows[0] ?? null;
}

export async function createUserFromClerk(params: {
  clerkUserId: string;
  email?: string | null;
  displayName?: string | null;
}) {
  const rows = await db
    .insert(users)
    .values({
      clerkUserId: params.clerkUserId,
      email: params.email ?? null,
      displayName: params.displayName ?? null,
    })
    .returning();
  return rows[0]!;
}

/**
 * The important one:
 * - if user exists: return it
 * - if not: create it
 */
export async function ensureUser(params: {
  clerkUserId: string;
  email?: string | null;
  displayName?: string | null;
}) {
  const existing = await getUserByClerkId(params.clerkUserId);
  if (existing) return existing;

  return createUserFromClerk(params);
}
