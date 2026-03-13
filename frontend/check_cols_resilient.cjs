const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // Just try to select one row to see columns in the response
    const { data, error } = await supabase.from('partners').select('*').limit(1);
    if (error) {
        console.error("Select error:", error);
    } else {
        if (data.length > 0) {
            console.log("Columns found in first partner record:");
            console.log(Object.keys(data[0]));
        } else {
            console.log("No partners found, cannot check columns this way.");
        }
    }
}
main();
