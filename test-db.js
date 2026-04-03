const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zeqnxwvzbbfkszuanfux.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcW54d3Z6YmJma3N6dWFuZnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDk3NTUsImV4cCI6MjA4MDgyNTc1NX0.6E_4fhjYzKzb_e1SL-Fslf-uMPYB8jd3eyokSitmu4E';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('advertiser_data')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching:", error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkData();
