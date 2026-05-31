import { NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import supabase from "@/lib/db";
import { toZonedTime, format } from 'date-fns-tz';
import { subDays, isMonday, startOfDay, endOfDay } from 'date-fns';

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const timeZone = 'Asia/Jakarta';

    // 1. Get current time strictly in WIB
    const nowWIB = toZonedTime(new Date(), timeZone);

    // 2. Format the timestamp for the Accurate Signature (dd/MM/yyyy HH:mm:ss)
    const currentTimestamp = format(nowWIB, 'dd/MM/yyyy HH:mm:ss', { timeZone });

    // 3. Calculate target date based on WIB time (or manual date)
    const { searchParams } = new URL(request.url);
    const manualDate = searchParams.get('date');

    let targetDateWIB: Date;
    if (manualDate && /^\d{4}-\d{2}-\d{2}$/.test(manualDate)) {
        targetDateWIB = toZonedTime(new Date(`${manualDate}T00:00:00`), timeZone);
    } else {
        const checkMonday = isMonday(nowWIB);
        targetDateWIB = subDays(nowWIB, checkMonday ? 2 : 1);
    }

    // 4. Format the filter date for Accurate API (dd/MM/yyyy)
    const filterDate = format(targetDateWIB, 'dd/MM/yyyy', { timeZone });

    const secretKey = process.env.ACCURATE_SIGNATURE || '';
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(currentTimestamp)
      .digest('base64');

    const url = 'https://iris.accurate.id/accurate/api/sales-receipt/list.do';
    const response = await axios.get(url, {
      params: {
        'filter.transDate.val': filterDate,
        'filter.transDate.op': 'EQUAL',
        'sp.pageSize': 100,
        'sp.page': 1,
        'fields': 'id,number,totalPayment,branch,customer'
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

    // 5. Aggregate Omset (Updated to use targetDateWIB)
    const aggregatedOmset = accurateData.reduce((acc: any, item: any) => {
      if (item.companyName === "TEAM FRANCHISE" || (item.customer && (item.customer.companyName === "TEAM FRANCHISE" || item.customer.name === "TEAM FRANCHISE"))) {
        return acc;
      }

      const rawBranchName = item.branch?.name || "";
      const cleanBranchName = rawBranchName.replace("PEVESINDO CABANG ", "").trim().toUpperCase();
      const branchId = dbBranchMap[cleanBranchName];

      if (branchId) {
        if (!acc[branchId]) {
          acc[branchId] = {
            branch_id: branchId,
            total: 0,
            created_at: targetDateWIB.toISOString(),
            user_id: SYSTEM_USER_ID
          };
        }
        acc[branchId].total += (item.totalPayment || 0);
      }

      return acc;
    }, {});

    const insertPayload = Object.values(aggregatedOmset);

    if (insertPayload.length > 0) {
      // 6. Create start and end bounds natively in WIB for Supabase
      const startWIB = startOfDay(targetDateWIB);
      const endWIB = endOfDay(targetDateWIB);

      const { error: deleteError } = await supabase
        .from('real_omset')
        .delete()
        .gte('created_at', startWIB.toISOString())
        .lte('created_at', endWIB.toISOString());

      if (deleteError) throw deleteError;

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