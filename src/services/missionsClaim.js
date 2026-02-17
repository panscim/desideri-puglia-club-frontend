// src/services/missionsClaim.js
import { supabase } from '../services/supabase'
import { getPeriodKeyAndReset } from '../utils/periods' // <-- reset calendar-based (Europe/Rome)

/**
 * Claim mission a pulsante (button/bottone)
 * - Usa period_key calcolata in base alla cadenza (giornaliera/settimanale/mensile)
 * - Impedisce doppio claim nello stesso periodo
 * - Le missioni "speciali/una tantum" si possono fare una sola volta (se approvate)
 */
export async function claimMission({ missionId, userId }) {
  try {
    if (!missionId || !userId) {
      return { ok: false, reason: 'params_missing' }
    }

    // 1) Missione
    const { data: mission, error: missionErr } = await supabase
      .from('missioni_catalogo')
      .select('*')
      .eq('id', missionId)
      .single()

    if (missionErr || !mission) {
      return { ok: false, reason: 'mission_not_found', error: missionErr }
    }

    // accetto "button" / "bottone"
    const tipo = String(mission.tipo_verifica || '').toLowerCase().trim()
    if (tipo !== 'button' && tipo !== 'bottone') {
      return { ok: false, reason: 'wrong_verification_type' }
    }

    // 2) Chiave periodo basata su calendario (Europe/Rome)
    const { key: periodKey } = getPeriodKeyAndReset(mission.cadenza)

    // 3) Regola una-tantum
    const cad = String(mission.cadenza || '').toLowerCase().trim()
    const isOneOff = ['speciale', 'una tantum', 'permanente', 'special', 'one_off'].includes(cad)

    // 4) Ultima submission dell’utente per la missione
    const { data: existing, error: exErr } = await supabase
      .from('missioni_inviate')
      .select('id, stato, period_key, data_creazione')
      .eq('id_utente', userId)
      .eq('id_missione', missionId)
      .order('data_creazione', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (exErr) {
      return { ok: false, reason: 'read_failed', error: exErr }
    }

    if (existing) {
      // se una-tantum ed è stata già approvata
      if (isOneOff && existing.stato === 'Approvata') {
        return { ok: false, reason: 'already_claimed_once' }
      }
      // se stessa period_key (giorno/settimana/mese corrente) ed esiste già un invio
      if (existing.period_key === periodKey) {
        if (existing.stato === 'In attesa' || existing.stato === 'Approvata') {
          return { ok: false, reason: 'already_claimed_period' }
        }
      }
    }

    // 5) Inserisci invio (RLS: id_utente deve combaciare con auth.uid())
    const payload = {
      id_utente: userId,
      id_missione: missionId,
      period_key: periodKey,
      stato: 'In attesa',       // il trigger DB accrediterà i punti quando sarà "Approvata"
      prova_url: null,
      nota_utente: null,
      punti_approvati: 0,
    }

    const { error: insErr } = await supabase.from('missioni_inviate').insert([payload])
    if (insErr) {
      // unique su (id_utente, id_missione, period_key)
      const msg = String(insErr.message || '').toLowerCase()
      if (insErr.code === '23505' || msg.includes('duplicate')) {
        return { ok: false, reason: 'already_claimed_period' }
      }
      return { ok: false, reason: 'insert_failed', error: insErr }
    }

    return { ok: true }
  } catch (e) {
    return { ok: false, reason: 'unexpected', error: e }
  }
}