// src/app/api/admin/artists/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { artists } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

function isAdminFromClaims(publicMetadata: any) {
  const role = publicMetadata?.role;
  return role === "admin" || role === "superadmin" || role === "ADMIN" || role === true;
}

async function requireAdmin() {
  const { sessionClaims, userId } = await auth();
  if (!userId) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const pm = (sessionClaims as any)?.publicMetadata ?? (sessionClaims as any)?.metadata ?? {};
  if (!isAdminFromClaims(pm)) {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, userId };
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const rows = await db
    .select()
    .from(artists)
    .orderBy(desc(artists.updatedAt), desc(artists.createdAt));

  return NextResponse.json({ artists: rows });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => null)) as
    | { name?: string; imageUrl?: string | null; spotifyUrl?: string | null; websiteUrl?: string | null }
    | null;

  const name = body?.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const inserted = await db
    .insert(artists)
    .values({
      name,
      imageUrl: body?.imageUrl ?? null,
      spotifyUrl: body?.spotifyUrl ?? null,
      websiteUrl: body?.websiteUrl ?? null,
    })
    .returning();

  return NextResponse.json({ artist: inserted[0] }, { status: 201 });
}
