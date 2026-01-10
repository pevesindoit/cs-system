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
      page = 1, // Default to page 1
      limit = 10, // Default to 10 items per page
    } = body.data || body;

    const start = `${start_date} 00:00:00+00`;
    const end = `${end_date} 23:59:59+00`;

    // =========================================================================
    // QUERY A: LEAD DATA (Global Date/Branch/CS Filters - ALL Statuses)
    // =========================================================================
    // NOTE: We fetch ALL data first to ensure Charts & Stats are accurate for the whole period.
    let query = supabase
      .from("leads")
      .select(
        "*, platform:platform_id(name), pic_name:pic_id(name), branch_name:branch_id(name)"
      )
      .gte("updated_at", start)
      .lte("updated_at", end)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (branch) query = query.eq("branch_id", branch);
    if (cs) query = query.eq("user_id", cs);

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
    // EXECUTE QUERIES PARALLEL
    // =========================================================================
    const [leadsResult, agentsResult] = await Promise.all([query, agentsQuery]);

    const allLeads = leadsResult.data || [];
    const agents = agentsResult.data || [];

    if (leadsResult.error) {
      return NextResponse.json(
        { error: leadsResult.error.message },
        { status: 500 }
      );
    }

    // =========================================================================
    // 1. LEADS STATUS COUNT (Based on ALL leads - Unfiltered by status)
    // =========================================================================
    const initialCounts: Record<string, number> = {
      closing: 0,
      followup: 0,
      los: 0,
      hold: 0,
      warm: 0,
      hot: 0,
    };

    const statusCounts = allLeads.reduce((acc, lead) => {
      const statusName = lead.status ? lead.status.toLowerCase() : "unknown";
      if (acc[statusName] !== undefined) acc[statusName]++;
      return acc;
    }, initialCounts);

    // =========================================================================
    // 2. SC PERFORMANCE (Nominal Closing per CS)
    // =========================================================================
    const scPerformance = agents.map((agent) => {
      const agentClosingLeads = allLeads.filter(
        (lead) => lead.user_id === agent.id && lead.status === "closing"
      );
      const totalNominal = agentClosingLeads.reduce(
        (sum, lead) => sum + (Number(lead.nominal) || 0),
        0
      );

      return {
        name: agent.name,
        user_id: agent.id,
        total_nominal: totalNominal,
        closing_count: agentClosingLeads.length,
      };
    });

    scPerformance.sort((a, b) => b.total_nominal - a.total_nominal);

    // =========================================================================
    // 3. FILTER DATA (Apply specific Status filter if requested)
    // =========================================================================
    let filteredLeads = allLeads;

    if (status) {
      filteredLeads = allLeads.filter((lead) => lead.status === status);
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
    // 5. PAGINATION LOGIC (New Section)
    // =========================================================================
    // We slice the `filteredLeads` array based on page and limit

    const pageInt = parseInt(page as string);
    const limitInt = parseInt(limit as string);

    const startIndex = (pageInt - 1) * limitInt;
    const endIndex = startIndex + limitInt;

    // The leads to show on the current page
    const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

    // Pagination Metadata
    const pagination = {
      totalItems: filteredLeads.length,
      totalPages: Math.ceil(filteredLeads.length / limitInt),
      currentPage: pageInt,
      limit: limitInt,
    };

    // =========================================================================
    // RETURN RESPONSE
    // =========================================================================
    return NextResponse.json(
      {
        leads: paginatedLeads, // RETURN ONLY PAGINATED LIST
        pagination, // RETURN META DATA FOR FRONTEND
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
