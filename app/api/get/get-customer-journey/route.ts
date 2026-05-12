import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export const maxDuration = 10; // Vercel free tier max

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      page = 1,
      limit = 5,
      search = "",
      start_date = "",
      end_date = "",
      status = "",
    } = body;

    const pageInt = parseInt(page as string);
    const limitInt = parseInt(limit as string);
    const startIndex = (pageInt - 1) * limitInt;
    const endIndex = startIndex + limitInt - 1;

    const isFiltered = !!(start_date || end_date || status);

    // ── STEP 1: Get customer IDs (paginated) ─────────────────────────────────
    // Use a lightweight query that only selects `id` for pagination counting.
    // This avoids the heavy joins that cause timeouts.
    let countQuery = supabase
      .from("costumers")
      .select(
        isFiltered ? "id,leads!inner(id)" : "id",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply lead-level filters
    if (isFiltered) {
      if (start_date) {
        countQuery = countQuery.gte("leads.updated_at", start_date);
      }
      if (end_date) {
        countQuery = countQuery.lte("leads.updated_at", end_date);
      }
      if (status) {
        countQuery = countQuery.ilike("leads.status", status);
      }
    }

    if (search) {
      const cleanedSearch = search.replace(/\D/g, "").replace(/^(62|0)+/, "");
      countQuery = countQuery.or(
        `name.ilike.%${search}%,number.cast.text.ilike.%${cleanedSearch || search}%`
      );
    }

    // Paginate
    const { data: customerRows, error: customersError, count } = await countQuery.range(startIndex, endIndex);

    if (customersError) {
      return NextResponse.json({ error: customersError.message }, { status: 500 });
    }

    const customerIds = (customerRows || []).map((c: any) => c.id);

    if (customerIds.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          totalItems: count || 0,
          totalPages: Math.ceil((count || 0) / limitInt),
          currentPage: pageInt,
          limit: limitInt,
        },
      }, { status: 200 });
    }

    // ── STEP 2: Fetch customer details + leads in parallel ───────────────────
    // Run both queries at the same time to cut latency in half.
    const [customersResult, leadsResult] = await Promise.all([
      supabase
        .from("costumers")
        .select("id,name,number,address,costumers_type,created_at")
        .in("id", customerIds)
        .order("created_at", { ascending: false }),

      supabase
        .from("leads")
        .select(
          "*, platform:platform_id(name,id), channel:channel_id(name,id), keterangan_leads:keterangan_leads(name,id), branch:branch_id(name,id), pic:pic_id(name,id)"
        )
        .in("costumer_id", customerIds)
        .order("updated_at", { ascending: false }),
    ]);

    if (customersResult.error) {
      return NextResponse.json({ error: customersResult.error.message }, { status: 500 });
    }

    const customers = customersResult.data || [];
    const leadsData = leadsResult.error ? [] : (leadsResult.data || []);

    // ── STEP 3: Merge leads into customers ───────────────────────────────────
    // Build a map for O(n) merge instead of O(n*m) filter
    const leadsMap = new Map<string, any[]>();
    for (const lead of leadsData) {
      const cid = lead.costumer_id;
      if (!leadsMap.has(cid)) leadsMap.set(cid, []);
      leadsMap.get(cid)!.push(lead);
    }

    const customersWithLeads = customers.map((customer: any) => ({
      ...customer,
      leads: leadsMap.get(customer.id) || [],
    }));

    const pagination = {
      totalItems: count || 0,
      totalPages: Math.ceil((count || 0) / limitInt),
      currentPage: pageInt,
      limit: limitInt,
    };

    return NextResponse.json({ data: customersWithLeads, pagination }, { status: 200 });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err },
      { status: 500 }
    );
  }
}
