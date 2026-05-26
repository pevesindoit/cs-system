import { NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import supabase from "@/lib/db";
import { toZonedTime, format } from 'date-fns-tz';
import { subDays, isMonday } from 'date-fns';

export const maxDuration = 60;

export async function GET(request: Request) {
    try {
        const timeZone = 'Asia/Jakarta';
        const nowWIB = toZonedTime(new Date(), timeZone);

        // Accurate Authentication
        const currentTimestamp = format(nowWIB, 'dd/MM/yyyy HH:mm:ss', { timeZone });
        const secretKey = process.env.ACCURATE_SIGNATURE || '';
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(currentTimestamp)
            .digest('base64');

        const headers = {
            'Authorization': `Bearer ${process.env.ACCURATE_TOKEN}`,
            'X-Api-Timestamp': currentTimestamp,
            'X-Api-Signature': signature
        };

        // Date definitions
        const { searchParams } = new URL(request.url);
        const manualDate = searchParams.get('date'); // Optional override: YYYY-MM-DD

        let targetDateWIB: Date;
        if (manualDate && /^\d{4}-\d{2}-\d{2}$/.test(manualDate)) {
            // Parse the manually selected date in WIB timezone
            targetDateWIB = toZonedTime(new Date(`${manualDate}T00:00:00`), timeZone);
        } else {
            // Default: yesterday, or Saturday when today is Monday
            const checkMonday = isMonday(nowWIB);
            targetDateWIB = subDays(nowWIB, checkMonday ? 2 : 1);
        }

        const filterDateAccurate = format(targetDateWIB, 'dd/MM/yyyy', { timeZone });
        const supabaseDate = format(targetDateWIB, 'yyyy-MM-dd', { timeZone }); // Format for Supabase 'date' column

        // 1. Fetch Sales Order List
        const listUrl = 'https://iris.accurate.id/accurate/api/sales-order/list.do';
        const listResponse = await axios.get(listUrl, {
            params: {
                'filter.transDate.val': filterDateAccurate,
                'filter.transDate.op': 'EQUAL',
                'sp.pageSize': 100,
                'sp.page': 1,
                'fields': 'id,number,branch'
            },
            headers
        });

        const salesOrders = listResponse.data.d || [];
        const extractedItems: any[] = [];

        // 2. Fetch Details and Extract Raw Items
        for (const order of salesOrders) {
            const rawBranchName = order.branch?.name || "Unknown Branch";
            const branchName = rawBranchName.replace("PEVESINDO CABANG ", "").trim().toUpperCase();

            try {
                const detailResponse = await axios.get('https://iris.accurate.id/accurate/api/sales-order/detail.do', {
                    params: { id: order.id },
                    headers
                });

                const detailItems = detailResponse.data.d?.detailItem || [];

                for (const row of detailItems) {
                    extractedItems.push({
                        branchName,
                        productName: row.item?.name?.trim() || 'Unknown Product',
                        motifSku: row.item?.no?.trim() || 'UNKNOWN_SKU',
                        quantity: row.quantity || 0,
                        totalPrice: row.totalPrice || 0
                    });
                }
            } catch (err) {
                console.error(`Failed to fetch detail for SO ID: ${order.id}`);
            }
        }

        // ---------------------------------------------------------
        // 3. SUPABASE SYNC & UPSERT LOGIC
        // ---------------------------------------------------------

        // A. Load Branches map
        const { data: dbBranches, error: branchError } = await supabase.from('branch').select('id, name');
        if (branchError) throw branchError;

        const branchMap = new Map(dbBranches.map((b: any) => [b.name.trim().toUpperCase(), b.id]));

        // B. Upsert Products
        const uniqueProductNames = [...new Set(extractedItems.map(i => i.productName))];
        const { data: existingProducts } = await supabase.from('products').select('id, name').in('name', uniqueProductNames);
        const productMap = new Map((existingProducts || []).map((p: any) => [p.name, p.id]));

        const missingProducts = uniqueProductNames.filter(name => !productMap.has(name));
        if (missingProducts.length > 0) {
            const { data: newProducts, error: productInsertErr } = await supabase
                .from('products')
                .insert(missingProducts.map(name => ({ name })))
                .select('id, name');

            if (productInsertErr) throw productInsertErr;
            newProducts?.forEach(p => productMap.set(p.name, p.id));
        }

        // C. Upsert Motifs
        const uniqueMotifsMap = new Map();
        extractedItems.forEach(item => {
            if (!uniqueMotifsMap.has(item.motifSku)) {
                uniqueMotifsMap.set(item.motifSku, {
                    sku: item.motifSku,
                    motif_name: item.motifSku, // Using SKU as Motif name fallback
                    product_id: productMap.get(item.productName)
                });
            }
        });

        const motifSkus = Array.from(uniqueMotifsMap.keys());
        const { data: existingMotifs } = await supabase.from('motifs').select('id, sku').in('sku', motifSkus);
        const motifMap = new Map((existingMotifs || []).map((m: any) => [m.sku, m.id]));

        const missingMotifs = Array.from(uniqueMotifsMap.values()).filter(m => !motifMap.has(m.sku));
        if (missingMotifs.length > 0) {
            const { data: newMotifs, error: motifInsertErr } = await supabase
                .from('motifs')
                .insert(missingMotifs)
                .select('id, sku');

            if (motifInsertErr) throw motifInsertErr;
            newMotifs?.forEach(m => motifMap.set(m.sku, m.id));
        }

        // D. Aggregate Data for Daily Sales Table
        const aggregatedSales = new Map();

        extractedItems.forEach(item => {
            const branchId = branchMap.get(item.branchName);
            const skuId = motifMap.get(item.motifSku);

            if (!branchId || !skuId) return; // Skip if branch isn't in DB

            const key = `${branchId}_${skuId}`;
            if (!aggregatedSales.has(key)) {
                aggregatedSales.set(key, {
                    date: supabaseDate,
                    branch_id: branchId,
                    sku_id: skuId,
                    total_price: 0,
                    quantity: 0,
                });
            }

            const record = aggregatedSales.get(key);
            record.total_price += item.totalPrice;
            record.quantity += item.quantity;
        });

        const finalSalesData = Array.from(aggregatedSales.values());

        if (finalSalesData.length > 0) {
            // E. Clean up previous data for this exact date (Idempotency)
            // Replace 'daily_sales' with your actual table name from Image 2 if it's different.
            const { error: deleteError } = await supabase
                .from('daily_sales')
                .delete()
                .eq('date', supabaseDate);

            if (deleteError) throw deleteError;

            // F. Insert new aggregated data
            const { error: insertError } = await supabase
                .from('daily_sales')
                .insert(finalSalesData);

            if (insertError) throw insertError;
        }

        return NextResponse.json({
            success: true,
            dateProcessed: supabaseDate,
            productsAdded: missingProducts.length,
            motifsAdded: missingMotifs.length,
            salesRecordsInserted: finalSalesData.length
        });

    } catch (error: any) {
        console.error(error);
        if (axios.isAxiosError(error)) {
            return NextResponse.json({
                error: error.message,
                apiResponse: error.response?.data
            }, { status: 500 });
        }
        return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
    }
}