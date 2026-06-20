import supabase from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [platformRes, channelRes, keteranganLeadsRes, picRes, branchRes, adsNameRes] =
      await Promise.all([
        supabase.from("platform").select("*"),
        supabase.from("channel").select("*"),
        supabase.from("keterangan_leads").select("*"),
        supabase.from("pic").select("*"),
        supabase.from("branch").select("*"),
        supabase.from("ads_name").select("*"),
      ]);

    const errors =
      platformRes.error ||
      channelRes.error ||
      keteranganLeadsRes.error ||
      picRes.error ||
      branchRes.error ||
      adsNameRes.error;

    if (errors) {
      return NextResponse.json({ error: errors.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        platform: platformRes.data,
        channel: channelRes.data,
        keteranganLeads: keteranganLeadsRes.data,
        pic: picRes.data,
        branch: branchRes.data,
        adsName: adsNameRes.data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
