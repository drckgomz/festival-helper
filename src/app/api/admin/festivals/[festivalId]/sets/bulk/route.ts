// src/app/api/admin/festivals/[festivalId]/sets/bulk/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { sets } from "@/db/schema";
import { and, eq, inArray, notInArray } from "drizzle-orm";

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

type BulkSetInput = {
  id?: string;
  stageId?: string | null;
  artistId?: string;
  startsAt?: string;
  endsAt?: string;
  dayLabel?: string | null;
};

export async function POST(req: NextRequest, ctx: RouteCtx<{ festivalId: string }>) {
  const { festivalId } = await ctx.params;

  const guard = await requireFestivalRole(festivalId, "editor");
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => null)) as
    | {
        sets?: BulkSetInput[];
        // Optional future behavior:
        // deleteMissing?: boolean;
      }
    | null;

  const payload = body?.sets;
  if (!Array.isArray(payload) || payload.length === 0) {
    return NextResponse.json({ error: "sets[] is required" }, { status: 400 });
  }

  const now = new Date();
  const toInsert = payload.filter((s) => !s.id);
  const toUpdate = payload.filter((s) => !!s.id) as (BulkSetInput & { id: string })[];

  const inserted: any[] = [];
  const updated: any[] = [];

  await db.transaction(async (tx) => {
    if (toInsert.length) {
      // validate required fields
      for (const s of toInsert) {
        if (!s.artistId?.trim()) throw new Error("artistId is required for insert");
        if (!s.startsAt || !s.endsAt) throw new Error("startsAt and endsAt are required for insert");
        const a = new Date(s.startsAt);
        const b = new Date(s.endsAt);
        if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) throw new Error("Invalid startsAt/endsAt");
        if (b <= a) throw new Error("endsAt must be after startsAt");
      }

      const rows = await tx
        .insert(sets)
        .values(
          toInsert.map((s) => ({
            festivalId,
            stageId: s.stageId ?? null,
            artistId: s.artistId!.trim(),
            startsAt: new Date(s.startsAt!),
            endsAt: new Date(s.endsAt!),
            dayLabel: s.dayLabel ?? null,
            createdAt: now,
            updatedAt: now,
          }))
        )
        .returning();

      inserted.push(...rows);
    }

    for (const s of toUpdate) {
      const patch: Partial<typeof sets.$inferInsert> = { updatedAt: now };

      if (s.stageId !== undefined) patch.stageId = s.stageId ?? null;
      if (s.artistId !== undefined) patch.artistId = s.artistId.trim();

      if (s.startsAt !== undefined) patch.startsAt = new Date(s.startsAt);
      if (s.endsAt !== undefined) patch.endsAt = new Date(s.endsAt);

      if (s.dayLabel !== undefined) patch.dayLabel = s.dayLabel ?? null;

      // validate date parsing only if provided
      if (s.startsAt !== undefined && Number.isNaN(patch.startsAt?.getTime())) {
        throw new Error("Invalid startsAt");
      }
      if (s.endsAt !== undefined && Number.isNaN(patch.endsAt?.getTime())) {
        throw new Error("Invalid endsAt");
      }
      if (patch.startsAt && patch.endsAt && patch.endsAt <= patch.startsAt) {
        throw new Error("endsAt must be after startsAt");
      }

      const rows = await tx
        .update(sets)
        .set(patch)
        .where(and(eq(sets.id, s.id), eq(sets.festivalId, festivalId)))
        .returning();

      if (rows[0]) updated.push(rows[0]);
    }

    // OPTIONAL destructive sync (uncomment if you want it)
    // if (body?.deleteMissing) {
    //   const keepIds = toUpdate.map((s) => s.id).filter(Boolean);
    //   if (keepIds.length) {
    //     await tx.delete(sets).where(and(eq(sets.festivalId, festivalId), notInArray(sets.id, keepIds)));
    //   }
    // }
  });

  return NextResponse.json({ ok: true, inserted, updated });
}
