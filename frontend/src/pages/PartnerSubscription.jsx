import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Compass,
  RocketLaunch,
  Crown,
  CurrencyEur,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
} from '@phosphor-icons/react'

const PLANS = [
  {
    tier: 'discovery',
    name: 'Puglia Discovery',
    productId: 'prod_U6dXaqx4SvzxdW',
    monthlyPrice: 9,
    commissionRate: 25,
    icon: Compass,
    accent: 'from-amber-300/45 to-orange-300/35',
  },
  {
    tier: 'pro',
    name: 'Puglia Pro',
    productId: 'prod_U6dY6wVCv9xLCH',
    monthlyPrice: 29,
    commissionRate: 15,
    icon: RocketLaunch,
    accent: 'from-sky-300/45 to-cyan-300/35',
  },
  {
    tier: 'grande',
    name: 'Grande Puglia',
    productId: 'prod_U6dZmZC556bqNX',
    monthlyPrice: 59,
    commissionRate: 10,
    icon: Crown,
    accent: 'from-emerald-300/45 to-teal-300/35',
  },
]

export default function PartnerSubscription() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState(null)

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

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#F6F3EE] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#F6F3EE] px-5 pb-28 pt-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-amber-200/35 blur-3xl" />
        <div className="absolute -bottom-10 -left-20 w-80 h-80 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-white/80 border border-white/70 shadow-sm backdrop-blur-md flex items-center justify-center"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>
          <span className="text-[10px] uppercase tracking-[0.25em] font-black text-zinc-500">Partner Access</span>
          <div className="w-11" />
        </div>

        <header className="mb-8">
          <h1 className="text-[38px] leading-[0.98] tracking-tight font-black text-zinc-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Scegli il piano
          </h1>
          <p className="mt-3 text-[14px] text-zinc-600 font-medium">
            Nessun piano gratuito. L&apos;ecosistema partner e&apos; riservato agli abbonati attivi.
          </p>
        </header>

        {isActive && activePlan && (
          <div className="mb-7 rounded-3xl border border-emerald-200 bg-emerald-50/70 px-5 py-4 flex items-start gap-3">
            <ShieldCheck size={20} weight="duotone" className="text-emerald-700 mt-0.5" />
            <div>
              <p className="text-[12px] uppercase tracking-[0.2em] font-black text-emerald-700">Piano Attivo</p>
              <p className="text-[17px] font-bold text-emerald-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {activePlan.name}
              </p>
              <p className="text-[13px] text-emerald-800">
                Commissione corrente: <b>{partner?.commission_rate ?? activePlan.commissionRate}%</b>
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isCurrent = isActive && activeTier === plan.tier
            const disabled = false

            return (
              <article
                key={plan.tier}
                className="rounded-[2rem] p-5 border border-white/60 bg-white/50 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.accent} pointer-events-none`} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/70 border border-white/90 flex items-center justify-center">
                        <Icon size={22} weight="duotone" className="text-zinc-900" />
                      </div>
                      <div>
                        <h2 className="text-[26px] leading-none font-bold text-zinc-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                          {plan.name}
                        </h2>
                        <p className="text-[12px] uppercase tracking-[0.15em] font-black text-zinc-600 mt-1">
                          Product: {plan.productId}
                        </p>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] uppercase tracking-[0.18em] font-black">
                        Attivo
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-500">Prezzo</p>
                      <p className="text-[30px] font-black text-zinc-900">
                        <CurrencyEur size={22} weight="bold" className="inline -mt-1" />{plan.monthlyPrice}
                        <span className="text-[13px] text-zinc-600 font-semibold"> /mese</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-500">Commissione</p>
                      <p className="text-[26px] font-black text-zinc-900">{plan.commissionRate}%</p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/partner/subscription/${plan.tier}`)}
                    disabled={disabled || isCurrent}
                    className="mt-5 w-full h-12 rounded-full bg-zinc-950 text-white text-[13px] uppercase tracking-[0.15em] font-black shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCurrent ? 'Piano già attivo' : 'Scopri di più'}
                    {!isCurrent ? <ArrowRight size={14} weight="bold" /> : null}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
