// src/pages/Missioni.jsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { QuestService } from '../services/quest'
import { ChevronLeft, Info, CalendarClock, Shield, Footprints, Church, Navigation, CheckCircle, ArrowRight, Award, Share2, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLocalized } from '../utils/content'
import { getProgressToNextLevel } from '../utils/levels'

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

  const [mainTab, setMainTab] = useState('saghe_storiche') // 'saghe_storiche' | 'sfide_grado'
  const [activeTab, setActiveTab] = useState('attive') // attive, giornaliere, completate (solo in Saghe Storiche)

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
      // 1. Fetch Classic Missions (Eventi a Tempo -> Sfide Grado)
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

      // 3. Fetch user progress se loggato
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

  // --- LOGIC FOR LEVEL PROGRESS (Sfide Grado) ---
  const punti = profile?.punti_classifica || 0
  const { current: currentLevel, next: nextLevel, percentage: levelPercent } = getProgressToNextLevel(punti)

  // --- MOCK DAILY ACTIVITIES ---
  const dailyActivities = [
    { id: 1, title: 'Il Pellegrino', desc: 'Cammina per 2km oggi', current: 1.5, max: 2, unit: 'km', reward: '+50 $', icon: Footprints, hint: '' },
    { id: 2, title: 'Fede e Arte', desc: 'Visita una Chiesa storica', current: 0, max: 1, unit: '', reward: '1 Pack', icon: Church, hint: 'Scoperta consigliata: Cattedrale di Trani' }
  ]

  // Render logic for Missione Principale
  const mainSet = questSets[0]

  let completedStepsCount = 0
  let totalStepsCount = 1
  if (mainSet && questProgress) {
    totalStepsCount = mainSet.steps?.length || 1
    const setStepIds = mainSet.steps?.map(s => s.id) || []
    completedStepsCount = questProgress.completedSteps.filter(id => setStepIds.includes(id)).length
  }
  const progressPercent = Math.min(100, Math.round((completedStepsCount / totalStepsCount) * 100))

  return (
    <div className={`min-h-screen font-sans pb-24 ${mainTab === 'sfide_grado' ? 'bg-[#1C1A14]' : 'bg-[#F9F9F7]'}`}>

      {/* ================= HEADER PRINCIPALE ================= */}
      <div className={`px-6 pt-12 pb-6 sticky top-0 z-20 ${mainTab === 'sfide_grado' ? 'bg-[#1C1A14]' : 'bg-[#F9F9F7]'}`}>

        {/* Top Navbar */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${mainTab === 'sfide_grado' ? 'bg-[#312B1B] text-[#E4AE2F]' : 'bg-transparent text-slate-400'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Segmented Control Switch */}
        <div className={`flex rounded-[14px] p-1.5 ${mainTab === 'sfide_grado' ? 'bg-[#2A2A26] border border-[#3A3A36]' : 'border-2 border-[#E4AE2F] bg-transparent'}`}>
          <button
            onClick={() => setMainTab('saghe_storiche')}
            className={`flex-1 py-3 text-[13px] font-bold rounded-[10px] transition-all ${mainTab === 'saghe_storiche'
              ? 'bg-[#E4AE2F] text-olive-dark shadow-sm'
              : 'text-[#A0937D]'
              }`}
          >
            Saghe Storiche
          </button>
          <button
            onClick={() => setMainTab('sfide_grado')}
            className={`flex-1 py-3 text-[13px] font-bold rounded-[10px] transition-all ${mainTab === 'sfide_grado'
              ? 'bg-[#E4AE2F] text-olive-dark shadow-sm'
              : 'text-[#A0937D]'
              }`}
          >
            Sfide Grado
          </button>
        </div>
      </div>


      {/* =======================================================
          TAB: SAGHE STORICHE (Design Chiaro Originale)
          ======================================================= */}
      {mainTab === 'saghe_storiche' && (
        <div className="animate-in fade-in duration-300">

          <div className="px-6 pt-6 space-y-10">
            {loading ? (
              <MissionSkeleton />
            ) : (
              <>
                {/* ATTIVE */}
                <h2 className="text-[11px] font-bold text-[#E4AE2F] uppercase tracking-wider mb-3">
                  {questSets.length > 1 ? 'Saghe Attive' : 'Saga Principale'}
                </h2>

                {questSets.length > 0 ? (
                  <div className="space-y-6">
                    {questSets.map((set, index) => {
                      let completedStepsCount = 0
                      let totalStepsCount = 1
                      if (set && questProgress) {
                        totalStepsCount = set.steps?.length || 1
                        const setStepIds = set.steps?.map(s => s.id) || []
                        completedStepsCount = questProgress.completedSteps.filter(id => setStepIds.includes(id)).length
                      }
                      const progressPercent = Math.min(100, Math.round((completedStepsCount / totalStepsCount) * 100))

                      return (
                        <section key={set.id}>
                          <div className="relative rounded-[2rem] overflow-hidden shadow-xl shadow-stone-900/10 min-h-[340px] flex flex-col justify-between p-6 bg-stone-900 group">
                            {/* Background Image */}
                            <div
                              className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105"
                              style={{ backgroundImage: `url('${set.image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format'}')` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E44] via-[#1A2E44]/60 to-[#1A2E44]/10" />

                            {/* Top Badges */}
                            <div className="relative flex justify-between items-start">
                              <div className="bg-[#E4AE2F] text-olive-dark text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md shadow-md">
                                Saga Leggendaria
                              </div>
                              <div className="bg-[#1A2E44] border border-[#2D3F55] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                                <span className="text-[#E4AE2F] material-symbols-outlined text-[14px]">star</span> Premio Raro
                              </div>
                            </div>

                            {/* Content */}
                            <div className="relative mt-12 text-white">
                              <h3 className="text-3xl font-bold font-serif leading-tight mb-2 text-white drop-shadow-md">
                                {getLocalized(set, 'title', i18n?.language)}
                              </h3>
                              <p className="text-sm text-white/90 leading-relaxed mb-6 drop-shadow-sm">
                                {getLocalized(set, 'description', i18n?.language) || "Esplora i segreti celati in questa saga leggendaria."}
                              </p>

                              {/* Progress */}
                              <div className="mb-6">
                                <div className="flex justify-between items-end mb-2">
                                  <span className="text-xs text-white/80 font-medium">Progresso</span>
                                  <span className="text-xs font-bold font-serif">{completedStepsCount} / {totalStepsCount} step</span>
                                </div>
                                <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                                  <div
                                    className="h-full bg-[#E4AE2F] rounded-full transition-all duration-1000"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>

                              {/* Action Button */}
                              <Link to={`/saga/${set.id}`} className="w-full bg-[#E4AE2F] hover:bg-[#D4A02A] text-olive-dark font-bold text-base py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                                Continua il Viaggio <ArrowRight className="w-5 h-5" />
                              </Link>
                            </div>
                          </div>
                        </section>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white rounded-[2rem] border border-dashed border-sand">
                    <span className="material-symbols-outlined text-4xl text-sand block mb-2">event_busy</span>
                    <p className="text-olive-light text-sm">Nessuna Saga Leggendaria al momento.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB: SFIDE GRADO (Design Scuro - Come Screenshot)
          ======================================================= */}
      {mainTab === 'sfide_grado' && (
        <div className="px-6 animate-in fade-in duration-300">

          {/* LEVEL BOX */}
          <div className="border border-[#E4AE2F]/40 rounded-[20px] p-5 bg-[#211F18] shadow-lg mb-8 relative overflow-hidden">
            {/* Background subtle glow */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#E4AE2F]/10 blur-[50px] rounded-full" />

            <div className="flex justify-between items-end mb-4 relative z-10">
              <div>
                <span className="text-[#E4AE2F] text-[10px] font-bold uppercase tracking-widest block mb-1">
                  Grado Attuale
                </span>
                <h2 className="text-[26px] text-white font-bold tracking-tight">
                  {currentLevel?.name || 'Iniziamo'}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[#A0937D] text-[10px] font-medium block mb-1">
                  Prossimo Grado
                </span>
                <div className="text-white text-base font-bold">
                  {punti} <span className="text-[#A0937D] text-sm font-normal">/ {nextLevel?.minPoints || '-'} XP</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-[#1C1A14] rounded-full overflow-hidden relative z-10 border border-[#E4AE2F]/10">
              <div
                className="h-full bg-[#E4AE2F] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${levelPercent}%` }}
              />
            </div>
          </div>

          {/* MISSIONI ATTIVE LIST */}
          <h3 className="text-[#E4AE2F] text-[12px] font-bold tracking-widest uppercase mb-4">Missioni Attive</h3>

          <div className="space-y-4">
            {loading ? (
              <div className="h-32 bg-[#211F18] border border-[#E4AE2F]/20 rounded-[24px] animate-pulse"></div>
            ) : missions.length > 0 ? missions.map((mission, index) => {

              // Selezioniamo un'icona tematica
              const getIcon = (i) => {
                if (i % 3 === 0) return <Footprints className="w-7 h-7 text-[#E4AE2F]" strokeWidth={1.5} />
                if (i % 3 === 1) return <BookOpen className="w-6 h-6 text-[#E4AE2F]" strokeWidth={1.5} />
                return <Share2 className="w-6 h-6 text-[#E4AE2F]" strokeWidth={1.5} />
              }

              return (
                <div key={mission.id} className="border border-[#E4AE2F]/20 rounded-[24px] p-5 bg-[#211F18] flex flex-col group hover:border-[#E4AE2F]/40 transition-colors">

                  {/* Card Header */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-[52px] h-[52px] rounded-2xl bg-[#312C1E] flex items-center justify-center shrink-0">
                      {getIcon(index)}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h4 className="text-white text-[19px] font-bold tracking-tight">
                        {getLocalized(mission, 'titolo', i18n?.language)}
                      </h4>
                      <p className="text-[#E4AE2F] text-xs font-medium mt-0.5 truncate tracking-wide">
                        {mission.sottotitolo || "Esplora i confini dell'Impero"}
                      </p>
                    </div>
                    <div className="border border-[#E4AE2F]/30 bg-[#2A261C] text-[#E4AE2F] text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 tracking-wider">
                      +{mission.punti} XP
                    </div>
                  </div>

                  {/* Descrizione */}
                  <p className="text-[#D6D3CD] text-[15px] font-light leading-snug mb-6 pr-4">
                    {getLocalized(mission, 'descrizione', i18n?.language)}
                  </p>

                  {/* Card Footer */}
                  <div className="flex items-end justify-between mt-auto">
                    <div className="w-[50%]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[#A0937D] text-[10px] font-bold tracking-widest uppercase">Progresso</span>
                        <span className="text-[#A0937D] text-[10px] font-bold uppercase">0 / 1</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#1C1A14] rounded-full overflow-hidden border border-[#E4AE2F]/10">
                        <div className="h-full bg-[#E4AE2F] rounded-full w-[25%]" />
                      </div>
                    </div>

                    <Link to={`/missione/${mission.id}`} className="bg-[#E4AE2F] text-[#1C1A14] px-7 py-2.5 rounded-lg text-[13px] font-bold shadow-[0_4px_14px_rgba(228,174,47,0.2)] hover:bg-[#FBE5B4] active:scale-95 transition-all">
                      INIZIA
                    </Link>
                  </div>
                </div>
              )
            }) : (
              <div className="text-center py-10 rounded-[24px] border border-dashed border-[#E4AE2F]/20 bg-[#211F18]">
                <span className="material-symbols-outlined text-4xl text-[#E4AE2F]/40 block mb-2">event_busy</span>
                <p className="text-[#A0937D] text-sm">Nessuna missione Grado disponibile.</p>
              </div>
            )}
          </div>

        </div>
      )
      }

    </div >
  )
}

export default Missioni