// src/app/api/admin/festivals/[festivalId]/locations/[locationId]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

type Ctx = {
  params: Promise<{ festivalId: string; locationId: string }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const supabase = adminSupabase();
    const { festivalId, locationId } = await ctx.params;

    const body = await req.json().catch(() => ({}));

    // Only allow these fields to be updated
    const patch: Record<string, any> = {};

    if (typeof body?.name === "string") patch.name = body.name.trim();
    if (typeof body?.address === "string") patch.address = body.address.trim();
    if (body?.address === null) patch.address = null;

    // accept both sortOrder (camel) and sort_order (snake) from client
    if (typeof body?.sortOrder === "number") patch.sort_order = body.sortOrder;
    if (typeof body?.sort_order === "number") patch.sort_order = body.sort_order;

    // If nothing to update, return current row
    if (Object.keys(patch).length === 0) {
      const { data, error } = await supabase
        .from("festival_locations")
        .select("*")
        .eq("festival_id", festivalId)
        .eq("id", locationId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ location: data });
    }

    const { data, error } = await supabase
      .from("festival_locations")
      .update(patch)
      .eq("festival_id", festivalId)
      .eq("id", locationId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ location: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to update location" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const supabase = adminSupabase();
    const { festivalId, locationId } = await ctx.params;

    const { error } = await supabase
      .from("festival_locations")
      .delete()
      .eq("festival_id", festivalId)
      .eq("id", locationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to delete location" },
      { status: 500 }
    );
  }
}
