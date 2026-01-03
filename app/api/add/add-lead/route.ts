import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, user_id, ...rest } = body;

    // 1. Validate required fields
    if (!user_id) {
      return NextResponse.json(
        { error: "Missing required fields: name or user_id" },
        { status: 400 }
      );
    }

    // 2. Build the payload
    const insertPayload = {
      name,
      user_id,
      ...rest,
    };

    // 3. Insert and return ONLY the new record
    // We select specific fields or '*' to get the ID back immediately
    const { data: newLead, error: insertError } = await supabase
      .from("leads")
      .insert(insertPayload)
      .select("*, platform:platform_id(name)") // Try to join immediately if Supabase allows, otherwise just select '*'
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // --- DELETED: The "Fetch All" block that was crashing your server ---

    // 4. Return just the new lead
    return NextResponse.json(
      {
        message: "Lead created successfully",
        newLead: newLead, // Send the full object so frontend can use it
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
