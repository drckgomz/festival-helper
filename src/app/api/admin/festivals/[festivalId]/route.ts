// src/app/api/admin/festivals/[festivalId]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { festivals } from "@/db/schema";
import { eq } from "drizzle-orm";

type FestivalRole = "admin" | "editor" | "viewer";
type RouteCtx<T extends Record<string, string>> = { params: Promise<T> };

function getRoleForFestival(pm: any, festivalId: string): FestivalRole | null {
  const r = pm?.festivalRoles?.[festivalId];
  return r === "admin" || r === "editor" || r === "viewer" ? r : null;
}

function isSuperAdmin(pm: any) {
  return pm?.role === "superadmin";
}

async function requireFestivalRole(festivalId: string, min: FestivalRole) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const pm = (sessionClaims as any)?.publicMetadata ?? {};
  if (isSuperAdmin(pm)) return { ok: true as const, pm };

  const role = getRoleForFestival(pm, festivalId);
  const rank: Record<FestivalRole, number> = { viewer: 1, editor: 2, admin: 3 };

  if (!role || rank[role] < rank[min]) {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, pm };
}

export async function GET(_req: NextRequest, ctx: RouteCtx<{ festivalId: string }>) {
  const { festivalId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "viewer");
  if (!guard.ok) return guard.res;

  const row = await db.select().from(festivals).where(eq(festivals.id, festivalId)).limit(1);
  if (!row[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ festival: row[0] });
}

export async function PATCH(req: NextRequest, ctx: RouteCtx<{ festivalId: string }>) {
  const { festivalId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "editor");
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => null)) as
    | {
        slug?: string;
        name?: string;
        city?: string | null;
        timezone?: string | null;
        startDate?: string | null;
        endDate?: string | null;
        isPublished?: boolean;
      }
    | null;

  const update: Partial<typeof festivals.$inferInsert> = { updatedAt: new Date() };

  if (typeof body?.slug === "string") update.slug = body.slug.trim();
  if (typeof body?.name === "string") update.name = body.name.trim();
  if (body?.city !== undefined) update.city = body.city ?? null;
  if (body?.timezone !== undefined) update.timezone = body.timezone ?? "America/Chicago";
  if (body?.startDate !== undefined) update.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body?.endDate !== undefined) update.endDate = body.endDate ? new Date(body.endDate) : null;
  if (typeof body?.isPublished === "boolean") update.isPublished = body.isPublished;

  const updated = await db.update(festivals).set(update).where(eq(festivals.id, festivalId)).returning();
  if (!updated[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ festival: updated[0] });
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx<{ festivalId: string }>) {
  const { festivalId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "admin");
  if (!guard.ok) return guard.res;

  const deleted = await db.delete(festivals).where(eq(festivals.id, festivalId)).returning();
  if (!deleted[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
