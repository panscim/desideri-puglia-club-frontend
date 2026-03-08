import { createClient } from '@supabase/supabase-js'

// Queste variabili saranno configurate dopo aver creato il progetto Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key-for-development'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Funzioni helper per l'autenticazione
export const authService = {
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('utenti')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  }
}
