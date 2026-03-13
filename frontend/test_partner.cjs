const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Updating partner status...");
    const { data: partner, error } = await supabase
        .from('partners')
        .update({
            subscription_status: 'active',
            must_choose_plan_once: false
        })
        .eq('owner_user_id', '3d059993-5f6c-41ef-87cb-37da52290dd8')
        .select()
        .single();
        
    console.dir({ partner, error }, { depth: null });
}
main();
