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
    } = body;

    const pageInt = parseInt(page as string);
    const limitInt = parseInt(limit as string);
    const startIndex = (pageInt - 1) * limitInt;
    const endIndex = startIndex + limitInt - 1;

    // Query customers with pagination
    let customersQuery = supabase
      .from("costumers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(startIndex, endIndex);

    if (search) {
      customersQuery = customersQuery.ilike("name", `%${search}%`);
    }

    const { data: customers, error: customersError, count } = await customersQuery;

    if (customersError) {
      return NextResponse.json({ error: customersError.message }, { status: 500 });
    }

    // For each customer, fetch their leads from the leads table
    const customerIds = (customers || []).map((c: any) => c.id);

    let leadsData: any[] = [];
    if (customerIds.length > 0) {
      let leadsQuery = supabase
        .from("leads")
        .select(
          "*, platform:platform_id(name,id), channel:channel_id(name,id), keterangan_leads:keterangan_leads(name,id), branch:branch_id(name,id), pic:pic_id(name,id)"
        )
        .in("costumer_id", customerIds)
        .order("updated_at", { ascending: false });

      // Apply date range filter on leads if provided
      if (start_date) {
        leadsQuery = leadsQuery.gte("updated_at", `${start_date} 00:00:00+00`);
      }
      if (end_date) {
        leadsQuery = leadsQuery.lte("updated_at", `${end_date} 23:59:59+00`);
      }

      const { data: leads, error: leadsError } = await leadsQuery;

      if (!leadsError) {
        leadsData = leads || [];
      }
    }

    // Group leads by customer
    const customersWithLeads = (customers || []).map((customer: any) => ({
      ...customer,
      leads: leadsData.filter((lead: any) => lead.costumer_id === customer.id),
    }));

    // When a date filter is active, hide customers who have no leads in that period
    const isDateFiltered = !!(start_date || end_date);
    const filteredCustomers = isDateFiltered
      ? customersWithLeads.filter((c: any) => c.leads.length > 0)
      : customersWithLeads;

    const pagination = {
      totalItems: isDateFiltered ? filteredCustomers.length : (count || 0),
      totalPages: isDateFiltered
        ? Math.ceil(filteredCustomers.length / limitInt)
        : Math.ceil((count || 0) / limitInt),
      currentPage: pageInt,
      limit: limitInt,
    };

    return NextResponse.json({ data: filteredCustomers, pagination }, { status: 200 });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err },
      { status: 500 }
    );
  }
}

