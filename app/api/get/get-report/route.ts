import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { ReportItem } from "@/app/types/types";

// 1. Define internal types
interface AdData {
  daily_spend: number;
  created_at: string;
  platform_id?: string;
}

interface LeadData {
  nominal: number;
  status: string;
  created_at: string;
  platform_id?: string;
}

interface DailyBucket {
  date: string;
  budget: number;
  leads: LeadData[];
  ads: AdData[];
}

export async function POST(req: NextRequest) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (e) {}

    const { start_date, end_date, platform_id, target_lead, target_omset } =
      body as ReportItem;

    // Date Defaults
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    const safeStartDate = start_date || formatDate(thirtyDaysAgo);
    const safeEndDate = end_date || formatDate(now);

    const start = `${safeStartDate} 00:00:00+00`;
    const end = `${safeEndDate} 23:59:59+00`;

    // Queries
    let adsQuery = supabase
      .from("ads")
      .select("daily_spend, platform_id, created_at")
      .gte("created_at", start)
      .lte("created_at", end);

    let leadsQuery = supabase
      .from("leads")
      .select("nominal, status, platform_id, created_at")
      .gte("created_at", start)
      .lte("created_at", end);

    if (platform_id) {
      adsQuery = adsQuery.eq("platform_id", platform_id);
      leadsQuery = leadsQuery.eq("platform_id", platform_id);
    }

    const [adsRes, leadsRes] = await Promise.all([adsQuery, leadsQuery]);

    if (adsRes.error) throw adsRes.error;
    if (leadsRes.error) throw leadsRes.error;

    const adsData = (adsRes.data || []) as AdData[];
    const leadsData = (leadsRes.data || []) as LeadData[];

    // --- DAILY BREAKDOWN LOGIC ---

    const dateMap = new Map<string, DailyBucket>();
    const currentDate = new Date(safeStartDate);
    const lastDate = new Date(safeEndDate);

    while (currentDate <= lastDate) {
      const dateStr = formatDate(currentDate);
      dateMap.set(dateStr, {
        date: dateStr,
        budget: 0,
        leads: [],
        ads: [],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Distribute ADS
    adsData.forEach((ad) => {
      const dateKey = ad.created_at.split("T")[0];
      const bucket = dateMap.get(dateKey);
      if (bucket) {
        bucket.budget += ad.daily_spend || 0;
        bucket.ads.push(ad);
      }
    });

    // Distribute LEADS
    leadsData.forEach((lead) => {
      const dateKey = lead.created_at.split("T")[0];
      const bucket = dateMap.get(dateKey);
      if (bucket) {
        bucket.leads.push(lead);
      }
    });

    // Process Daily Metrics
    const dailyBreakdown = Array.from(dateMap.values()).map((day) => {
      // 1. Budget & Spend Calculation (FIXED)
      const budget = day.budget;
      // Spend = Budget + 12% PPN
      const total_spend = budget * 1.12;

      // 2. Leads
      const actual_lead = day.leads.length;

      // 3. Closing
      const closingLeads = day.leads.filter((lead) =>
        ["closing", "followup", "hold"].includes(lead.status?.toLowerCase())
      );
      const closing = closingLeads.length;

      const warm_leads = day.leads.filter(
        (lead) => lead.status?.toLowerCase() === "warm"
      ).length;

      // 4. Omset
      const omset = closingLeads.reduce(
        (acc, curr) => acc + (curr.nominal || 0),
        0
      );

      // 5. Ratios
      const closing_rate = actual_lead > 0 ? (closing / actual_lead) * 100 : 0;
      const ads_vs_omset = omset > 0 ? (total_spend / omset) * 100 : 0;

      return {
        date: day.date,
        budget: budget,
        total_spend: Math.round(total_spend), // Will now be higher than budget
        actual_lead: actual_lead,
        closing: closing,
        warm_leads: warm_leads,
        closing_rate: `${closing_rate.toFixed(2)}%`,
        omset: omset,
        ads_vs_omset: `${ads_vs_omset.toFixed(2)}%`,
      };
    });

    // --- SUMMARY CALCULATIONS (FIXED) ---
    const totalBudget = adsData.reduce(
      (acc, curr) => acc + (curr.daily_spend || 0),
      0
    );

    // Fixed: Budget * 1.12
    const totalSpend = totalBudget * 1.12;

    const totalActualLead = leadsData.length;

    const totalClosingLeads = leadsData.filter((lead) =>
      ["closing", "followup", "hold"].includes(lead.status?.toLowerCase())
    );
    const totalClosing = totalClosingLeads.length;
    const totalWarm = leadsData.filter(
      (l) => l.status?.toLowerCase() === "warm"
    ).length;
    const totalOmset = totalClosingLeads.reduce(
      (acc, curr) => acc + (curr.nominal || 0),
      0
    );

    const safeTargetLead = Number(target_lead) || 0;
    const totalTargetVsActual =
      safeTargetLead > 0 ? (totalActualLead / safeTargetLead) * 100 : 0;

    const totalClosingRate =
      totalActualLead > 0 ? (totalClosing / totalActualLead) * 100 : 0;
    const totalAdsVsOmset =
      totalOmset > 0 ? (totalSpend / totalOmset) * 100 : 0;

    const safeTargetOmset = Number(target_omset) || 0;
    const totalTargetVsActualOmset =
      safeTargetOmset > 0 ? (totalOmset / safeTargetOmset) * 100 : 0;

    const responseData = {
      summary: {
        date_range: { start: safeStartDate, end: safeEndDate },
        budget: totalBudget,
        total_spend: Math.round(totalSpend),
        actual_lead: totalActualLead,
        target_lead: safeTargetLead,
        target_vs_actual_leads: `${totalTargetVsActual.toFixed(2)}%`,
        closing: totalClosing,
        warm_leads: totalWarm,
        closing_rate: `${totalClosingRate.toFixed(2)}%`,
        omset: totalOmset,
        target_omset: safeTargetOmset,
        target_vs_actual_omset: `${totalTargetVsActualOmset.toFixed(2)}%`,
        ads_vs_omset: `${totalAdsVsOmset.toFixed(2)}%`,
      },
      daily_breakdown: dailyBreakdown,
    };

    return NextResponse.json({ data: responseData }, { status: 200 });
  } catch (err) {
    console.error("Internal Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err },
      { status: 500 }
    );
  }
}
