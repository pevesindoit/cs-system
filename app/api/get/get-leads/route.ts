import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  const {
    user_id,
    date,
    page = 1,
    limit = 50
  } = await req.json();

  try {
    let query = supabase
      .from("leads")
      .select(
        "*, platform:platform_id(name,id), channel:channel_id(name,id), keterangan_leads:keterangan_leads(name,id), branch:branch_id(name,id), pic:pic_id(name,id)",
        { count: "exact" }
      )
      .eq("user_id", user_id);

    // Apply Date Filter (Default to Today if provided, otherwise handle as before?)
    // The requirement is "only show leads from 1 day".
    // If 'date' is passed, filter by that date.
    if (date) {
      const start = `${date} 00:00:00+00`;
      const end = `${date} 23:59:59+00`;
      query = query.gte("updated_at", start).lte("updated_at", end);
    }

    // Sort
    query = query
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    // Pagination
    const pageInt = parseInt(page as string);
    const limitInt = parseInt(limit as string);
    const startIndex = (pageInt - 1) * limitInt;
    const endIndex = startIndex + limitInt - 1; // Supabase range is inclusive

    query = query.range(startIndex, endIndex);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const pagination = {
      totalItems: count || 0,
      totalPages: Math.ceil((count || 0) / limitInt),
      currentPage: pageInt,
      limit: limitInt
    }

    return NextResponse.json({ data, pagination }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err },
      { status: 500 }
    );
  }
}
