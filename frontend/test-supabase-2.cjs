require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log("Fetching active events...");
  const { data, error } = await supabase
    .from('eventi_club')
    .select('*, partners(id, nome), cards:ricompensa_card_id(id, title_it)')
    .eq('disponibile', true)
    .gte('data_fine', new Date().toISOString());
  console.log("Active Events:", data?.length, error);
}

test();
