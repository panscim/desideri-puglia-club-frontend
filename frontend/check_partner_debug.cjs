const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // We don't know the exact user id, so we'll look for the most recent partner
    const { data, error } = await supabase
        .from('partners')
        .select('id, name, owner_user_id, stripe_account_id, stripe_connect_account_id, charges_enabled, payouts_enabled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error(error);
    } else {
        console.log("Current Partner Record:");
        console.dir(data);
    }
}
main();
