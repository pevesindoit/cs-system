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

/** Strip commas so they don't break the plain CSV structure */
function clean(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value).replace(/,/g, "").trim();
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

    // Build plain @ -separated file — Meta Ads format
    const header = "phone,fn,ct,value";
    const csvLines: string[] = [];

    // De-duplicate by phone — first occurrence wins; closing nominal upgrades empty value
    const seenPhones = new Map<string, { fn: string; ct: string; value: string }>();

    for (const lead of allLeads) {
      const phone = normalizePhone(lead.nomor_hp);
      const fn = clean(lead.name).split(" ")[0];
      const ct = clean(getBranchCity(lead.branch_name?.name));
      const isClosing = (lead.status ?? "").toLowerCase() === "closing";
      const value = isClosing && lead.nominal ? String(lead.nominal) : "";

      if (!seenPhones.has(phone)) {
        seenPhones.set(phone, { fn, ct, value });
      } else if (isClosing && value) {
        // Upgrade existing entry's value if it doesn't have one yet
        const existing = seenPhones.get(phone)!;
        if (!existing.value) existing.value = value;
      }
    }

    for (const [phone, { fn, ct, value }] of seenPhones) {
      csvLines.push(`${phone},${fn},${ct},${value}`);
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
