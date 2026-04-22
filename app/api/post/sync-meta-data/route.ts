import supabase from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // 1. Fetch Meta campaign data
    const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;
    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    if (!AD_ACCOUNT_ID || !ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Missing Meta credentials in .env" },
        { status: 500 }
      );
    }

    const accountId = AD_ACCOUNT_ID.startsWith("act_")
      ? AD_ACCOUNT_ID
      : `act_${AD_ACCOUNT_ID}`;
    const metaUrl = `https://graph.facebook.com/v19.0/${accountId}/insights?fields=campaign_name,spend,actions&level=campaign&date_preset=today&access_token=${ACCESS_TOKEN}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const metaRes = await fetch(metaUrl, {
      method: "GET",
      signal: controller.signal,
      next: { revalidate: 0 },
    });
    clearTimeout(timeoutId);

    const metaResult = await metaRes.json();

    if (metaResult.error) {
      return NextResponse.json(
        { error: `Meta API error: ${metaResult.error.message}` },
        { status: 400 }
      );
    }

    const campaigns: Array<{
      campaign_name: string;
      spend: string;
      date_start: string;
      date_stop: string;
      actions?: Array<{ action_type: string; value: string }>;
    }> = metaResult.data ?? [];

    if (!campaigns.length) {
      return NextResponse.json(
        { message: "No campaigns returned from Meta for today.", inserted: 0 },
        { status: 200 }
      );
    }

    // 2. Fetch branches, ads_platform, and target data in parallel
    const [branchRes, platformRes, targetRes] = await Promise.all([
      supabase.from("branch").select("id, name"),
      supabase.from("ads_platform").select("id, name"),
      supabase.from("target").select("branch_id, leads_target, omset_target"),
    ]);

    if (branchRes.error) {
      return NextResponse.json(
        { error: `Failed to fetch branches: ${branchRes.error.message}` },
        { status: 500 }
      );
    }
    if (platformRes.error) {
      return NextResponse.json(
        { error: `Failed to fetch platforms: ${platformRes.error.message}` },
        { status: 500 }
      );
    }

    if (targetRes.error) {
      return NextResponse.json(
        { error: `Failed to fetch targets: ${targetRes.error.message}` },
        { status: 500 }
      );
    }

    const branches: Array<{ id: string; name: string }> = branchRes.data ?? [];
    const adsPlatforms: Array<{ id: string; name: string }> =
      platformRes.data ?? [];
    const targets: Array<{ branch_id: string; leads_target: number; omset_target: number }> =
      targetRes.data ?? [];

    // 3. Find the Meta platform ID (case-insensitive match on "meta")
    const metaPlatform = adsPlatforms.find((p) =>
      p.name.toLowerCase().includes("meta")
    );

    if (!metaPlatform) {
      return NextResponse.json(
        {
          error:
            'No platform with name containing "meta" found in ads_platform table.',
        },
        { status: 400 }
      );
    }

    // Helper: strip hyphens, spaces, dots so "Parepare" matches "Pare-Pare"
    const normalizeName = (s: string) =>
      s.toLowerCase().replace(/[\s\-_.]/g, "");

    // 4. Build upsert payloads — only campaigns where we can find a matching branch
    const skipped: string[] = [];
    const upsertPayloads: Array<Record<string, unknown>> = [];

    // Fetch existing records for today to handle updates (upsert)
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: existingRecords } = await supabase
      .from("advertiser_data")
      .select("id, cabang_id")
      .eq("platform_id", metaPlatform.id)
      .gte("created_at", `${todayStr}T00:00:00`)
      .lte("created_at", `${todayStr}T23:59:59`);

    const existingMap = new Map(existingRecords?.map(r => [r.cabang_id, r.id]) || []);

    for (const campaign of campaigns) {
      // Match branch by name — try exact first, then normalized fallback
      const branch =
        branches.find(
          (b) => b.name.toLowerCase() === campaign.campaign_name.toLowerCase()
        ) ??
        branches.find(
          (b) => normalizeName(b.name) === normalizeName(campaign.campaign_name)
        );

      if (!branch) {
        skipped.push(campaign.campaign_name);
        continue;
      }

      // Use date_start as created_at
      const createdAt = new Date(campaign.date_start).toISOString();

      // Extract actual leads from Meta actions
      const actualLeadsAction = campaign.actions?.find(
        (a) => a.action_type === "onsite_conversion.messaging_conversation_started_7d"
      );
      const actualLeads = actualLeadsAction ? Number(actualLeadsAction.value) : 0;

      // Match branch target
      const branchTarget = targets.find((t) => t.branch_id === branch.id);
      const targetLeads = branchTarget?.leads_target || 0;
      const targetOmset = branchTarget?.omset_target || 0;

      // Calculate financials
      const spend = Number(campaign.spend) || 0;
      const ppn = Math.round(spend * 0.11);
      const totalBudget = spend + ppn;
      const costPerLead = actualLeads > 0 ? Math.round(totalBudget / actualLeads) : 0;

      const payload: Record<string, any> = {
        created_at: createdAt,
        cabang_id: branch.id,
        platform_id: metaPlatform.id,
        spend: spend,
        total_budget: totalBudget,
        leads: targetLeads,
        actual_leads: actualLeads,
        omset_target: targetOmset,
        conversi_google: 0,
        keterangan: "",
        ads_manager_id: "174bd8d4-749a-4300-bc54-2d43de0248fb",
      };

      // If record exists for this branch today, include ID to trigger update
      if (existingMap.has(branch.id)) {
        payload.id = existingMap.get(branch.id);
      }

      upsertPayloads.push(payload);
    }

    if (!upsertPayloads.length) {
      return NextResponse.json(
        {
          message: "No matching branches found for any campaign.",
          skipped,
          inserted: 0,
        },
        { status: 200 }
      );
    }

    // 5. Upsert all matched campaigns
    const { data: insertedRows, error: insertError } = await supabase
      .from("advertiser_data")
      .upsert(upsertPayloads)
      .select("id, cabang_id, spend, created_at");

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Sync complete",
        inserted: insertedRows?.length ?? 0,
        skipped,
        data: insertedRows,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const name = err instanceof Error ? err.name : "Error";
    console.error("Sync Meta Error:", name, message);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}
