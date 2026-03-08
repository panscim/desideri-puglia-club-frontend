require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('partners').select('*').limit(1);
  if (data && data.length > 0) console.log("KEYS:", Object.keys(data[0]).join(", "));
  else console.log("ERROR/EMPTY:", error);
}
test();
