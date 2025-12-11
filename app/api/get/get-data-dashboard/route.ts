import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { start_date, end_date } = body.data;

    // Full timestamp include whole day
    const start = `${start_date} 00:00:00+00`;
    const end = `${end_date} 23:59:59+00`;

    // ======== LEADS DATA ============
    const { data: leads, error: errorLeads } = await supabase
      .from("leads")
      .select("*, platform:platform_id(name)")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false });

    if (errorLeads) {
      return NextResponse.json({ error: errorLeads.message }, { status: 500 });
    }

    // ======== ADS DATA ============
    const { data: ads, error: errorAds } = await supabase
      .from("ads")
      .select("*, platform:platform_id(name)")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false });

    if (errorAds) {
      return NextResponse.json({ error: errorAds.message }, { status: 500 });
    }

    // ======== CALCULATIONS ============

    // Revenue = Sum nominal from leads
    const revenue =
      leads?.reduce((sum, item) => sum + (item.nominal || 0), 0) || 0;

    // Ads spend = Sum daily_spend from ads
    const ads_spend =
      ads?.reduce((sum, item) => sum + (item.daily_spend || 0), 0) || 0;

    // ROAS
    const roas = ads_spend > 0 ? revenue / ads_spend : 0;

    // Conversion Rate = leads count / ads count
    const conversion_rate =
      ads?.length > 0 ? (leads.length / ads.length) * 100 : 0;

    return NextResponse.json(
      {
        leads,
        ads,
        revenue,
        ads_spend,
        roas,
        conversion_rate,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err },
      { status: 500 }
    );
  }
}
