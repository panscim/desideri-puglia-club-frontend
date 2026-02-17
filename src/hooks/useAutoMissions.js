import { useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

// 🧠 questo file controlla le missioni automatiche
export function useAutoMissions() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    checkDailyMissions()
  }, [user])

  async function checkDailyMissions() {
    const today = new Date().toISOString().split('T')[0] // esempio: 2025-10-29

    try {
      // 1️⃣ LOGIN_DAILY → accedi una volta al giorno (+1 punto)
      await completeMission('LOGIN_DAILY', today)

      // 2️⃣ VISIT_SHOP → visita lo shop (+2 punti)
      const shopVisited = localStorage.getItem('visitedShopToday')
      if (shopVisited === today) {
        await completeMission('VISIT_SHOP', today)
      }

      // 3️⃣ CHECK_PROFILE → controlla il profilo (+1 punto)
      const profileVisited = localStorage.getItem('visitedProfileToday')
      if (profileVisited === today) {
        await completeMission('CHECK_PROFILE', today)
      }

      // 4️⃣ 3_LOGIN_WEEK → entra almeno 3 volte a settimana (+5 punti)
      await checkWeeklyLogins(3, 5, '3_LOGIN_WEEK')

      // 5️⃣ 7_LOGIN_WEEK → entra 7 giorni su 7 (+10 punti)
      await checkWeeklyLogins(7, 10, '7_LOGIN_WEEK')

    } catch (err) {
      console.error('Errore missioni automatiche:', err)
    }
  }

  async function completeMission(code, today) {
    // controlla se la missione è già completata oggi
    const { data: existing } = await supabase
      .from('missioni_inviate')
      .select('*')
      .eq('id_utente', user.id)
      .eq('period_key', today)
      .eq('codice_missione', code)
      .maybeSingle()

    if (existing) return // già completata oggi

    // recupera info missione
    const { data: mission } = await supabase
      .from('missioni_catalogo')
      .select('*')
      .eq('codice', code)
      .single()

    if (!mission) return

    // aggiunge la missione completata
    await supabase.from('missioni_inviate').insert([
      {
        id_utente: user.id,
        id_missione: mission.id,
        stato: 'Approvata',
        punti_approvati: mission.punti,
        period_key: today
      }
    ])

    toast.success(`+${mission.punti} punti per la missione ${mission.titolo}! 🎯`)
  }

  async function checkWeeklyLogins(requiredDays, rewardPoints, code) {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // inizio settimana (domenica)
    const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth()+1}-${weekStart.getDate()}`

    const { data: logins } = await supabase
      .from('missioni_inviate')
      .select('*')
      .eq('id_utente', user.id)
      .eq('codice_missione', 'LOGIN_DAILY')

    const weeklyCount = logins?.filter(l => {
      const date = new Date(l.period_key)
      return date >= weekStart && date <= now
    }).length || 0

    if (weeklyCount >= requiredDays) {
      const { data: existing } = await supabase
        .from('missioni_inviate')
        .select('*')
        .eq('id_utente', user.id)
        .eq('codice_missione', code)
        .eq('period_key', weekKey)
        .maybeSingle()

      if (!existing) {
        await supabase.from('missioni_inviate').insert([
          {
            id_utente: user.id,
            stato: 'Approvata',
            punti_approvati: rewardPoints,
            period_key: weekKey,
            codice_missione: code
          }
        ])
        toast.success(`🎉 Missione settimanale completata: ${code}!`)
      }
    }
  }

  // restituisce funzioni per segnalare visite
  return {
    markShopVisit: () => {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('visitedShopToday', today)
    },
    markProfileVisit: () => {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem('visitedProfileToday', today)
    }
  }
}