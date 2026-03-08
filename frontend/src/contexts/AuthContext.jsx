import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Controlla la sessione corrente all'avvio
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Ascolta i cambi di autenticazione
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 🔥 Solo profilo base, SENZA cosmetici
  const loadProfile = async (userId) => {
    try {
      setLoading(true)

      const { data: baseProfile, error: profileError } = await supabase
        .from('utenti')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // mantengo la chiave activeCosmetics vuota solo per non rompere niente altrove
      const fullProfile = {
        ...baseProfile,
        activeCosmetics: {}
      }

      setProfile(fullProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = () => {
    if (user) {
      loadProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    refreshProfile,
    activeCosmetics: profile?.activeCosmetics || {},
    isAdmin: profile?.ruolo === 'Admin' || profile?.ruolo === 'Moderatore',
    isModerator: profile?.ruolo === 'Moderatore'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}