// src/pages/Missioni.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Search, Filter, CheckCircle, Clock, Lock, ArrowRight, Zap, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLocalized } from '../utils/content'

// --- SKELETON LOADER ---
const MissionSkeleton = () => (
  <div className="rounded-3xl border border-sand bg-white p-6 space-y-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 bg-sand/30 rounded-2xl" />
      <div className="w-16 h-6 bg-sand/20 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="h-6 w-3/4 bg-sand/30 rounded" />
      <div className="h-4 w-full bg-sand/20 rounded" />
      <div className="h-4 w-1/2 bg-sand/20 rounded" />
    </div>
    <div className="pt-4 border-t border-sand/30 flex justify-between">
      <div className="w-20 h-4 bg-sand/20 rounded" />
      <div className="w-16 h-4 bg-sand/20 rounded" />
    </div>
  </div>
)

const Missioni = () => {
  const { t, i18n } = useTranslation()
  const { profile } = useAuth()
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filter, setFilter] = useState('all') // all, active, completed
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadMissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMissions = async () => {
    setLoading(true)
    try {
      // 1. Fetch Tutte le Missioni
      const { data: allMissions, error: mErr } = await supabase
        .from('missioni_catalogo')
        .select('*')
        .eq('attiva', true)
        .order('punti', { ascending: false })

      if (mErr) throw mErr

      // 2. Fetch Missioni Completate/In Attesa dell'utente (se loggato)
      let userMissions = []
      if (profile?.id) {
        const { data: um, error: uErr } = await supabase
          .from('missioni_inviate')
          .select('id_missione, stato, period_key')
          .eq('id_utente', profile.id)

        if (uErr) throw uErr
        userMissions = um || []
      }

      // 3. Merge Status
      // Mappa semplificata: ID Missione -> Stato più recente
      // (Per logica più complessa ricorrente servirebbe logica period_key, qui semplifichiamo UI catalogo)
      const statusMap = {}
      userMissions.forEach(um => {
        // Se c'è già uno stato, diamo priorità a 'In attesa' o 'Approvata' rispetto a Rifiutata
        const current = statusMap[um.id_missione]
        if (!current || (current !== 'Approvata' && um.stato === 'Approvata')) {
          statusMap[um.id_missione] = um.stato
        } else if (!current && um.stato === 'In attesa') {
          statusMap[um.id_missione] = 'In attesa'
        }
      })

      const merged = allMissions.map(m => ({
        ...m,
        userStatus: statusMap[m.id] || null // null, 'In attesa', 'Approvata', 'Rifiutata'
      }))

      setMissions(merged)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- FILTER LOGIC ---
  const filteredMissions = missions.filter(m => {
    // Text Search (Localized)
    const title = getLocalized(m, 'titolo', i18n.language).toLowerCase()
    const desc = getLocalized(m, 'descrizione', i18n.language).toLowerCase()
    const matchesSearch = title.includes(search.toLowerCase()) || desc.includes(search.toLowerCase())

    // Status Filter
    let matchesFilter = true
    if (filter === 'completed') matchesFilter = m.userStatus === 'Approvata'
    if (filter === 'todo') matchesFilter = !m.userStatus || m.userStatus === 'Rifiutata'
    if (filter === 'pending') matchesFilter = m.userStatus === 'In attesa'

    return matchesSearch && matchesFilter
  })

  const iconForMission = (tipo) => {
    const t = String(tipo || '').toLowerCase()
    const map = { live: '📷', galleria: '🖼️', link: '🔗', button: '🖱️', bottone: '🖱️' }
    return map[t] || '🎯'
  }

  return (
    <div className="space-y-8 pb-12">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-olive-dark">{t('missions.title')}</h1>
          <p className="text-olive-light mt-1">{t('missions.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-sand shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-olive-dark text-white shadow-md' : 'text-olive-light hover:bg-sand/30'}`}
          >
            {t('missions.filter_all')}
          </button>
          <button
            onClick={() => setFilter('todo')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'todo' ? 'bg-gold text-olive-dark shadow-md' : 'text-olive-light hover:bg-sand/30'}`}
          >
            {t('missions.filter_todo')}
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'completed' ? 'bg-green-600 text-white shadow-md' : 'text-olive-light hover:bg-sand/30'}`}
          >
            {t('missions.filter_done')}
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
        <input
          type="text"
          placeholder={t('missions.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-sand bg-white focus:outline-none focus:ring-2 focus:ring-olive-dark/20 focus:border-olive-dark transition-all shadow-sm"
        />
      </div>

      {/* STATS SUMMARY (Optional) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-olive-dark to-olive-screen text-white shadow-md">
          <div className="text-xs font-medium opacity-80 uppercase tracking-widest">{t('missions.stats_total')}</div>
          <div className="text-2xl font-bold mt-1">{missions.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-sand text-olive-dark shadow-sm">
          <div className="text-xs font-medium text-olive-light uppercase tracking-widest">{t('missions.stats_completed')}</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {missions.filter(m => m.userStatus === 'Approvata').length}
          </div>
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MissionSkeleton /><MissionSkeleton /><MissionSkeleton />
        </div>
      ) : filteredMissions.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMissions.map((mission) => {
            const isCompleted = mission.userStatus === 'Approvata'
            const isPending = mission.userStatus === 'In attesa'
            const isRejected = mission.userStatus === 'Rifiutata'

            return (
              <Link
                key={mission.id}
                to={`/missione/${mission.id}`}
                className={`group relative flex flex-col justify-between rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isCompleted
                  ? 'bg-green-50/50 border-green-200 hover:border-green-300'
                  : isPending
                    ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                    : 'bg-white border-sand hover:border-gold/50'
                  }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-colors ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-sand/20 text-olive-dark group-hover:bg-gold group-hover:text-white'
                      }`}>
                      {iconForMission(mission.tipo_verifica)}
                    </div>
                    {isCompleted && <CheckCircle className="w-6 h-6 text-green-600" />}
                    {isPending && <Clock className="w-6 h-6 text-amber-500" />}
                    {isRejected && <div className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase">Rifiutata</div>}
                  </div>

                  <h3 className="font-bold font-serif text-lg text-olive-dark mb-2 leading-tight">
                    {getLocalized(mission, 'titolo', i18n.language)}
                  </h3>
                  <p className="text-sm text-olive-light line-clamp-2 leading-relaxed font-sans mb-4">
                    {getLocalized(mission, 'descrizione', i18n.language)}
                  </p>
                </div>

                <div className="pt-4 border-t border-black/5 flex justify-between items-center mt-auto">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${mission.cadenza === 'giornaliera' ? 'bg-blue-50 text-blue-700' : 'bg-sand/30 text-olive-dark'}`}>
                      {mission.cadenza}
                    </span>
                  </div>
                  <span className="font-bold text-gold text-lg flex items-center gap-1">
                    +{mission.punti} <span className="text-xs text-olive-light font-normal">pts</span>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-sand/10 rounded-3xl border border-dashed border-sand">
          <Target className="w-16 h-16 mx-auto text-olive-light/30 mb-4" />
          <h3 className="text-xl font-bold text-olive-dark mb-1">{t('missions.no_results_title')}</h3>
          <p className="text-olive-light">{t('missions.no_results_desc')}</p>
          <button onClick={() => { setSearch(''); setFilter('all'); }} className="mt-4 text-gold font-bold underline">
            {t('missions.clear_filters')}
          </button>
        </div>
      )}
    </div>
  )
}

export default Missioni