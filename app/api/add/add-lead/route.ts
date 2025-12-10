import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, user_id, ...rest } = body;

    console.log(body, "ini bodynya");

    // Validate required fields
    if (!name || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: name or user_id" },
        { status: 400 }
      );
    }

    // Build the data you want to insert
    const insertPayload = {
      name,
      user_id,
      ...rest, // include other optional fields if needed
    };

    // Insert new lead
    const { data: newLead, error: insertError } = await supabase
      .from("leads")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Fetch updated list
    const { data: allLeads, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user_id)
      .order("name", { ascending: true });

    if (fetchError) {
      console.error("Supabase Fetch Error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        newLead: {
          id: newLead.id,
          name: newLead.name,
        },
        allLeads,
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
