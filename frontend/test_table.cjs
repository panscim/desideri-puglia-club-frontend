const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Checking if missioni_catalogo exists...");
    const { data, error } = await supabase.from('missioni_catalogo').select('id').limit(1);
    
    if (error) {
        console.error("EXISTS ERR:", error);
    } else {
        console.log("Table exists, row count checked:", data?.length);
    }
}
main();
