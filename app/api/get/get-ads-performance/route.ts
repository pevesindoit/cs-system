import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      start_date,
      end_date,
      branch,
    } = body.data || body;

    const start = `${start_date} 00:00:00+00`;
    const end = `${end_date} 23:59:59+00`;

    // Fetch Ads names
    const { data: adsData, error: adsError } = await supabase
      .from("ads_name")
      .select("id, ads_name");
      
    if (adsError) throw adsError;

    // Fetch all leads to compute performance
    let allLeads: any[] = [];
    let offset = 0;
    const fetchLimit = 1000;
    while (true) {
      let q = supabase
        .from("leads")
        .select("id, status, ads_id, nominal")
        .gte("updated_at", start)
        .lte("updated_at", end);
        
      if (branch) q = q.eq("branch_id", branch);

      const { data, error } = await q.range(offset, offset + fetchLimit - 1);
      if (error) throw error;
      allLeads.push(...(data || []));
      if (!data || data.length < fetchLimit) break;
      offset += fetchLimit;
    }

    // Process ads performance
    const adsPerformance = adsData.map((ad) => {
        const adLeads = allLeads.filter(lead => lead.ads_id === ad.id);
        
        let counts = {
            closing: 0,
            warm: 0,
            survey: 0,
            los: 0,
            hold: 0,
            hot: 0,
            "closing proyek": 0
        };

        let total = 0;
        let total_omset = 0;

        adLeads.forEach(lead => {
            total++;
            total_omset += lead.nominal || 0;
            const st = lead.status?.toLowerCase();
            if (st === "closing" || st === "closing proyek" || st === "warm" || st === "survey" || st === "los" || st === "hold" || st === "hot") {
                counts[st as keyof typeof counts]++;
            }
        });

        return {
            ads_id: ad.id,
            ads_name: ad.ads_name,
            total,
            total_omset,
            ...counts
        };
    });

    // sort by highest closing count (closing + closing proyek)
    adsPerformance.sort((a, b) => {
       const closingA = a.closing + a["closing proyek"];
       const closingB = b.closing + b["closing proyek"];
       if (closingB !== closingA) return closingB - closingA;
       return b.total - a.total; // fallback to total leads
    });
    
    return NextResponse.json({
        adsPerformance
    }, { status: 200 });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err },
      { status: 500 }
    );
  }
}
