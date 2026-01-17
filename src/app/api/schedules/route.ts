// src/app/api/schedules/route.ts
import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server"; // if Clerk
// import { db } from "@/db";

export async function POST(req: Request) {
  // const { userId } = auth();
  // if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // validate body: festivalId, days, chosenSets, ratings, etc.

  // await db.schedule.create({ data: { userId, festivalId: ..., payload: body } });

  return NextResponse.json({ ok: true });
}
