import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ads_name } = body;

    if (!ads_name) {
      return NextResponse.json(
        { error: "ads_name is required" },
        { status: 400 }
      );
    }

    const { data: newAdsName, error: insertError } = await supabase
      .from("ads_name")
      .insert({ ads_name })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Fetch updated list of ads_name
    const { data: allAdsNames, error: fetchError } = await supabase
      .from("ads_name")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Supabase Fetch Error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        newAdsName,
        allAdsNames,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
