require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching all events...");
  const { data: allData, error: allErr } = await supabase.from('eventi_club').select('*');
  console.log("All Events:", allData?.length, allErr);

  if (allData && allData.length > 0) {
    console.log("First Event Sample:", allData[0]);
  }
}

test();
