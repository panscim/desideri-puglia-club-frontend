import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://edzwtxatihiqyvqvqqqe.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: partner } = await supabase.from('partners').select('id, slug').eq('slug', 'sg-metal').maybeSingle()
  // Try 'sgmetal'
  const { data: partner2 } = await supabase.from('partners').select('id, slug').eq('slug', 'sgmetal').maybeSingle()
  
  const pId = partner?.id || partner2?.id || '28bdcacc-dbde-4412-a7d0-1a6ec0b5cd92' // fallback to random
  
  console.log('Partner ID used:', pId)
  
  const { data, error } = await supabase.rpc('validate_pin_visit', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_partner_id: pId,
    p_pin: '123456'
  })
  console.log('Error:', error)
  console.log('Data:', data)
}
run()
