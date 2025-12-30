import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { id, field, value } = await req.json();

    if (!id || !field) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("advertiser_data")
      .update({ [field]: value }) // 👈 dynamic column
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
