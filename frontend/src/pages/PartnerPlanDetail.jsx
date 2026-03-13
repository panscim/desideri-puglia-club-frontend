import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { colors as TOKENS, typography, motion as springMotion } from '../utils/designTokens'
import { CheckCircle, XCircle, Plus, ArrowLeft, ArrowRight, Lock, ShieldCheck } from 'lucide-react'
import { Compass, RocketLaunch, Crown } from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'

const PLAN_DATA = {
  discovery: {
    name: 'Discovery',
    monthlyPrice: 9,
    tag: 'Per iniziare',
    accentColor: '#6B7280',
    icon: Compass,
    description: 'Il punto di partenza per qualsiasi attività che vuole farsi trovare dai soci Desideri di Puglia. Nessun costo iniziale, nessun impegno.',
    includes: [
      'Profilo attività con foto e descrizione',
      'Posizionamento sulla mappa del Club',
      'Visibilità ai soci in zona',
      'Statistiche base',
      'Accesso community partner',
    ],
    excludes: [
      'Creazione eventi',
      'Biglietteria e incassi automatici',
      'Analytics prenotazioni',
      'Badge verificato',
    ],
    faq: [
      { q: 'Posso passare a Pro in qualsiasi momento?', a: "Sì. L'upgrade è immediato e i tuoi dati rimangono invariati." },
      { q: 'Devo inserire una carta di credito?', a: 'No. Il piano Discovery non richiede nessun metodo di pagamento.' },
      { q: 'Quanto ci vuole per apparire sulla mappa?', a: 'Una volta completata la registrazione, il profilo è visibile entro pochi minuti.' },
    ],
  },
  pro: {
    name: 'Puglia Pro',
    monthlyPrice: 29,
    tag: '⭐ Il più scelto',
    accentColor: '#C4974A',
    icon: RocketLaunch,
    description: 'Il piano per chi vuole trasformare la propria attività in un punto di riferimento per i soci. Crea eventi, incassa online, gestisci gli accessi con QR.',
    includes: [
      'Tutto di Discovery',
      'Creazione eventi illimitati',
      'Biglietteria con pagamento immediato',
      'Incassi automatici sul tuo conto (Stripe Connect)',
      'QR di accesso e scanner check-in',
      'Dashboard analytics prenotazioni',
      'Badge verificato sul profilo',
      'Supporto prioritario',
    ],
    excludes: [
      'Account manager dedicato',
      'Integrazioni API custom',
    ],
    faq: [
      { q: 'Quando ricevo i pagamenti?', a: 'Entro 2 giorni lavorativi dalla transazione, tramite Stripe Connect.' },
      { q: 'Stripe è obbligatorio?', a: 'Sì. Garantisce sicurezza e regolarità degli incassi. La configurazione richiede pochi minuti.' },
      { q: 'Posso creare eventi gratuiti?', a: 'Sì. Puoi creare eventi a ingresso libero, a pagamento, o con prezzi differenziati.' },
      { q: 'Quanto prende il Club per biglietto?', a: 'Una commissione del 15% sul valore del biglietto.' },
    ],
  },
  grande: {
    name: 'Grande Puglia',
    monthlyPrice: 59,
    tag: "Partner d'élite",
    accentColor: '#B8882F',
    icon: Crown,
    description: 'Per strutture ricettive, agriturismi, cantine e realtà con volumi elevati. Un account manager dedicato e integrazioni su misura.',
    includes: [
      'Tutto di Pro',
      'Account manager dedicato',
      'Slot prioritario homepage',
      'Integrazioni API custom',
      'Report mensile personalizzato',
      'SLA garantiti',
      'Campagne promozionali mirate ai soci',
    ],
    excludes: [],
    faq: [
      { q: 'Come si attiva il piano Grande?', a: 'Dopo il pagamento, un account manager ti contatta entro 24 ore.' },
      { q: 'Posso integrare il mio sistema di prenotazione?', a: 'Sì. Gestiamo integrazioni personalizzate via API con i principali sistemi gestionali.' },
      { q: "C'è un volume minimo?", a: 'No. Il piano si costruisce sulle tue esigenze reali.' },
    ],
  },
}

const FaqItem = ({ item }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-black/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-4 flex items-center justify-between text-left"
      >
        <span className="text-[14px] font-bold text-zinc-800 pr-6 leading-snug">
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center shrink-0"
        >
          <Plus size={14} className="text-zinc-600" strokeWidth={2.5} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springMotion.spring}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[13px] leading-relaxed text-zinc-500">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PartnerPlanDetail() {
  const { tier } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()
  const [loadingCheckout, setLoadingCheckout] = useState(false)

  const plan = PLAN_DATA[tier] || PLAN_DATA.pro
  const Icon = plan.icon
  const isPro = tier === 'pro'
  const isFree = tier === 'discovery'

  const handleJoin = async () => {
    if (!profile?.id) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }

    setLoadingCheckout(true)
    const toastId = toast.loading('Preparazione checkout...')

    try {
      const { data: existingPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('owner_user_id', profile.id)
        .maybeSingle()

      let partnerId = existingPartner?.id

      if (!partnerId) {
        const ownerName = `${profile?.nome || ''} ${profile?.cognome || ''}`.trim() || profile?.nickname || 'Titolare'
        const { data: newPartner, error: insertError } = await supabase
          .from('partners')
          .insert([{
            owner_user_id: profile.id,
            name: 'Nuovo Partner',
            owner_name: ownerName,
            category: 'Altro',
            is_active: false,
            subscription_status: 'incomplete',
            plan_tier: tier,
            commission_rate: tier === 'grande' ? 10 : tier === 'pro' ? 15 : 25,
          }])
          .select('id')
          .single()

        if (insertError) throw insertError
        partnerId = newPartner.id
        await supabase.from('utenti').update({ partner_id: partnerId }).eq('id', profile.id)
      }

      toast.loading('Connessione a Stripe...', { id: toastId })

      const response = await fetch('/api/create-partner-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          tier,
          successUrl: `${window.location.origin}/partner/dashboard?payment_success=1`,
          cancelUrl: `${window.location.origin}/partner/subscription/${tier}?canceled=1`,
        }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Checkout non disponibile')

      toast.success('Reindirizzamento...', { id: toastId })
      window.location.href = payload.url
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Errore durante il checkout.', { id: toastId })
      setLoadingCheckout(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] flex flex-col pb-40 relative">

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
            {plan.name}
          </h1>
          <p className="text-[12px] text-zinc-500 font-medium mt-0.5">{plan.tag}</p>
        </div>
        {/* Price pill */}
        <div
          className="px-3 py-1.5 rounded-full"
          style={{ backgroundColor: `${plan.accentColor}15` }}
        >
          <span className="text-[15px] font-black" style={{ color: plan.accentColor }}>
            {isFree ? 'Gratis' : `€${plan.monthlyPrice}/m`}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-5 pt-6 max-w-lg mx-auto w-full gap-5">

        {/* ── HERO CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`rounded-3xl bg-white border-2 shadow-sm overflow-hidden ${isPro ? 'border-[#C4974A]' : 'border-black/6'}`}
        >
          {isPro && <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #C4974A, #D4793A)' }} />}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: `${plan.accentColor}15` }}
              >
                <Icon size={24} weight="duotone" style={{ color: plan.accentColor }} />
              </div>
              <div>
                <h2
                  className="text-[22px] font-black text-zinc-900 leading-none"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  {plan.name}
                </h2>
                <p className="text-[11px] font-bold text-zinc-400 mt-0.5 uppercase tracking-wider">{plan.tag}</p>
              </div>
            </div>
            <p className="text-[14px] text-zinc-500 leading-relaxed">{plan.description}</p>
            <div className="mt-4 pt-4 border-t border-black/5 flex items-end gap-1">
              <span className="text-[32px] font-black text-zinc-900 leading-none">
                {isFree ? 'Gratis' : `€${plan.monthlyPrice}`}
              </span>
              {!isFree && <span className="text-[13px] text-zinc-400 font-medium mb-1">/mese</span>}
            </div>
          </div>
        </motion.div>

        {/* ── COSA INCLUDE ── */}
        <section className="rounded-3xl bg-white border border-black/6 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4">Cosa include</p>
          <ul className="space-y-3">
            {plan.includes.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5"
              >
                <CheckCircle
                  size={16}
                  className="shrink-0"
                  style={{ color: isPro ? '#C4974A' : plan.accentColor }}
                />
                <span className="text-[13px] font-medium text-zinc-700">{item}</span>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* ── NON INCLUDE ── */}
        {plan.excludes.length > 0 && (
          <section className="rounded-3xl bg-white border border-black/6 shadow-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4">Non include</p>
            <ul className="space-y-3 opacity-60">
              {plan.excludes.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <XCircle size={16} className="text-zinc-400 shrink-0" />
                  <span className="text-[13px] font-medium text-zinc-500">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── FAQ ── */}
        <section className="rounded-3xl bg-white border border-black/6 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-2">Domande frequenti</p>
          {plan.faq.map((item, i) => (
            <FaqItem key={i} item={item} />
          ))}
        </section>

        {/* ── TRUST ── */}
        <div className="rounded-2xl bg-white border border-black/5 px-5 py-3.5 flex items-center justify-center gap-5">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Lock size={12} strokeWidth={2.5} />
            <span className="text-[11px] font-bold">Stripe</span>
          </div>
          <div className="w-px h-4 bg-zinc-200" />
          <div className="flex items-center gap-1.5 text-zinc-400">
            <ShieldCheck size={12} strokeWidth={2} />
            <span className="text-[11px] font-bold">Pagamento sicuro</span>
          </div>
          <div className="w-px h-4 bg-zinc-200" />
          <span className="text-[11px] font-bold text-zinc-400">Disdici quando vuoi</span>
        </div>

      </div>

      {/* ── STICKY CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-xl border-t border-black/5 px-5 pt-4"
        style={{ paddingBottom: 'max(96px, calc(env(safe-area-inset-bottom, 0px) + 80px))' }}
      >
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleJoin}
            disabled={loadingCheckout}
            className="w-full h-14 rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: isPro
                ? 'linear-gradient(135deg, #C4974A, #D4793A)'
                : '#1A1A1A',
              color: '#fff',
            }}
          >
            {loadingCheckout
              ? 'Attendi...'
              : isFree
                ? 'Attiva gratuitamente'
                : 'Paga con Stripe'}
            {!loadingCheckout && <ArrowRight size={16} weight="bold" />}
          </button>
          {!isFree && (
            <p className="text-center text-[10px] text-zinc-400 font-medium mt-2">
              Nessun dato richiesto ora · Configura dopo
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
