import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, noted } = body;

    console.log(body, "ini bodynya");

    // Validate required fields
    if (!id || !noted) {
      return NextResponse.json(
        { error: "Missing required fields: id and noted" },
        { status: 400 }
      );
    }

    // Build the data you want to insert
    const insertPayload = {
      leads_id: id,
      note: noted, // include other optional fields if needed
    };

    // Insert new lead
    const { data: newLead, error: insertError } = await supabase
      .from("followups")
      .insert(insertPayload)
      .select()
      .single();

    console.log(newLead, "inimi");

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Fetch updated lis

    return NextResponse.json(
      {
        newLead: {
          id: newLead.id,
          note: newLead.note,
        },
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
