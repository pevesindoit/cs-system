import { NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import { toZonedTime, format } from 'date-fns-tz';

export const maxDuration = 60;

export async function GET(req: Request) {
    try {
        // 1. Extract Pagination Parameters from the URL
        // Example: /api/stock?page=1&limit=50
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50'); // Keep between 50-100 for optimal speed

        const timeZone = 'Asia/Jakarta';
        const secretKey = process.env.ACCURATE_SIGNATURE || '';
        const token = process.env.ACCURATE_TOKEN || '';

        // Generate Time and Signature for the initial List request
        let nowWIB = toZonedTime(new Date(), timeZone);
        let currentTimestamp = format(nowWIB, 'dd/MM/yyyy HH:mm:ss', { timeZone });
        let signature = crypto.createHmac('sha256', secretKey).update(currentTimestamp).digest('base64');

        // STEP 2: Fetch only ONE specific page from the Accurate List Endpoint
        const listUrl = 'https://iris.accurate.id/accurate/api/item/list.do';
        const listResponse = await axios.get(listUrl, {
            params: {
                'sp.pageSize': limit,
                'sp.page': page,
                'fields': 'id,no,name'
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Api-Timestamp': currentTimestamp,
                'X-Api-Signature': signature
            }
        });

        const accurateData = listResponse.data.d || [];
        const totalAccuratePages = listResponse.data.sp?.pageCount || 1;
        const totalItemsInDatabase = listResponse.data.sp?.rowCount || 0;

        // If the page requested is beyond the available data, return early
        if (accurateData.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No more items to fetch",
                pageRequested: page,
                hasMoreData: false,
                data: {}
            });
        }

        // STEP 3: Fetch detailed warehouse stock for ONLY the items on this page
        const detailUrl = 'https://iris.accurate.id/accurate/api/item/detail.do';
        const branchStockMap: Record<string, any[]> = {};

        // Process this specific page's chunk concurrently
        await Promise.all(accurateData.map(async (basicItem: any) => {
            try {
                // Generate fresh signature per individual detail request
                const detailWIB = toZonedTime(new Date(), timeZone);
                const detailTimestamp = format(detailWIB, 'dd/MM/yyyy HH:mm:ss', { timeZone });
                const detailSignature = crypto.createHmac('sha256', secretKey).update(detailTimestamp).digest('base64');

                const detailResponse = await axios.get(detailUrl, {
                    params: { id: basicItem.id },
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Api-Timestamp': detailTimestamp,
                        'X-Api-Signature': detailSignature
                    }
                });

                const itemDetails = detailResponse.data.d;
                const warehouses = itemDetails?.detailWarehouseData || [];

                warehouses.forEach((wh: any) => {
                    const rawWarehouseName = wh.warehouseName || wh.name || "";

                    // Filter for GOOD STOCK branches only
                    if (rawWarehouseName.toUpperCase().includes("GOOD STOCK -")) {

                        // Clean the branch name
                        const cleanBranchName = rawWarehouseName
                            .replace(/GOOD STOCK\s*-\s*/i, "")
                            .trim()
                            .toUpperCase();

                        if (!branchStockMap[cleanBranchName]) {
                            branchStockMap[cleanBranchName] = [];
                        }

                        // Push the data
                        branchStockMap[cleanBranchName].push({
                            sku: itemDetails.no,
                            name: itemDetails.name,
                            quantityInBranch: wh.balance || 0
                        });
                    }
                });
            } catch (err) {
                console.error(`Error fetching detail for ID ${basicItem.id}`);
            }
        }));

        // STEP 4: Return paginated results
        return NextResponse.json({
            success: true,
            pagination: {
                currentPage: page,
                itemsRequested: limit,
                itemsProcessedThisPage: accurateData.length,
                totalDatabaseItems: totalItemsInDatabase,
                totalPages: totalAccuratePages,
                hasMoreData: page < totalAccuratePages
            },
            branchesFoundOnThisPage: Object.keys(branchStockMap),
            data: branchStockMap
        });

    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            return NextResponse.json({
                error: error.message,
                apiResponse: error.response?.data
            }, { status: 500 });
        }
        return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
    }
}