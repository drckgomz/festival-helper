// src/app/api/admin/artists/[artistId]/route.ts
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { artists } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

function isAdmin(meta: any) {
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

  // 1) Fast path: session claims
  const pm =
    (sessionClaims as any)?.publicMetadata ??
    (sessionClaims as any)?.metadata ??
    (sessionClaims as any)?.public_metadata ??
    {};

  if (isAdmin(pm)) {
    return { ok: true as const, userId };
  }

  // 2) Fallback: fetch the Clerk user (handles missing claims / stale token)
  const u = await currentUser();
  const upm = (u as any)?.publicMetadata ?? {};
  if (isAdmin(upm)) {
    return { ok: true as const, userId };
  }

  return {
    ok: false as const,
    res: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}

export async function GET(_req: Request, ctx: { params: Promise<{ artistId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { artistId } = await ctx.params;

  const row = await db.select().from(artists).where(eq(artists.id, artistId)).limit(1);
  const artist = row[0] ?? null;

  if (!artist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ artist });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ artistId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { artistId } = await ctx.params;

  const body = (await req.json().catch(() => null)) as
    | { name?: string; imageUrl?: string | null; spotifyUrl?: string | null; websiteUrl?: string | null }
    | null;

  const update: Partial<typeof artists.$inferInsert> = {};

  if (typeof body?.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    update.name = name;
  }

  if (body?.imageUrl !== undefined) update.imageUrl = body.imageUrl ?? null;
  if (body?.spotifyUrl !== undefined) update.spotifyUrl = body.spotifyUrl ?? null;
  if (body?.websiteUrl !== undefined) update.websiteUrl = body.websiteUrl ?? null;

  update.updatedAt = new Date();

  const updated = await db.update(artists).set(update).where(eq(artists.id, artistId)).returning();
  if (!updated[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ artist: updated[0] });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ artistId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  const { artistId } = await ctx.params;

  const deleted = await db.delete(artists).where(eq(artists.id, artistId)).returning();
  if (!deleted[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
