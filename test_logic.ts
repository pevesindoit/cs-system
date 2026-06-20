import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const firstEquals = trimmed.indexOf("=");
    if (firstEquals !== -1) {
      const key = trimmed.slice(0, firstEquals).trim();
      const val = trimmed.slice(firstEquals + 1).replace(/^['"]|['"]$/g, "").trim();
      process.env[key] = val;
    }
  }
} catch (e) {}

async function testLogic() {
  const { default: supabase } = await import("./lib/db");
  
  const [branchRes, adsNameRes, leadsRes] = await Promise.all([
    supabase.from("branch").select("id, name").eq("id", "d1dd8b2d-1023-410d-bffa-a8d672850eea"),
    supabase.from("ads_name").select("id, ads_name"),
    supabase.from("leads").select("status, branch_id, ads_id").eq("branch_id", "d1dd8b2d-1023-410d-bffa-a8d672850eea").order("created_at", { ascending: false }).limit(200)
  ]);

  const branchLeads = leadsRes.data || [];
  console.log("Total leads for branch:", branchLeads.length);
  
  const hasAdsId = branchLeads.filter(l => l.ads_id !== null);
  console.log("Leads with ads_id:", hasAdsId);

  const uniqueAdsIds = Array.from(new Set(branchLeads.map((l) => l.ads_id)));
  console.log("Unique Ads IDs:", uniqueAdsIds);
}

testLogic();
