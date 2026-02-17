import { supabase } from '../services/supabase'

// Questa funzione serve a completare una missione automatica
export async function completeAutomaticMission(userId, codice) {
  try {
    // 1️⃣ Cerchiamo la missione con quel codice e tipo "automatica"
    const { data: mission, error } = await supabase
      .from('missioni_catalogo')
      .select('*')
      .eq('codice', codice)
      .eq('tipo_missione', 'automatica')
      .eq('attiva', true)
      .single()

    if (error || !mission) return // Se non la trova, non fa nulla

    // 2️⃣ Controlliamo se l'utente l'ha già completata
    const { data: already, error: checkError } = await supabase
      .from('missioni_inviate')
      .select('id')
      .eq('id_utente', userId)
      .eq('id_missione', mission.id)
      .maybeSingle()

    if (checkError) throw checkError
    if (already) return // già completata

    // 3️⃣ Se non ancora completata, creiamo la riga in missioni_inviate
    const { error: insertError } = await supabase
      .from('missioni_inviate')
      .insert([
        {
          id_utente: userId,
          id_missione: mission.id,
          stato: 'Approvata',
          punti_approvati: mission.punti,
          prova_url: null,
          data_revisione: new Date().toISOString(),
          period_key: 'permanent'
        }
      ])

    if (insertError) throw insertError

    console.log(`✅ Missione automatica completata: ${mission.titolo}`)
    return mission
  } catch (err) {
    console.error('Errore missione automatica:', err)
  }
}