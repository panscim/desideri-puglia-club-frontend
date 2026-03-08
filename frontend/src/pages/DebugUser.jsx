// src/pages/DebugUser.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

export default function DebugUser() {
  const [userData, setUserData] = useState(null)
  const [dbUser, setDbUser] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserData(user)

      if (user?.id) {
        const { data } = await supabase
          .from('utenti')
          .select('id, email, ruolo')
          .eq('id', user.id)
          .maybeSingle()
        setDbUser(data)
      }
    }
    load()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Debug Utente</h1>
      <pre>{JSON.stringify({ auth_uid: userData?.id, utente_tabella: dbUser }, null, 2)}</pre>
    </div>
  )
}