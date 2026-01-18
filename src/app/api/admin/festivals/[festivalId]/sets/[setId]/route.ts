// src/app/api/admin/festivals/[festivalId]/sets/[setId]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { sets } from "@/db/schema";
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

export async function GET(_req: NextRequest, ctx: RouteCtx<{ festivalId: string; setId: string }>) {
  const { festivalId, setId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "viewer");
  if (!guard.ok) return guard.res;

  const row = await db
    .select()
    .from(sets)
    .where(and(eq(sets.id, setId), eq(sets.festivalId, festivalId)))
    .limit(1);

  if (!row[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ set: row[0] });
}

export async function PATCH(req: NextRequest, ctx: RouteCtx<{ festivalId: string; setId: string }>) {
  const { festivalId, setId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "editor");
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => null)) as
    | {
        stageId?: string | null;
        artistId?: string;
        startsAt?: string;
        endsAt?: string;
        dayLabel?: string | null;
      }
    | null;

  const update: Partial<typeof sets.$inferInsert> = { updatedAt: new Date() };

  if (body?.stageId !== undefined) update.stageId = body.stageId ?? null;

  // required in schema, so only set if provided; validation below
  if (body?.artistId !== undefined) update.artistId = body.artistId;
  if (body?.startsAt !== undefined) update.startsAt = new Date(body.startsAt);
  if (body?.endsAt !== undefined) update.endsAt = new Date(body.endsAt);

  if (body?.dayLabel !== undefined) update.dayLabel = body.dayLabel ?? null;

  // Basic validation for date parsing if provided
  if (body?.startsAt !== undefined && Number.isNaN(update.startsAt?.getTime())) {
    return NextResponse.json({ error: "startsAt must be a valid ISO datetime" }, { status: 400 });
  }
  if (body?.endsAt !== undefined && Number.isNaN(update.endsAt?.getTime())) {
    return NextResponse.json({ error: "endsAt must be a valid ISO datetime" }, { status: 400 });
  }
  if (update.startsAt && update.endsAt && update.endsAt <= update.startsAt) {
    return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 });
  }

  const updated = await db
    .update(sets)
    .set(update)
    .where(and(eq(sets.id, setId), eq(sets.festivalId, festivalId)))
    .returning();

  if (!updated[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ set: updated[0] });
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx<{ festivalId: string; setId: string }>) {
  const { festivalId, setId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "admin");
  if (!guard.ok) return guard.res;

  const deleted = await db
    .delete(sets)
    .where(and(eq(sets.id, setId), eq(sets.festivalId, festivalId)))
    .returning();

  if (!deleted[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
