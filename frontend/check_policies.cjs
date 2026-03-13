const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.rpc('get_policies', { table_name: 'partners' });
    if (error) {
        // Fallback to direct query if RPC doesn't exist
        const { data: pgData, error: pgError } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'partners');
        
        if (pgError) {
             console.error("Could not fetch policies:", pgError);
             // Try another way: query pg_policy table
             const { data: qData, error: qError } = await supabase.from('pg_policy').select('*');
             console.log("pg_policy count:", qData?.length);
        } else {
            console.log("Policies for 'partners':");
            console.dir(pgData);
        }
    } else {
         console.dir(data);
    }
}
main();
