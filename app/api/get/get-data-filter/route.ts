import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Destructure parameters
    const { start_date, end_date, branch, cs, status } = body.data || body;

    const start = `${start_date} 00:00:00+00`;
    const end = `${end_date} 23:59:59+00`;

    // 2. Build the query (GLOBAL FILTERS ONLY: Date, Branch, CS)
    // We do NOT add the status filter here. We need all statuses to calculate the counts.
    let query = supabase
      .from("leads")
      .select(
        "*, platform:platform_id(name), pic_name:pic_id(name), branch_name:branch_id(name)"
      )
      .gte("updated_at", start)
      .lte("updated_at", end)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    // 3. Conditional Filtering (Global Context)
    if (branch) {
      query = query.eq("branch_id", branch);
    }

    if (cs) {
      query = query.eq("user_id", cs);
    }

    // NOTE: We removed the `status` filter from the SQL query here!

    // 4. Await the data (This is the "All Statuses" dataset)
    const { data: allLeads, error: errorLeads } = await query;

    if (errorLeads) {
      return NextResponse.json({ error: errorLeads.message }, { status: 500 });
    }

    // ======== 1. LEADS STATUS COUNT (Based on ALL leads) ============
    // We calculate this BEFORE filtering by status, so the counts remain correct
    // even if the user selects a specific status filter.
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
      if (acc[statusName] !== undefined) {
        acc[statusName]++;
      }
      return acc;
    }, initialCounts);

    // ======== FILTER DATA FOR RESPONSE ============
    // Now we apply the status filter manually in JavaScript for the List and Chart
    let filteredLeads = allLeads;

    if (status) {
      filteredLeads = allLeads.filter((lead) => lead.status === status);
    }

    // ======== 2. DAILY CHART DATA (Based on FILTERED leads) ============

    // Step A: Generate all dates
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

    // Step B: Init map
    const dailyCountMap: Record<string, number> = {};
    allDates.forEach((date) => {
      dailyCountMap[date] = 0;
    });

    // Step C: Fill map using FILTERED leads
    // The chart will reflect the selected status (e.g., only show "Closed" trends)
    filteredLeads.forEach((lead) => {
      const date = lead.updated_at.split("T")[0];
      if (dailyCountMap[date] !== undefined) {
        dailyCountMap[date] += 1;
      }
    });

    // Step D: Build Chart Array
    const chartData = allDates.map((date) => ({
      date,
      count: dailyCountMap[date],
    }));

    return NextResponse.json(
      {
        leads: filteredLeads, // Filtered list
        statusCounts, // Unfiltered counts (Total context)
        chartData, // Filtered chart
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
