// src/app/api/admin/festivals/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { festivals } from "@/db/schema";
import { desc } from "drizzle-orm";

type FestivalRole = "admin" | "editor" | "viewer";

async function getClaims() {
  const a = await auth();
  return {
    userId: a.userId,
    publicMetadata: ((a.sessionClaims as any)?.publicMetadata ?? {}) as any,
  };
}

function isSuperAdmin(pm: any) {
  return pm?.role === "superadmin";
}

function requireSuperAdminOrGlobalAdmin(pm: any) {
  return isSuperAdmin(pm) || pm?.role === "admin";
}

export async function GET(_req: NextRequest) {
  const { userId, publicMetadata } = await getClaims();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(festivals).orderBy(desc(festivals.updatedAt));
  return NextResponse.json({ festivals: rows });
}

export async function POST(req: NextRequest) {
  const { userId, publicMetadata } = await getClaims();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!requireSuperAdminOrGlobalAdmin(publicMetadata)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const slug = body?.slug?.trim();
  const name = body?.name?.trim();

  if (!slug || !name) {
    return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
  }

  const inserted = await db
    .insert(festivals)
    .values({
      slug,
      name,
      city: body?.city ?? null,
      timezone: body?.timezone ?? "America/Chicago",
      startDate: body?.startDate ? new Date(body.startDate) : null,
      endDate: body?.endDate ? new Date(body.endDate) : null,
      isPublished: body?.isPublished ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ festival: inserted[0] }, { status: 201 });
}
