import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { id, field, value } = await req.json();

    if (!id || !field) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Special handling: when nomor_hp is updated, also upsert the customer
    if (field === "nomor_hp") {
      const rawHp = typeof value === "string" ? value : "";
      const cleanedHpStr = rawHp.replace(/\D/g, "").replace(/^(62|0)+/, "");
      const cleanedHp = cleanedHpStr ? parseInt(cleanedHpStr, 10) : null;

      if (cleanedHp) {
        // Fetch existing lead to get name, address, channel_id for customer creation
        const { data: existingLead } = await supabase
          .from("leads")
          .select("name, address, channel_id")
          .eq("id", id)
          .single();

        // Find or create the customer
        const { data: existingCustomer, error: findError } = await supabase
          .from("costumers")
          .select("id")
          .eq("number", cleanedHp)
          .maybeSingle();

        if (findError) {
          console.error("Supabase Find Error:", findError);
          return NextResponse.json({ error: findError.message }, { status: 500 });
        }

        let costumer_id: string;
        if (existingCustomer) {
          costumer_id = existingCustomer.id;
        } else {
          const { data: newCustomer, error: customerError } = await supabase
            .from("costumers")
            .insert({
              name: existingLead?.name ?? "",
              address: existingLead?.address ?? "",
              number: cleanedHp,
              costumers_type: existingLead?.channel_id ?? 1,
            })
            .select("id")
            .single();

          if (customerError) {
            console.error("Customer Insert Error:", customerError);
            return NextResponse.json({ error: customerError.message }, { status: 500 });
          }
          costumer_id = newCustomer.id;
        }

        // Update both nomor_hp and costumer_id on the lead
        const { data, error } = await supabase
          .from("leads")
          .update({ nomor_hp: cleanedHpStr, costumer_id })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("Supabase Error:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 200 });
      }

      // If phone is cleared/empty, just clear both fields
      const { data, error } = await supabase
        .from("leads")
        .update({ nomor_hp: "", costumer_id: null })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data }, { status: 200 });
    }

    // Default: update any other field normally
    const { data, error } = await supabase
      .from("leads")
      .update({ [field]: value })
      .eq("id", id)
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
