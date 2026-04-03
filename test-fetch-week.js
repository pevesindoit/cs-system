const payload = {
  start_date: "2026-03-01",
  end_date: "2026-04-04",
  interval: "week"
};

fetch("http://localhost:3000/api/get/get-report", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
}).then(res => res.json()).then(data => {
  console.log(JSON.stringify(data.data.ads.slice(0, 3), null, 2));
  console.log("ads mapping:", data.data.ads.length);
}).catch(console.error);
