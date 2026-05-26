import { NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import { toZonedTime, format } from 'date-fns-tz';

export const maxDuration = 60;

// ─── Auth helper ───────────────────────────────────────────────────────────────
function makeHeaders(secretKey: string, token: string) {
    const timeZone = 'Asia/Jakarta';
    const nowWIB = toZonedTime(new Date(), timeZone);
    const timestamp = format(nowWIB, 'dd/MM/yyyy HH:mm:ss', { timeZone });
    const signature = crypto.createHmac('sha256', secretKey).update(timestamp).digest('base64');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Api-Timestamp': timestamp,
            'X-Api-Signature': signature,
        }
    };
}

// ─── Branch extractor (shared logic) ─────────────────────────────────────────
function extractBranchStock(
    itemDetails: any,
    branchStockMap: Record<string, { sku: string; name: string; quantityInBranch: number }[]>
) {
    const warehouses: any[] = itemDetails?.detailWarehouseData || [];
    warehouses.forEach((wh) => {
        const rawName: string = wh.warehouseName || wh.name || '';
        if (rawName.toUpperCase().includes('GOOD STOCK -')) {
            const cleanBranch = rawName
                .replace(/GOOD STOCK\s*-\s*/i, '')
                .trim()
                .toUpperCase();
            if (!branchStockMap[cleanBranch]) branchStockMap[cleanBranch] = [];
            branchStockMap[cleanBranch].push({
                sku: itemDetails.no || itemDetails.itemNo || '',
                name: itemDetails.name || '',
                quantityInBranch: wh.balance || 0,
            });
        }
    });
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get('q') || '').trim();

        if (q.length < 2) {
            return NextResponse.json({
                success: true,
                query: q,
                totalFound: 0,
                branches: [],
                data: {},
            });
        }

        const secretKey = process.env.ACCURATE_SIGNATURE || '';
        const token = process.env.ACCURATE_TOKEN || '';

        // ── STEP 1: Run BOTH searches in parallel ─────────────────────────────
        //   a) Exact SKU / barcode match  → search-by-no-upc.do
        //   b) Partial / fuzzy name match → search-by-item-or-sn.do
        const exactUrl  = 'https://iris.accurate.id/accurate/api/item/search-by-no-upc.do';
        const fuzzyUrl  = 'https://iris.accurate.id/accurate/api/item/search-by-item-or-sn.do';

        const [exactRes, fuzzyRes] = await Promise.allSettled([
            axios.get(exactUrl, {
                params: { keywords: q },
                ...makeHeaders(secretKey, token),
            }),
            axios.get(fuzzyUrl, {
                params: { keywords: q, sp_pageSize: 50 },
                ...makeHeaders(secretKey, token),
            }),
        ]);

        // ── Parse exact results ───────────────────────────────────────────────
        let exactItems: any[] = [];
        if (exactRes.status === 'fulfilled') {
            const raw = exactRes.value.data.d;
            if (Array.isArray(raw)) {
                exactItems = raw;
            } else if (raw && typeof raw === 'object') {
                if ('item' in raw && 'found' in raw) {
                    if (raw.found && raw.item) exactItems = [raw.item];
                } else {
                    exactItems = [raw];
                }
            }
        } else {
            console.warn('[search-stock] exact search failed:', exactRes.reason?.message);
        }

        // ── Parse fuzzy results ───────────────────────────────────────────────
        // search-by-item-or-sn.do returns: { d: [ { id, no, name, ... }, ... ] }
        let fuzzyItems: any[] = [];
        if (fuzzyRes.status === 'fulfilled') {
            const raw = fuzzyRes.value.data.d;
            if (Array.isArray(raw)) {
                fuzzyItems = raw;
            } else if (raw && typeof raw === 'object') {
                // Some versions wrap in { data: [...] }
                fuzzyItems = raw.data || [];
            }
        } else {
            console.warn('[search-stock] fuzzy search failed:', fuzzyRes.reason?.message);
        }

        // ── Merge & deduplicate by item id ────────────────────────────────────
        const seenIds = new Set<string | number>();
        const foundItems: any[] = [];
        for (const item of [...exactItems, ...fuzzyItems]) {
            const key = item.id ?? item.no ?? item.itemNo;
            if (key !== undefined && !seenIds.has(key)) {
                seenIds.add(key);
                foundItems.push(item);
            }
        }

        // ── Filter: only keep items whose name OR sku STARTS WITH the query ──
        const ql = q.toLowerCase();
        const startsWithItems = foundItems.filter((item) => {
            const name = (item.name || '').toLowerCase();
            const sku  = (item.no || item.itemNo || item.sku || '').toLowerCase();
            return name.startsWith(ql) || sku.startsWith(ql);
        });

        console.log(`[search-stock] query="${q}" → exact:${exactItems.length} fuzzy:${fuzzyItems.length} merged:${foundItems.length} startsWith:${startsWithItems.length}`);

        if (startsWithItems.length === 0) {
            return NextResponse.json({
                success: true,
                query: q,
                totalFound: 0,
                branches: [],
                data: {},
            });
        }

        const MAX_DETAIL = 30;
        const itemsToProcess = startsWithItems.slice(0, MAX_DETAIL);
        const branchStockMap: Record<string, { sku: string; name: string; quantityInBranch: number }[]> = {};

        // ── STEP 2: Extract warehouse data ─────────────────────────────────────
        // If search-by-no-upc already returns detailWarehouseData, use it directly.
        // Otherwise fall back to a detail.do call per item.
        const detailUrl = 'https://iris.accurate.id/accurate/api/item/detail.do';

        await Promise.all(
            itemsToProcess.map(async (item: any) => {
                try {
                    // Debug: show what fields the search response returned
                    console.log(`[search-stock] item keys:`, Object.keys(item));
                    console.log(`[search-stock] item.id=${item.id}, item.no=${item.no}, item.name=${item.name}`);

                    if (item.detailWarehouseData) {
                        // ✅ Full details already in search response
                        console.log(`[search-stock] using direct detailWarehouseData (${item.detailWarehouseData.length} warehouses)`);
                        extractBranchStock(item, branchStockMap);
                    } else {
                        // ⬇️ Fetch details separately via item id
                        const itemId = item.id;
                        if (!itemId) {
                            console.warn(`[search-stock] item has no id, skipping:`, item);
                            return;
                        }

                        console.log(`[search-stock] calling detail.do for id=${itemId}`);
                        const detailResponse = await axios.get(detailUrl, {
                            params: { id: itemId },
                            ...makeHeaders(secretKey, token),
                        });

                        const itemDetails = detailResponse.data.d;
                        console.log(`[search-stock] detail.do keys:`, Object.keys(itemDetails || {}));

                        const warehouses: any[] = itemDetails?.detailWarehouseData || [];
                        console.log(`[search-stock] warehouses count:`, warehouses.length);
                        warehouses.forEach((wh: any) => {
                            console.log(`  warehouse name: "${wh.warehouseName || wh.name}", balance: ${wh.balance}`);
                        });

                        if (itemDetails) extractBranchStock(itemDetails, branchStockMap);
                    }
                } catch (err: any) {
                    console.error(`[search-stock] Failed for item id=${item.id}:`, err.response?.data || err.message);
                }
            })
        );

        return NextResponse.json({
            success: true,
            query: q,
            totalFound: foundItems.length,
            totalProcessed: itemsToProcess.length,
            branches: Object.keys(branchStockMap).sort(),
            // ── TEMP DEBUG: remove once warehouse names are confirmed ──────────
            _debug: {
                rawItems: itemsToProcess,
            },
            data: branchStockMap,
        });

    } catch (error: any) {
        // Log full Accurate API error for debugging
        if (axios.isAxiosError(error)) {
            console.error('[search-stock] Accurate API error:', error.response?.data);
            return NextResponse.json(
                {
                    error: error.message,
                    status: error.response?.status,
                    apiResponse: error.response?.data,
                },
                { status: 500 }
            );
        }
        console.error('[search-stock] Unexpected error:', error.message);
        return NextResponse.json(
            { error: error.message || 'Unexpected error' },
            { status: 500 }
        );
    }
}
