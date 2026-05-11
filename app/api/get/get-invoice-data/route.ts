import { NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import supabase from "@/lib/db";

export const maxDuration = 60;

export async function GET() {
  try {
    const now = new Date();
    const tsDay = String(now.getDate()).padStart(2, '0');
    const tsMonth = String(now.getMonth() + 1).padStart(2, '0');
    const tsYear = now.getFullYear();
    const tsTime = now.toTimeString().split(' ')[0];
    const currentTimestamp = `${tsDay}/${tsMonth}/${tsYear} ${tsTime}`;

    const secretKey = process.env.ACCURATE_SIGNATURE || '';
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(currentTimestamp)
      .digest('base64');

    const targetDate = new Date();
    const isMonday = now.getDay() === 1;
    targetDate.setDate(now.getDate() - (isMonday ? 2 : 1));

    // 👇 FIX 1: Normalize the time to exactly midnight so timestamps are perfectly consistent
    targetDate.setHours(0, 0, 0, 0);

    const filterDate = `${String(targetDate.getDate()).padStart(2, '0')}/${String(targetDate.getMonth() + 1).padStart(2, '0')}/${targetDate.getFullYear()}`;

    const url = 'https://iris.accurate.id/accurate/api/sales-receipt/list.do';
    const response = await axios.get(url, {
      params: {
        'filter.transDate.val': filterDate,
        'filter.transDate.op': 'EQUAL',
        'sp.pageSize': 100,
        'sp.page': 1,
        'fields': 'id,number,totalPayment,branch'
      },
      headers: {
        'Authorization': `Bearer ${process.env.ACCURATE_TOKEN}`,
        'X-Api-Timestamp': currentTimestamp,
        'X-Api-Signature': signature
      }
    });

    const accurateData = response.data.d || [];

    const { data: dbBranches, error: branchError } = await supabase
      .from('branch')
      .select('id, name');

    if (branchError) throw branchError;

    const dbBranchMap: Record<string, string> = {};
    dbBranches.forEach((b: any) => {
      dbBranchMap[b.name.trim().toUpperCase()] = b.id;
    });

    const SYSTEM_USER_ID = "174bd8d4-749a-4300-bc54-2d43de0248fb";

    const aggregatedOmset = accurateData.reduce((acc: any, item: any) => {
      const rawBranchName = item.branch?.name || "";
      const cleanBranchName = rawBranchName.replace("PEVESINDO CABANG ", "").trim().toUpperCase();
      const branchId = dbBranchMap[cleanBranchName];

      if (branchId) {
        if (!acc[branchId]) {
          acc[branchId] = {
            branch_id: branchId,
            total: 0,
            created_at: targetDate.toISOString(),
            user_id: SYSTEM_USER_ID
          };
        }
        acc[branchId].total += (item.totalPayment || 0);
      }

      return acc;
    }, {});

    const insertPayload = Object.values(aggregatedOmset);

    // 5. Insert into Supabase (With Duplication Prevention)
    if (insertPayload.length > 0) {

      // 👇 FIX 2: Create start and end bounds for the target day
      const startOfDay = new Date(targetDate);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // A. Delete any existing data for this specific day to prevent duplicates
      const { error: deleteError } = await supabase
        .from('real_omset')
        .delete()
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (deleteError) throw deleteError;

      // B. Insert the fresh, deduplicated data
      const { error: insertError } = await supabase
        .from('real_omset')
        .insert(insertPayload);

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      fetchingDataFor: filterDate,
      totalReceiptsProcessed: accurateData.length,
      totalBranchesInserted: insertPayload.length,
      data: insertPayload
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