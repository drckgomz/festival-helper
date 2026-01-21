// src/app/api/admin/festivals/[festivalId]/days/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { festivalDays } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

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

export async function GET(_req: NextRequest, ctx: RouteCtx<{ festivalId: string }>) {
  const { festivalId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "viewer");
  if (!guard.ok) return guard.res;

  const rows = await db
    .select()
    .from(festivalDays)
    .where(eq(festivalDays.festivalId, festivalId))
    .orderBy(asc(festivalDays.sortOrder), asc(festivalDays.dayDate));

  return NextResponse.json({ days: rows });
}

export async function POST(req: NextRequest, ctx: RouteCtx<{ festivalId: string }>) {
  const { festivalId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "editor");
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => null)) as
    | {
        dayDate?: string; // YYYY-MM-DD
        label?: string | null;
        groupKey?: string | null;
        groupLabel?: string | null;
        sortOrder?: number | null;
        isActive?: boolean | null;
      }
    | null;

  const dayDate = body?.dayDate?.trim();
  if (!dayDate) return NextResponse.json({ error: "dayDate is required (YYYY-MM-DD)" }, { status: 400 });

  const inserted = await db
    .insert(festivalDays)
    .values({
      festivalId,
      dayDate,
      label: body?.label ?? null,
      groupKey: body?.groupKey ?? null,
      groupLabel: body?.groupLabel ?? null,
      sortOrder: body?.sortOrder ?? 0,
      isActive: body?.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ day: inserted[0] }, { status: 201 });
}
