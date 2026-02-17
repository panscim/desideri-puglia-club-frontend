// src/utils/periods.js
// Helpers per fuso Europe/Rome + key/reset dei periodi

const TZ = 'Europe/Rome'

// Converte "adesso" nel tempo locale di Roma, restituendo una Date coerente
function romeNow(base = new Date()) {
  const parts = new Intl.DateTimeFormat('it-IT', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).formatToParts(base).reduce((acc, p) => (acc[p.type] = p.value, acc), {})
  // yyyy-mm-ddThh:mm:ss in fuso Roma
  return new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`)
}

const pad2 = (n) => String(n).padStart(2, '0')

// Calcolo ISO week key (YYYY-Www) in locale Roma
function isoWeekKeyRome(nowRome) {
  // getDay(): 0=Dom ... 6=Sab ; mappo a 1..7 con Lun=1
  const day = nowRome.getDay() || 7
  // Giovedì della settimana corrente
  const th = new Date(nowRome)
  th.setDate(nowRome.getDate() + (4 - day)) // 4=Giovedì (Lun=1,...,Dom=7)
  // Inizio anno ISO (non basta il 1 Gennaio del gregoriano; usiamo la regola del giovedì)
  const yearStart = new Date(th.getFullYear(), 0, 1)
  // Trasformo in “giorni” interi
  const week = Math.ceil((((th - yearStart) / 86400000) + 1) / 7)
  return `${th.getFullYear()}-W${pad2(week)}`
}

// Prossimo reset per cadenza (ritorna Date nel fuso del sistema ma calcolata su Roma)
function nextResetRome(cadenza, baseNow = new Date()) {
  const now = romeNow(baseNow)
  const v = String(cadenza || '').toLowerCase().trim()

  if (v === 'giornaliera' || v === 'giornaliero') {
    const reset = new Date(now)
    reset.setHours(0, 0, 0, 0) // porta a mezzanotte di oggi
    reset.setDate(reset.getDate() + 1) // +1 giorno → domani 00:00 Roma
    return reset
  }

  if (v === 'settimanale') {
    // prossimo lunedì 00:00 Roma
    const day = now.getDay() || 7 // Lun=1 ... Dom=7
    const daysToNextMonday = 8 - day
    const reset = new Date(now)
    reset.setHours(0, 0, 0, 0)
    reset.setDate(reset.getDate() + daysToNextMonday)
    return reset
  }

  if (v === 'mensile') {
    // primo giorno del mese prossimo 00:00 Roma
    const reset = new Date(now)
    reset.setHours(0, 0, 0, 0)
    reset.setMonth(reset.getMonth() + 1, 1)
    return reset
  }

  // una tantum / speciale → nessun reset
  return null
}

// Chiave periodo (mirror del backend) + resetAt
export function getPeriodKeyAndReset(cadenza, baseNow = new Date()) {
  const now = romeNow(baseNow)
  const y = now.getFullYear()
  const m = pad2(now.getMonth() + 1)
  const d = pad2(now.getDate())
  const v = String(cadenza || '').toLowerCase().trim()

  if (v === 'giornaliera' || v === 'giornaliero') {
    return { key: `${y}-${m}-${d}`, resetAt: nextResetRome(v, baseNow) }
  }
  if (v === 'settimanale') {
    return { key: isoWeekKeyRome(now), resetAt: nextResetRome(v, baseNow) }
  }
  if (v === 'mensile') {
    return { key: `${y}-${m}`, resetAt: nextResetRome(v, baseNow) }
  }
  return { key: 'permanent', resetAt: null }
}

// Solo la key (utile per coerenza FE/BE)
export function periodKeyFromCadenza(cadenza, baseNow = new Date()) {
  return getPeriodKeyAndReset(cadenza, baseNow).key
}

// “Quanto manca” in forma compatta
export function formatRemaining(toDate) {
  if (!toDate) return ''
  const diffMs = toDate.getTime() - Date.now()
  if (diffMs <= 0) return 'disponibile ora'

  const s = Math.floor(diffMs / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60

  if (h > 0) return `${h}h ${pad2(m)}m ${pad2(sec)}s`
  if (m > 0) return `${m}m ${pad2(sec)}s`
  return `${pad2(sec)}s`
}

// Helper: mostrare il countdown di reset solo quando ha senso per la UI
// Regola richieste: nessun timer quando "Disponibile" o "In revisione".
// Mostra solo quando la missione è "Completata" e c'è un prossimo reset.
export function shouldShowResetCountdown(isCompleted, isPending, resetAt) {
  return Boolean(isCompleted && resetAt instanceof Date);
}

// Helper: etichetta standardizzata per il reset
// Ritorna stringa vuota quando il timer NON va mostrato.
export function formatResetLabel(isCompleted, isPending, resetAt) {
  if (!shouldShowResetCountdown(isCompleted, isPending, resetAt)) return '';
  const remaining = formatRemaining(resetAt);
  if (!remaining) return '';
  return `Si sblocca tra ${remaining}`;
}