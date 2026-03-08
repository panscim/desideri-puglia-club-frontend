import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  MapPin, Globe, Instagram, Clock, Phone, Navigation,
  ChevronLeft, Lock, Unlock, CheckCircle2, Share2, Star, Check, X, Map, Copy
} from 'lucide-react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import toast from 'react-hot-toast'
import Confetti from 'canvas-confetti'

// ── UI Utilities ──
const isUuid = (v) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

const weekdayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
const getTodayWeekday = () => (new Date().getDay() + 6) % 7

const parseTimeToMinutes = (t) => {
  if (!t) return null
  const parts = String(t).split(':')
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10)
}

const getOpeningStatus = (hours) => {
  if (!hours?.length) return { label: 'Orari non disponibili', isOpen: false }
  const today = hours.find(h => h.weekday === getTodayWeekday())
  if (!today) return { label: 'Oggi chiuso', isOpen: false }

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const ranges = []
  if (today.open_time && today.close_time) {
    ranges.push({ s: parseTimeToMinutes(today.open_time), e: parseTimeToMinutes(today.close_time) })
  }
  if (today.open_time_2 && today.close_time_2) {
    ranges.push({ s: parseTimeToMinutes(today.open_time_2), e: parseTimeToMinutes(today.close_time_2) })
  }

  if (!ranges.length) return { label: 'Oggi chiuso', isOpen: false }
  const isOpen = ranges.some(r => r.s <= nowMin && nowMin < r.e)

  if (isOpen) {
    const nextClose = ranges.find(r => r.s <= nowMin && nowMin < r.e).e
    const hours = Math.floor(nextClose / 60)
    const mins = nextClose % 60
    return { label: `Aperto · Chiude alle ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`, isOpen: true }
  }
  return { label: 'Chiuso ora', isOpen: false }
}

const formatHoursList = (hours) => {
  if (!hours || hours.length === 0) return []
  return weekdayNames.map((name, idx) => {
    const dayData = hours.find(h => h.weekday === idx)
    let timeString = 'Chiuso'
    if (dayData && dayData.open_time && dayData.close_time) {
      timeString = `${dayData.open_time.substring(0, 5)} - ${dayData.close_time.substring(0, 5)}`
      if (dayData.open_time_2 && dayData.close_time_2) {
        timeString += `, ${dayData.open_time_2.substring(0, 5)} - ${dayData.close_time_2.substring(0, 5)}`
      }
    }
    return { day: name, time: timeString, isToday: idx === getTodayWeekday() }
  })
}

// ═══════════════════════════════════════════════════
// MASTER REDESIGN: AIRBNB / GETYOURGUIDE STYLE
// ═══════════════════════════════════════════════════
const PartnerDetail = () => {
  const params = useParams()
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const rawParam = params.id || params.partnerId || params.partner_id || params.slug

  const [partner, setPartner] = useState(null)
  const [openingHours, setOpeningHours] = useState([])
  const [loading, setLoading] = useState(true)

  // Card & Unlock States
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [submittingPin, setSubmittingPin] = useState(false)

  // UI States
  const [showFullStory, setShowFullStory] = useState(false)
  const [showHoursModal, setShowHoursModal] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showExpandedCard, setShowExpandedCard] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Header Scroll Logic
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 150)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    loadData()
  }, [rawParam])

  const loadData = async () => {
    try {
      setLoading(true)
      if (!rawParam) return navigate(-1)

      let q = supabase.from('partners').select('*')
      q = isUuid(rawParam) ? q.eq('id', rawParam) : q.eq('slug', rawParam)

      const { data: p, error } = await q.maybeSingle()
      if (error || !p) throw new Error('Partner non trovato')
      setPartner(p)

      const { data: h } = await supabase.from('partner_opening_hours')
        .select('*').eq('partner_id', p.id).order('weekday', { ascending: true })
      setOpeningHours((h || []).map(row => ({
        weekday: row.weekday,
        open_time: row.open_time,
        close_time: row.close_time,
        open_time_2: row.break_open_time,
        close_time_2: row.break_close_time,
      })))

      if (user) {
        const { data: v } = await supabase.from('logs_transazioni')
          .select('id').eq('user_id', user.id).eq('partner_id', p.id).eq('tipo', 'visita_pin').maybeSingle()
        if (v) setIsUnlocked(true)
      }
    } catch (e) {
      toast.error(e.message)
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPin = async (e) => {
    e.preventDefault()
    if (!user) return toast.error('Esegui il login per sbloccare la card')
    setSubmittingPin(true)
    setPinError(false)

    try {
      const { data, error } = await supabase.rpc('validate_pin_visit', {
        p_user_id: user.id,
        p_partner_id: partner.id,
        p_pin: pin,
      })
      if (error) throw error
      if (data.success) {
        if (navigator.vibrate) navigator.vibrate([50, 50, 50])
        setIsUnlocked(true)
        setShowPinModal(false)

        // Massive Confetti 
        const duration = 2000
        const end = Date.now() + duration
        const frame = () => {
          Confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#D4793A', '#1F2933', '#4ADE80']
          })
          Confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#D4793A', '#1F2933', '#FAF7F2']
          })
          if (Date.now() < end) requestAnimationFrame(frame)
        }
        frame()

        toast.success(data.message)
        refreshProfile?.()
      } else {
        if (navigator.vibrate) navigator.vibrate([100])
        setPinError(true)
        setPin('')
        toast.error('PIN non valido, riprova.')
      }
    } catch (e) {
      console.error("RPC Error Details:", e)
      const errorMsg = e.message || e.details || e.hint || 'Errore di connessione al server'
      toast.error(`Errore 400: ${errorMsg}`)
      setPinError(true)
      setPin('')
    } finally {
      setSubmittingPin(false)
    }
  }

  if (loading) return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const openingStatus = getOpeningStatus(openingHours)
  const formattedHoursList = formatHoursList(openingHours)
  const mapUrl = partner.google_maps_url || (partner.address ? `https://maps.google.com/?q=${encodeURIComponent(partner.address + ' Barletta')}` : null)
  const historyText = partner.storytelling || partner.description || "Unisciti all'esclusiva rete di Desideri di Puglia e scopri i vantaggi riservati passeggiando nel cuore della tua città."
  const isTruncated = historyText.length > 200 && !showFullStory

  const coverBackground = partner.cover_image_url || partner.image || "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=1400"
  const cardBackground = partner.card_image_url || partner.image || partner.cover_image_url || "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=1400"

  return (
    <div className="min-h-[100dvh] bg-white font-sans text-zinc-900 pb-48">

      {/* 1. DYNAMIC HEADER (Airbnb Style) */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]' : 'bg-transparent'}`}>
        <div className="flex justify-between items-center px-4 h-16 pt-[env(safe-area-inset-top,0px)]">
          <button
            onClick={() => navigate(-1)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95 ${isScrolled ? 'bg-zinc-100 hover:bg-zinc-200' : 'bg-white/90 backdrop-blur-md shadow-sm'}`}
          >
            <ChevronLeft size={24} className="text-zinc-900" strokeWidth={1.5} />
          </button>

          <div className={`transition-opacity duration-300 font-bold ${isScrolled ? 'opacity-100' : 'opacity-0'}`} style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {partner.name}
          </div>

          <button
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95 ${isScrolled ? 'bg-zinc-100 hover:bg-zinc-200' : 'bg-white/90 backdrop-blur-md shadow-sm'}`}
          >
            <Share2 size={20} className="text-zinc-900" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* 2. HERO IMAGE (Clean Geometry) */}
      <section className="relative w-full h-[40vh] md:h-[50vh]">
        <img
          src={coverBackground}
          alt={partner.name}
          className="w-full h-full object-cover"
        />
        {/* Subtle gradient for visual weight */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
      </section>

      {/* MAIN CONTENT PORTAL */}
      <main className="max-w-xl mx-auto px-6 pt-6 bg-white relative -mt-4 rounded-t-3xl min-h-[50vh]">

        {/* 3. TITLE & IDENTITY BLOCK */}
        <div className="mb-8">
          <h1 className="text-4xl leading-none text-zinc-950 tracking-tight mb-2" style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 900 }}>
            {partner.name}
          </h1>
          <div className="flex items-center gap-2 text-zinc-600 mb-4 text-sm font-medium">
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-zinc-950 text-zinc-950" />
              5.0
            </span>
            <span>·</span>
            <span className="underline decoration-zinc-300 underline-offset-4">{partner.address || 'Posizione Premium'}</span>
          </div>

          <div className="flex items-center gap-4 py-4 border-y border-zinc-100 mt-6">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-200 shrink-0">
              <img src={partner.logo_url || partner.cover_image_url} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-bold text-zinc-900">Partner Esclusivo / Elite</p>
              <p className="text-sm text-zinc-500">Un'esperienza selezionata per il club</p>
            </div>
          </div>
        </div>

        {/* 4. THE PHYSICAL BENEFIT CARD */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Satoshi, sans-serif' }}>Vantaggio Club</h2>

          {!isUnlocked ? (
            <div className="w-full flex flex-col items-center">
              {/* Istruzioni Vantaggio (Shown when locked) */}
              <div className="mb-6 p-5 rounded-[24px] bg-[#F7F7F9] border border-zinc-100 w-full">
                <h3 className="font-bold text-zinc-900 flex items-center gap-2 mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  <Star size={16} className="text-[#D4793A] fill-[#D4793A]" />
                  Quasi un Desiderio...
                </h3>
                <p className="text-sm text-zinc-600 mb-5 leading-relaxed">
                  {partner.card_benefits || 'Un privilegio esclusivo è custodito in questo luogo, in attesa di essere vissuto.'}
                </p>

                <h3 className="font-bold text-zinc-900 flex items-center gap-2 mb-1" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  <Unlock size={16} className="text-zinc-500" />
                  Il Segreto del Custode
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Mostra questa schermata al custode del luogo in cui ti trovi. Fatti sussurrare la <strong className="text-zinc-900">chiave d'accesso</strong> e inseriscila nel pulsante "Inserisci Chiave" in basso per rivelare la tua collezione.
                </p>
              </div>

              {/* Locked Card Preview */}
              <div className="relative w-[280px] aspect-[9/16] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-zinc-200">
                <div className="absolute inset-0 grayscale blur-xl opacity-60">
                  <img src={cardBackground} alt="Card Cover" className="w-full h-full object-cover scale-110" />
                  {/* Locked Overlay — Mystery Glass Card */}
                  <AnimatePresence>
                    {!isUnlocked && (
                      <motion.div
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 z-10"
                        style={{
                          backdropFilter: 'blur(22px)',
                          WebkitBackdropFilter: 'blur(22px)',
                          background: 'radial-gradient(ellipse at 40% 35%, rgba(180,150,100,0.22) 0%, rgba(160,140,120,0.14) 40%, rgba(200,195,185,0.10) 100%)'
                        }}
                      >
                        {/* Centered golden lock */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{ border: '1px solid rgba(200,175,130,0.6)', background: 'rgba(255,252,245,0.08)' }}
                          >
                            <Lock
                              size={22}
                              strokeWidth={1}
                              style={{ color: 'rgba(200,175,130,0.9)' }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowExpandedCard(true)}
              className="w-full p-5 rounded-[20px] bg-[#F7F7F9] border border-zinc-100 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all text-left"
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 ring-1 ring-zinc-200">
                <img src={cardBackground} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Vantaggio Svelato</p>
                <h3 className="text-zinc-900 font-bold text-base leading-tight" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Visualizza la tua Card
                </h3>
              </div>
              <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                <Unlock size={16} className="text-white" />
              </div>
            </button>
          )}
        </section>

        {/* 5. LINEAR STORYTELLING */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Satoshi, sans-serif' }}>La storia</h2>
          <div className="text-zinc-700 leading-relaxed font-normal text-[15px]">
            {isTruncated ? `${historyText.substring(0, 200)}...` : historyText}
          </div>
          {historyText.length > 200 && (
            <button
              onClick={() => setShowFullStory(!showFullStory)}
              className="mt-2 font-bold text-zinc-900 underline flex items-center gap-1 active:opacity-70"
            >
              {showFullStory ? 'Mostra meno' : 'Mostra di più'}
            </button>
          )}
        </section>

        {/* 6. PRACTICAL INFO & MAP (List Layout) */}
        <section className="mb-10 space-y-6">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Satoshi, sans-serif' }}>Informazioni pratiche</h2>

          {/* Clean Minimal Location Card */}
          <button
            onClick={() => setShowMapModal(true)}
            className="w-full rounded-[20px] bg-white border border-zinc-100 active:scale-[0.98] transition-all cursor-pointer text-left"
            style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}
          >
            <div className="px-5 py-5 flex items-center gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#F5F5F0' }}>
                <MapPin size={20} className="text-[#9a7f60]" strokeWidth={1.5} />
              </div>
              {/* Text */}
              <div className="flex-1">
                <p className="text-[10px] text-[#9A9A9A] font-medium uppercase tracking-widest mb-0.5">Raggiungici</p>
                <p className="font-semibold text-[#1A1A1A] text-sm leading-snug line-clamp-2">{partner.address || 'Indirizzo non disponibile'}</p>
              </div>
              {/* CTA */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full border border-zinc-200 flex items-center justify-center" style={{ background: '#F5F5F0' }}>
                  <Navigation size={14} className="text-[#4A4A4A]" strokeWidth={1.5} />
                </div>
                <p className="text-[9px] text-[#9A9A9A] uppercase tracking-wide font-medium whitespace-nowrap">Mappa</p>
              </div>
            </div>
            {/* Bottom CTA label */}
            <div className="px-5 pb-4">
              <div className="w-full py-2.5 rounded-xl border border-zinc-100 flex items-center justify-center gap-2" style={{ background: '#F5F5F0' }}>
                <Navigation size={13} className="text-[#9a7f60]" strokeWidth={1.5} />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9a7f60]">Raggiungi il Luogo</span>
              </div>
            </div>
          </button>

          {/* Simple List Items */}
          <div className="divide-y divide-zinc-100">
            <div
              className="py-4 flex items-center justify-between cursor-pointer active:bg-zinc-50"
              onClick={() => setShowHoursModal(true)}
            >
              <div className="flex items-center gap-4">
                <Clock size={24} strokeWidth={1.5} className="text-zinc-600" />
                <div>
                  <p className="font-medium text-zinc-900">Orari di apertura</p>
                  <p className={`text-sm ${openingStatus.isOpen ? 'text-emerald-600 font-medium' : 'text-zinc-500'}`}>{openingStatus.label}</p>
                </div>
              </div>
              <ChevronLeft size={20} className="text-zinc-400 rotate-180" />
            </div>

            {partner.phone && (
              <a href={`tel:${partner.phone}`} className="py-4 flex items-center justify-between cursor-pointer active:bg-zinc-50">
                <div className="flex items-center gap-4">
                  <Phone size={24} strokeWidth={1.5} className="text-zinc-600" />
                  <div>
                    <p className="font-medium text-zinc-900">Telefono</p>
                    <p className="text-sm text-zinc-500">{partner.phone}</p>
                  </div>
                </div>
              </a>
            )}

            {partner.instagram_url && (
              <a href={partner.instagram_url} target="_blank" rel="noreferrer" className="py-4 flex items-center justify-between cursor-pointer active:bg-zinc-50">
                <div className="flex items-center gap-4">
                  <Instagram size={24} strokeWidth={1.5} className="text-zinc-600" />
                  <div>
                    <p className="font-medium text-zinc-900">Instagram</p>
                    <p className="text-sm text-zinc-500">@partner.ufficiale</p>
                  </div>
                </div>
              </a>
            )}
          </div>
        </section>

      </main>

      {/* 7. STICKY BOTTOM BAR (Call To Action - Hides when unlocked) */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
            className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] md:bottom-0 inset-x-0 bg-white border-t border-zinc-200 px-6 py-4 flex items-center justify-between z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] md:pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <div className="flex flex-col">
              <span className="font-bold text-zinc-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>Esplora</span>
              <span className="text-xs text-zinc-500 font-medium tracking-tight">Custodisce un segreto</span>
            </div>
            <button
              onClick={() => setShowPinModal(true)}
              className="px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95 shadow-sm bg-zinc-900 text-white"
            >
              Inserisci Chiave
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. PIN MODAL (Clean Design) */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative"
            >
              <button onClick={() => setShowPinModal(false)} className="absolute top-4 right-4 p-2 bg-zinc-100 rounded-full active:bg-zinc-200">
                <div className="w-3 h-[2px] bg-zinc-900 rotate-45 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="w-3 h-[2px] bg-zinc-900 -rotate-45 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#D4793A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-[#D4793A]" strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tight" style={{ fontFamily: 'Satoshi, sans-serif' }}>Sblocca il VIP Pass</h3>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">Inserisci il PIN di attivazione fornito dallo staff in loco.</p>
              </div>

              <form onSubmit={handleVerifyPin} className="space-y-6">
                <input
                  type="tel"
                  maxLength={8}
                  autoFocus
                  placeholder="PIN"
                  className={`w-full text-center text-4xl tracking-widest font-black py-4 border-2 rounded-2xl outline-none transition-colors ${pinError ? 'border-red-500 bg-red-50 text-red-500' : 'border-zinc-200 focus:border-[#D4793A] text-zinc-900'}`}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setPin(val)
                    setPinError(false)
                  }}
                />

                <button
                  type="submit"
                  disabled={pin.length < 4 || submittingPin}
                  className="w-full bg-zinc-900 text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:bg-zinc-300 disabled:text-zinc-500 active:scale-[0.98] transition-all"
                >
                  {submittingPin ? 'Verifica in corso...' : 'Conferma PIN'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAP OPTIONS MODAL (Bottom Sheet) */}
      <AnimatePresence>
        {showMapModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMapModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl z-[210] pb-[env(safe-area-inset-bottom,16px)]"
            >
              {/* Address pill header */}
              <div className="px-6 pt-5 pb-4 border-b border-zinc-100">
                <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4" />
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={18} className="text-zinc-900" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Indirizzo</p>
                    <p className="font-bold text-zinc-900 text-sm leading-snug mt-0.5">{partner.address || 'Indirizzo non disponibile'}</p>
                  </div>
                </div>
              </div>

              {/* Action options */}
              <div className="px-4 pt-3 pb-2 space-y-2">
                {/* Apple Maps */}
                <button
                  onClick={() => {
                    const addr = encodeURIComponent((partner.address || '') + ' Barletta')
                    window.open(`https://maps.apple.com/?q=${addr}`, '_blank')
                    setShowMapModal(false)
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-[#F7F7F9] hover:bg-zinc-100 active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-zinc-200 flex items-center justify-center shrink-0">
                    {/* Apple Maps-style icon */}
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                      <rect width="24" height="24" rx="5" fill="#34C759" />
                      <path d="M12 5C8.69 5 6 7.69 6 11C6 15 12 20 12 20C12 20 18 15 18 11C18 7.69 15.31 5 12 5Z" fill="white" />
                      <circle cx="12" cy="11" r="2.5" fill="#34C759" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 text-[15px]">Apple Maps</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Apri nell'app Mappe</p>
                  </div>
                  <ChevronLeft size={18} className="text-zinc-300 rotate-180 ml-auto shrink-0" />
                </button>

                {/* Google Maps */}
                <button
                  onClick={() => {
                    const addr = encodeURIComponent((partner.address || '') + ' Barletta')
                    window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank')
                    setShowMapModal(false)
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-[#F7F7F9] hover:bg-zinc-100 active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-zinc-200 flex items-center justify-center shrink-0">
                    {/* Google Maps icon */}
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#EA4335" />
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V9C8 7.34 9.34 6 11 6H13C14.66 6 16 7.34 16 9V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z" fill="#FBBC04" />
                      <circle cx="12" cy="9" r="3" fill="white" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 text-[15px]">Google Maps</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Apri in Google Maps</p>
                  </div>
                  <ChevronLeft size={18} className="text-zinc-300 rotate-180 ml-auto shrink-0" />
                </button>

                {/* Copy Address */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(partner.address || '')
                    toast.success('Indirizzo copiato!', { icon: '📋' })
                    setShowMapModal(false)
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-[#F7F7F9] hover:bg-zinc-100 active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-zinc-200 flex items-center justify-center shrink-0">
                    <Copy size={20} className="text-zinc-700" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 text-[15px]">Copia indirizzo</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Incollalo dove vuoi</p>
                  </div>
                </button>
              </div>

              {/* Cancel */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => setShowMapModal(false)}
                  className="w-full py-4 rounded-2xl bg-zinc-100 font-semibold text-zinc-700 active:bg-zinc-200 transition-all"
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 9. HOURS MODAL (BottomSheet) */}
      <AnimatePresence>
        {showHoursModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHoursModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] z-[210]"
            >
              <h3 className="text-xl font-bold mb-6 text-zinc-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>Orari della settimana</h3>
              <div className="space-y-4">
                {formattedHoursList.map((day, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className={day.isToday ? 'font-bold text-zinc-900' : 'text-zinc-600'}>{day.day} {day.isToday && '(Oggi)'}</span>
                    <span className={day.isToday ? 'font-bold text-zinc-900' : 'text-zinc-800'}>{day.time}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowHoursModal(false)} className="mt-8 w-full bg-zinc-100 text-zinc-900 font-bold py-4 rounded-xl active:bg-zinc-200">
                Chiudi
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 10. FULL SCREEN EXPANDED CARD MODAL */}
      <AnimatePresence>
        {showExpandedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-start bg-black/90 backdrop-blur-2xl pt-[env(safe-area-inset-top,24px)] overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.55, type: "spring", bounce: 0.15 }}
              className="flex flex-col items-center w-full max-w-[300px] mx-auto py-8 text-white"
            >
              {/* Card Image - capped height so text is visible */}
              <div className="relative w-full rounded-[28px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
                style={{ aspectRatio: '9/16', maxHeight: '55vh' }}>
                <img src={cardBackground} alt="Benefit Card" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* Text below Card — white on dark background */}
              <div className="mt-7 text-center w-full px-4" style={{ color: 'white' }}>
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">
                  Il Desiderio Esaudito
                </p>
                <h3 className="text-xl font-black leading-snug tracking-tight mb-3" style={{ fontFamily: 'Satoshi, sans-serif', color: 'white' }}>
                  {partner.card_benefits || 'Un Segreto Svelato'}
                </h3>
                <div className="w-10 h-[1px] bg-white/20 mx-auto mb-3" />
                <p className="text-sm leading-relaxed font-light" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Questo ricordo appartiene alla tua collezione. Mostralo con fierezza al custode per accedere al privilegio.
                </p>
              </div>

              {/* Close button — placed BELOW text, clearly visible */}
              <button
                onClick={() => setShowExpandedCard(false)}
                className="mt-8 w-12 h-12 flex items-center justify-center bg-white/15 border border-white/20 rounded-full active:scale-95 transition-all"
                style={{ color: 'white' }}
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
      `}</style>
    </div>
  )
}

export default PartnerDetail