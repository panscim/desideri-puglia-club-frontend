// src/pages/Missioni.jsx
import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { QuestService } from '../services/quest'
import { CaretLeft, MapPin, Compass, Heart } from '@phosphor-icons/react'
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
  const [searchParams] = useSearchParams()
  const initialCity = searchParams.get('city') || 'Tutte'

  const [questSets, setQuestSets] = useState([])
  const [questProgress, setQuestProgress] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtri UI
  const [selectedCity, setSelectedCity] = useState(initialCity)
  const [selectedType, setSelectedType] = useState('Tutti')

  useEffect(() => {
    const cityParam = searchParams.get('city')
    if (cityParam) {
      setSelectedCity(cityParam)
    }
  }, [searchParams])

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

        // 4. Fetch user favorites
        const favs = await QuestService.getUserFavorites(profile.id)
        setFavorites(favs)
      }

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async (e, setId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!profile?.id) return

    const res = await QuestService.toggleFavorite(profile.id, setId)
    if (res.success) {
      if (res.isFavorite) {
        setFavorites(prev => [...prev, setId])
      } else {
        setFavorites(prev => prev.filter(id => id !== setId))
      }
    }
  }

  return (
    <div className="min-h-screen font-sans pb-24 bg-zinc-950">

      {/* ================= HEADER PRINCIPALE ================= */}
      <div className="px-5 pt-12 pb-4 sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-white/5">

        {/* Top Navbar */}
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-zinc-900 border border-white/5 text-white hover:bg-zinc-800"
          >
            <CaretLeft size={24} weight="bold" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black font-satoshi text-white tracking-tight leading-none">
              Esplora
            </h1>
            <span className="text-zinc-400 text-[13px] font-geist mt-1">Svela i segreti di Puglia</span>
          </div>
        </div>
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
              {/* FILTRI CHIPS ESTETICI */}
              {questSets.length > 0 && (
                <div className="space-y-6 mb-8 -mx-6 px-6 overflow-x-hidden pt-2">

                  {/* Filtro Città */}
                  {cities.length > 1 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-zinc-300 px-1">
                        <MapPin size={16} weight="fill" className="text-red-500" />
                        <span className="text-[12px] font-bold tracking-wider uppercase font-geist">Destinazione</span>
                      </div>
                      <div className="flex gap-2 border-b border-zinc-900 pb-4 overflow-x-auto scrollbar-hide snap-x">
                        {cities.map((city, idx) => (
                          <button
                            key={idx}
                            className={`snap-start whitespace-nowrap pl-3 pr-4 py-2 rounded-full text-[13px] font-geist font-medium transition-all flex items-center gap-2 border shadow-sm ${selectedCity === city
                              ? 'bg-white text-zinc-950 border-white scale-100'
                              : 'bg-zinc-900 border-white/10 text-zinc-400 hover:bg-zinc-800'
                              }`}
                            onClick={() => setSelectedCity(city)}
                          >
                            <MapPin weight={selectedCity === city ? "fill" : "regular"} size={16} />
                            {city === 'Tutte' ? 'Tutta la Puglia' : city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filtro Tipo Quest */}
                  {types.length > 1 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-zinc-300 px-1">
                        <Compass size={16} weight="fill" className="text-blue-500" />
                        <span className="text-[12px] font-bold tracking-wider uppercase font-geist">Tipologia</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                        {types.map((type, idx) => (
                          <button
                            key={idx}
                            className={`snap-start whitespace-nowrap px-4 py-2 rounded-xl text-[13px] font-geist font-medium transition-all border ${selectedType === type
                              ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                              : 'bg-transparent text-zinc-500 border-white/5 hover:border-white/20'
                              }`}
                            onClick={() => setSelectedType(type)}
                          >
                            {type === 'Tutti' ? 'Tutte le esperienze' : type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LISTA SAGHE */}
              {(() => {
                const hasCityFilterAndEmpty = selectedCity !== 'Tutte' && filteredSets.length === 0;
                const setsToDisplay = hasCityFilterAndEmpty ? questSets : filteredSets;

                return (
                  <>
                    {hasCityFilterAndEmpty && (
                      <div className="bg-zinc-800/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 mb-8 flex flex-col items-center justify-center text-center shadow-lg">
                        <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-3 border border-white/5">
                          <span className="text-xl animate-pulse">🌙</span>
                        </div>
                        <p className="text-white text-[15px] font-bold">Non ci sono ancora Saghe a {selectedCity}.</p>
                        <p className="text-zinc-400 text-sm mt-1 font-geist">Nessun problema, esplora le altre avventure disponibili!</p>
                      </div>
                    )}

                    <h2 className="text-[11px] font-bold text-[#E4AE2F] uppercase tracking-wider mb-3">
                      {setsToDisplay.length > 1 ? 'Saghe Attive' : 'Saga Principale'}
                    </h2>

                    {setsToDisplay.length > 0 ? (
                      <div className="space-y-6">
                        {setsToDisplay.map((set, index) => {
                          let completedStepsCount = 0
                          let totalStepsCount = 1
                          if (set && questProgress) {
                            totalStepsCount = set.steps?.length || 1
                            const setStepIds = set.steps?.map(s => s.id) || []
                            completedStepsCount = questProgress.completedSteps.filter(id => setStepIds.includes(id)).length
                          }
                          const progressPercent = Math.min(100, Math.round((completedStepsCount / totalStepsCount) * 100))

                          return (
                            <Link to={`/saga/${set.id}/intro`} key={set.id} className="block active:scale-[0.98] transition-all pb-4">
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

                                  {/* Floating Badge top-left */}
                                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                    <div className="bg-[#6A2B1C]/80 border border-[#B34524]/60 backdrop-blur-md text-orange-50 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-full">
                                      {index % 2 === 0 ? 'Step Into The Story' : 'Squad Challenge'}
                                    </div>
                                    {set.is_original ? (
                                      <div className="flex items-center gap-1.5 bg-zinc-950/70 backdrop-blur-md px-2 py-1 rounded-lg border border-[#E4AE2F]/30 shadow-lg">
                                        <div className="w-5 h-5 rounded-md bg-[#E4AE2F] flex items-center justify-center text-[10px] font-black text-zinc-900 shadow-inner">D</div>
                                        <div className="flex flex-col">
                                          <span className="text-[8px] font-black uppercase tracking-[0.1em] text-[#E4AE2F] leading-none">Originals</span>
                                          <span className="text-[5px] font-medium text-white/50 uppercase tracking-[0.05em] leading-none mt-0.5">by Desideri di Puglia</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 bg-zinc-950/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-lg w-fit">
                                        <div className="text-[7px] font-bold text-zinc-400 flex flex-col uppercase tracking-tighter leading-tight">
                                          <span className="text-white/80">Certificato da</span>
                                          <span>Desideri di Puglia</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Heart Button */}
                                  <button
                                    onClick={(e) => handleToggleFavorite(e, set.id)}
                                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-950/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-lg hover:scale-110 active:scale-95 transition-transform z-20"
                                  >
                                    <Heart
                                      size={22}
                                      weight={favorites.includes(set.id) ? "fill" : "bold"}
                                      className={favorites.includes(set.id) ? "text-red-500" : "text-white"}
                                    />
                                  </button>

                                  {/* Progress Bar Override on Image */}
                                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-[#1E202B]/50 backdrop-blur-sm">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#D8B65A] to-[#E4AE2F] transition-all duration-1000 ease-out"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                </div>

                                {/* BOTTOM: Content */}
                                <div className="p-5 flex flex-col relative z-10 bg-[#1E202B]">
                                  <h3 className="text-white text-[22px] font-bold leading-tight mb-3 pr-2">
                                    {getLocalized(set, 'title', i18n?.language)}
                                  </h3>

                                  <div className="flex items-center gap-2">
                                    {set.city && (
                                      <span className="flex items-center gap-1 text-[#E4AE2F] text-[13px] font-bold border border-[#E4AE2F]/30 bg-[#E4AE2F]/10 px-2.5 py-1 rounded-full">
                                        <MapPin weight="fill" size={14} />
                                        {set.city}
                                      </span>
                                    )}
                                    <span className="text-slate-400 text-[14px]">
                                      {set.distance_km || '5.2'} km
                                    </span>
                                    <span className="ml-auto border border-[#B39345]/50 text-[#D8B65A] text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                                      {set.difficulty || 'Medium'}
                                    </span>
                                  </div>
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
                )
              })()}
            </>
          )}
        </div>
      </div>

    </div>
  )
}

export default Missioni