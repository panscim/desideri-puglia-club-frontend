const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: evs, error } = await supabase.from('partner_events_created').select(`*, partners(*)`).limit(5);
    if (error) console.error("ERR", error);
    console.log(JSON.stringify(evs, null, 2));
}

main();
