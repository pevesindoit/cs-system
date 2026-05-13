import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("Checking branch table...");
    const { data: branches, error: bError } = await supabase.from('branch').select('id, name').limit(5);
    if (bError) console.error(bError);
    else console.log("Branches:", branches);

    console.log("\nChecking leads table...");
    const { data: leads, error: lError } = await supabase.from('leads').select('branch_id').limit(5);
    if (lError) console.error(lError);
    else console.log("Leads branch_ids:", leads);
}

checkData();
