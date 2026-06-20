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

async function checkDb() {
  try {
    const { default: supabase } = await import("./lib/db");
    
    console.log("Fetching latest leads...");
    const { data: leads } = await supabase.from("leads").select("id, ads_id, branch_id, created_at").order('created_at', { ascending: false }).limit(5);
    console.log("Latest leads:", leads);

  } catch (err: any) {
    console.error(err);
  }
}

checkDb();
