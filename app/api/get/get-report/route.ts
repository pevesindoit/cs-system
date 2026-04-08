import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { ReportItem } from "@/app/types/types";

interface AdvertiserRow {
  omset_target: number;
  spend: number;
  total_budget: number;
  leads: number;
  actual_leads: number;
  created_at: string;
  platform_id?: string;
  cabang_id?: string;
}

interface LeadData {
  status: string;
  created_at: string;
  platform_id?: string;
  branch_id?: string;
  total?: number;
  nominal?: number;
}

interface RealOmsetRow {
  total: number;
  created_at: string;
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
  total_budget: number;
  omset_target: number;
  target_lead: number;
  actual_lead: number;
  closing: number;
  warm_leads: number;
  omset: number;         // From real_omset table
  leads_omset: number;   // From leads table
  google_ads: number;
  meta_ads: number;
  tiktok_ads: number;
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  date.setUTCDate(diff);
  return date;
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

    const { start_date, end_date, platform_id, branch_id, interval = 'week' } = body as ReportItem;

    // Dates
    const now = new Date();
    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const safeStartDate = start_date || formatDate(new Date(now.setDate(now.getDate() - 30)));
    const today = new Date();
    const safeEndDate = end_date || formatDate(today);

    let queryStartStr = safeStartDate;
    let queryEndStr = safeEndDate;

    if (interval === 'week') {
      const s = new Date(safeStartDate);
      queryStartStr = formatDate(getMonday(s));
      const e = new Date(safeEndDate);
      const endMonday = getMonday(e);
      const endSunday = new Date(endMonday);
      endSunday.setUTCDate(endMonday.getUTCDate() + 6);
      queryEndStr = formatDate(endSunday);
    }

    const start = `${queryStartStr} 00:00:00+07`;
    const end = `${queryEndStr} 23:59:59+07`;

    // Queries
    const branchQuery = supabase.from("branch").select("id, name");
    const platformQuery = supabase.from("ads_platform").select("id, name");

    let adsQuery = supabase
      .from("advertiser_data")
      .select("spend, total_budget, leads, actual_leads, platform_id, created_at, cabang_id, omset_target")
      .gte("created_at", start)
      .lte("created_at", end);

    let leadsQuery = supabase
      .from("leads")
      .select("status, platform_id, created_at, branch_id, total, nominal")
      .gte("created_at", start)
      .lte("created_at", end);

    let realOmsetQuery = supabase
      .from("real_omset")
      .select("total, created_at, branch_id")
      .gte("created_at", start)
      .lte("created_at", end);

    // Filters
    if (platform_id) {
      adsQuery = adsQuery.eq("platform_id", platform_id);
      const { data: platformData } = await supabase.from("ads_platform").select("name").eq("id", platform_id).single();
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
      realOmsetQuery = realOmsetQuery.eq("branch_id", branch_id);
    }

    const [branchRes, adsRes, leadsRes, platformRes, realOmsetRes] = await Promise.all([
      branchQuery, adsQuery, leadsQuery, platformQuery, realOmsetQuery,
    ]);

    const branches = (branchRes.data || []) as BranchRow[];
    const adsData = (adsRes.data || []) as AdvertiserRow[];
    const rawLeadsData = (leadsRes.data || []) as LeadData[];
    const leadsData = rawLeadsData.filter(l => l.status?.toLowerCase() !== "hold");
    const platforms = (platformRes.data || []) as PlatformRow[];
    const realOmsetData = (realOmsetRes.data || []) as RealOmsetRow[];

    const platformMap = new Map<string, string>();
    platforms.forEach((p) => platformMap.set(p.id, p.name.toLowerCase()));

    const getKey = (d: Date) => interval === 'day' ? formatDate(d) : formatDate(getMonday(d));

    const allKeys = new Set<string>();
    const currentDate = new Date(safeStartDate);
    const lastDate = new Date(safeEndDate);
    while (currentDate <= lastDate) {
      allKeys.add(getKey(currentDate));
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    const sortedKeys = Array.from(allKeys).sort();

    // Initialize Maps
    const branchMap = new Map<string, { name: string; weeks: Map<string, WeeklyMetric> }>();
    branches.forEach((b) => {
      if (branch_id && String(b.id) !== String(branch_id)) return;
      const weeksMap = new Map<string, WeeklyMetric>();
      sortedKeys.forEach((key) => {
        let endStr = key;
        if (interval === 'week') {
          const m = new Date(key); const s = new Date(m); s.setUTCDate(m.getUTCDate() + 6); endStr = formatDate(s);
        }
        weeksMap.set(key, { start_date: key, end_date: endStr, budget: 0, total_budget: 0, target_lead: 0, omset_target: 0, actual_lead: 0, closing: 0, warm_leads: 0, omset: 0, leads_omset: 0, google_ads: 0, meta_ads: 0, tiktok_ads: 0 });
      });
      branchMap.set(String(b.id), { name: b.name, weeks: weeksMap });
    });

    const globalWeeksMap = new Map<string, WeeklyMetric>();
    sortedKeys.forEach((key) => {
      let endStr = key;
      if (interval === 'week') {
        const m = new Date(key); const s = new Date(m); s.setUTCDate(m.getUTCDate() + 6); endStr = formatDate(s);
      }
      globalWeeksMap.set(key, { start_date: key, end_date: endStr, budget: 0, total_budget: 0, target_lead: 0, omset_target: 0, actual_lead: 0, closing: 0, warm_leads: 0, omset: 0, leads_omset: 0, google_ads: 0, meta_ads: 0, tiktok_ads: 0 });
    });

    // 1. Ads Data
    adsData.forEach((ad) => {
      const key = getKey(new Date(ad.created_at));
      const pName = platformMap.get(ad.platform_id || "") || "";
      const spend = ad.spend || 0;

      const processBucket = (bucket: WeeklyMetric | undefined) => {
        if (!bucket) return;
        bucket.budget += spend;
        bucket.total_budget += ad.total_budget || (spend * 1.11);
        bucket.target_lead += ad.leads || 0;
        bucket.omset_target += ad.omset_target || 0;
        if (interval !== 'day') bucket.actual_lead += ad.actual_leads || 0;
        if (pName.includes("google")) bucket.google_ads += spend;
        else if (pName.includes("facebook") || pName.includes("instagram") || pName.includes("meta")) bucket.meta_ads += spend;
        else if (pName.includes("tiktok")) bucket.tiktok_ads += spend;
      };

      processBucket(globalWeeksMap.get(key));
      if (ad.cabang_id) processBucket(branchMap.get(String(ad.cabang_id))?.weeks.get(key));
    });

    // 2. Leads Data (Now captures leads_omset strictly here)
    leadsData.forEach((lead) => {
      const key = getKey(new Date(lead.created_at));
      const status = lead.status?.toLowerCase();
      const nominalValue = lead.total || 0;

      const processBucket = (bucket: WeeklyMetric | undefined) => {
        if (!bucket) return;
        bucket.leads_omset += nominalValue;
        if (interval === 'day') bucket.actual_lead += 1;
        if (["closing", "followup"].includes(status)) bucket.closing += 1;
        if (status === "warm") bucket.warm_leads += 1;
      };

      processBucket(globalWeeksMap.get(key));
      if (lead.branch_id) processBucket(branchMap.get(String(lead.branch_id))?.weeks.get(key));
    });

    // 3. Real Omset Data
    realOmsetData.forEach((row) => {
      const key = getKey(new Date(row.created_at));
      const processBucket = (bucket: WeeklyMetric | undefined) => {
        if (!bucket) return;
        bucket.omset += row.total || 0;
      };
      processBucket(globalWeeksMap.get(key));
      if (row.branch_id) processBucket(branchMap.get(String(row.branch_id))?.weeks.get(key));
    });

    // Breakdown Computations
    const ads_breakdown = Array.from(globalWeeksMap.values()).map((w, index) => {
      const total_ads = w.google_ads + w.meta_ads + w.tiktok_ads;
      return {
        week: interval === 'day' ? w.start_date : `Week ${index + 1}`,
        budget_iklan: w.budget,
        total_spend: Math.round(w.total_budget || (w.budget * 1.11)),
        target_leads: w.target_lead,
        target_omset: w.omset_target,
        cost_perlead: Math.round(w.actual_lead > 0 ? (w.total_budget || (w.budget * 1.11)) / w.actual_lead : 0),
        google_ads: w.google_ads,
        meta_ads: w.meta_ads,
        tiktok_ads: w.tiktok_ads,
        total_ads: total_ads,
        omset: w.omset,
        leads_omset: w.leads_omset,
        ads_ratio: `${w.omset > 0 ? ((total_ads / w.omset) * 100).toFixed(2) : 0}%`,
      };
    });

    const branch_breakdown = Array.from(branchMap.entries()).map(([id, data]) => {
      const weeks = Array.from(data.weeks.values()).map((w, index) => {
        const total_spend = w.total_budget || (w.budget * 1.11);
        const total_ads = w.google_ads + w.meta_ads + w.tiktok_ads;

        return {
          week_name: interval === 'day' ? w.start_date : `Week ${index + 1}`,
          date_range: interval === 'day' ? w.start_date : `${w.start_date} - ${w.end_date}`,
          budget: w.budget,
          ppn: Math.round(total_spend - w.budget),
          total_spend: Math.round(total_spend),
          target_leads: w.target_lead,
          target_omset: w.omset_target,
          actual_lead: w.actual_lead,
          cost_per_lead: Math.round(w.actual_lead > 0 ? total_spend / w.actual_lead : 0),
          target_vs_actual: `${w.target_lead > 0 ? (w.actual_lead / w.target_lead) * 100 : 0}%`,
          closing: w.closing,
          warm_leads: w.warm_leads,
          omset: w.omset,
          leads_omset: w.leads_omset, // Ensure this passes through!
          closing_rate: `${w.actual_lead > 0 ? (w.closing / w.actual_lead) * 100 : 0}%`,
          ads_vs_omset: `${w.omset > 0 ? (total_spend / w.omset) * 100 : 0}%`,
          google_ads: w.google_ads,
          meta_ads: w.meta_ads,
          tiktok_ads: w.tiktok_ads,
          total_ads: total_ads,
          ads_ratio: `${w.omset > 0 ? ((total_ads / w.omset) * 100).toFixed(2) : 0}%`,
        };
      });
      return { branch_id: id, branch_name: data.name, weeks: weeks };
    });

    // Global Summary
    const totalSpend = adsData.reduce((acc, curr) => acc + (curr.total_budget || (curr.spend || 0) * 1.11), 0);
    const totalTarget = adsData.reduce((acc, curr) => acc + (curr.leads || 0), 0);
    const totalActualLead = interval === 'day' ? leadsData.length : adsData.reduce((acc, curr) => acc + (curr.actual_leads || 0), 0);
    const totalOmsetTarget = adsData.reduce((acc, curr) => acc + (curr.omset_target || 0), 0);
    const totalOmset = realOmsetData.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const totalLeadsOmset = leadsData.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const totalClosingLeads = leadsData.filter((l) => ["closing"].includes(l.status?.toLowerCase())).length;

    const summary = {
      date_range: { start: safeStartDate, end: safeEndDate },
      budget: adsData.reduce((acc, curr) => acc + (curr.spend || 0), 0),
      total_spend: Math.round(totalSpend),
      actual_lead: totalActualLead,
      target_lead: totalTarget,
      omset_target: totalOmsetTarget,
      target_vs_actual_leads: totalTarget > 0 ? `${((totalActualLead / totalTarget) * 100).toFixed(2)}%` : "0%",
      target_vs_actual_omset: totalOmsetTarget > 0 ? `${((totalOmset / totalOmsetTarget) * 100).toFixed(2)}%` : "0%",
      closing: totalClosingLeads,
      warm_leads: leadsData.filter((l) => l.status?.toLowerCase() === "warm").length,
      closing_rate: totalActualLead > 0 ? `${((totalClosingLeads / totalActualLead) * 100).toFixed(2)}%` : "0%",
      omset: totalOmset,
      leads_omset: totalLeadsOmset,
      ads_vs_omset: totalOmset > 0 ? `${((totalSpend / totalOmset) * 100).toFixed(2)}%` : "0%",
    };

    return NextResponse.json({ data: { summary, branch_breakdown, ads: ads_breakdown } }, { status: 200 });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}