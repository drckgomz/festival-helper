// src/app/api/admin/artists/route.ts
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { artists } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export const runtime = "nodejs";

function isAdminFromClaimsOrMetadata(meta: any) {
  const role = meta?.role;
  return role === "admin" || role === "superadmin" || role === "ADMIN" || role === true;
}

async function requireAdmin() {
  const { sessionClaims, userId } = await auth();

  if (!userId) {
    return {
      ok: false as const,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const pm =
    (sessionClaims as any)?.publicMetadata ??
    (sessionClaims as any)?.metadata ??
    (sessionClaims as any)?.public_metadata ??
    {};

  if (isAdminFromClaimsOrMetadata(pm)) {
    return { ok: true as const, userId };
  }

  const u = await currentUser();
  const upm = (u as any)?.publicMetadata ?? {};
  if (isAdminFromClaimsOrMetadata(upm)) {
    return { ok: true as const, userId };
  }

  return {
    ok: false as const,
    res: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}

function cleanName(input: unknown) {
  if (typeof input !== "string") return null;
  const v = input.trim();
  return v.length ? v : null;
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
    | {
        name?: string;
        imageUrl?: string | null;
        spotifyUrl?: string | null;
        websiteUrl?: string | null;
      }
    | null;

  const name = cleanName(body?.name);
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const existing = await db
    .select()
    .from(artists)
    .where(sql`lower(${artists.name}) = lower(${name})`)
    .limit(1);

  if (existing[0]) {
    return NextResponse.json({ artist: existing[0], existed: true }, { status: 200 });
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

  return NextResponse.json({ artist: inserted[0], existed: false }, { status: 201 });
}
