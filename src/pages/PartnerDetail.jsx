import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import {
  MapPin,
  Globe,
  Instagram,

  Clock,
  Star,
  MapPinned,
  Coins,
  BadgeCheck,
  MessageCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const FALLBACK_LOGO = 'https://placehold.co/64x64?text=Logo'

// Helper: controlla se è un UUID v4 valido
const isUuid = (v) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

// ---------- HELPER ORARI (Mantieni Logica Originale) ----------
const weekdayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

const parseTimeToMinutes = (t) => {
  if (!t) return null
  const parts = String(t).split(':')
  const h = parseInt(parts[0] || '0', 10)
  const m = parseInt(parts[1] || '0', 10)
  return h * 60 + m
}

const formatRangeLabel = (open, close) => {
  if (!open || !close) return null
  return `${String(open).slice(0, 5)} – ${String(close).slice(0, 5)}`
}

const getOpeningStatus = (openingHours) => {
  if (!openingHours || !openingHours.length) return null

  const now = new Date()
  const weekday = (now.getDay() + 6) % 7
  const today = openingHours.find((h) => h.weekday === weekday)

  if (!today) return null

  const ranges = []
  if (today.open_time && today.close_time) {
    const start = parseTimeToMinutes(today.open_time)
    const end = parseTimeToMinutes(today.close_time)
    if (start != null && end != null) ranges.push({ start, end })
  }
  if (today.open_time_2 && today.close_time_2) {
    const start = parseTimeToMinutes(today.open_time_2)
    const end = parseTimeToMinutes(today.close_time_2)
    if (start != null && end != null) ranges.push({ start, end })
  }

  if (!ranges.length) return null

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  let openNow = false
  for (const r of ranges) {
    if (r.start <= nowMinutes && nowMinutes < r.end) {
      openNow = true
      break
    }
  }

  const todayLabelParts = []
  const r1 = formatRangeLabel(today.open_time, today.close_time)
  const r2 = formatRangeLabel(today.open_time_2, today.close_time_2)
  if (r1) todayLabelParts.push(r1)
  if (r2) todayLabelParts.push(r2)

  return { openNow, todayLabel: todayLabelParts.join(', '), weekday }
}

// ---------- ICONE MISSIONI ----------
const missionIcon = (tipo_verifica) => {
  const t = String(tipo_verifica || '').toLowerCase()
  if (t === 'live') return <img src="/polaroid.png" alt="Missione live" className="w-6 h-6 object-contain" />
  if (t === 'galleria') return <img src="/galleria.png" alt="Missione galleria" className="w-6 h-6 object-contain" />
  if (t === 'link') return <img src="/link.png" alt="Missione link" className="w-6 h-6 object-contain" />
  if (t === 'button' || t === 'bottone') return <span className="text-lg">🖱️</span>
  return <span className="text-lg">✍️</span>
}

// ---------- COMPONENTE PRINCIPALE ----------
const PartnerDetail = () => {
  const { t } = useTranslation()
  const params = useParams()
  const navigate = useNavigate()
  const rawParam = params.id || params.partnerId || params.partner_id || params.slug

  const [partner, setPartner] = useState(null)
  const [openingHours, setOpeningHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg] = useState('')
  const [partnerMissions, setPartnerMissions] = useState([])

  useEffect(() => {
    loadData()
  }, [rawParam])

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
      setLoading(true)
      setPartner(null)
      setOpeningHours([])
      setPartnerMissions([])

      if (!rawParam) throw new Error(t('partner.missing_param'))

      // 1. Load Partner - chain query properly
      let partnerQuery = supabase.from('partners').select('*')
      if (isUuid(rawParam)) {
        partnerQuery = partnerQuery.eq('id', rawParam)
      } else {
        partnerQuery = partnerQuery.eq('slug', rawParam)
      }

      const { data: p, error: pe } = await partnerQuery.maybeSingle()
      if (pe) throw new Error(pe.message || t('partner.db_error'))
      if (!p) throw new Error(t('partner.not_found'))
      if (!p.is_active) throw new Error(t('partner.not_available'))

      setPartner(p)

      // 2. (Offers Removed)

      // 3. Load Hours (with proper field mapping)
      try {
        const { data: h } = await supabase.from('partner_opening_hours')
          .select('weekday, open_time, close_time, break_open_time, break_close_time')
          .eq('partner_id', p.id)
          .order('weekday', { ascending: true })

        const mappedHours = (h || []).map((row) => ({
          weekday: row.weekday,
          open_time: row.open_time,
          close_time: row.close_time,
          open_time_2: row.break_open_time,
          close_time_2: row.break_close_time,
        }))
        setOpeningHours(mappedHours)
      } catch (hoursErr) {
        console.warn('Hours load error:', hoursErr)
        setOpeningHours([])
      }

      // 4. Load Missions
      try {
        const { data: m } = await supabase.from('missioni_catalogo')
          .select('*').eq('attiva', true).eq('id_partner', p.id).order('punti', { ascending: false })
        setPartnerMissions(m || [])
      } catch (missErr) {
        console.warn('Missions load error:', missErr)
        setPartnerMissions([])
      }

    } catch (e) {
      console.error('[PartnerDetail] loadData error:', e)
      setErrMsg(e?.message || t('partner.load_error'))
    } finally {
      setLoading(false)
    }
  }

  // Tracking Actions
  const trackAction = async (type) => {
    if (!partner?.id) return
    try {
      await supabase.rpc('partner_track_event', { p_partner_id: partner.id, p_event_type: type })
    } catch (e) {
      console.warn('Track action error:', e)
    }
  }

  // (Offer Logic Removed)

  if (loading) return <div className="flex justify-center min-h-[60vh] items-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-olive-dark"></div></div>
  if (errMsg || !partner) return (
    <div className="p-10 text-center">
      <p className="text-olive-dark text-lg font-serif">{errMsg || t('partner.not_found')}</p>
      <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 rounded-full bg-olive-dark text-white text-sm">{t('partner.back')}</button>
    </div>
  )

  const heroImage = partner.cover_image_url || partner.hero_image_url || partner.logo_url || FALLBACK_LOGO
  const openingStatus = getOpeningStatus(openingHours)
  const mapUrl = partner.google_maps_url || (partner.address ? `https://maps.google.com/?q=${encodeURIComponent(partner.address + ' ' + (partner.city || ''))}` : null)

  return (
    <div className="pb-24">
      {/* 🟢 HERO SECTION FULL BLEED (Negative margins to escape container) */}
      <div className="-mt-6 -mx-4 mb-6 relative h-72 md:h-80 w-[calc(100%+2rem)] overflow-hidden">
        <img src={heroImage} alt={partner.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Info Overlay Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
          <img
            src={partner.logo_url || FALLBACK_LOGO}
            alt="Logo"
            className="w-20 h-20 rounded-2xl border-4 border-white bg-white object-cover shadow-xl"
          />
          <div className="text-white pb-1 min-w-0">
            <h1 className="text-3xl font-bold font-serif leading-none truncate">{partner.name}</h1>
            <p className="text-white/80 text-sm mt-1 font-medium">{partner.category} • {partner.city}</p>
          </div>
        </div>
      </div>

      {/* 🟢 ACTION BAR */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 hide-scrollbar">

        {partner.instagram_url && (
          <a
            href={partner.instagram_url}
            target="_blank"
            onClick={() => trackAction('click_instagram')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-sand text-olive-dark text-xs font-semibold hover:bg-sand/20 transition whitespace-nowrap"
          >
            <Instagram size={16} /> Instagram
          </a>
        )}

        {partner.website_url && (
          <a
            href={partner.website_url}
            target="_blank"
            onClick={() => trackAction('click_website')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-sand text-olive-dark text-xs font-semibold hover:bg-sand/20 transition whitespace-nowrap"
          >
            <Globe size={16} /> {t('partner.website')}
          </a>
        )}

        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-olive-dark text-white text-xs font-semibold hover:bg-olive-dark/90 transition whitespace-nowrap shadow-lg shadow-olive-dark/20"
          >
            <MapPinned size={16} /> {t('partner.directions')}
          </a>
        )}
      </div>

      {/* 🟢 PUNTI VISITA CTA */}
      <div className="flex gap-3 pb-2">
        <button
          onClick={() => navigate(`/partner/${partner.id}/pin`)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-olive-dark to-olive-dark/80 text-white font-semibold text-sm shadow-lg shadow-olive-dark/20 hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <Coins size={18} /> {t('partner.get_visit_points')}
        </button>

        {partner.is_verified && partner.whatsapp_number && (
          <a
            href={`https://wa.me/${partner.whatsapp_number.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <MessageCircle size={18} /> WhatsApp
          </a>
        )}
      </div>

      {/* Verified badge */}
      {partner.is_verified && (
        <div className="flex items-center gap-2 pb-3">
          <BadgeCheck className="w-5 h-5 text-blue-500" />
          <span className="text-xs font-semibold text-blue-600">{t('partner.verified')}</span>
        </div>
      )}

      {/* 🟢 CONTENT GRID */}
      <div className="space-y-8 mt-4">

        {/* About */}
        {partner.description && (
          <section>
            <h2 className="text-xl font-serif font-bold text-olive-dark mb-2">{t('partner.about')}</h2>
            <p className="text-olive-light text-sm leading-relaxed whitespace-pre-line break-words">{partner.description}</p>
          </section>
        )}

        {/* Offers */}
        {/* (Offers Section Removed) */}

        {/* Missions */}
        {partnerMissions.length > 0 && (
          <section>
            <h2 className="text-xl font-serif font-bold text-olive-dark mb-4 flex items-center gap-2">
              <Star className="text-gold" size={20} /> {t('partner.missions_here')}
            </h2>
            <div className="space-y-3">
              {partnerMissions.map(m => (
                <div key={m.id} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-sand">
                  <div className="w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center">
                    {missionIcon(m.tipo_verifica)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-olive-dark text-sm">{m.titolo}</h4>
                    <p className="text-[10px] text-olive-light mt-0.5 line-clamp-1">{m.descrizione}</p>
                  </div>
                  <span className="font-serif font-bold text-gold">+{m.punti} pt</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info & Hours */}
        <section className="bg-sand/20 rounded-3xl p-6">
          <h2 className="text-lg font-serif font-bold text-olive-dark mb-4">{t('partner.details_hours')}</h2>

          <div className="space-y-4 text-sm">
            {partner.address && (
              <div className="flex items-start gap-3">
                <MapPin className="top-1 relative text-olive-dark w-4 h-4 shrink-0" />
                <span className="text-olive-light">{partner.address}, {partner.city}</span>
              </div>
            )}
            {openingStatus && (
              <div className="flex items-start gap-3">
                <Clock className="top-1 relative text-olive-dark w-4 h-4 shrink-0" />
                <div>
                  <p className={`font-bold ${openingStatus.openNow ? 'text-green-600' : 'text-red-500'}`}>
                    {openingStatus.openNow ? t('partner.open_now') : t('partner.closed')}
                  </p>
                  <p className="text-olive-light text-xs mt-1">
                    {t('partner.today')}: {openingStatus.todayLabel || t('partner.no_hours')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* MODAL OFFERTA */}
      {/* (Offer Modal Removed) */}

    </div>
  )
}

export default PartnerDetail