// src/services/autoMissions.js
import { supabase } from './supabase'

/**
 * ✅ Elenco missioni automatiche base (per UI)
 * Nota: lato premio si prende quello dal DB (punti/desideri),
 * qui servono solo per mostrare i titoli/descrizioni.
 */
export const autoMissionsList = [
  {
    codice: 'LOGIN_DAILY',
    titolo: 'Accedi oggi',
    descrizione: 'Entra almeno una volta oggi nella tua dashboard.',
    cadenza: 'giornaliera',
  },
  {
    codice: 'VISIT_SHOP',
    titolo: 'Visita lo Shop',
    descrizione: 'Dai un’occhiata alle offerte nello Shop.',
    cadenza: 'giornaliera',
  },
  {
    codice: 'CHECK_PROFILE',
    titolo: 'Controlla il profilo',
    descrizione: 'Apri la pagina profilo per rivedere i tuoi progressi.',
    cadenza: 'giornaliera',
  },
]

/**
 * 🧠 calcola inizio periodo (giorno / settimana / mese)
 */
function getPeriodStart(cadenza) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)

  if (String(cadenza).toLowerCase() === 'settimanale') {
    const startOfWeek = new Date(startOfDay)
    // Lunedì come inizio (0 = domenica → trasformo in 0..6 con lunedì=0)
    startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7))
    return startOfWeek
  }
  if (String(cadenza).toLowerCase() === 'mensile') {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  }
  // giornaliera o altro → giorno
  return startOfDay
}

/**
 * 🛠️ assegna premio all’utente (punti o desideri)
 */
async function awardUser(userId) {
  // Aggiorniamo unicamente l'ultima attività all'interno del DB
  await supabase
    .from('utenti')
    .update({
      ultima_attivita: new Date().toISOString(),
    })
    .eq('id', userId)
}

/**
 * 🚀 completeAutoMission('LOGIN_DAILY', userId)
 * - legge la missione dal DB (id, cadenza, premi)
 * - controlla se già fatta nel periodo
 * - se no: inserisce in missioni_inviate (Approvata) + premia l’utente
 */
export async function completeAutoMission(code, userId) {
  if (!code || !userId) return { ok: false, reason: 'missing_params' }

  // 1) prendo la missione dal DB (solo campi utili)
  const { data: mission, error: mErr } = await supabase
    .from('missioni_catalogo')
    .select('id, cadenza, attiva')
    .eq('codice', code)
    .eq('attiva', true)
    .maybeSingle()

  // se non esiste → esco silenzioso
  if (mErr || !mission) return { ok: false, reason: 'mission_not_found' }

  // 2) calcolo inizio periodo
  const from = getPeriodStart(mission.cadenza).toISOString()
  const isSpecial = String(mission.cadenza || '').toLowerCase() === 'speciale'

  // 3) controllo già fatta (se non è speciale)
  if (!isSpecial) {
    const { data: already, error: aErr } = await supabase
      .from('missioni_inviate')
      .select('id')
      .eq('id_utente', userId)
      .eq('id_missione', mission.id)
      .gte('data_creazione', from)
      .limit(1)

    if (!aErr && already && already.length) {
      return { ok: false, reason: 'already_done' }
    }
  }

  // 4) inserisco log “Approvata”
  const insertPayload = {
    id_utente: userId,
    id_missione: mission.id,
    stato: 'Approvata',
    prova_url: null,
    nota_utente: null,
  }

  const { error: iErr } = await supabase
    .from('missioni_inviate')
    .insert([insertPayload])

  if (iErr) return { ok: false, reason: 'insert_failed' }

  // 5) Registro l'azione all'utente
  try {
    await awardUser(userId)
  } catch {
    // se fallisce, pazienza: il log è inserito
  }

  return { ok: true }
}