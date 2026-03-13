const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase
        .from('partners')
        .select('id, name')
        .eq('id', 'fd102bbb-801a-4277-96f7-fe125ed86a31');
        
    if (error) {
        console.error(error);
    } else {
        if (data.length === 0) {
            console.log("SUCCESS: Partner 'Casa stella' is no longer in the DB.");
        } else {
            console.log("FAILURE: Partner 'Casa stella' still exists in the DB.");
            console.dir(data);
        }
    }
}
main();
