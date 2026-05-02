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
    // we fetch customers first (filtered by leads) and then fetch all leads for those customers.

    let query = supabase
      .from("costumers")
      .select((isFiltered ? "*,leads!inner(id)" : "*") as any, { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (isFiltered) {
      if (start_date) {
        query = query.gte("leads.updated_at", start_date);
      }
      if (end_date) {
        query = query.lte("leads.updated_at", end_date);
      }
      if (status) {
        query = query.ilike("leads.status", status);
      }
    }

    if (search) {
      const cleanedSearch = search.replace(/\D/g, "").replace(/^(62|0)+/, "");
      query = query.or(`name.ilike.%${search}%,number.cast.text.ilike.%${cleanedSearch || search}%`);
    }


    // Paginate customers
    const { data: customersRaw, error: customersError, count } = await query.range(startIndex, endIndex);
    const customers = customersRaw as any[] | null;

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
