// src/pages/Missioni.jsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { QuestService } from '../services/quest'
import { ChevronLeft, Info, CalendarClock, Shield, Footprints, Church, Navigation, CheckCircle, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLocalized } from '../utils/content'

// --- SKELETON LOADER ---
const MissionSkeleton = () => (
  <div className="rounded-3xl border border-sand bg-white p-6 space-y-4 animate-pulse">
    <div className="h-24 w-full bg-sand/30 rounded-2xl" />
    <div className="h-6 w-3/4 bg-sand/30 rounded" />
    <div className="h-4 w-1/2 bg-sand/20 rounded" />
  </div>
)

const Missioni = () => {
  const { t, i18n } = useTranslation()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('attive') // attive, giornaliere, completate
  const [missions, setMissions] = useState([])
  const [questSets, setQuestSets] = useState([])
  const [questProgress, setQuestProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Classic Missions (Eventi a Tempo)
      const { data: allMissions, error: mErr } = await supabase
        .from('missioni_catalogo')
        .select('*')
        .eq('attiva', true)
        .order('punti', { ascending: false })

      if (mErr) throw mErr
      setMissions(allMissions || [])

      // 2. Fetch Quest Sets (Missione Principale)
      const sets = await QuestService.getActiveSets()
      setQuestSets(sets)

      // 3. Fetch user progress if logged in
      if (profile?.id) {
        const progress = await QuestService.getUserProgress(profile.id)
        setQuestProgress(progress)
      }

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- MOCK DAILY ACTIVITIES ---
  const dailyActivities = [
    { id: 1, title: 'Il Pellegrino', desc: 'Cammina per 2km oggi', current: 1.5, max: 2, unit: 'km', reward: '+50 $', icon: Footprints, hint: '' },
    { id: 2, title: 'Fede e Arte', desc: 'Visita una Chiesa storica', current: 0, max: 1, unit: '', reward: '1 Pack', icon: Church, hint: 'Scoperta consigliata: Cattedrale di Trani' }
  ]

  // Render logic for Missione Principale
  const mainSet = questSets[0] // Taking the first active set for showcase

  // Calculate specific set progress
  let completedStepsCount = 0
  let totalStepsCount = 1
  if (mainSet && questProgress) {
    totalStepsCount = mainSet.steps?.length || 1
    const setStepIds = mainSet.steps?.map(s => s.id) || []
    completedStepsCount = questProgress.completedSteps.filter(id => setStepIds.includes(id)).length
  }
  const progressPercent = Math.min(100, Math.round((completedStepsCount / totalStepsCount) * 100))

  return (
    <div className="min-h-screen bg-[#F9F9F7] font-sans pb-24">

      {/* HEADER */}
      <div className="bg-white px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-olive-dark">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase text-olive-dark">Sfide e Missioni</h1>
        <button className="p-2 -mr-2 text-olive-dark">
          <Info className="w-6 h-6 fill-olive-dark text-white" />
        </button>
      </div>

      {/* TABS */}
      <div className="flex px-6 bg-white border-b border-sand text-sm font-bold shadow-sm relative z-0">
        <button
          onClick={() => setActiveTab('attive')}
          className={`flex-1 py-4 text-center border-b-[3px] transition-colors ${activeTab === 'attive' ? 'border-gold text-olive-dark' : 'border-transparent text-slate-400'}`}
        >
          Attive
        </button>
        <button
          onClick={() => setActiveTab('giornaliere')}
          className={`flex-1 py-4 text-center border-b-[3px] transition-colors ${activeTab === 'giornaliere' ? 'border-gold text-olive-dark' : 'border-transparent text-slate-400'}`}
        >
          Giornaliere
        </button>
        <button
          onClick={() => setActiveTab('completate')}
          className={`flex-1 py-4 text-center border-b-[3px] transition-colors ${activeTab === 'completate' ? 'border-gold text-olive-dark' : 'border-transparent text-slate-400'}`}
        >
          Completate
        </button>
      </div>

      {/* CONTENT: ATTIVE */}
      {activeTab === 'attive' && (
        <div className="px-6 pt-6 space-y-10">

          {loading ? (
            <MissionSkeleton />
          ) : (
            <>
              {/* MISSIONE PRINCIPALE (QUEST SET) */}
              {mainSet && (
                <section>
                  <h2 className="text-[11px] font-bold text-gold uppercase tracking-wider mb-3">Missione Principale</h2>

                  <div className="relative rounded-[2rem] overflow-hidden shadow-xl shadow-stone-900/10 min-h-[340px] flex flex-col justify-between p-6 bg-stone-900 group">
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105"
                      style={{ backgroundImage: `url('${mainSet.image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format'}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E44] via-[#1A2E44]/60 to-[#1A2E44]/10" />

                    {/* Top Badges */}
                    <div className="relative flex justify-between items-start">
                      <div className="bg-gold text-olive-dark text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md shadow-md">
                        Leggendaria
                      </div>
                      <div className="bg-[#1A2E44] border border-[#2D3F55] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                        <span className="text-gold material-symbols-outlined text-[14px]">star</span> Premio Raro
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative mt-12 text-white">
                      <h3 className="text-3xl font-bold font-serif leading-tight mb-2 text-white drop-shadow-md">
                        {getLocalized(mainSet, 'title', i18n?.language)}
                      </h3>
                      <p className="text-sm text-white/90 leading-relaxed mb-6 drop-shadow-sm">
                        {getLocalized(mainSet, 'description', i18n?.language) || "Esplora i segreti celati nell'architettura federiciana e sblocca la carta esclusiva di Castel del Monte."}
                      </p>

                      {/* Progress */}
                      <div className="mb-6">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs text-white/80 font-medium">Progresso</span>
                          <span className="text-xs font-bold font-serif">{completedStepsCount} / {totalStepsCount} monumenti</span>
                        </div>
                        <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                          <div
                            className="h-full bg-gold rounded-full transition-all duration-1000"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link to="/album" className="w-full bg-gold hover:bg-[#E4AE2F] text-olive-dark font-bold text-base py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                        Continua il Viaggio <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </section>
              )}

              {/* EVENTI A TEMPO (CLASSIC MISSIONS) */}
              <section>
                <h2 className="text-[11px] font-bold text-gold uppercase tracking-wider mb-3">Eventi a Tempo</h2>

                <div className="space-y-4">
                  {missions.slice(0, 3).map(mission => (
                    <div key={mission.id} className="bg-white rounded-[2rem] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-sand/50">

                      {/* Event Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-[#FFF9EB] text-gold rounded-xl flex items-center justify-center shrink-0 border border-[#FBE5B4]">
                          <CalendarClock className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-olive-dark leading-tight mb-1">
                            {getLocalized(mission, 'titolo', i18n?.language)}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 uppercase tracking-widest">
                            <span className="material-symbols-outlined text-[14px]">schedule</span> Termina tra: 01:23:45
                          </div>
                        </div>
                      </div>

                      {/* Event Body */}
                      <div className="bg-[#F8F9FA] rounded-[1.2rem] p-4 flex items-center gap-4 border border-sand/60">
                        <div className="bg-white w-14 h-14 rounded-xl shadow-sm flex items-center justify-center border border-sand shrink-0">
                          <Shield className="w-7 h-7 text-olive-light" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 italic mb-1.5 truncate">
                            "{getLocalized(mission, 'descrizione', i18n?.language)}"
                          </p>
                          <div className="text-[10px] font-bold text-gold uppercase tracking-widest">
                            Ricompensa: +{mission.punti} Punti
                          </div>
                        </div>
                        <Link to={`/missione/${mission.id}`} className="bg-[#1A2E44] text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-md hover:bg-[#132130] transition-colors active:scale-95 shrink-0">
                          Partecipa
                        </Link>
                      </div>

                    </div>
                  ))}

                  {missions.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-[2rem] border border-dashed border-sand">
                      <span className="material-symbols-outlined text-4xl text-sand block mb-2">event_busy</span>
                      <p className="text-olive-light text-sm">Nessun evento a tempo al momento.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* ATTIVITÀ GIORNALIERE */}
              <section className="pb-10">
                <div className="flex justify-between items-end mb-3">
                  <h2 className="text-[11px] font-bold text-gold uppercase tracking-wider">Attività Giornaliere</h2>
                  <span className="text-[11px] text-slate-400 font-medium">Reset tra 14h 22m</span>
                </div>

                <div className="space-y-4">
                  {dailyActivities.map((activity) => (
                    <div key={activity.id} className="bg-white rounded-[2rem] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-sand/50 flex flex-col md:flex-row md:items-center gap-4">

                      {/* Icon */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 rounded-full border-2 border-gold flex items-center justify-center bg-white shrink-0 relative">
                          {/* Using Lucide Icons as placeholder for custom logic */}
                          <activity.icon className={`w-6 h-6 ${activity.color}`} />
                          {/* Small circular completion indicator placeholder */}
                          {activity.current >= activity.max && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full text-white border-2 border-white">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-olive-dark">{activity.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{activity.desc}</p>
                          {activity.hint && (
                            <p className="text-[10px] text-gold font-bold mt-1.5">{activity.hint}</p>
                          )}
                        </div>
                      </div>

                      {/* Progress / Reward */}
                      <div className="flex flex-col md:items-end justify-center w-full md:w-auto mt-2 md:mt-0">
                        {/* Reward Badge */}
                        {activity.reward && (
                          <div className="hidden md:flex flex-col items-center mb-1">
                            <div className="w-6 h-6 bg-[#FEF6E4] rounded-md text-gold font-bold flex items-center justify-center text-xs border border-gold/30">
                              {activity.reward.includes('$') ? '$' : 'P'}
                            </div>
                            <span className="text-[10px] font-bold text-olive-dark mt-1">{activity.reward.replace('$', '')}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 w-full md:w-48 mt-2 md:mt-0">
                          <div className="h-1.5 flex-1 bg-sand/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gold rounded-full"
                              style={{ width: `${Math.min(100, (activity.current / activity.max) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                            {activity.current} / {activity.max} {activity.unit}
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </section>

            </>
          )}

        </div>
      )}

      {/* CONTENT: GIORNALIERE */}
      {activeTab === 'giornaliere' && (
        <div className="px-6 pt-10 text-center">
          <div className="w-20 h-20 bg-sand/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Footprints className="w-10 h-10 text-olive-light" />
          </div>
          <h2 className="text-xl font-bold font-serif text-olive-dark mb-2">Tutte le attività giornaliere</h2>
          <p className="text-olive-light text-sm">Le tue attività quotidiane verranno mostrate qui. Torna domani per nuove sfide!</p>
        </div>
      )}

      {/* CONTENT: COMPLETATE */}
      {activeTab === 'completate' && (
        <div className="px-6 pt-10 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-100">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-bold font-serif text-olive-dark mb-2">Traguardi Raggiunti</h2>
          <p className="text-olive-light text-sm">Qui troverai lo storico di tutte le tue missioni completate e dei set leggendari sbloccati.</p>
        </div>
      )}

    </div>
  )
}

export default Missioni