const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Testing user update to see if trigger fails on utenti");
    try {
        const { error } = await supabase.from('utenti').update({ partner_id: 'd1375b51-a515-449e-9c66-c59d234942bf' }).eq('id', '3d059993-5f6c-41ef-87cb-37da52290dd8');
        console.log("Update result:", error || "OK");
    } catch(e) {
        console.error("Crash:", e);
    }
}
main();
