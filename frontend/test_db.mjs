import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://edzwtxatihiqyvqvqqqe.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: user } = await supabase.auth.signInWithPassword({
    email: 'test@desideridipuglia.it', // fake login or we can just try invoking
    password: 'password'
  })
  
  // Actually, we don't have a login. Let's list the details of the RPC from Postgres.
  // Wait, I can't run pure SQL easily without the postgres connection string.
  // Let me just execute the RPC and print `error.message`, `error.details`, `error.hint`.
  const { data, error } = await supabase.rpc('validate_pin_visit', {
    p_user_id: '123e4567-e89b-12d3-a456-426614174000',
    p_partner_id: '123e4567-e89b-12d3-a456-426614174000',
    p_pin: '1234'
  })
  if (error) {
    console.log('Error Data:', JSON.stringify(error, null, 2))
  } else {
    console.log('Success:', data)
  }
}
run()
