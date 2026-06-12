import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  const { user_id, page = 1, limit = 50 } = await req.json();
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("advertiser_data")
      .select("*, platform:platform_id(name), branch:cabang_id(name)", { count: "exact" })
      .eq("ads_manager_id", user_id) // <-- filter by user id
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data, total: count, page, limit }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err },
      { status: 500 }
    );
  }
}
