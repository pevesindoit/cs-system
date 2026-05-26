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
        //    Each row also carries a `skus` array for the expandable detail
        // ===================================================================
        type SkuDetail = { 
            sku: string; 
            motif_name: string; 
            quantity: number; 
            total_price: number;
            history?: { date: string; branch_name: string; quantity: number; total_price: number }[];
        };
        type TableRow = {
            date: string;
            product_name: string;
            branch_name: string;
            total_price: number;
            quantity: number;
            transaction_count: number;
            skus: SkuDetail[];
        };
        const tableMap: Record<string, TableRow> = {};

        sales.forEach((row: any) => {
            const productName = (row.motif as any)?.product?.name || "Unknown Product";
            const branchName  = (row.branch as any)?.name           || "Unknown Branch";
            const skuCode     = (row.motif as any)?.sku             || "UNKNOWN";
            const motifName   = (row.motif as any)?.motif_name      || skuCode;
            const key = `${row.date}_${productName}_${branchName}`;

            if (!tableMap[key]) {
                tableMap[key] = {
                    date: row.date,
                    product_name: productName,
                    branch_name: branchName,
                    total_price: 0,
                    quantity: 0,
                    transaction_count: 0,
                    skus: [],
                };
            }

            const entry = tableMap[key];
            entry.total_price      += row.total_price || 0;
            entry.quantity         += row.quantity    || 0;
            entry.transaction_count += 1;

            // Accumulate SKU-level data inside this row
            const existing = entry.skus.find((s) => s.sku === skuCode);
            if (existing) {
                existing.quantity    += row.quantity    || 0;
                existing.total_price += row.total_price || 0;
            } else {
                entry.skus.push({
                    sku: skuCode,
                    motif_name: motifName,
                    quantity: row.quantity    || 0,
                    total_price: row.total_price || 0,
                });
            }
        });

        // Sort SKUs inside each row: best seller (qty) first
        const tableData = Object.values(tableMap).map((row) => ({
            ...row,
            skus: row.skus.sort((a, b) => b.quantity - a.quantity),
        })).sort((a, b) =>
            a.date > b.date ? -1 : a.date < b.date ? 1 : 0
        );


        // ===================================================================
        // 4. Build PRODUCT RANKING — one row per product across full date range
        //    sorted by transaction_count descending
        // ===================================================================
        type ProductRankRow = {
            product_name: string;
            total_price: number;
            quantity: number;
            transaction_count: number;
            skus: SkuDetail[];
        };
        const rankMap: Record<string, ProductRankRow> = {};

        sales.forEach((row: any) => {
            const productName = (row.motif as any)?.product?.name || "Unknown Product";
            const skuCode     = (row.motif as any)?.sku             || "UNKNOWN";
            const motifName   = (row.motif as any)?.motif_name      || skuCode;
            const branchName  = (row.branch as any)?.name           || "Unknown Branch";

            if (!rankMap[productName]) {
                rankMap[productName] = {
                    product_name: productName,
                    total_price: 0,
                    quantity: 0,
                    transaction_count: 0,
                    skus: [],
                };
            }

            const entry = rankMap[productName];
            entry.total_price       += row.total_price || 0;
            entry.quantity          += row.quantity    || 0;
            entry.transaction_count += 1;

            let existingSku = entry.skus.find((s) => s.sku === skuCode);
            if (!existingSku) {
                existingSku = {
                    sku: skuCode,
                    motif_name: motifName,
                    quantity: 0,
                    total_price: 0,
                    history: [],
                };
                entry.skus.push(existingSku);
            }

            existingSku.quantity    += row.quantity    || 0;
            existingSku.total_price += row.total_price || 0;
            existingSku.history?.push({
                date: row.date,
                branch_name: branchName,
                quantity: row.quantity || 0,
                total_price: row.total_price || 0,
            });
        });

        const productRanking = Object.values(rankMap)
            .map((p) => {
                const skus = p.skus.map(s => ({
                    ...s,
                    history: s.history?.sort((a, b) => (a.date > b.date ? -1 : 1))
                })).sort((a, b) => b.quantity - a.quantity);
                return { ...p, skus };
            })
            .sort((a, b) => b.transaction_count - a.transaction_count);

        // ===================================================================
        // RETURN
        // ===================================================================
        return NextResponse.json(
            {
                chartData,
                topProducts,
                tableData,
                productRanking,
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
