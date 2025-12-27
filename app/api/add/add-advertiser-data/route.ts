import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      date,
      cabang_id,
      spend,
      ppn,
      total_budget,
      platform_id,
      leads,
      cost_per_lead,
      konversi_google,
      cost_per_konversi,
      keterangan,
      ads_manager_id,
    } = body;

    // 1. Get User ID
    let finalUserId = ads_manager_id;

    if (!finalUserId) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const {
          data: { user },
        } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        finalUserId = user?.id;
      }
    }

    // 2. Validate Required Fields
    // We explicitly check if platform_id is valid
    if (!date || !platform_id || !cabang_id || !finalUserId) {
      console.error("Validation Failed:", {
        date,
        platform_id,
        cabang_id,
        finalUserId,
      });
      return NextResponse.json(
        { error: "Missing required fields. Did you select a Platform?" },
        { status: 400 }
      );
    }

    // 3. Format Date
    const formattedDate = new Date(date).toISOString();

    // 4. Build DB Payload
    // CRITICAL FIX: Mapping frontend keys to Database Columns based on your select query
    const insertPayload = {
      created_at: formattedDate,

      // Map 'cabang_id' -> 'branch_id' (Based on your fetch: branch:branch_id(name))
      cabang_id: cabang_id,

      // Map 'platform_id' -> 'ads_platform_id' (Based on your fetch: platform:ads_platform_id(name))
      platform_id: platform_id,

      spend: Number(spend),
      total_budget: Number(total_budget),
      leads: Number(leads),
      // Ensure these match your actual DB column names in the 'ads' table
      conversi_google: Number(konversi_google),

      keterangan: keterangan,
      ads_manager_id: finalUserId,
    };

    console.log(insertPayload);

    // 5. Insert
    // CRITICAL FIX: Changed table from "advertiser_data" to "ads" to match the fetch query below
    const { data: newEntry, error: insertError } = await supabase
      .from("advertiser_data")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 6. Fetch Updated List
    const { data: allLeads, error: fetchError } = await supabase
      .from("advertiser_data")
      .select(
        `
        *, 
        platform:platform_id(name), 
        branch:cabang_id(name)
      `
      )
      .eq("ads_manager_id", finalUserId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Success", newEntry, allLeads },
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
