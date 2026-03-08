require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log("1. Check connessione e eventi...");
  const ev = await supabase.from('eventi_club').select('*').limit(2);
  console.log("Eventi trovati (Base):", ev.data?.length, "Errori:", ev.error?.message);

  if (ev.data?.length > 0) {
    console.log("Data prima riga eventi_club:", ev.data[0]);
  }

  console.log("\n2. Check query con JOIN getActiveEvents...");
  const j = await supabase
    .from('eventi_club')
    .select(`
      *,
      partners ( id, name, city, logo_url ),
      cards:ricompensa_card_id ( id, image_url, rarity, title_it )
    `)
    .eq('disponibile', true)
    .gte('data_fine', new Date().toISOString());

  console.log("Eventi trovati (Join):", j.data?.length, "Errori:", j.error?.message);

  if (j.error) {
    console.log("Dettagli errore JOIN:", j.error);
  }
}
check();
