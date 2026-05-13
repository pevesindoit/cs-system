import { NextResponse } from 'next/server';
import { toZonedTime, format } from 'date-fns-tz';
import { subDays, isMonday } from 'date-fns';

export async function GET() {
  const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  // 1. Immediate validation
  if (!AD_ACCOUNT_ID || !ACCESS_TOKEN) {
    return NextResponse.json({
      error: "Missing credentials in .env",
      receivedId: !!AD_ACCOUNT_ID,
      receivedToken: !!ACCESS_TOKEN
    }, { status: 500 });
  }

  // 2. Format account ID
  const accountId = AD_ACCOUNT_ID.startsWith('act_') ? AD_ACCOUNT_ID : `act_${AD_ACCOUNT_ID}`;

  // Dynamic Date Logic using WIB timezone (Saturday if Monday, else Yesterday)
  const timeZone = 'Asia/Jakarta';
  const nowWIB = toZonedTime(new Date(), timeZone);
  const checkMonday = isMonday(nowWIB);
  const targetDate = subDays(nowWIB, checkMonday ? 2 : 1);

  // Format to YYYY-MM-DD
  const formattedDate = format(targetDate, 'yyyy-MM-dd', { timeZone });

  // Encode for URL
  const timeRange = {
    since: formattedDate,
    until: formattedDate
  };
  const encodedTimeRange = encodeURIComponent(JSON.stringify(timeRange));

  // 4. Format URL with time_range instead of date_preset
  const url = `https://graph.facebook.com/v19.0/${accountId}/insights?fields=campaign_name,spend,actions&level=campaign&time_range=${encodedTimeRange}&access_token=${ACCESS_TOKEN}`;

  try {
    // 5. Set a timeout controller (Meta can be slow)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    // 6. Return Meta's specific error if it exists
    if (result.error) {
      return NextResponse.json({
        source: "Meta API",
        message: result.error.message,
        type: result.error.type
      }, { status: 400 });
    }

    return NextResponse.json(result.data);

  } catch (error: any) {
    // 7. Detailed error logging for your terminal
    console.error("Fetch Error:", error.name, error.message);

    return NextResponse.json({
      error: "Internal Server Error",
      details: error.message,
      type: error.name // Will show 'AbortError' if it timed out
    }, { status: 500 });
  }
}