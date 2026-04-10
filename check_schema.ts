
import supabase from "./lib/db";

async function checkSchema() {
    try {
        const { data, error } = await supabase.from('target').select('*').limit(5);
        if (error) {
            console.error("Supabase Error:", error);
        } else {
            console.log("Total rows found:", data.length);
            if (data.length > 0) {
                console.log("Columns:", Object.keys(data[0]));
                console.log("Rows:", JSON.stringify(data, null, 2));
            } else {
                console.log("Target table is empty.");
            }
        }
    } catch (err) {
        console.error("Runtime Error:", err);
    }
}

checkSchema();
