import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Destructure parameters
    // Menggunakan fallback body.data || body agar fleksibel
    const { start_date, end_date, branch, cs } = body.data || body;

    const start = `${start_date} 00:00:00+00`;
    const end = `${end_date} 23:59:59+00`;

    // 2. Build the query
    let query = supabase
      .from("leads")
      .select(
        "*, platform:platform_id(name), pic_name:pic_id(name), branch_name:branch_id(name)"
      )
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false });

    // 3. Conditional Filtering
    if (branch) {
      query = query.eq("branch_id", branch);
    }

    if (cs) {
      query = query.eq("user_id", cs);
    }

    // 4. Await the data
    const { data: leads, error: errorLeads } = await query;

    if (errorLeads) {
      return NextResponse.json({ error: errorLeads.message }, { status: 500 });
    }

    // ======== 1. LEADS STATUS COUNT (Summary Cards) ============
    // Kita tetap pertahankan ini untuk summary card di atas grafik
    const initialCounts: Record<string, number> = {
      closed: 0,
      followup: 0,
      los: 0,
      hold: 0,
      warm: 0,
      hot: 0,
    };

    const statusCounts = leads.reduce((acc, lead) => {
      const statusName = lead.status ? lead.status.toLowerCase() : "unknown";
      if (acc[statusName] !== undefined) {
        acc[statusName]++;
      }
      return acc;
    }, initialCounts);

    // ======== 2. DAILY CHART DATA (TOTAL LEADS) ============

    // Step A: Generate all dates (Agar grafik tidak bolong jika ada hari tanpa leads)
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

    // Step B: Init map for DAILY TOTALS
    // Format: { "2023-01-01": 0, "2023-01-02": 0 }
    const dailyCountMap: Record<string, number> = {};

    allDates.forEach((date) => {
      dailyCountMap[date] = 0;
    });

    // Step C: Fill map from leads (Count ALL leads regardless of status)
    leads.forEach((lead) => {
      const date = lead.created_at.split("T")[0];

      // Pastikan tanggal ada dalam range (safety check)
      if (dailyCountMap[date] !== undefined) {
        dailyCountMap[date] += 1;
      }
    });

    // Step D: Build Single Array for Chart
    // Output: [{ date: "2025-12-01", count: 5 }, { date: "2025-12-02", count: 8 }]
    const chartData = allDates.map((date) => ({
      date,
      count: dailyCountMap[date],
    }));

    return NextResponse.json(
      {
        leads,
        statusCounts,
        chartData, // <--- Sekarang kembali menjadi Array tunggal simple
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
