import fs from "fs";
import path from "path";
import axios from "axios";

// Load .env.local
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
} catch (e) {
  console.error("Failed to read .env.local", e);
}

async function test() {
  try {
    const { default: supabase } = await import("./lib/db");
    // Get a valid ads_name id
    const { data: adsNames } = await supabase.from("ads_name").select("id").limit(1);
    const adsId = adsNames && adsNames.length > 0 ? adsNames[0].id : null;

    console.log("Using ads_id:", adsId);

    const payload = {
      name: "Test Lead Ads ID",
      address: "Test Address",
      platform_id: "33d30171-5646-4231-af2d-1650ca595e39",
      channel_id: 1,
      keterangan_leads_id: 1,
      status: "hold",
      nominal: 0,
      pic_id: 1,
      branch_id: "d1382b33-9052-4469-a394-8dd99457d1be",
      reason: "",
      user_id: "1eeaef44-4f96-405a-b9f1-482d48745668",
      nomor_hp: "81234567891",
      ads_id: adsId
    };
    
    console.log("Sending payload...");
    const res = await axios.post("http://localhost:3000/api/add/add-lead", payload);
    console.log("Status:", res.status);
    console.log("Response:", res.data);
  } catch (err: any) {
    console.error("Error status:", err.response?.status);
    console.error("Error response data:", err.response?.data);
  }
}

test();
