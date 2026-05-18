import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

// Branch names that map to "makassar" city
const MAKASSAR_BRANCHES = ["baddoka", "hertasning"];

function normalizePhone(raw: string | number | null | undefined): string {
  if (!raw) return "";
  // Remove all non-digit characters
  let digits = String(raw).replace(/\D/g, "");
  // Strip leading zeros or leading country code (62)
  digits = digits.replace(/^(62|0)+/, "");
  if (!digits) return "";
  // Return in 62XXXXXXXXX format (no + sign)
  return `+62${digits}`;
}

function getBranchCity(branchName: string | null | undefined): string {
  if (!branchName) return "";
  const lower = branchName.toLowerCase().trim();
  if (MAKASSAR_BRANCHES.includes(lower)) return "makassar";
  return lower;
}

/** RFC 4180 CSV field escaping — always wraps in quotes and escapes internal double-quotes */
function csvEscape(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { start_date, end_date, branch, cs, status, keterangan } =
      body.data || body;

    const start = `${start_date} 00:00:00+00`;
    const end = `${end_date} 23:59:59+00`;

    // Fetch ALL matching leads (paginated internally to bypass Supabase 1000-row limit)
    let allLeads: any[] = [];
    let offset = 0;
    const fetchLimit = 1000;

    while (true) {
      let q = supabase
        .from("leads")
        .select("name, nomor_hp, status, nominal, branch_name:branch_id(name)")
        .gte("updated_at", start)
        .lte("updated_at", end)
        .not("nomor_hp", "is", null)
        .neq("nomor_hp", "")
        .order("updated_at", { ascending: false })
        .range(offset, offset + fetchLimit - 1);

      if (branch) q = q.eq("branch_id", branch);
      if (cs) q = q.eq("user_id", cs);
      if (keterangan) q = q.eq("keterangan_leads_id", keterangan);
      if (status) q = q.ilike("status", status);

      const { data, error } = await q;
      if (error) throw error;
      allLeads.push(...(data || []));
      if (!data || data.length < fetchLimit) break;
      offset += fetchLimit;
    }

    // De-duplicate by phone number.
    // When we see the same phone more than once, prefer the closing lead's nominal as value.
    const phoneMap = new Map<string, { fn: string; ct: string; value: string }>();

    for (const lead of allLeads) {
      const phone = normalizePhone(lead.nomor_hp);
      if (!phone) continue;

      const branchName = lead.branch_name?.name ?? "";
      const ct = getBranchCity(branchName);
      const fn = (lead.name ?? "").trim();
      const isClosing = (lead.status ?? "").toLowerCase() === "closing";
      const nominal = isClosing && lead.nominal ? String(lead.nominal) : "";

      if (!phoneMap.has(phone)) {
        phoneMap.set(phone, { fn, ct, value: nominal });
      } else if (isClosing && nominal) {
        // Upgrade existing entry with closing nominal if not already set
        const existing = phoneMap.get(phone)!;
        if (!existing.value) existing.value = nominal;
      }
    }

    // Build CSV rows
    const header = ["phone", "fn", "ct", "value"].map(csvEscape).join(",");
    const csvLines: string[] = [];

    for (const [phone, { fn, ct, value }] of phoneMap) {
      csvLines.push(
        [csvEscape(phone), csvEscape(fn), csvEscape(ct), csvEscape(value)].join(",")
      );
    }

    const csvContent = [header, ...csvLines].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="meta-ads-customers.csv"`,
      },
    });
  } catch (err) {
    console.error("Export Meta Ads Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(err) },
      { status: 500 }
    );
  }
}
