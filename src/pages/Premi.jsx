// src/pages/Premi.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { Crown, Trophy, Star, Gift, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLocalized } from '../utils/content'

const Premi = () => {
  const { t, i18n } = useTranslation()
  const [prizes, setPrizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [months, setMonths] = useState([])

  useEffect(() => {
    loadMonths()
    loadPrizes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth])

  const loadMonths = async () => {
    // Carica i mesi disponibili (una sola volta basterebbe, ma qui lo rifacciamo per semplicità o possiamo ottimizzare)
    // Qui simuliamo i mesi correnti +/- range, oppure facciamo una query distinct
    // Per ora teniamo hardcoded +/- 1 mese o fetch distinct
    const { data } = await supabase
      .from('premi_mensili')
      .select('mese')
      .order('mese', { ascending: false })

    if (data) {
      const unique = [...new Set(data.map(p => p.mese))]
      if (unique.length > 0) setMonths(unique)
      else setMonths([new Date().toISOString().slice(0, 7)])
    }
  }

  const loadPrizes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('premi_mensili')
        .select('*')
        .eq('mese', selectedMonth)
        .order('posizione', { ascending: true })

      if (error) throw error
      setPrizes(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getPositionStyle = (pos) => {
    if (pos === 1) return 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white shadow-yellow-500/50'
    if (pos === 2) return 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-slate-500/50'
    if (pos === 3) return 'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-500/50'
    return 'bg-white text-olive-dark border border-sand'
  }

  const formatMonth = (iso) => {
    if (!iso) return ''
    const date = new Date(iso + '-01')
    return date.toLocaleString('it-IT', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-gold/20 mb-2">
          <Crown className="w-10 h-10 text-olive-dark" />
        </div>
        <h1 className="text-4xl font-bold font-serif text-olive-dark">{t('prizes.title')}</h1>
        <p className="text-olive-light max-w-lg mx-auto">
          {t('prizes.subtitle')}
        </p>
      </div>

      {/* MONTH SELECTOR */}
      <div className="flex justify-center">
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none pl-6 pr-12 py-3 rounded-full bg-white border border-sand text-olive-dark font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-gold cursor-pointer capitalize"
          >
            {months.map(m => (
              <option key={m} value={m}>{formatMonth(m)}</option>
            ))}
            {/* Fallback se la lista è vuota */}
            {months.length === 0 && <option value={selectedMonth}>{formatMonth(selectedMonth)}</option>}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-olive-light" />
          </div>
        </div>
      </div>

      {/* PRIZES LIST */}
      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-sand/10 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : prizes.length > 0 ? (
          prizes.map((prize) => (
            <div
              key={prize.id}
              className="group relative overflow-hidden rounded-3xl bg-white border border-sand shadow-sm hover:shadow-xl transition-all duration-300 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start"
            >
              {/* Badge Posizione */}
              <div className={`absolute top-0 left-0 px-4 py-2 rounded-br-2xl font-bold text-sm uppercase tracking-widest shadow-lg ${getPositionStyle(prize.posizione)}`}>
                #{prize.posizione}
              </div>

              {/* Immagine */}
              <div className="w-full md:w-1/3 shrink-0 mt-8 md:mt-0">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-sand/20 shadow-inner relative">
                  {prize.immagine_url ? (
                    <img src={prize.immagine_url} alt={getLocalized(prize, 'titolo', i18n.language)} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-olive-light/20">
                      <Gift className="w-16 h-16" />
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left space-y-4 pt-2">
                <div>
                  <h3 className="text-2xl font-bold text-olive-dark font-serif mb-2">
                    {getLocalized(prize, 'titolo', i18n.language)}
                  </h3>
                  <p className="text-olive-light leading-relaxed">
                    {getLocalized(prize, 'descrizione', i18n.language)}
                  </p>
                </div>

                <div className="pt-4 border-t border-sand/30 flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="px-4 py-2 rounded-full bg-sand/20 text-olive-dark text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> {t('prizes.monthly_reward')}
                  </div>
                  {prize.posizione === 1 && (
                    <div className="px-4 py-2 rounded-full bg-gold/20 text-olive-dark text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                      <Star className="w-4 h-4 text-gold" /> {t('prizes.top_prize')}
                    </div>
                  )}
                </div>

                {/* Termini e Condizioni */}
                {(prize.termini || prize.termini_en) && (
                  <div className="text-left mt-2">
                    <details className="group/details">
                      <summary className="text-xs text-olive-light/70 cursor-pointer hover:text-olive-light list-none flex items-center gap-1 transition-colors">
                        <span className="underline decoration-dotted">{t('prizes.terms')}</span>
                        <ChevronDown className="w-3 h-3 group-open/details:rotate-180 transition-transform" />
                      </summary>
                      <p className="text-xs text-olive-light mt-2 p-3 bg-sand/10 rounded-xl">
                        {getLocalized(prize, 'termini', i18n.language)}
                      </p>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-sand/10 rounded-3xl border border-dashed border-sand">
            <Gift className="w-16 h-16 mx-auto text-olive-light/30 mb-4" />
            <h3 className="text-xl font-bold text-olive-dark mb-1">{t('prizes.no_prizes')}</h3>
            <p className="text-olive-light text-sm">{t('prizes.check_back')}</p>
          </div>
        )}
      </div>

    </div>
  )
}

export default Premi