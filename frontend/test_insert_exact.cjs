const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // We cannot query pg_trigger directly through the REST API without an RPC.
    // However, the error is happening ONLY when calling the Vercel API.
    // Let's look closely at `create-partner-subscription-checkout.js` again. 
    // Are there any other queries happening there?
    // Wait, let's reproduce the exact same query that fails.
    
    console.log("Testing exact partner insert...");
    const { data: inserted, error: insertErr } = await supabase
        .from('partners')
        .insert([
          {
            owner_user_id: '3d059993-5f6c-41ef-87cb-37da52290dd8',
            name: `Partner Setup Test`,
            subscription_status: 'incomplete',
            is_active: false,
          },
        ])
        .select('*');
        
    if (insertErr) {
        console.error("Insert Err:", insertErr);
    } else {
        console.log("Insert OK", inserted[0].id);
        
        // Now delete it to clean up
        await supabase.from('partners').delete().eq('id', inserted[0].id);
    }
}
main();
