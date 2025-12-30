import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { ReportItem } from "@/app/types/types";

// 1. Data Interfaces
interface AdvertiserRow {
  spend: number;
  total_budget: number;
  created_at: string;
  platform_id?: string;
  cabang_id?: string; // Note: Database uses 'cabang_id'
}

interface LeadData {
  nominal: number;
  status: string;
  created_at: string;
  platform_id?: string;
  branch_id?: string; // Note: Database uses 'branch_id'
}

interface BranchRow {
  id: string;
  name: string;
}

// 2. Breakdown Interface
interface DailyBucket {
  date: string;
  budget: number;
  total_spend: number;
  leads: LeadData[];
  ads: AdvertiserRow[];
}

interface BranchBucket {
  id: string;
  name: string;
  budget: number;
  total_spend: number;
  actual_lead: number;
  closing: number;
  warm_leads: number;
  omset: number;
}

export async function POST(req: NextRequest) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (error) {
      console.log(error)
    }

    const {
      start_date,
      end_date,
      platform_id,
      target_lead,
      target_omset,
      branch_id, // Optional filter
    } = body as ReportItem;

    // --- Date Defaults ---
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    const safeStartDate = start_date || formatDate(thirtyDaysAgo);
    const safeEndDate = end_date || formatDate(now);

    const start = `${safeStartDate} 00:00:00+00`;
    const end = `${safeEndDate} 23:59:59+00`;

    // --- PREPARE QUERIES ---

    // 1. Fetch ALL Branches (Dynamic Check)
    const branchQuery = supabase.from("branch").select("id, name");

    // 2. Fetch Advertiser Data
    let adsQuery = supabase
      .from("advertiser_data")
      .select("spend, total_budget, platform_id, created_at, cabang_id")
      .gte("created_at", start)
      .lte("created_at", end);

    // 3. Fetch Leads Data
    let leadsQuery = supabase
      .from("leads")
      .select("nominal, status, platform_id, created_at, branch_id")
      .gte("created_at", start)
      .lte("created_at", end);

    // --- APPLY FILTERS ---
    if (platform_id) {
      adsQuery = adsQuery.eq("platform_id", platform_id);
      leadsQuery = leadsQuery.eq("platform_id", platform_id);
    }

    if (branch_id) {
      adsQuery = adsQuery.eq("cabang_id", branch_id);
      leadsQuery = leadsQuery.eq("branch_id", branch_id);
    }

    // --- EXECUTE PARALLEL ---
    const [branchRes, adsRes, leadsRes] = await Promise.all([
      branchQuery,
      adsQuery,
      leadsQuery,
    ]);

    if (branchRes.error) throw branchRes.error;
    if (adsRes.error) throw adsRes.error;
    if (leadsRes.error) throw leadsRes.error;

    const branches = (branchRes.data || []) as BranchRow[];
    const adsData = (adsRes.data || []) as AdvertiserRow[];
    const leadsData = (leadsRes.data || []) as LeadData[];

    // ==========================================
    // LOGIC 1: DAILY BREAKDOWN (Existing)
    // ==========================================
    const dateMap = new Map<string, DailyBucket>();
    const currentDate = new Date(safeStartDate);
    const lastDate = new Date(safeEndDate);

    while (currentDate <= lastDate) {
      const dateStr = formatDate(currentDate);
      dateMap.set(dateStr, {
        date: dateStr,
        budget: 0,
        total_spend: 0,
        leads: [],
        ads: [],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    adsData.forEach((ad) => {
      const dateKey = ad.created_at.split("T")[0];
      const bucket = dateMap.get(dateKey);
      if (bucket) {
        bucket.budget += ad.spend || 0;
        bucket.total_spend += ad.total_budget || 0;
        bucket.ads.push(ad);
      }
    });

    leadsData.forEach((lead) => {
      const dateKey = lead.created_at.split("T")[0];
      const bucket = dateMap.get(dateKey);
      if (bucket) {
        bucket.leads.push(lead);
      }
    });

    const dailyBreakdown = Array.from(dateMap.values()).map((day) => {
      const closingLeads = day.leads.filter((lead) =>
        ["closing", "followup", "hold"].includes(lead.status?.toLowerCase())
      );
      const actual_lead = day.leads.length;
      const closing = closingLeads.length;
      const omset = closingLeads.reduce(
        (acc, curr) => acc + (curr.nominal || 0),
        0
      );
      const warm_leads = day.leads.filter(
        (l) => l.status?.toLowerCase() === "warm"
      ).length;

      return {
        date: day.date,
        budget: day.budget,
        total_spend: Math.round(day.total_spend),
        actual_lead,
        closing,
        warm_leads,
        closing_rate:
          actual_lead > 0
            ? `${((closing / actual_lead) * 100).toFixed(2)}%`
            : "0%",
        omset,
        ads_vs_omset:
          omset > 0 ? `${((day.total_spend / omset) * 100).toFixed(2)}%` : "0%",
      };
    });

    // ==========================================
    // LOGIC 2: BRANCH BREAKDOWN (New & Dynamic)
    // ==========================================

    // Initialize map with all available branches from DB
    const branchMap = new Map<string, BranchBucket>();

    branches.forEach((b) => {
      branchMap.set(String(b.id), {
        id: String(b.id),
        name: b.name,
        budget: 0,
        total_spend: 0,
        actual_lead: 0,
        closing: 0,
        warm_leads: 0,
        omset: 0,
      });
    });

    // Aggregate Ads by Branch (using cabang_id)
    adsData.forEach((ad) => {
      if (!ad.cabang_id) return;
      // Convert to string to ensure matching keys
      const bId = String(ad.cabang_id);

      // If branch exists in our map, update it.
      // Note: If you have data for a deleted branch, this check handles it safely.
      if (branchMap.has(bId)) {
        const bucket = branchMap.get(bId)!;
        bucket.budget += ad.spend || 0;
        bucket.total_spend += ad.total_budget || 0;
      }
    });

    // Aggregate Leads by Branch (using branch_id)
    leadsData.forEach((lead) => {
      if (!lead.branch_id) return;
      const bId = String(lead.branch_id);

      if (branchMap.has(bId)) {
        const bucket = branchMap.get(bId)!;
        bucket.actual_lead += 1;

        const status = lead.status?.toLowerCase();
        if (["closing", "followup", "hold"].includes(status)) {
          bucket.closing += 1;
          bucket.omset += lead.nominal || 0;
        }
        if (status === "warm") {
          bucket.warm_leads += 1;
        }
      }
    });

    // Convert Map to Array and Calculate Ratios
    const branchBreakdown = Array.from(branchMap.values())
      // Optional: Filter out branches with 0 activity if you want cleaner UI
      // .filter(b => b.total_spend > 0 || b.actual_lead > 0)
      .map((b) => {
        const closing_rate =
          b.actual_lead > 0 ? (b.closing / b.actual_lead) * 100 : 0;
        const ads_vs_omset = b.omset > 0 ? (b.total_spend / b.omset) * 100 : 0;

        return {
          name: b.name,
          budget: b.budget,
          total_spend: Math.round(b.total_spend),
          actual_lead: b.actual_lead,
          closing: b.closing,
          warm_leads: b.warm_leads,
          omset: b.omset,
          closing_rate: `${closing_rate.toFixed(2)}%`,
          ads_vs_omset: `${ads_vs_omset.toFixed(2)}%`,
        };
      });

    // ==========================================
    // LOGIC 3: GLOBAL SUMMARY
    // ==========================================
    const totalBudget = adsData.reduce(
      (acc, curr) => acc + (curr.spend || 0),
      0
    );
    const totalSpend = adsData.reduce(
      (acc, curr) => acc + (curr.total_budget || 0),
      0
    );
    const totalActualLead = leadsData.length;

    const totalClosingLeads = leadsData.filter((lead) =>
      ["closing", "followup", "hold"].includes(lead.status?.toLowerCase())
    );
    const totalClosing = totalClosingLeads.length;
    const totalOmset = totalClosingLeads.reduce(
      (acc, curr) => acc + (curr.nominal || 0),
      0
    );

    const safeTargetLead = Number(target_lead) || 0;
    const safeTargetOmset = Number(target_omset) || 0;

    const responseData = {
      summary: {
        date_range: { start: safeStartDate, end: safeEndDate },
        budget: totalBudget,
        total_spend: Math.round(totalSpend),
        actual_lead: totalActualLead,
        target_lead: safeTargetLead,
        target_vs_actual_leads:
          safeTargetLead > 0
            ? `${((totalActualLead / safeTargetLead) * 100).toFixed(2)}%`
            : "0%",
        closing: totalClosing,
        closing_rate:
          totalActualLead > 0
            ? `${((totalClosing / totalActualLead) * 100).toFixed(2)}%`
            : "0%",
        omset: totalOmset,
        target_omset: safeTargetOmset,
        target_vs_actual_omset:
          safeTargetOmset > 0
            ? `${((totalOmset / safeTargetOmset) * 100).toFixed(2)}%`
            : "0%",
        ads_vs_omset:
          totalOmset > 0
            ? `${((totalSpend / totalOmset) * 100).toFixed(2)}%`
            : "0%",
      },
      daily_breakdown: dailyBreakdown,
      branch_breakdown: branchBreakdown, // <--- NEW FIELD ADDED HERE
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
