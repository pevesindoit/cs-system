import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ads_manager_id, ...rest } = body;

    console.log(body, "ini bodynya");

    // Validate required fields
    if (!name || !ads_manager_id) {
      return NextResponse.json(
        { error: "Missing required fields: name or user_id" },
        { status: 400 }
      );
    }

    // Build the data you want to insert
    const insertPayload = {
      name,
      ads_manager_id,
      ...rest, // include other optional fields if needed
    };

    // Insert new lead
    const { data: newLead, error: insertError } = await supabase
      .from("ads")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Fetch updated list
    const { data: allLeads, error: fetchError } = await supabase
      .from("ads")
      .select("*, platform:platform_id(name)")
      .eq("ads_manager_id", ads_manager_id)
      .order("created_at", { ascending: false });

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
