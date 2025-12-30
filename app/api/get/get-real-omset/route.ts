import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  const { user_id } = await req.json();
  try {
    const { data, error } = await supabase
      .from("real_omset")
      .select("*, branch:branch_id(name)")
      .eq("user_id", user_id) // <-- filter by user id
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err },
      { status: 500 }
    );
  }
}
