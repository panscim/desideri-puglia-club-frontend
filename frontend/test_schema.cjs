const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Checking DB triggers...");
    // To execute raw SQL, we will just call a non-existent table and hope the error isn't helpful,
    // actually Supabase doesn't let us run raw sql directly via JS client without RPC.
    // Instead I'll use the management API or just REST. Let's try downloading the schema type via npx if possible,
    // or querying a known table that might relate to stripe.
    
    // As a workaround, just log out the latest partners and see if there are missing fields
    const { data: partners } = await supabase.from('partners').select('*').limit(1);
    console.log("Partners fields:", Object.keys(partners[0] || {}));
}
main();
