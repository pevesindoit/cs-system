import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { ReportItem } from "@/app/types/types";

// ... [Keep Interfaces] ...
interface AdvertiserRow {
  spend: number;
  total_budget: number;
  created_at: string;
  platform_id?: string;
  cabang_id?: string;
}

interface LeadData {
  nominal: number;
  status: string;
  created_at: string;
  platform_id?: string;
  branch_id?: string;
}

interface BranchRow {
  id: string;
  name: string;
}

interface WeeklyMetric {
  start_date: string;
  end_date: string;
  budget: number;
  total_spend: number;
  actual_lead: number;
  closing: number;
  warm_leads: number;
  omset: number;
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

// 1. MAPPING
const PLATFORM_MAPPING: Record<string, string[]> = {
  meta: ["facebook", "instagram"],
  google: ["google"],
  tiktok: ["tiktok"],
  shopee: ["shopee", "shopee ads"],
};

export async function POST(req: NextRequest) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (error) {
      console.log(error);
    }

    const {
      start_date,
      end_date,
      platform_id, // THIS IS A UUID (e.g. "d8c73...")
      target_lead,
      target_omset,
      branch_id,
    } = body as ReportItem;

    // Dates
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    const safeStartDate = start_date || formatDate(thirtyDaysAgo);
    const safeEndDate = end_date || formatDate(now);
    const start = `${safeStartDate} 00:00:00+00`;
    const end = `${safeEndDate} 23:59:59+00`;

    // Queries
    const branchQuery = supabase.from("branch").select("id, name");

    let adsQuery = supabase
      .from("advertiser_data")
      .select("spend, total_budget, platform_id, created_at, cabang_id")
      .gte("created_at", start)
      .lte("created_at", end);

    let leadsQuery = supabase
      .from("leads")
      .select("nominal, status, platform_id, created_at, branch_id")
      .gte("created_at", start)
      .lte("created_at", end);

    // ==========================================
    // 2. FIXED FILTER LOGIC
    // ==========================================

    if (platform_id) {
      // A. Filter Ads: Use UUID directly (works for advertiser_data)
      adsQuery = adsQuery.eq("platform_id", platform_id);

      // B. Filter Leads: Resolve UUID -> Name first
      // 1. Fetch the Name from DB using the UUID
      const { data: platformData } = await supabase
        .from("ads_platform")
        .select("name")
        .eq("id", platform_id)
        .single();

      if (platformData && platformData.name) {
        console.log(platformData.name, "inimi");
        // 2. Normalize name (e.g. "TikTok" -> "tiktok")
        const pNameLower = platformData.name.toLowerCase();

        // 3. Look up mapping using the NAME
        const targetNames = PLATFORM_MAPPING[pNameLower]; // Now this works!

        if (targetNames && targetNames.length > 0) {
          // Filter using the array: ['tiktok'] or ['facebook', 'instagram']
          leadsQuery = leadsQuery.in("platform_id", targetNames);
        } else {
          // Fallback: use the name directly if not in mapping
          leadsQuery = leadsQuery.ilike("platform_id", pNameLower);
        }
      } else {
        // Fallback if UUID not found in DB (rare)
        leadsQuery = leadsQuery.eq("platform_id", platform_id);
      }
    }

    if (branch_id) {
      adsQuery = adsQuery.eq("cabang_id", branch_id);
      leadsQuery = leadsQuery.eq("branch_id", branch_id);
    }

    // --- EXECUTE MAIN QUERIES ---
    const [branchRes, adsRes, leadsRes] = await Promise.all([
      branchQuery,
      adsQuery,
      leadsQuery,
    ]);

    const branches = (branchRes.data || []) as BranchRow[];
    const adsData = (adsRes.data || []) as AdvertiserRow[];
    const leadsData = (leadsRes.data || []) as LeadData[];

    // ==========================================
    // LOGIC: WEEKLY BREAKDOWN
    // ==========================================
    const allWeekKeys = new Set<string>();
    const currentDate = new Date(safeStartDate);
    const lastDate = new Date(safeEndDate);
    while (currentDate <= lastDate) {
      allWeekKeys.add(formatDate(getMonday(currentDate)));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const sortedWeekKeys = Array.from(allWeekKeys).sort();

    const branchMap = new Map<
      string,
      { name: string; weeks: Map<string, WeeklyMetric> }
    >();

    branches.forEach((b) => {
      if (branch_id && String(b.id) !== String(branch_id)) return;
      const weeksMap = new Map<string, WeeklyMetric>();
      sortedWeekKeys.forEach((weekKey) => {
        const monday = new Date(weekKey);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        weeksMap.set(weekKey, {
          start_date: weekKey,
          end_date: formatDate(sunday),
          budget: 0,
          total_spend: 0,
          actual_lead: 0,
          closing: 0,
          warm_leads: 0,
          omset: 0,
        });
      });
      branchMap.set(String(b.id), { name: b.name, weeks: weeksMap });
    });

    adsData.forEach((ad) => {
      if (!ad.cabang_id) return;
      const bData = branchMap.get(String(ad.cabang_id));
      if (bData) {
        const weekKey = formatDate(getMonday(new Date(ad.created_at)));
        const bucket = bData.weeks.get(weekKey);
        if (bucket) {
          bucket.budget += ad.spend || 0;
          bucket.total_spend += ad.total_budget || 0;
        }
      }
    });

    leadsData.forEach((lead) => {
      if (!lead.branch_id) return;
      const bData = branchMap.get(String(lead.branch_id));
      if (bData) {
        const weekKey = formatDate(getMonday(new Date(lead.created_at)));
        const bucket = bData.weeks.get(weekKey);
        if (bucket) {
          bucket.actual_lead += 1;
          const status = lead.status?.toLowerCase();
          if (["closing", "followup", "hold"].includes(status)) {
            bucket.closing += 1;
            bucket.omset += lead.nominal || 0;
          }
          if (status === "warm") bucket.warm_leads += 1;
        }
      }
    });

    const branch_breakdown = Array.from(branchMap.entries()).map(
      ([id, data]) => {
        const weeks = Array.from(data.weeks.values()).map((w, index) => {
          const closing_rate =
            w.actual_lead > 0 ? (w.closing / w.actual_lead) * 100 : 0;
          const ads_vs_omset =
            w.omset > 0 ? (w.total_spend / w.omset) * 100 : 0;
          return {
            week_name: `Week ${index + 1}`,
            date_range: `${w.start_date} - ${w.end_date}`,
            budget: w.budget,
            total_spend: Math.round(w.total_spend),
            actual_lead: w.actual_lead,
            closing: w.closing,
            warm_leads: w.warm_leads,
            omset: w.omset,
            closing_rate: `${closing_rate.toFixed(2)}%`,
            ads_vs_omset: `${ads_vs_omset.toFixed(2)}%`,
          };
        });
        return { branch_id: id, branch_name: data.name, weeks: weeks };
      }
    );

    // --- GLOBAL SUMMARY ---
    const totalBudget = adsData.reduce(
      (acc, curr) => acc + (curr.spend || 0),
      0
    );
    const totalSpend = adsData.reduce(
      (acc, curr) => acc + (curr.total_budget || 0),
      0
    );
    const totalActualLead = leadsData.length;
    const totalClosingLeads = leadsData.filter((l) =>
      ["closing", "followup", "hold"].includes(l.status?.toLowerCase())
    );
    const totalOmset = totalClosingLeads.reduce(
      (acc, curr) => acc + (curr.nominal || 0),
      0
    );
    const safeTargetLead = Number(target_lead) || 0;
    const safeTargetOmset = Number(target_omset) || 0;

    const summary = {
      date_range: { start: safeStartDate, end: safeEndDate },
      budget: totalBudget,
      total_spend: Math.round(totalSpend),
      actual_lead: totalActualLead,
      target_lead: safeTargetLead,
      target_vs_actual_leads:
        safeTargetLead > 0
          ? `${((totalActualLead / safeTargetLead) * 100).toFixed(2)}%`
          : "0%",
      closing: totalClosingLeads.length,
      closing_rate:
        totalActualLead > 0
          ? `${((totalClosingLeads.length / totalActualLead) * 100).toFixed(
              2
            )}%`
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
    };

    return NextResponse.json(
      { data: { summary, branch_breakdown } },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
