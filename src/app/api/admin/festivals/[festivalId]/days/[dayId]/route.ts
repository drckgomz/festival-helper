// src/app/api/admin/festivals/[festivalId]/days/[dayId]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { festivalDays } from "@/db/schema";
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
  const a = await auth();
  if (!a.userId) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const pm = (a.sessionClaims as any)?.publicMetadata ?? {};
  if (isSuperAdmin(pm)) return { ok: true as const };

  const role = getRoleForFestival(pm, festivalId);
  const rank: Record<FestivalRole, number> = { viewer: 1, editor: 2, admin: 3 };

  if (!role || rank[role] < rank[min]) {
    return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const };
}

export async function GET(_req: NextRequest, ctx: RouteCtx<{ festivalId: string; dayId: string }>) {
  const { festivalId, dayId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "viewer");
  if (!guard.ok) return guard.res;

  const row = await db
    .select()
    .from(festivalDays)
    .where(and(eq(festivalDays.id, dayId), eq(festivalDays.festivalId, festivalId)))
    .limit(1);

  if (!row[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ day: row[0] });
}

export async function PATCH(req: NextRequest, ctx: RouteCtx<{ festivalId: string; dayId: string }>) {
  const { festivalId, dayId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "editor");
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => null)) as
    | {
        dayDate?: string;
        label?: string | null;
        groupKey?: string | null;
        groupLabel?: string | null;
        sortOrder?: number | null;
        isActive?: boolean | null;
      }
    | null;

  const update: Partial<typeof festivalDays.$inferInsert> = { updatedAt: new Date() };

  if (typeof body?.dayDate === "string") update.dayDate = body.dayDate.trim();
  if (body?.label !== undefined) update.label = body.label ?? null;
  if (body?.groupKey !== undefined) update.groupKey = body.groupKey ?? null;
  if (body?.groupLabel !== undefined) update.groupLabel = body.groupLabel ?? null;
  if (body?.sortOrder !== undefined && body.sortOrder !== null) update.sortOrder = body.sortOrder;
  if (body?.isActive !== undefined && body.isActive !== null) update.isActive = body.isActive;

  const updated = await db
    .update(festivalDays)
    .set(update)
    .where(and(eq(festivalDays.id, dayId), eq(festivalDays.festivalId, festivalId)))
    .returning();

  if (!updated[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ day: updated[0] });
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx<{ festivalId: string; dayId: string }>) {
  const { festivalId, dayId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "admin");
  if (!guard.ok) return guard.res;

  const deleted = await db
    .delete(festivalDays)
    .where(and(eq(festivalDays.id, dayId), eq(festivalDays.festivalId, festivalId)))
    .returning();

  if (!deleted[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
