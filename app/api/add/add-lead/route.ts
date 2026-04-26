import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, nomor_hp, channel_id, user_id, ...rest } = body;

    // 1. Validate required fields
    if (!user_id || !nomor_hp) {
      return NextResponse.json(
        { error: "Missing required fields: user_id or nomor_hp" },
        { status: 400 }
      );
    }

    // Clean phone number: remove non-digits, then remove any '62' or '0' prefixes to start with '8'
    const cleanedHpStr = nomor_hp.replace(/\D/g, "").replace(/^(62|0)+/, "");
    const cleanedHp = parseInt(cleanedHpStr, 10); // Store as number

    // 2. Check/Upsert Customer
    let costumer_id;

    // Check if customer exists by phone number
    const { data: existingCustomer, error: findError } = await supabase
      .from("costumers")
      .select("id")
      .eq("number", cleanedHp)
      .maybeSingle();

    if (findError) {
      console.error("Supabase Find Error:", findError);
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (existingCustomer) {
      costumer_id = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from("costumers")
        .insert({
          name,
          address,
          number: cleanedHp,
          costumers_type: channel_id || 1
        })
        .select("id")
        .single();

      if (customerError) {
        console.error("Customer Insert Error:", customerError);
        return NextResponse.json({ error: customerError.message }, { status: 500 });
      }
      costumer_id = newCustomer.id;
    }

    // 3. Build the payload for the lead
    const insertPayload = {
      name,
      address,
      nomor_hp: cleanedHpStr, // leads table keeps as string
      user_id,
      channel_id,
      costumer_id,
      ...rest,
    };

    // 4. Insert and return ONLY the new record
    const { data: newLead, error: insertError } = await supabase
      .from("leads")
      .insert(insertPayload)
      .select("*, platform:platform_id(name)")
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: "Lead created successfully",
        newLead: newLead,
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
