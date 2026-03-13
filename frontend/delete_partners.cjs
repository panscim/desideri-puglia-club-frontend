const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Fetching partners to clear them out...");
    const { data: partners, error } = await supabase.from('partners').select('id, name');
    
    if (error) {
        console.error("Fetch error:", error);
        return;
    }
    
    // Find "sgmetal" or "sg metal"
    const toKeep = partners.filter(p => p.name && p.name.toLowerCase().replace(/\s/g, '').includes('sgmetal'));
    
    console.log("Found partners to keep:", toKeep.map(p => p.name));
    
    const keepIds = toKeep.map(p => p.id);
    
    const idsToDelete = partners.filter(p => !keepIds.includes(p.id)).map(p => p.id);
    
    console.log(`Will delete ${idsToDelete.length} partners. Keeping ${keepIds.length}.`);
    
    if (idsToDelete.length > 0) {
        for (const id of idsToDelete) {
             const { error: delError } = await supabase.from('partners').delete().eq('id', id);
             if (delError) console.error(`Failed to delete ${id}:`, delError.message);
        }
        console.log("Cleanup complete!");
    } else {
        console.log("No partners to delete.");
    }
}
main();
