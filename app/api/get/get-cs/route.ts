import supabase from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Run all queries in parallel for better performance
    const [csRes, branchRes, platformRes, advertiserRes] = await Promise.all([
      // 1. Get Users (CS) where type_id is 1
      supabase.from("users").select("*").eq("type_id", 1),

      // 2. Get Branches
      supabase.from("branch").select("*"),
      // 2. Get Branches
      supabase.from("platform").select("*"),
      supabase.from("ads_platform").select("*"),
    ]);

    // Check for errors in any of the requests
    const errors =
      csRes.error ||
      branchRes.error ||
      platformRes.error ||
      advertiserRes.error;

    if (errors) {
      console.error("Supabase Error:", errors);
      return NextResponse.json({ error: errors.message }, { status: 500 });
    }

    // Return the combined data
    return NextResponse.json(
      {
        cs: csRes.data,
        branch: branchRes.data,
        platform: platformRes.data,
        ads_platform: advertiserRes.data,
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
