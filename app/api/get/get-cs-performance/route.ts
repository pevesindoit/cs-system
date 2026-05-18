import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Destructure parameters (Added page & limit)
    const {
      start_date,
      end_date,
      branch,
      cs,
      status,
      keterangan,
      page = 1, // Default to page 1
      limit = 10, // Default to 10 items per page
    } = body.data || body;

    const start = `${start_date} 00:00:00+00`;
    const end = `${end_date} 23:59:59+00`;

    const pageInt = parseInt(page as string);
    const limitInt = parseInt(limit as string);
    const startIndex = (pageInt - 1) * limitInt;
    const endIndex = startIndex + limitInt - 1;

    // =========================================================================
    // QUERY A: PAGINATED LEAD DATA (WITH RELATIONS)
    // =========================================================================
    let paginatedQuery = supabase
      .from("leads")
      .select(
        "*, platform:platform_id(name), pic_name:pic_id(name), branch_name:branch_id(name)",
        { count: "exact" }
      )
      .gte("updated_at", start)
      .lte("updated_at", end)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .range(startIndex, endIndex);

    if (branch) paginatedQuery = paginatedQuery.eq("branch_id", branch);
    if (cs) paginatedQuery = paginatedQuery.eq("user_id", cs);
    if (keterangan) paginatedQuery = paginatedQuery.eq("keterangan_leads_id", keterangan);
    if (status) paginatedQuery = paginatedQuery.ilike("status", status);

    // =========================================================================
    // QUERY B: USER DATA (Sales Consultants - Type 1)
    // =========================================================================
    let agentsQuery = supabase
      .from("users")
      .select("id, name")
      .eq("type_id", 1);

    if (branch) agentsQuery = agentsQuery.eq("branch_id", branch);
    if (cs) agentsQuery = agentsQuery.eq("id", cs);

    // =========================================================================
    // HELPER C: FETCH ALL LEADS FOR STATS & CHARTS (Unlimited)
    // =========================================================================
    const fetchAllStats = async () => {
      let allData: any[] = [];
      let offset = 0;
      const fetchLimit = 1000;
      while (true) {
        let q = supabase
          .from("leads")
          .select("id, status, updated_at")
          .gte("updated_at", start)
          .lte("updated_at", end)
          .order("updated_at", { ascending: false })
          .range(offset, offset + fetchLimit - 1);
        
        if (branch) q = q.eq("branch_id", branch);
        if (cs) q = q.eq("user_id", cs);
        if (keterangan) q = q.eq("keterangan_leads_id", keterangan);

        const { data, error } = await q;
        if (error) throw error;
        allData.push(...(data || []));
        if (!data || data.length < fetchLimit) break;
        offset += fetchLimit;
      }
      return allData;
    };

    // =========================================================================
    // HELPER D: FETCH ALL PERFORMANCE (Unlimited)
    // =========================================================================
    const fetchAllPerformance = async () => {
      let allData: any[] = [];
      let offset = 0;
      const fetchLimit = 1000;
      while (true) {
        let q = supabase
          .from("leads")
          .select("user_id, nominal")
          .gte("updated_at", start)
          .lte("updated_at", end)
          .ilike("status", "closing")
          .order("updated_at", { ascending: false })
          .range(offset, offset + fetchLimit - 1);
          
        if (branch) q = q.eq("branch_id", branch);
        if (cs) q = q.eq("user_id", cs);
        if (keterangan) q = q.eq("keterangan_leads_id", keterangan);

        const { data, error } = await q;
        if (error) throw error;
        allData.push(...(data || []));
        if (!data || data.length < fetchLimit) break;
        offset += fetchLimit;
      }
      return allData;
    };

    // =========================================================================
    // EXECUTE QUERIES PARALLEL
    // =========================================================================
    const [paginatedResult, agentsResult, allStatsLeads, performanceLeads] = await Promise.all([
      paginatedQuery,
      agentsQuery,
      fetchAllStats(),
      fetchAllPerformance(),
    ]);

    if (paginatedResult.error) {
      return NextResponse.json(
        { error: paginatedResult.error.message },
        { status: 500 }
      );
    }

    const paginatedLeads = paginatedResult.data || [];
    const totalCount = paginatedResult.count || 0;
    const agents = agentsResult.data || [];

    // =========================================================================
    // 1. LEADS STATUS COUNT (Based on ALL leads - Unfiltered by status)
    // =========================================================================
    const initialCounts: Record<string, number> = {
      closing: 0,
      followup: 0,
      survey: 0,
      los: 0,
      hold: 0,
      warm: 0,
      hot: 0,
    };

    const statusCounts = allStatsLeads.reduce((acc, lead) => {
      const statusName = lead.status ? lead.status.toLowerCase() : "unknown";
      if (acc[statusName] !== undefined) acc[statusName]++;
      return acc;
    }, initialCounts);

    // =========================================================================
    // 2. SC PERFORMANCE (Nominal Closing per CS)
    // =========================================================================
    const scPerformance = agents.map((agent) => {
      const agentClosingLeads = performanceLeads.filter(
        (lead) => lead.user_id === agent.id
      );

      const totalNominal = agentClosingLeads.reduce((sum, lead) => {
        const nominal = Number(lead.nominal);
        return sum + (isNaN(nominal) ? 0 : nominal);
      }, 0);

      return {
        name: agent.name,
        user_id: agent.id,
        total_nominal: totalNominal,
        closing_count: agentClosingLeads.length,
      };
    });

    scPerformance.sort((a, b) => b.total_nominal - a.total_nominal);

    // =========================================================================
    // 3. FILTER DATA FOR CHARTS (Apply specific Status filter if requested)
    // =========================================================================
    let filteredLeads = allStatsLeads;
    if (status) {
      filteredLeads = allStatsLeads.filter(
        (lead) => lead.status?.toLowerCase() === status.toLowerCase()
      );
    }

    // =========================================================================
    // 4. DAILY CHART DATA (Based on FILTERED leads)
    // =========================================================================
    const generateDateRange = (start: string, end: string): string[] => {
      const dates: string[] = [];
      const startDate = new Date(start);
      const endDate = new Date(end);
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(d.toISOString().split("T")[0]);
      }
      return dates;
    };

    const allDates = generateDateRange(start_date, end_date);
    const dailyCountMap: Record<string, number> = {};
    allDates.forEach((date) => {
      dailyCountMap[date] = 0;
    });

    filteredLeads.forEach((lead) => {
      const date = lead.updated_at.split("T")[0];
      if (dailyCountMap[date] !== undefined) dailyCountMap[date] += 1;
    });

    const chartData = allDates.map((date) => ({
      date,
      count: dailyCountMap[date],
    }));

    // =========================================================================
    // 5. PAGINATION LOGIC
    // =========================================================================
    const pagination = {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limitInt),
      currentPage: pageInt,
      limit: limitInt,
    };

    // =========================================================================
    // RETURN RESPONSE
    // =========================================================================
    return NextResponse.json(
      {
        leads: paginatedLeads,
        pagination,
        statusCounts,
        chartData,
        scPerformance,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err },
      { status: 500 }
    );
  }
}
