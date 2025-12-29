import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // FIX 1: Destructure the actual keys sent by the frontend
    // (changed 'date' to 'created_at' and 'angage' to 'engagement')
    const {
      created_at,
      user_id,
      platform_id,
      followers,
      reach,
      engagement,
      notes,
    } = body;

    // 1. Get User ID
    let finalUserId = user_id;

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
    // FIX 2: Check 'created_at' instead of 'date'
    if (!created_at || !platform_id || !finalUserId) {
      console.error("Validation Failed:", {
        created_at,
        platform_id,
        finalUserId,
      });
      return NextResponse.json(
        { error: "Missing required fields. Did you select a Platform?" },
        { status: 400 }
      );
    }

    // 3. Format Date
    const formattedDate = new Date(created_at).toISOString();

    // 4. Build DB Payload
    const insertPayload = {
      created_at: formattedDate,
      platform_id,
      angage: engagement,
      notes,
      followers,
      user_id: finalUserId,
      reach,
    };

    // 5. Insert
    const { data: newEntry, error: insertError } = await supabase
      .from("social_media_growth")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 6. Fetch Updated List
    const { data: allLeads, error: fetchError } = await supabase
      .from("social_media_growth")
      .select(
        `
        *, 
        platform:platform_id(name)
      `
      )
      .eq("user_id", finalUserId)
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
