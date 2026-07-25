import supabase from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function normalizePhone(phone: string) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("62")) return digits;

  if (digits.startsWith("0"))
    return "62" + digits.substring(1);

  return digits;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, nomor_hp, channel_id, user_id, ...rest } = body;

    // 1. Validate required fields
    if (!user_id) {
      return NextResponse.json(
        { error: "Missing required fields: user_id" },
        { status: 400 }
      );
    }

    // Clean phone number (only if provided)
    const cleanedHpStr = nomor_hp
      ? nomor_hp.replace(/\D/g, "").replace(/^(62|0)+/, "")
      : "";
    const cleanedHp = cleanedHpStr ? parseInt(cleanedHpStr, 10) : null;

    // 2. Check/Upsert Customer (only if phone number is provided)
    let costumer_id = null;

    if (cleanedHp) {
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
      .select("*, platform:platform_id(name), branch:branch_id(name)")
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 5. Meta CAPI Integration
    try {
      const status = newLead.status?.toLowerCase();
      const nominal = Number(newLead.nominal || 0);

      let eventName: string | null = null;

      switch (status) {
        case "hold":
          eventName = "Lead";
          break;

        case "warm":
          eventName = "Contact";
          break;

        case "survey":
          eventName = "Contact";
          break;

        case "closing":
        case "closing proyek":
        case "repeat order":
          if (nominal > 0) {
            eventName = "Purchase";
          }
          break;
      }

      // Prevent duplicate 'Lead' events if the customer already has a 'hold' status lead
      if (eventName === "Lead" && costumer_id) {
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("costumer_id", costumer_id)
          .eq("status", "hold");

        // Since the current lead is already inserted, if count > 1, there was a previous hold
        if (count && count > 1) {
          eventName = null; // Skip sending
        }
      }

      if (eventName) {
        const PIXEL_ID = process.env.PIXEL_ID;
        const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
        const APP_URL = process.env.APP_URL;

        if (PIXEL_ID && META_ACCESS_TOKEN) {
          const phoneToHash = nomor_hp
            ? normalizePhone(String(nomor_hp))
            : "";

          const hashedPhone = phoneToHash
            ? crypto
              .createHash("sha256")
              .update(phoneToHash.trim())
              .digest("hex")
            : null;

          const firstName = name
            ? String(name).split(" ")[0]
            : "";

          const hashedName = firstName
            ? crypto
              .createHash("sha256")
              .update(firstName.toLowerCase().trim())
              .digest("hex")
            : null;

          const metaCity = newLead.city || (newLead.branch && newLead.branch.name) || "";
          const hashedCity = metaCity
            ? crypto
              .createHash("sha256")
              .update(String(metaCity).toLowerCase().replace(/[^a-z]/g, '').trim())
              .digest("hex")
            : null;

          const externalId = costumer_id
            ? crypto
              .createHash("sha256")
              .update(String(costumer_id))
              .digest("hex")
            : null;

          const payload = {
            data: [
              {
                event_name: eventName,
                event_time: Math.floor(Date.now() / 1000),
                action_source: "system_generated",
                event_id: `${newLead.id}`,

                ...(APP_URL && {
                  event_source_url: APP_URL,
                }),

                user_data: {
                  ...(hashedPhone && {
                    ph: [hashedPhone],
                  }),

                  ...(hashedName && {
                    fn: [hashedName],
                  }),

                  ...(hashedCity && {
                    ct: [hashedCity],
                  }),

                  ...(externalId && {
                    external_id: [externalId],
                  }),
                },

                ...(eventName === "Purchase" && {
                  custom_data: {
                    currency: "IDR",
                    value: nominal,
                  },
                }),
              },
            ],
          };

          console.log("Meta Payload:");
          console.log(JSON.stringify(payload, null, 2));

          const metaResponse = await fetch(
            `https://graph.facebook.com/v23.0/${PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }
          );

          const result = await metaResponse.json();

          console.log("Meta CAPI Response:", result);
        }
      }
    } catch (metaErr) {
      console.error("Meta CAPI Error:", metaErr);
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
