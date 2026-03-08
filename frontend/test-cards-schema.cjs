require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('cards').select('*').limit(1);
  console.log("Keys:", data && data[0] ? Object.keys(data[0]) : "No data", "Error:", error);
}
test().catch(console.error);
