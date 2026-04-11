import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (!payload.id && !payload.branch_id) {
      return NextResponse.json({ error: "Invalid payload: id or branch_id is required" }, { status: 400 });
    }

    let targetId = payload.id;

    // If no ID is provided, try to find an existing record for this branch
    if (!targetId && payload.branch_id) {
      const { data: existing } = await supabase
        .from("target")
        .select("id")
        .eq("branch_id", payload.branch_id)
        .maybeSingle();
      
      if (existing) {
        targetId = existing.id;
      }
    }

    const { data, error } = await supabase
      .from("target")
      .upsert({
        id: targetId || undefined,
        branch_id: payload.branch_id,
        target: payload.target,
        ads: payload.ads,
        google_ads: payload.google_ads,
        google_ads_cpl: payload.google_ads_cpl,
        fb_ads_cpl: payload.fb_ads_cpl,
        leads_target: payload.leads_target,
        omset_target: payload.omset_target,
      })
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
