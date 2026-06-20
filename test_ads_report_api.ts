import axios from "axios";

async function testApi() {
  try {
    const range = {
      start_date: "2026-05-01",
      end_date: "2026-06-30"
    };
    
    console.log("Sending payload:", range);
    const res = await axios.post("http://localhost:3000/api/get/get-ads-report", range);
    
    const branch = res.data.data.find((b: any) => b.branch_id === 'd1dd8b2d-1023-410d-bffa-a8d672850eea');
    console.log("Found Branch d1dd8b2d-1023-410d-bffa-a8d672850eea:", branch);
    
    // check if it's in the other branch
    const branch2 = res.data.data.find((b: any) => b.branch_id === '981fbf7d-c697-4d6a-844b-395a3acef7c6');
    console.log("Found Branch 981fbf7d-c697-4d6a-844b-395a3acef7c6 (sengkang):", branch2);

  } catch (err: any) {
    console.error("Error status:", err.response?.status);
  }
}

testApi();
