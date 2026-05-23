import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { start_date, end_date, branch } = body;

        // ===================================================================
        // QUERY A: Fetch all daily_sales records within the date range
        // Joining with motifs → products and branch
        // ===================================================================
        let salesQuery = supabase
            .from("daily_sales")
            .select(
                `date, total_price, quantity, branch_id,
                motif:sku_id (
                    id,
                    sku,
                    motif_name,
                    product:product_id (
                        id,
                        name
                    )
                ),
                branch:branch_id (
                    id,
                    name
                )`
            )
            .gte("date", start_date)
            .lte("date", end_date)
            .order("date", { ascending: true });

        if (branch) {
            salesQuery = salesQuery.eq("branch_id", branch);
        }

        const { data: rawSales, error: salesError } = await salesQuery;
        if (salesError) throw salesError;

        const sales = rawSales || [];

        // ===================================================================
        // QUERY B: Fetch all branches for filter dropdown
        // ===================================================================
        const { data: branches } = await supabase.from("branch").select("id, name");

        // ===================================================================
        // 1. Build CHART DATA — daily total sales per day
        // ===================================================================
        const generateDateRange = (start: string, end: string): string[] => {
            const dates: string[] = [];
            const startDate = new Date(start);
            const endDate = new Date(end);
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                dates.push(d.toISOString().split("T")[0]);
            }
            return dates;
        };

        const allDates = generateDateRange(start_date, end_date);
        const dailyTotalMap: Record<string, number> = {};
        allDates.forEach((date) => { dailyTotalMap[date] = 0; });

        sales.forEach((row: any) => {
            if (row.date && dailyTotalMap[row.date] !== undefined) {
                dailyTotalMap[row.date] += row.total_price || 0;
            }
        });

        const chartData = allDates.map((date) => ({
            date,
            total: dailyTotalMap[date],
        }));

        // ===================================================================
        // 2. Build TOP PRODUCTS — aggregate by product name
        // ===================================================================
        const productMap: Record<string, { product_name: string; total_price: number; quantity: number; transaction_count: number }> = {};

        sales.forEach((row: any) => {
            const productName = (row.motif as any)?.product?.name || "Unknown Product";
            if (!productMap[productName]) {
                productMap[productName] = { product_name: productName, total_price: 0, quantity: 0, transaction_count: 0 };
            }
            productMap[productName].total_price += row.total_price || 0;
            productMap[productName].quantity += row.quantity || 0;
            productMap[productName].transaction_count += 1;
        });

        const topProducts = Object.values(productMap)
            .sort((a, b) => b.total_price - a.total_price);

        // ===================================================================
        // 3. Build TABLE DATA — daily breakdown per product + branch
        // ===================================================================
        type TableRow = { date: string; product_name: string; branch_name: string; total_price: number; quantity: number; transaction_count: number };
        const tableMap: Record<string, TableRow> = {};

        sales.forEach((row: any) => {
            const productName = (row.motif as any)?.product?.name || "Unknown Product";
            const branchName = (row.branch as any)?.name || "Unknown Branch";
            const key = `${row.date}_${productName}_${branchName}`;

            if (!tableMap[key]) {
                tableMap[key] = {
                    date: row.date,
                    product_name: productName,
                    branch_name: branchName,
                    total_price: 0,
                    quantity: 0,
                    transaction_count: 0,
                };
            }
            tableMap[key].total_price += row.total_price || 0;
            tableMap[key].quantity += row.quantity || 0;
            tableMap[key].transaction_count += 1;
        });

        const tableData = Object.values(tableMap).sort((a, b) =>
            a.date > b.date ? -1 : a.date < b.date ? 1 : 0
        );

        // ===================================================================
        // RETURN
        // ===================================================================
        return NextResponse.json(
            {
                chartData,
                topProducts,
                tableData,
                branches: branches || [],
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error("API Error [get-daily-sales]:", err);
        return NextResponse.json(
            { error: "Internal Server Error", details: err?.message },
            { status: 500 }
        );
    }
}
