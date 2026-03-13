const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

// Use service role key to bypass RLS and trigger the DB error
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Testing partner update with service role:", supabaseKey ? "Key present" : "No key");
    const { data, error } = await supabase.from('partners').update({ name: 'Test Name 2' }).eq('id', 'd1375b51-a515-449e-9c66-c59d234942bf');
    if (error) {
        console.error("Update ERR:", error);
    } else {
        console.log("Update OK", data);
    }
}
main();
