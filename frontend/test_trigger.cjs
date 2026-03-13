const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Testing partner INSERT to see if a trigger fails...");
    try {
        const { error } = await supabase.from('partners').insert([{
            owner_user_id: '3d059993-5f6c-41ef-87cb-37da52290dd8',
            name: `Partner Test Trigger`,
            subscription_status: 'incomplete',
            is_active: false
        }]);
        console.log("Insert result:", error || "OK");
    } catch(e) {
        console.error("Crash:", e);
    }
}
main();
