const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const partnerId = 'fd102bbb-801a-4277-96f7-fe125ed86a31';
    console.log(`Trying to delete partner ID: ${partnerId} with ANON_KEY`);

    const { error } = await supabase.from('partners').delete().eq('id', partnerId);
    if (error) {
        console.error("Deletion failed with ANON_KEY:", error.message);
    } else {
        console.log("Partner 'Casa stella' deleted successfully (or RLS silently ignored it).");
    }
}

main();
