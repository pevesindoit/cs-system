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
    let countQuery = supabase
      .from("costumers")
      .select("id", { count: "exact" })
      .order("created_at", { ascending: false });

    // If filtered by lead attributes (status/date), we fetch the IDs from leads first
    // This is MUCH faster than a join-based count on a large table
    if (isFiltered) {
      let leadFilterQuery = supabase.from("leads").select("costumer_id");
      
      if (start_date) leadFilterQuery = leadFilterQuery.gte("updated_at", start_date);
      if (end_date) leadFilterQuery = leadFilterQuery.lte("updated_at", end_date);
      if (status) leadFilterQuery = leadFilterQuery.ilike("status", status);

      const { data: filteredLeads, error: filterError } = await leadFilterQuery;
      
      if (filterError) {
        console.error("Lead Filter Error:", filterError);
        return NextResponse.json({ error: filterError.message }, { status: 500 });
      }

      const matchingCustomerIds = Array.from(new Set((filteredLeads || []).map(l => l.costumer_id)));
      
      if (matchingCustomerIds.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: { totalItems: 0, totalPages: 0, currentPage: pageInt, limit: limitInt },
        }, { status: 200 });
      }

      countQuery = countQuery.in("id", matchingCustomerIds);
    }

    if (search) {
      const cleanedSearch = search.replace(/\D/g, "");
      if (cleanedSearch && cleanedSearch.length > 3) {
        countQuery = countQuery.or(
          `name.ilike.%${search}%,number.gte.${cleanedSearch}00,number.lte.${cleanedSearch}99`
        );
      } else {
        countQuery = countQuery.ilike("name", `%${search}%`);
      }
    }

    // Paginate
    const { data: customerRows, error: customersError, count } = await countQuery.range(startIndex, endIndex);

    if (customersError) {
      console.error("Customers Error:", customersError);
      return NextResponse.json({ error: customersError.message }, { status: 500 });
    }

    const customerIds = Array.from(new Set((customerRows || []).map((c: any) => c.id)));

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
    const [customersResult, leadsResult] = await Promise.all([
      supabase
        .from("costumers")
        .select("id,name,number,address,costumers_type,created_at")
        .in("id", customerIds)
        .order("created_at", { ascending: false }),

      supabase
        .from("leads")
        .select(`
          id,
          costumer_id,
          name,
          nomor_hp,
          status,
          updated_at,
          created_at,
          nominal,
          reason,
          address,
          platform:platform_id(name,id),
          channel:channel_id(name,id),
          keterangan_leads:keterangan_leads(name,id),
          branch:branch_id(name,id),
          pic:pic_id(name,id)
        `)
        .in("costumer_id", customerIds)
        .order("updated_at", { ascending: false }),
    ]);

    if (customersResult.error) {
      return NextResponse.json({ error: customersResult.error.message }, { status: 500 });
    }

    const customers = customersResult.data || [];
    const leadsData = leadsResult.error ? [] : (leadsResult.data || []);

    // ── STEP 3: Merge leads into customers ───────────────────────────────────
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
