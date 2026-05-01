import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

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

    // Build the query
    // We use !inner on leads to filter customers by their leads' attributes
    // but still return the customer data.
    // However, if we want the FULL history of those customers (even non-matching leads),
    // we have to be careful. If we use !inner with a filter, it only returns the MATCHING leads.
    // So we'll use a two-step approach but more robustly.

    let customerIdsQuery = supabase
      .from("leads")
      .select("costumer_id");

    if (start_date) {
      customerIdsQuery = customerIdsQuery.gte("updated_at", start_date);
    }
    if (end_date) {
      customerIdsQuery = customerIdsQuery.lte("updated_at", end_date);
    }
    if (status) {
      customerIdsQuery = customerIdsQuery.ilike("status", status);
    }

    // To handle large datasets, we'll get the distinct costumer_ids 
    // that match the filter. We'll use a limit to avoid fetching too many rows,
    // but a large enough one to cover recent activity.
    const { data: matchedLeads, error: leadsError } = await customerIdsQuery.limit(5000);

    if (leadsError) {
      return NextResponse.json({ error: leadsError.message }, { status: 500 });
    }

    const matchedCustomerIds = [...new Set((matchedLeads || []).map(l => l.costumer_id).filter(Boolean))];

    // Main query for customers
    let query = supabase
      .from("costumers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (isFiltered) {
      if (matchedCustomerIds.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: { totalItems: 0, totalPages: 0, currentPage: pageInt, limit: limitInt }
        }, { status: 200 });
      }
      query = query.in("id", matchedCustomerIds);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Paginate customers
    const { data: customers, error: customersError, count } = await query.range(startIndex, endIndex);

    if (customersError) {
      return NextResponse.json({ error: customersError.message }, { status: 500 });
    }

    // Fetch ALL leads for the current page's customers to show full history
    const customerIdsOnPage = (customers || []).map(c => c.id);
    let leadsData: any[] = [];

    if (customerIdsOnPage.length > 0) {
      const { data: leads, error: historyError } = await supabase
        .from("leads")
        .select(
          "*, platform:platform_id(name,id), channel:channel_id(name,id), keterangan_leads:keterangan_leads(name,id), branch:branch_id(name,id), pic:pic_id(name,id)"
        )
        .in("costumer_id", customerIdsOnPage)
        .order("updated_at", { ascending: false });

      if (!historyError) {
        leadsData = leads || [];
      }
    }

    const customersWithLeads = (customers || []).map((customer: any) => ({
      ...customer,
      leads: leadsData.filter((lead: any) => lead.costumer_id === customer.id),
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
