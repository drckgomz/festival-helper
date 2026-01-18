// src/app/api/admin/festivals/[festivalId]/sets/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { sets } from "@/db/schema";
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
    .from(sets)
    .where(eq(sets.festivalId, festivalId))
    .orderBy(asc(sets.startsAt));

  return NextResponse.json({ sets: rows });
}

export async function POST(req: NextRequest, ctx: RouteCtx<{ festivalId: string }>) {
  const { festivalId } = await ctx.params;

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

  const artistId = body?.artistId?.trim();
  if (!artistId) return NextResponse.json({ error: "artistId is required" }, { status: 400 });

  const startsAtStr = body?.startsAt;
  const endsAtStr = body?.endsAt;
  if (!startsAtStr || !endsAtStr) {
    return NextResponse.json({ error: "startsAt and endsAt are required" }, { status: 400 });
  }

  const startsAt = new Date(startsAtStr);
  const endsAt = new Date(endsAtStr);

  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "startsAt must be a valid ISO datetime" }, { status: 400 });
  }
  if (Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "endsAt must be a valid ISO datetime" }, { status: 400 });
  }
  if (endsAt <= startsAt) {
    return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 });
  }

  const inserted = await db
    .insert(sets)
    .values({
      festivalId,
      stageId: body?.stageId ?? null,
      artistId,
      startsAt,
      endsAt,
      dayLabel: body?.dayLabel ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ set: inserted[0] }, { status: 201 });
}
