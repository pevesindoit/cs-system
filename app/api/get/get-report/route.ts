import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { ReportItem } from "@/app/types/types";

interface AdvertiserRow {
  omset_target: number;
  spend: number;
  total_budget: number;
  leads: number;
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

interface PlatformRow {
  id: string;
  name: string;
}

interface WeeklyMetric {
  start_date: string;
  end_date: string;
  budget: number;
  omset_target: number;
  target_lead: number;
  actual_lead: number;
  closing: number;
  warm_leads: number;
  omset: number;
  // New fields for platform breakdown
  google_ads: number;
  meta_ads: number;
  tiktok_ads: number;
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

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

    const { start_date, end_date, platform_id, branch_id } = body as ReportItem;

    // Dates
    const now = new Date();
    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    // Default to last 30 days if no date provided
    const safeStartDate =
      start_date || formatDate(new Date(now.setDate(now.getDate() - 30)));
    // Reset 'now' for end date usage
    const today = new Date();
    const safeEndDate = end_date || formatDate(today);

    const start = `${safeStartDate} 00:00:00+00`;
    const end = `${safeEndDate} 23:59:59+00`;

    // Queries
    const branchQuery = supabase.from("branch").select("id, name");
    // NEW: Fetch platforms to map IDs to Names for the breakdown
    const platformQuery = supabase.from("ads_platform").select("id, name");

    // --- FIX 1: Added 'omset_target' to the select query below ---
    let adsQuery = supabase
      .from("advertiser_data")
      .select(
        "spend, total_budget, leads, platform_id, created_at, cabang_id, omset_target"
      )
      .gte("created_at", start)
      .lte("created_at", end);

    let leadsQuery = supabase
      .from("leads")
      .select("nominal, status, platform_id, created_at, branch_id")
      .gte("created_at", start)
      .lte("created_at", end);

    // ==========================================
    // FILTER LOGIC
    // ==========================================
    if (platform_id) {
      adsQuery = adsQuery.eq("platform_id", platform_id);

      // If filtering by specific platform, we need to handle the "child" platforms (e.g. Meta -> FB/IG)
      const { data: platformData } = await supabase
        .from("ads_platform")
        .select("name")
        .eq("id", platform_id)
        .single();

      if (platformData && platformData.name) {
        const pNameLower = platformData.name.toLowerCase();
        const targetNames = PLATFORM_MAPPING[pNameLower];

        if (targetNames && targetNames.length > 0) {
          leadsQuery = leadsQuery.in("platform_id", targetNames);
        } else {
          leadsQuery = leadsQuery.ilike("platform_id", pNameLower);
        }
      } else {
        leadsQuery = leadsQuery.eq("platform_id", platform_id);
      }
    }

    if (branch_id) {
      adsQuery = adsQuery.eq("cabang_id", branch_id);
      leadsQuery = leadsQuery.eq("branch_id", branch_id);
    }

    // --- EXECUTE MAIN QUERIES ---
    const [branchRes, adsRes, leadsRes, platformRes] = await Promise.all([
      branchQuery,
      adsQuery,
      leadsQuery,
      platformQuery,
    ]);

    const branches = (branchRes.data || []) as BranchRow[];
    const adsData = (adsRes.data || []) as AdvertiserRow[];
    const leadsData = (leadsRes.data || []) as LeadData[];
    const platforms = (platformRes.data || []) as PlatformRow[];
    console.log(adsData, "ini bede");

    // Create a lookup map for Platform ID -> Name
    const platformMap = new Map<string, string>();
    platforms.forEach((p) => platformMap.set(p.id, p.name.toLowerCase()));

    // ==========================================
    // LOGIC: WEEKLY BREAKDOWN
    // ==========================================
    const allWeekKeys = new Set<string>();
    const currentDate = new Date(safeStartDate);
    const lastDate = new Date(safeEndDate);

    // Generate all weeks in range
    while (currentDate <= lastDate) {
      allWeekKeys.add(formatDate(getMonday(currentDate)));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const sortedWeekKeys = Array.from(allWeekKeys).sort();

    // 1. Initialize Branch Map
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
          target_lead: 0,
          omset_target: 0,
          actual_lead: 0,
          closing: 0,
          warm_leads: 0,
          omset: 0,
          google_ads: 0,
          meta_ads: 0,
          tiktok_ads: 0,
        });
      });
      branchMap.set(String(b.id), { name: b.name, weeks: weeksMap });
    });

    // 2. Initialize GLOBAL Map for the separate 'ads' table
    const globalWeeksMap = new Map<string, WeeklyMetric>();
    sortedWeekKeys.forEach((weekKey) => {
      const monday = new Date(weekKey);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      globalWeeksMap.set(weekKey, {
        start_date: weekKey,
        end_date: formatDate(sunday),
        budget: 0,
        target_lead: 0,
        omset_target: 0,
        actual_lead: 0,
        closing: 0,
        warm_leads: 0,
        omset: 0,
        google_ads: 0,
        meta_ads: 0,
        tiktok_ads: 0,
      });
    });

    // 3. AGGREGATE ADS DATA (Fill Branch Map AND Global Map)
    adsData.forEach((ad) => {
      const weekKey = formatDate(getMonday(new Date(ad.created_at)));
      const pName = platformMap.get(ad.platform_id || "") || "";
      const spend = ad.spend || 0;

      // Update Global Map
      const globalBucket = globalWeeksMap.get(weekKey);
      if (globalBucket) {
        if (pName.includes("google")) globalBucket.google_ads += spend;
        else if (
          pName.includes("facebook") ||
          pName.includes("instagram") ||
          pName.includes("meta")
        )
          globalBucket.meta_ads += spend;
        else if (pName.includes("tiktok")) globalBucket.tiktok_ads += spend;
      }

      // Update Branch Map
      if (!ad.cabang_id) return;
      const bData = branchMap.get(String(ad.cabang_id));
      if (bData) {
        const bucket = bData.weeks.get(weekKey);
        if (bucket) {
          bucket.budget += spend;
          bucket.target_lead += ad.leads || 0;
          // --- FIX 2: Added accumulation for target_omset here ---
          bucket.omset_target += ad.omset_target || 0;

          if (pName.includes("google")) bucket.google_ads += spend;
          else if (
            pName.includes("facebook") ||
            pName.includes("instagram") ||
            pName.includes("meta")
          )
            bucket.meta_ads += spend;
          else if (pName.includes("tiktok")) bucket.tiktok_ads += spend;
        }
      }
    });

    // 4. AGGREGATE LEADS DATA (Fill Branch Map AND Global Map)
    leadsData.forEach((lead) => {
      const weekKey = formatDate(getMonday(new Date(lead.created_at)));

      // Update Global Map (only Omset needed for ratio)
      const globalBucket = globalWeeksMap.get(weekKey);
      if (globalBucket) {
        const status = lead.status?.toLowerCase();
        if (["closing", "followup", "hold"].includes(status)) {
          globalBucket.omset += lead.nominal || 0;
        }
      }

      // Update Branch Map
      if (!lead.branch_id) return;
      const bData = branchMap.get(String(lead.branch_id));
      if (bData) {
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

    // 5. CALCULATE FINAL GLOBAL ADS BREAKDOWN
    const ads_breakdown = Array.from(globalWeeksMap.values()).map(
      (w, index) => {
        const total_ads = w.google_ads + w.meta_ads + w.tiktok_ads;
        const ads_ratio = w.omset > 0 ? (total_ads / w.omset) * 100 : 0;

        return {
          week: `Week ${index + 1}`, // requested key: 'week'
          google_ads: w.google_ads,
          meta_ads: w.meta_ads,
          tiktok_ads: w.tiktok_ads,
          total_ads: total_ads,
          omset: w.omset,
          ads_ratio: `${ads_ratio.toFixed(2)}%`,
        };
      }
    );

    // 6. CALCULATE BRANCH BREAKDOWN (Existing Logic)
    const branch_breakdown = Array.from(branchMap.entries()).map(
      ([id, data]) => {
        const weeks = Array.from(data.weeks.values()).map((w, index) => {
          // Standard Metrics
          const budget = w.budget;
          const ppn = budget * 0.11;
          const total_spend = budget + ppn;

          const actual_lead = w.actual_lead;
          const target_lead = w.target_lead;
          const target_omset = w.omset_target;

          const closing_rate =
            actual_lead > 0 ? (w.closing / actual_lead) * 100 : 0;
          const ads_vs_omset = w.omset > 0 ? (total_spend / w.omset) * 100 : 0;
          const cost_per_lead = actual_lead > 0 ? total_spend / actual_lead : 0;
          const target_vs_actual =
            target_lead > 0 ? (actual_lead / target_lead) * 100 : 0;

          // NEW METRICS FOR BRANCH
          const total_ads = w.google_ads + w.meta_ads + w.tiktok_ads;
          const ads_ratio = w.omset > 0 ? (total_ads / w.omset) * 100 : 0;

          return {
            week_name: `Week ${index + 1}`,
            date_range: `${w.start_date} - ${w.end_date}`,
            budget: budget,
            ppn: Math.round(ppn),
            total_spend: Math.round(total_spend),
            target_leads: target_lead,
            // --- FIX 3: Passed target_omset here (it was already here but was 0) ---
            target_omset: target_omset,
            actual_lead: actual_lead,
            cost_per_lead: Math.round(cost_per_lead),
            target_vs_actual: `${target_vs_actual.toFixed(2)}%`,
            closing: w.closing,
            warm_leads: w.warm_leads,
            omset: w.omset,
            closing_rate: `${closing_rate.toFixed(2)}%`,
            ads_vs_omset: `${ads_vs_omset.toFixed(2)}%`,

            // New Requested Fields for Branch
            google_ads: w.google_ads,
            meta_ads: w.meta_ads,
            tiktok_ads: w.tiktok_ads,
            total_ads: total_ads,
            ads_ratio: `${ads_ratio.toFixed(2)}%`,
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
    // This will now work correctly because omset_target is in adsData
    const totalOmsetTarget = adsData.reduce(
      (acc, curr) => acc + (curr.omset_target || 0),
      0
    );
    const totalTarget = adsData.reduce(
      (acc, curr) => acc + (curr.leads || 0),
      0
    );
    const totalPPN = totalBudget * 0.11;
    const grandTotalSpend = totalBudget + totalPPN;

    const totalActualLead = leadsData.length;
    const totalClosingLeads = leadsData.filter((l) =>
      ["closing", "followup", "hold"].includes(l.status?.toLowerCase())
    );
    const totalOmset = totalClosingLeads.reduce(
      (acc, curr) => acc + (curr.nominal || 0),
      0
    );

    const summary = {
      date_range: { start: safeStartDate, end: safeEndDate },
      budget: totalBudget,
      total_spend: Math.round(grandTotalSpend),
      actual_lead: totalActualLead,
      target_lead: totalTarget,
      omset_target: totalOmsetTarget,
      target_vs_actual_leads:
        totalTarget > 0
          ? `${((totalActualLead / totalTarget) * 100).toFixed(2)}%`
          : "0%",
      closing: totalClosingLeads.length,
      closing_rate:
        totalActualLead > 0
          ? `${((totalClosingLeads.length / totalActualLead) * 100).toFixed(
              2
            )}%`
          : "0%",
      omset: totalOmset,
      ads_vs_omset:
        totalOmset > 0
          ? `${((grandTotalSpend / totalOmset) * 100).toFixed(2)}%`
          : "0%",
    };

    return NextResponse.json(
      { data: { summary, branch_breakdown, ads: ads_breakdown } },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error generating report:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
