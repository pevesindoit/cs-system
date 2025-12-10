import supabase from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, error } = await supabase.from("costumers").select("*");
    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log(data);
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
