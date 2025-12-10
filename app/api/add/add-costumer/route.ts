import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name } = body;

  try {
    // Insert new customer
    const { data: newCustomer, error: insertError } = await supabase
      .from("costumers")
      .insert({ name })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Fetch updated list of customers
    const { data: allCustomers, error: fetchError } = await supabase
      .from("costumers")
      .select("*")
      .order("name", { ascending: true });

    if (fetchError) {
      console.error("Supabase Fetch Error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        newCustomer: {
          id: newCustomer.id,
          name: newCustomer.name,
        },
        allCustomers, // full updated list
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
