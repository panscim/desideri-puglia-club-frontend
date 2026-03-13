import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  RocketLaunch,
  Crown,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Lock,
} from '@phosphor-icons/react'

const PLANS = [
  {
    tier: 'discovery',
    name: 'Discovery',
    productId: 'prod_U6dXaqx4SvzxdW',
    monthlyPrice: 9,
    commissionRate: 25,
    icon: Compass,
    tag: 'Per iniziare',
    color: '#6B7280',
    popular: false,
    features: [
      'Profilo su mappa Club',
      'Foto e descrizione',
      'Statistiche base',
      'Accesso community',
    ],
  },
  {
    tier: 'pro',
    name: 'Puglia Pro',
    productId: 'prod_U6dY6wVCv9xLCH',
    monthlyPrice: 29,
    commissionRate: 15,
    icon: RocketLaunch,
    tag: '⭐ Il più scelto',
    color: '#C4974A',
    popular: true,
    features: [
      'Tutto di Discovery',
      'Creazione eventi',
      'Incasso Stripe Connect',
      'QR scanner check-in',
      'Analytics prenotazioni',
      'Badge verificato',
    ],
  },
  {
    tier: 'grande',
    name: 'Grande Puglia',
    productId: 'prod_U6dZmZC556bqNX',
    monthlyPrice: 59,
    commissionRate: 10,
    icon: Crown,
    tag: "Partner d'élite",
    color: '#B8882F',
    popular: false,
    features: [
      'Tutto di Pro',
      'Account Manager dedicato',
      'Slot prioritario homepage',
      'Integrazioni API custom',
      'Report mensile',
      'SLA garantiti',
    ],
  },
]

export default function PartnerSubscription() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState(null)
  const [activeIndex, setActiveIndex] = useState(1) // default Pro
  const scrollRef = useRef(null)

  const activeTier = partner?.plan_tier || null
  const activeStatus = String(partner?.subscription_status || '').toLowerCase()
  const isActive = activeStatus === 'active' || activeStatus === 'trialing'

  useEffect(() => {
    const init = async () => {
      try {
        if (!profile?.id) return

        if (params.get('success') === '1') {
          toast.success('Abbonamento attivato. Sincronizzazione in corso...')
        }
        if (params.get('canceled') === '1') {
          toast.error('Checkout annullato')
        }

        const { data, error } = await supabase
          .from('partners')
          .select('id, plan_tier, subscription_status, commission_rate')
          .eq('owner_user_id', profile.id)
          .maybeSingle()

        if (error) throw error
        setPartner(data || null)

        // Set active index to current plan if exists
        if (data?.plan_tier) {
          const idx = PLANS.findIndex((p) => p.tier === data.plan_tier)
          if (idx !== -1) setActiveIndex(idx)
        }
      } catch (error) {
        console.error(error)
        toast.error('Errore nel caricamento del piano partner')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [profile?.id, params])

  const activePlan = useMemo(() => PLANS.find((p) => p.tier === activeTier) || null, [activeTier])
  const selectedPlan = PLANS[activeIndex]

  // Update activeIndex based on scroll position
  const handleScroll = () => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const cardWidth = el.scrollWidth / PLANS.length
    const idx = Math.round(el.scrollLeft / cardWidth)
    setActiveIndex(Math.max(0, Math.min(PLANS.length - 1, idx)))
  }

  const scrollToIndex = (idx) => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const cardWidth = el.scrollWidth / PLANS.length
    el.scrollTo({ left: cardWidth * idx, behavior: 'smooth' })
    setActiveIndex(idx)
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#E8DDD0] border-t-[#C4974A] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] flex flex-col pb-36 relative overflow-x-hidden">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-20 bg-[#FAF7F2]/90 backdrop-blur-xl px-5 pt-12 pb-4 flex items-center gap-3 border-b border-black/5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-white border border-black/8 flex items-center justify-center shadow-sm active:scale-95 transition"
        >
          <ArrowLeft size={18} weight="bold" className="text-zinc-900" />
        </button>
        <div className="flex-1">
          <h1
            className="text-[22px] font-black tracking-tight text-zinc-900 leading-tight"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Scegli il tuo piano
          </h1>
          <p className="text-[12px] text-zinc-500 font-medium mt-0.5">
            Entra nell'ecosistema partner Puglia Club
          </p>
        </div>
      </header>

      <div className="flex-1 flex flex-col">

        {/* ── BANNER PIANO ATTIVO ── */}
        <AnimatePresence>
          {isActive && activePlan && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-5 mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} weight="duotone" className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Piano attivo</p>
                <p className="text-[15px] font-bold text-emerald-900 truncate"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {activePlan.name}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate('/partner/dashboard')}
                  className="px-4 py-2 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/partner/subscription/manage')}
                  className="px-4 py-2 rounded-full bg-white border border-emerald-200 text-emerald-700 text-[11px] font-black uppercase tracking-wider active:scale-95 transition"
                >
                  Gestisci
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SECTION LABEL ── */}
        <div className="px-5 mt-6 mb-3 flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">I piani</p>
          {/* Dots indicator */}
          <div className="flex items-center gap-1.5">
            {PLANS.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? 'w-5 h-2 bg-[#C4974A]'
                    : 'w-2 h-2 bg-zinc-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── HORIZONTAL SCROLL CARDS ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-5 pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {PLANS.map((plan, idx) => {
            const Icon = plan.icon
            const isCurrent = isActive && activeTier === plan.tier

            return (
              <motion.article
                key={plan.tier}
                className={`snap-center shrink-0 w-[calc(100vw-56px)] max-w-sm rounded-[2rem] overflow-hidden relative flex flex-col bg-white border-2 shadow-lg ${
                  plan.popular
                    ? 'border-[#C4974A]'
                    : 'border-black/5'
                }`}
                style={{ minHeight: 420 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Gold accent strip for Pro */}
                {plan.popular && (
                  <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, #C4974A, #D4793A)` }} />
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Tag badge */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        plan.popular
                          ? 'bg-[#C4974A]/10 text-[#C4974A]'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {plan.tag}
                    </span>
                    {isCurrent && (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                        Attivo
                      </span>
                    )}
                  </div>

                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${plan.color}18` }}
                    >
                      <Icon size={24} weight="duotone" style={{ color: plan.color }} />
                    </div>
                    <h2
                      className="text-[26px] font-black tracking-tight text-zinc-900 leading-none"
                      style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                    >
                      {plan.name}
                    </h2>
                  </div>

                  {/* Price + Commission */}
                  <div className="flex items-end gap-6 mb-6 mt-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Prezzo</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[34px] font-black text-zinc-900 leading-none">€{plan.monthlyPrice}</span>
                        <span className="text-[13px] font-medium text-zinc-400">/mese</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Commissione</p>
                      <span
                        className="text-[24px] font-black leading-none"
                        style={{ color: plan.color }}
                      >
                        {plan.commissionRate}%
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-zinc-100 mb-5" />

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <CheckCircle
                          size={16}
                          weight="fill"
                          style={{ color: plan.popular ? '#C4974A' : '#6B7280', flexShrink: 0 }}
                        />
                        <span className="text-[13px] font-medium text-zinc-700">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            )
          })}
          {/* Right padding spacer */}
          <div className="shrink-0 w-1" />
        </div>

        {/* ── TRUST BAR ── */}
        <div className="mx-5 mt-5 rounded-2xl bg-white border border-black/5 px-5 py-3.5 flex items-center justify-center gap-5">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Lock size={13} weight="bold" />
            <span className="text-[11px] font-bold">Stripe</span>
          </div>
          <div className="w-px h-4 bg-zinc-200" />
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="text-[11px] font-bold">Apple Pay</span>
          </div>
          <div className="w-px h-4 bg-zinc-200" />
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="text-[11px] font-bold">Disdici quando vuoi</span>
          </div>
        </div>

      </div>

      {/* ── STICKY CTA BOTTOM ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-xl border-t border-black/5 px-5 pt-4 pb-8 safe-area-inset-bottom">
        <div className="max-w-sm mx-auto flex flex-col gap-3">
          {/* Price summary */}
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {selectedPlan.name}
              </p>
              <p className="text-[17px] font-black text-zinc-900">
                €{selectedPlan.monthlyPrice}
                <span className="text-[12px] font-medium text-zinc-400 ml-1">/mese</span>
              </p>
            </div>
            <p className="text-[12px] font-bold text-zinc-500">
              Commissione: <span className="font-black text-zinc-800">{selectedPlan.commissionRate}%</span>
            </p>
          </div>

          <button
            onClick={() => navigate(`/partner/subscription/${selectedPlan.tier}`)}
            disabled={isActive && activeTier === selectedPlan.tier}
            className="w-full h-14 rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: selectedPlan.popular
                ? 'linear-gradient(135deg, #C4974A, #D4793A)'
                : '#1A1A1A',
              color: '#fff',
            }}
          >
            {isActive && activeTier === selectedPlan.tier
              ? 'Piano già attivo'
              : 'Scegli questo piano'}
            {!(isActive && activeTier === selectedPlan.tier) && (
              <ArrowRight size={16} weight="bold" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
