import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader || "",
          },
        },
      }
    );

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("ads_name").delete().eq("id", id);

    if (error) {
      console.error("Supabase Delete Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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
        message: "Ads name deleted successfully",
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
