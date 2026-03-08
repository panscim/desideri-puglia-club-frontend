import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://edzwtxatihiqyvqvqqqe.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) { console.error('No key'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.rpc('validate_pin_visit', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_partner_id: '00000000-0000-0000-0000-000000000000',
    p_pin: '123456'
  })
  console.log('Error:', error)
}
run()
