// src/app/api/admin/festivals/[festivalId]/stages/[stageId]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { stages } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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
  if (isSuperAdmin(pm)) return { ok: true as const };

  const role = getRoleForFestival(pm, festivalId);
  const rank: Record<FestivalRole, number> = { viewer: 1, editor: 2, admin: 3 };
  if (!role || rank[role] < rank[min]) {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function GET(_req: NextRequest, ctx: RouteCtx<{ festivalId: string; stageId: string }>) {
  const { festivalId, stageId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "viewer");
  if (!guard.ok) return guard.res;

  const row = await db
    .select()
    .from(stages)
    .where(and(eq(stages.id, stageId), eq(stages.festivalId, festivalId)))
    .limit(1);

  if (!row[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ stage: row[0] });
}

export async function PATCH(req: NextRequest, ctx: RouteCtx<{ festivalId: string; stageId: string }>) {
  const { festivalId, stageId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "editor");
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => null)) as
    | { name?: string; sortOrder?: number | null }
    | null;

  const update: Partial<typeof stages.$inferInsert> = { updatedAt: new Date() };
  if (typeof body?.name === "string") update.name = body.name.trim();
  if (body?.sortOrder !== undefined && body.sortOrder !== null) update.sortOrder = body.sortOrder;

  const updated = await db
    .update(stages)
    .set(update)
    .where(and(eq(stages.id, stageId), eq(stages.festivalId, festivalId)))
    .returning();

  if (!updated[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ stage: updated[0] });
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx<{ festivalId: string; stageId: string }>) {
  const { festivalId, stageId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "admin");
  if (!guard.ok) return guard.res;

  const deleted = await db
    .delete(stages)
    .where(and(eq(stages.id, stageId), eq(stages.festivalId, festivalId)))
    .returning();

  if (!deleted[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
