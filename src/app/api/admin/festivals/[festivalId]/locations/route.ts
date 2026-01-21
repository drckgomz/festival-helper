// src/app/api/admin/festivals/[festivalId]/locations/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

type Ctx = {
  params: Promise<{ festivalId: string }>;
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const supabase = adminSupabase();
    const { festivalId } = await ctx.params;

    const { data, error } = await supabase
      .from("festival_locations")
      .select("*")
      .eq("festival_id", festivalId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ locations: data ?? [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load locations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const supabase = adminSupabase();
    const { festivalId } = await ctx.params;

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const address = typeof body?.address === "string" ? body.address.trim() : null;

    const sortOrder =
      typeof body?.sortOrder === "number"
        ? body.sortOrder
        : typeof body?.sort_order === "number"
          ? body.sort_order
          : 0;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("festival_locations")
      .insert({
        festival_id: festivalId,
        name,
        address,
        sort_order: sortOrder,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ location: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create location" },
      { status: 500 }
    );
  }
}
