// src/pages/Missioni.jsx
import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { QuestService } from '../services/quest'
import { ChevronLeft, Info, CalendarClock, Shield, Footprints, Church, Navigation, CheckCircle, ArrowRight, Award, Share2, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLocalized } from '../utils/content'

// --- SKELETON LOADER ---
const MissionSkeleton = () => (
  <div className="rounded-3xl border border-white/5 bg-[#1E202B] p-6 flex flex-col group animate-pulse">
    <div className="h-48 w-full bg-white/5 rounded-2xl mb-4" />
    <div className="h-6 w-3/4 bg-white/5 rounded mb-2" />
    <div className="h-4 w-1/2 bg-white/5 rounded" />
  </div>
)

const Missioni = () => {
  const { t, i18n } = useTranslation()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('attive') // attive, completate (solo in Saghe Storiche)

  const [missions, setMissions] = useState([])
  const [questSets, setQuestSets] = useState([])
  const [questProgress, setQuestProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  // Filtri UI
  const [selectedCity, setSelectedCity] = useState('Tutte')
  const [selectedType, setSelectedType] = useState('Tutti')

  // Derivati Memos
  const cities = useMemo(() => {
    const allCities = questSets.map(s => s.city).filter(Boolean)
    return ['Tutte', ...new Set(allCities)]
  }, [questSets])

  const types = useMemo(() => {
    const allTypes = questSets.map(s => s.quest_type).filter(Boolean)
    return ['Tutti', ...new Set(allTypes)]
  }, [questSets])

  const filteredSets = useMemo(() => {
    return questSets.filter(set => {
      const matchCity = selectedCity === 'Tutte' || set.city === selectedCity
      const matchType = selectedType === 'Tutti' || set.quest_type === selectedType
      return matchCity && matchType
    })
  }, [questSets, selectedCity, selectedType])

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Quest Sets (Missione Principale)
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
    <div className="min-h-screen font-sans pb-24 bg-[#14151B]">

      {/* ================= HEADER PRINCIPALE ================= */}
      <div className="px-6 pt-12 pb-6 sticky top-0 z-20 bg-[#14151B]">

        {/* Top Navbar */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-[#1E202B] text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold font-serif text-white">
            Missioni
          </h1>
        </div>

        {/* Segmented Control Switch Rimosso */}
      </div>


      {/* =======================================================
          SAGHE STORICHE
          ======================================================= */}
      <div className="animate-in fade-in duration-300">

        <div className="px-6 pt-6 space-y-10">
          {loading ? (
            <MissionSkeleton />
          ) : (
            <>
              {/* FILTRI CHIPS */}
              {questSets.length > 0 && (
                <div className="space-y-4 mb-8 -mx-6 px-6 overflow-x-hidden">
                  {/* Filtro Città */}
                  {cities.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                      {cities.map((city, idx) => (
                        <button
                          key={idx}
                          className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${selectedCity === city
                            ? 'bg-[#E4AE2F] text-[#14151B]'
                            : 'bg-[#1E202B] text-slate-400 border border-white/5 hover:bg-white/10'
                            }`}
                          onClick={() => setSelectedCity(city)}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Filtro Tipo Quest */}
                  {types.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                      {types.map((type, idx) => (
                        <button
                          key={idx}
                          className={`snap-start whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors ${selectedType === type
                            ? 'bg-slate-200 text-slate-900 border-slate-200'
                            : 'bg-transparent text-slate-500 border border-slate-700 hover:text-white hover:border-slate-500'
                            }`}
                          onClick={() => setSelectedType(type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* LISTA SAGHE */}
              <h2 className="text-[11px] font-bold text-[#E4AE2F] uppercase tracking-wider mb-3">
                {filteredSets.length > 1 ? 'Saghe Attive' : 'Saga Principale'}
              </h2>

              {filteredSets.length > 0 ? (
                <div className="space-y-6">
                  {filteredSets.map((set, index) => {
                    let completedStepsCount = 0
                    let totalStepsCount = 1
                    if (set && questProgress) {
                      totalStepsCount = set.steps?.length || 1
                      const setStepIds = set.steps?.map(s => s.id) || []
                      completedStepsCount = questProgress.completedSteps.filter(id => setStepIds.includes(id)).length
                    }
                    const progressPercent = Math.min(100, Math.round((completedStepsCount / totalStepsCount) * 100))

                    return (
                      <Link to={`/saga/${set.id}`} key={set.id} className="block active:scale-[0.98] transition-all pb-4">
                        <div className="bg-[#1E202B] rounded-3xl overflow-hidden shadow-lg border border-white/5 flex flex-col group">

                          {/* TOP: Image */}
                          <div className="relative h-56 w-full shrink-0">
                            <img
                              src={set.image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format'}
                              alt={getLocalized(set, 'title', i18n?.language)}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />

                            {/* Overlay Gradient at the bottom of the image for better text transition feeling */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1E202B] via-transparent to-transparent opacity-80" />

                            {/* Floating Badge top-right */}
                            <div className="absolute top-4 right-4 bg-[#6A2B1C]/80 border border-[#B34524]/60 backdrop-blur-md text-orange-50 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-full z-10">
                              {index % 2 === 0 ? 'Step Into The Story' : 'Squad Challenge'}
                            </div>
                          </div>

                          {/* BOTTOM: Content */}
                          <div className="p-5 flex flex-col -mt-4 relative z-10 bg-[#1E202B]">
                            <h3 className="text-white text-[22px] font-bold leading-tight mb-3 pr-2">
                              {getLocalized(set, 'title', i18n?.language)}
                            </h3>

                            <div className="flex items-center gap-2 mb-4">
                              {set.city && (
                                <span className="flex items-center gap-1 text-[#E4AE2F] text-[13px] font-bold border border-[#E4AE2F]/30 bg-[#E4AE2F]/10 px-2.5 py-1 rounded-full">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {set.city}
                                </span>
                              )}
                              <span className="text-slate-400 text-[14px]">
                                {set.distance_km || '5.2'} km <span className="mx-1">|</span> {set.completions_count || '1911'} completate
                              </span>
                              <span className="ml-auto border border-[#B39345]/50 text-[#D8B65A] text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                                {set.difficulty || 'Medium'}
                              </span>
                            </div>

                            {/* Removed Prezzo block */}
                          </div>

                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-[#1E202B] rounded-[2rem] border border-dashed border-white/10">
                  <span className="material-symbols-outlined text-4xl text-slate-500 block mb-2">event_busy</span>
                  <p className="text-slate-400 text-sm">Nessuna Saga Leggendaria al momento.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  )
}

export default Missioni