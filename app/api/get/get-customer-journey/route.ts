import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      page = 1,
      limit = 5,
      search = "",
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
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select(
          "*, platform:platform_id(name,id), channel:channel_id(name,id), keterangan_leads:keterangan_leads(name,id), branch:branch_id(name,id), pic:pic_id(name,id)"
        )
        .in("costumer_id", customerIds)
        .order("updated_at", { ascending: false });

      if (!leadsError) {
        leadsData = leads || [];
      }
    }

    // Group leads by customer
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
