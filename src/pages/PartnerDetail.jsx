import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  MapPin,
  Globe,
  Instagram,
  Clock,
  Star,
  MapPinned,
  BadgeCheck,
  MessageCircle,
  ArrowLeft,
  Lock,
  Delete,
  CheckCircle2,
  XCircle,
  Navigation,
  Unlock,
  ChevronRight,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const FALLBACK_LOGO = 'https://placehold.co/64x64?text=Logo'

// ── Constants ──
const MAX_ATTEMPTS = 3
const LOCKOUT_MINUTES = 15
const PIN_LENGTH = 4

// ── Haptic helpers ──
function hapticLight() { try { navigator.vibrate?.(30) } catch { } }
function hapticSuccess() { try { navigator.vibrate?.([100, 50, 200]) } catch { } }
function hapticError() { try { navigator.vibrate?.([200, 100, 200, 100, 200]) } catch { } }

// ── Lockout helpers ──
function getLockoutKey(pid) { return `pinAttempts_${pid}` }
function getLockoutState(pid) {
  try { const r = localStorage.getItem(getLockoutKey(pid)); return r ? JSON.parse(r) : { attempts: 0, lockedUntil: null } }
  catch { return { attempts: 0, lockedUntil: null } }
}
function setLockoutState(pid, state) { localStorage.setItem(getLockoutKey(pid), JSON.stringify(state)) }
function clearLockoutState(pid) { localStorage.removeItem(getLockoutKey(pid)) }

// Helper: UUID check
const isUuid = (v) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

// ── Opening Hours Helpers ──
const weekdayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

const parseTimeToMinutes = (t) => {
  if (!t) return null
  const parts = String(t).split(':')
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10)
}

const formatRangeLabel = (open, close) => {
  if (!open || !close) return null
  return `${String(open).slice(0, 5)} – ${String(close).slice(0, 5)}`
}

const getOpeningStatus = (openingHours) => {
  if (!openingHours?.length) return null
  const now = new Date()
  const weekday = (now.getDay() + 6) % 7
  const today = openingHours.find((h) => h.weekday === weekday)
  if (!today) return null

  const ranges = []
  if (today.open_time && today.close_time) {
    const s = parseTimeToMinutes(today.open_time), e = parseTimeToMinutes(today.close_time)
    if (s != null && e != null) ranges.push({ start: s, end: e })
  }
  if (today.open_time_2 && today.close_time_2) {
    const s = parseTimeToMinutes(today.open_time_2), e = parseTimeToMinutes(today.close_time_2)
    if (s != null && e != null) ranges.push({ start: s, end: e })
  }
  if (!ranges.length) return null

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const openNow = ranges.some((r) => r.start <= nowMinutes && nowMinutes < r.end)

  const parts = [
    formatRangeLabel(today.open_time, today.close_time),
    formatRangeLabel(today.open_time_2, today.close_time_2),
  ].filter(Boolean)

  return { openNow, todayLabel: parts.join(', '), weekday }
}

// ── Missions icon helper ──
const missionIcon = (tipo) => {
  const t = String(tipo || '').toLowerCase()
  if (t === 'live') return <img src="/polaroid.png" alt="live" className="w-5 h-5 object-contain" />
  if (t === 'galleria') return <img src="/galleria.png" alt="galleria" className="w-5 h-5 object-contain" />
  if (t === 'link') return <img src="/link.png" alt="link" className="w-5 h-5 object-contain" />
  if (t === 'button' || t === 'bottone') return <span className="text-base">🖱️</span>
  return <span className="text-base">✍️</span>
}

// ═══════════════════════════════════════════════════
//  INLINE PIN OVERLAY
// ═══════════════════════════════════════════════════
function PinOverlay({ partner, user, refreshProfile, onClose, onSuccess }) {
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [lockout, setLockout] = useState(getLockoutState(partner.id))
  const [shakeAnimation, setShakeAnimation] = useState(false)

  const isLocked = lockout.lockedUntil && new Date(lockout.lockedUntil) > new Date()
  const lockoutRemaining = isLocked
    ? Math.max(0, Math.ceil((new Date(lockout.lockedUntil).getTime() - Date.now()) / 60000))
    : 0

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Refresh lockout timer
  useEffect(() => {
    const interval = setInterval(() => {
      const state = getLockoutState(partner.id)
      if (state.lockedUntil && new Date(state.lockedUntil) <= new Date()) {
        clearLockoutState(partner.id)
        setLockout({ attempts: 0, lockedUntil: null })
      } else {
        setLockout(state)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [partner.id])

  const submitPin = async (pinValue) => {
    if (submitting) return
    setSubmitting(true)
    setResult(null)

    try {
      const { data, error } = await supabase.rpc('validate_pin_visit', {
        p_user_id: user.id,
        p_partner_id: partner.id,
        p_pin: pinValue,
      })
      if (error) throw error

      if (data.success) {
        hapticSuccess()
        setResult(data)
        clearLockoutState(partner.id)
        refreshProfile?.()
        // Auto-close after 2s with success callback
        setTimeout(() => { onSuccess?.(); onClose() }, 2000)
      } else {
        hapticError()
        setShakeAnimation(true)
        setTimeout(() => setShakeAnimation(false), 500)

        const currentState = getLockoutState(partner.id)
        const newAttempts = currentState.attempts + 1
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
          setLockoutState(partner.id, { attempts: newAttempts, lockedUntil })
          setLockout({ attempts: newAttempts, lockedUntil })
        } else {
          setLockoutState(partner.id, { attempts: newAttempts, lockedUntil: null })
          setLockout({ attempts: newAttempts, lockedUntil: null })
        }

        setResult(data)
        setTimeout(() => { setPin(''); setResult(null) }, 1500)
      }
    } catch (e) {
      console.error(e)
      hapticError()
      toast.error('Errore di connessione. Riprova.')
      setPin('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDigit = useCallback((digit) => {
    if (submitting || result?.success || isLocked) return
    hapticLight()
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev
      const next = prev + digit
      if (next.length === PIN_LENGTH) setTimeout(() => submitPin(next), 150)
      return next
    })
  }, [submitting, result, isLocked])

  const handleDelete = useCallback(() => {
    if (submitting || result?.success) return
    hapticLight()
    setPin((prev) => prev.slice(0, -1))
  }, [submitting, result])

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del']

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #12161f 100%)', paddingTop: 'env(safe-area-inset-top, 20px)' }}>
      {/* Decorative glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #d4a94a 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-8 pb-6 shadow-sm" style={{ backgroundColor: 'rgba(18,22,31,0.5)', backdropFilter: 'blur(10px)' }}>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={partner.logo_url || FALLBACK_LOGO}
            onError={(e) => (e.currentTarget.src = FALLBACK_LOGO)}
            alt={partner.name}
            className="w-10 h-10 rounded-xl object-cover"
            style={{ border: '2px solid rgba(212,169,74,0.4)' }}
          />
          <div className="min-w-0">
            <p className="font-bold text-white truncate text-sm">{partner.name}</p>
            <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {partner.city} · {partner.category}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-10">

        {/* Success State */}
        {result?.success ? (
          <div className="text-center animate-fadeIn w-full max-w-sm">
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-60"
                style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />
              <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}>
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Card Sbloccata!</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{result.message}</p>
          </div>
        ) : (
          <>
            {/* Lock icon */}
            <div className="mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'rgba(212,169,74,0.12)', border: '1.5px solid rgba(212,169,74,0.3)' }}>
                <Lock className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            {/* Instruction */}
            {isLocked ? (
              <div className="w-full max-w-sm text-center p-5 rounded-2xl mb-8"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <p className="font-semibold text-red-400 text-sm">Troppi tentativi falliti</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Riprova tra {lockoutRemaining} min
                </p>
              </div>
            ) : (
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white mb-1">Inserisci il PIN</h2>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Chiedi al partner di digitare il PIN
                </p>
              </div>
            )}

            {/* PIN dots */}
            <div className={`flex gap-4 mb-8 ${shakeAnimation ? 'animate-shake' : ''}`}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full transition-all duration-200"
                  style={{
                    background: i < pin.length
                      ? (result && !result.success ? '#ef4444' : '#d4a94a')
                      : 'rgba(255,255,255,0.12)',
                    border: i < pin.length ? 'none' : '2px solid rgba(255,255,255,0.2)',
                    transform: i < pin.length ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            {/* Error message */}
            {result && !result.success && (
              <div className="flex items-center gap-2 mb-4 text-red-400 text-sm">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{result.message}</span>
              </div>
            )}

            {/* Remaining attempts */}
            {!isLocked && lockout.attempts > 0 && lockout.attempts < MAX_ATTEMPTS && (
              <p className="text-xs text-amber-400 mb-4">
                {MAX_ATTEMPTS - lockout.attempts} tentativ{MAX_ATTEMPTS - lockout.attempts === 1 ? 'o' : 'i'} rimanent{MAX_ATTEMPTS - lockout.attempts === 1 ? 'e' : 'i'}
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {digits.map((d, i) => {
                if (d === null) return <div key={i} />
                if (d === 'del') return (
                  <button
                    key={i}
                    onClick={handleDelete}
                    disabled={submitting || isLocked}
                    className="aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <Delete className="w-5 h-5 text-white" />
                  </button>
                )
                return (
                  <button
                    key={i}
                    onClick={() => handleDigit(String(d))}
                    disabled={submitting || isLocked || pin.length >= PIN_LENGTH}
                    className="aspect-square rounded-2xl flex items-center justify-center text-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-30"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {d}
                  </button>
                )
              })}
            </div>

            {/* Submitting indicator */}
            {submitting && (
              <div className="mt-6 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-400" />
                <span className="text-sm">Verifica in corso...</span>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes fadeIn {
          from{opacity:0;transform:translateY(10px)}
          to{opacity:1;transform:translateY(0)}
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════
const PartnerDetail = () => {
  const { t } = useTranslation()
  const params = useParams()
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const rawParam = params.id || params.partnerId || params.partner_id || params.slug

  const [partner, setPartner] = useState(null)
  const [openingHours, setOpeningHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg] = useState('')
  const [partnerMissions, setPartnerMissions] = useState([])
  const [showPin, setShowPin] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => { loadData() }, [rawParam])

  // Tracking View
  useEffect(() => {
    if (!partner?.id) return
    const trackView = async () => {
      try {
        await supabase.rpc('partner_track_event', { p_partner_id: partner.id, p_event_type: 'view' })
      } catch (e) {
        console.warn('Track view error:', e)
      }
    }
    trackView()
  }, [partner?.id])

  const loadData = async () => {
    try {
      setErrMsg('')
      setLoading(true)
      setPartner(null)
      setOpeningHours([])
      setPartnerMissions([])

      if (!rawParam) throw new Error(t('partner.missing_param'))

      let q = supabase.from('partners').select('*')
      q = isUuid(rawParam) ? q.eq('id', rawParam) : q.eq('slug', rawParam)

      const { data: p, error: pe } = await q.maybeSingle()
      if (pe) throw new Error(pe.message || t('partner.db_error'))
      if (!p) throw new Error(t('partner.not_found'))
      if (!p.is_active) throw new Error(t('partner.not_available'))

      setPartner(p)

      // Hours
      try {
        const { data: h } = await supabase.from('partner_opening_hours')
          .select('weekday, open_time, close_time, break_open_time, break_close_time')
          .eq('partner_id', p.id)
          .order('weekday', { ascending: true })
        setOpeningHours((h || []).map((row) => ({
          weekday: row.weekday,
          open_time: row.open_time,
          close_time: row.close_time,
          open_time_2: row.break_open_time,
          close_time_2: row.break_close_time,
        })))
      } catch { setOpeningHours([]) }

      // Check if ALREADY unlocked/visited
      if (user) {
        try {
          const { data: visitData } = await supabase
            .from('logs_transazioni')
            .select('id')
            .eq('user_id', user.id)
            .eq('partner_id', p.id)
            .eq('tipo', 'visita_pin')
            .maybeSingle()
          if (visitData) setIsUnlocked(true)
        } catch (e) {
          console.warn('Check visit error:', e)
        }
      }

      // Missions
      try {
        const { data: m } = await supabase.from('missioni_catalogo')
          .select('*').eq('attiva', true).eq('id_partner', p.id).order('punti', { ascending: false })
        setPartnerMissions(m || [])
      } catch { setPartnerMissions([]) }

    } catch (e) {
      console.error('[PartnerDetail] loadData error:', e)
      setErrMsg(e?.message || t('partner.load_error'))
    } finally {
      setLoading(false)
    }
  }

  const trackAction = async (type) => {
    if (!partner?.id) return
    try {
      await supabase.rpc('partner_track_event', { p_partner_id: partner.id, p_event_type: type })
    } catch (e) {
      console.warn('Track action error:', e)
    }
  }

  const handleUnlockSuccess = () => {
    setIsUnlocked(true)
    toast.success('🎉 Card sbloccata con successo!')
  }

  if (loading) return (
    <div className="flex justify-center min-h-[60vh] items-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-olive-dark" />
    </div>
  )

  if (errMsg || !partner) return (
    <div className="p-10 text-center">
      <p className="text-olive-dark text-lg font-serif">{errMsg || t('partner.not_found')}</p>
      <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 rounded-full bg-olive-dark text-white text-sm">
        {t('partner.back')}
      </button>
    </div>
  )

  const heroImage = partner.cover_image_url || partner.hero_image_url || partner.logo_url || FALLBACK_LOGO
  const openingStatus = getOpeningStatus(openingHours)
  const mapUrl = partner.google_maps_url ||
    (partner.address ? `https://maps.google.com/?q=${encodeURIComponent(partner.address + ' ' + (partner.city || ''))}` : null)

  return (
    <>
      {/* PIN Overlay */}
      {showPin && user && (
        <PinOverlay
          partner={partner}
          user={user}
          refreshProfile={refreshProfile}
          onClose={() => setShowPin(false)}
          onSuccess={handleUnlockSuccess}
        />
      )}

      <div className="pb-28 -mt-6">

        {/* ── HERO ── */}
        <div className="relative h-[320px] w-[calc(100%+2rem)] -mx-4 overflow-hidden">
          <img
            src={heroImage}
            alt={partner.name}
            className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
          />
          {/* Skeleton while loading */}
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(135deg, #e8e5df 0%, #d4cfc5 100%)' }} />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.2) 50%, rgba(10,10,10,0.05) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.35) 0%, transparent 40%)' }} />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Verified badge top-right - Lowered for notch safety */}
          {partner.is_verified && (
            <div className="absolute top-12 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md z-10"
              style={{ background: 'rgba(59,130,246,0.35)', border: '1px solid rgba(59,130,246,0.5)' }}>
              <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Verificato</span>
            </div>
          )}

          {/* Hero bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end gap-4">
            <div className="relative shrink-0">
              <img
                src={partner.logo_url || FALLBACK_LOGO}
                alt="Logo"
                className="w-[72px] h-[72px] rounded-2xl object-cover shadow-2xl"
                style={{ border: '3px solid rgba(255,255,255,0.9)' }}
              />
              {/* Open/Closed dot */}
              {openingStatus && (
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                  style={{ background: openingStatus.openNow ? '#22c55e' : '#ef4444' }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-4">
              <h1 className="text-2xl font-bold text-white leading-tight font-serif drop-shadow-lg">{partner.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-white/90 font-bold bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">{partner.category}</span>
                {partner.city && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/60" />
                    <span className="text-xs text-white/90 font-medium">{partner.city}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── STATUS PILL ── */}
        {openingStatus && (
          <div className="flex items-center gap-3 mt-5 mb-3 px-1">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold shadow-sm ${openingStatus.openNow
              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
              : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
              <div className={`w-2 h-2 rounded-full ${openingStatus.openNow ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {openingStatus.openNow ? 'Aperto ora' : 'Chiuso'}
            </div>
            {openingStatus.todayLabel && (
              <span className="text-[13px] text-olive-light font-medium">{openingStatus.todayLabel}</span>
            )}
          </div>
        )}

        {/* ── ACTION BUTTONS ROW ── */}
        <div className="flex items-center gap-2 mt-3 mb-5 overflow-x-auto hide-scrollbar pb-1">
          {/* Directions - primary */}
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackAction('click_directions')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white font-semibold text-xs whitespace-nowrap shrink-0 transition-all active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(135deg, #3b5249 0%, #2d3e33 100%)', boxShadow: '0 4px 14px rgba(59,82,73,0.35)' }}
            >
              <Navigation size={14} />
              Indicazioni
            </a>
          )}
          {/* Instagram */}
          {partner.instagram_url && (
            <a
              href={partner.instagram_url}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackAction('click_instagram')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-olive-dark font-semibold text-xs whitespace-nowrap shrink-0 transition-all active:scale-95 border border-sand bg-white hover:bg-sand/20"
            >
              <Instagram size={14} /> Instagram
            </a>
          )}
          {/* Website */}
          {partner.website_url && (
            <a
              href={partner.website_url}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackAction('click_website')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-olive-dark font-bold text-xs whitespace-nowrap shrink-0 transition-all active:scale-95 border border-sand/40 bg-white/95"
            >
              <Globe size={14} /> Sito Web
            </a>
          )}
          {/* WhatsApp */}
          {partner.is_verified && partner.whatsapp_number && (
            <a
              href={`https://wa.me/${partner.whatsapp_number.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white font-semibold text-xs whitespace-nowrap shrink-0 transition-all active:scale-95 shadow-md"
              style={{ background: '#25d366' }}
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          )}
        </div>

        {/* ── CARD ADVANTAGES SECTION ── */}
        {partner.card_benefits && (
          <div className={`mb-6 rounded-2xl p-5 border-2 transition-all duration-500 ${isUnlocked
            ? 'bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5'
            : 'bg-white/5 border-white/5 opacity-90'}`}>

            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isUnlocked ? 'text-amber-500' : 'text-slate-400'}`}>
                {isUnlocked ? 'Il tuo Vantaggio Exclusive' : 'Vantaggio Member'}
              </h3>
              {isUnlocked && (
                <div className="px-2 py-0.5 bg-amber-500 text-[10px] text-black font-bold rounded shadow-sm">
                  ATTIVO
                </div>
              )}
            </div>

            <div className="flex items-start gap-4">
              <div className="relative shrink-0 w-24 aspect-[2/3] rounded-lg overflow-hidden border border-white/10 shadow-lg">
                <img
                  src={partner.card_image_url || '/placeholder-card.png'}
                  alt="Card Design"
                  className={`w-full h-full object-cover transition-all duration-700 ${!isUnlocked ? 'blur-md grayscale opacity-50' : 'blur-0 grayscale-0 opacity-100'}`}
                />
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white/40" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-white text-[15px] font-medium leading-relaxed">
                  {partner.card_benefits}
                </p>
                {!isUnlocked && (
                  <p className="text-[11px] text-amber-500/80 mt-2 italic font-medium">
                    Sblocca la card per riscattare il premio
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SBLOCCA CARD CTA ── */}
        <div className="mb-6">
          <button
            onClick={() => setShowPin(true)}
            className="w-full relative overflow-hidden rounded-2xl p-px transition-all active:scale-[0.98] shadow-xl"
            style={{ background: 'linear-gradient(135deg, #d4a94a, #e8c66e, #b8892a)' }}
          >
            <div className="relative flex items-center gap-4 px-5 py-4 rounded-[15px]"
              style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #12161f 100%)' }}>
              {/* Glow */}
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at left, #d4a94a 0%, transparent 70%)' }} />

              <div className="relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(212,169,74,0.15)', border: '1.5px solid rgba(212,169,74,0.35)' }}>
                {isUnlocked
                  ? <CheckCircle2 className="w-6 h-6 text-green-400" />
                  : <Unlock className="w-6 h-6 text-amber-400" />}
              </div>

              <div className="flex-1 min-w-0 relative">
                <p className="font-bold text-white text-sm leading-tight">
                  {isUnlocked ? 'Card Sbloccata!' : 'Sblocca la tua Card'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(212,169,74,0.7)' }}>
                  {isUnlocked
                    ? 'Congratulazioni! Visita completata'
                    : 'Chiedi al partner di inserire il PIN'}
                </p>
              </div>

              <ChevronRight className="w-5 h-5 shrink-0 text-amber-400 relative" />
            </div>
          </button>
        </div>

        {/* ── CONTENT ── */}
        <div className="space-y-6">

          {/* About */}
          {partner.description && (
            <section className="px-1">
              <h2 className="text-xl font-serif font-bold text-olive-dark mb-2">Chi siamo</h2>
              <div className="relative">
                <p className={`text-olive-light text-[15px] leading-relaxed break-words ${!descExpanded ? 'line-clamp-4' : ''}`}>
                  {partner.description}
                </p>
                {partner.description.length > 180 && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="text-olive-dark font-bold text-xs mt-2 underline"
                  >
                    {descExpanded ? 'Mostra meno' : 'Leggi tutto'}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Missions */}
          {partnerMissions.length > 0 && (
            <section>
              <h2 className="text-lg font-serif font-bold text-olive-dark mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                {t('partner.missions_here')}
              </h2>
              <div className="space-y-2">
                {partnerMissions.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 bg-white p-4 rounded-2xl transition-all"
                    style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-sand/40 flex items-center justify-center shrink-0">
                      {missionIcon(m.tipo_verifica)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-olive-dark text-sm truncate">{m.titolo}</h4>
                      <p className="text-[11px] text-olive-light mt-0.5 line-clamp-1">{m.descrizione}</p>
                    </div>
                    <span className="font-bold text-amber-600 text-sm shrink-0">+{m.punti} pt</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Info & Hours */}
          <section className="rounded-2xl p-5" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h2 className="text-base font-serif font-bold text-olive-dark mb-4">{t('partner.details_hours')}</h2>
            <div className="space-y-4 text-sm">
              {partner.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-olive-dark mt-0.5 shrink-0" />
                  <span className="text-olive-light">{partner.address}{partner.city ? `, ${partner.city}` : ''}</span>
                </div>
              )}
              {openingHours.length > 0 && (
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-olive-dark mt-0.5 shrink-0" />
                  <div className="flex-1">
                    {weekdayNames.map((dayName, idx) => {
                      const dayData = openingHours.find((h) => h.weekday === idx)
                      if (!dayData) return null
                      const r1 = formatRangeLabel(dayData.open_time, dayData.close_time)
                      const r2 = formatRangeLabel(dayData.open_time_2, dayData.close_time_2)
                      const label = [r1, r2].filter(Boolean).join(', ')
                      const isToday = (new Date().getDay() + 6) % 7 === idx
                      return (
                        <div key={idx} className={`flex justify-between py-1 text-xs ${isToday ? 'font-semibold text-olive-dark' : 'text-olive-light'}`}>
                          <span>{dayName}</span>
                          <span>{label || '–'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {!openingHours.length && openingStatus && (
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-olive-dark mt-0.5 shrink-0" />
                  <div>
                    <p className={`font-bold text-xs ${openingStatus.openNow ? 'text-green-600' : 'text-red-500'}`}>
                      {openingStatus.openNow ? t('partner.open_now') : t('partner.closed')}
                    </p>
                    {openingStatus.todayLabel && (
                      <p className="text-olive-light text-xs mt-0.5">Oggi: {openingStatus.todayLabel}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </>
  )
}

export default PartnerDetail