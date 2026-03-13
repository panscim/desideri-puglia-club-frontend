const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Testing exact partner insert WITH SERVICE ROLE...");
    const { data: inserted, error: insertErr } = await supabase
        .from('partners')
        .insert([{
            owner_user_id: '3d059993-5f6c-41ef-87cb-37da52290dd8',
            name: `Partner Setup Test`,
            subscription_status: 'incomplete',
            is_active: false,
        }]);
        
    if (insertErr) {
        console.error("Insert Err Details:", insertErr.message, insertErr.details, insertErr.hint);
    } else {
        console.log("Insert OK");
    }
}
main();
