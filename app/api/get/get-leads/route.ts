import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  const { user_id } = await req.json();
  console.log(user_id, "ini leads user_id");

  try {
    const { data, error } = await supabase
      .from("leads")
      .select(
        "*, platform:platform_id(name,id), channel:channel_id(name,id), keterangan_leads:keterangan_leads(name,id), branch:branch_id(name,id), pic:pic_id(name,id)"
      )
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
