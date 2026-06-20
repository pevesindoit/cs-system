import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (error) {
      console.log(error);
    }

    const { start_date, end_date } = body as any;

    const leadsQuery = supabase.from("leads").select("status, branch_id, ads_id, created_at")
        .gte("created_at", start_date ? `${start_date} 00:00:00` : "2000-01-01")
        .lte("created_at", end_date ? `${end_date} 23:59:59` : "2100-01-01")
        .order("created_at", { ascending: false })
        .limit(10000);

    const [branchRes, adsNameRes, leadsRes] = await Promise.all([
      supabase.from("branch").select("id, name"),
      supabase.from("ads_name").select("id, ads_name"),
      leadsQuery
    ]);

    const branches = branchRes.data || [];
    const adsNames = adsNameRes.data || [];
    const leads = leadsRes.data || [];

    // Group leads by branch first
    const leadsByBranch = leads.reduce((acc, lead) => {
      const branchId = lead.branch_id || "unknown";
      if (!acc[branchId]) acc[branchId] = [];
      acc[branchId].push(lead);
      return acc;
    }, {} as Record<string, any[]>);

    const branchBreakdown = Object.keys(leadsByBranch).map(branchId => {
      const branchLeads = leadsByBranch[branchId];
      let branchName = "Unknown Branch";
      if (branchId !== "unknown") {
        const matchedBranch = branches.find((b) => String(b.id) === String(branchId));
        if (matchedBranch) branchName = matchedBranch.name;
      }

      // Group leads by date within the branch
      const leadsByDate = branchLeads.reduce((acc, lead) => {
        const date = lead.created_at ? lead.created_at.split('T')[0] : 'Unknown Date';
        if (!acc[date]) acc[date] = [];
        acc[date].push(lead);
        return acc;
      }, {} as Record<string, any[]>);

      // Sort dates descending
      const sortedDates = Object.keys(leadsByDate).sort((a, b) => b.localeCompare(a));

      const dateBreakdown = sortedDates.map((date) => {
        const dateLeads = leadsByDate[date];

        // Find all unique ads_id present in the leads for this date
        const uniqueAdsIds = Array.from(new Set(dateLeads.map((l: any) => l.ads_id)));

        // Group leads by their ads_id
        const activeAdsStats = uniqueAdsIds.map((adsId) => {
          const adLeads = dateLeads.filter((l: any) => l.ads_id === adsId);

          let closing = 0, warm = 0, closing_proyek = 0, survey = 0, hold = 0;

          adLeads.forEach((l: any) => {
            const status = (l.status || "").toLowerCase();
            if (status === "closing") closing++;
            else if (status === "warm") warm++;
            else if (status === "closing proyek") closing_proyek++;
            else if (status === "survey") survey++;
            else if (status === "hold") hold++;
          });

          // Look up the name from the ads_name table
          let nameToDisplay = "Tanpa Iklan / Lainnya";
          if (adsId) {
            const matchedAd = adsNames.find((ad) => String(ad.id) === String(adsId));
            if (matchedAd) {
              nameToDisplay = matchedAd.ads_name;
            } else {
              nameToDisplay = `Unknown / Old ID`;
            }
          }

          return {
            ads_id: adsId || "unknown",
            ads_name: nameToDisplay,
            total_leads: adLeads.length,
            closing,
            warm,
            closing_proyek,
            survey,
            hold,
          };
        });

        // Sort by total_leads descending
        activeAdsStats.sort((a, b) => b.total_leads - a.total_leads);

        // We can also calculate totals for this date
        const total_leads = dateLeads.length;
        let total_closing = 0, total_warm = 0, total_closing_proyek = 0, total_survey = 0, total_hold = 0;
        activeAdsStats.forEach(ad => {
            total_closing += ad.closing;
            total_warm += ad.warm;
            total_closing_proyek += ad.closing_proyek;
            total_survey += ad.survey;
            total_hold += ad.hold;
        });

        return {
          date,
          total_leads,
          closing: total_closing,
          warm: total_warm,
          closing_proyek: total_closing_proyek,
          survey: total_survey,
          hold: total_hold,
          ads_data: activeAdsStats,
        };
      });

      return {
        branch_name: branchName,
        dates: dateBreakdown
      };
    });

    branchBreakdown.sort((a, b) => a.branch_name.localeCompare(b.branch_name));

    return NextResponse.json({ data: branchBreakdown }, { status: 200 });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
