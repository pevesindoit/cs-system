
import supabase from "./lib/db";

async function checkLeadsSchema() {
    const { data, error } = await supabase.from('leads').select('*').limit(1);
    if (data && data.length > 0) {
        console.log("Sample Lead:", data[0]);
        console.log("nomor_hp type:", typeof data[0].nomor_hp);
    }
}
checkLeadsSchema();
