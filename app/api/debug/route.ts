
import supabase from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const { data: targets, error } = await supabase.from('target').select('id');
    if (error) return NextResponse.json({ error });

    const counts: Record<string, number> = {};
    targets?.forEach(t => {
        counts[t.id] = (counts[t.id] || 0) + 1;
    });

    const duplicates = Object.entries(counts).filter(([id, count]) => count > 1);
    
    return NextResponse.json({ 
        total_rows: targets?.length,
        unique_ids: Object.keys(counts).length,
        duplicates: duplicates.length > 0 ? duplicates : "No duplicates found based on id"
    });
}
