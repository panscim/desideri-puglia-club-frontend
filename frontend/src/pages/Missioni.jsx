// src/pages/Missioni.jsx
import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { QuestService } from '../services/quest'
import { CaretLeft, MapPin, Compass, Heart, ArrowRight, Sparkle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { getLocalized } from '../utils/content'
import { motion, AnimatePresence } from 'framer-motion'

// --- ANIMATION VARIANTS ---
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

// --- SKELETON LOADER ---
const MissionSkeleton = () => (
  <div className="space-y-10">
    {[1, 2].map(i => (
      <div key={i} className="aspect-[4/5] w-full bg-zinc-100 animate-pulse rounded-[3rem]" />
    ))}
  </div>
)

// --- FILTER PILL ---
const FilterPill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border transition-all duration-300`}
    style={active
      ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg-base)', borderColor: 'var(--text-primary)' }
      : { backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
    }
  >
    {children}
  </button>
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

  const [selectedCity, setSelectedCity] = useState(initialCity)
  const [selectedType, setSelectedType] = useState('Tutti')

  useEffect(() => {
    const cityParam = searchParams.get('city')
    if (cityParam) setSelectedCity(cityParam)
  }, [searchParams])

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
      const sets = await QuestService.getActiveSets()
      setQuestSets(sets)
      if (profile?.id) {
        const progress = await QuestService.getUserProgress(profile.id)
        setQuestProgress(progress)
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

  const hasCityFilterAndEmpty = selectedCity !== 'Tutte' && filteredSets.length === 0
  const setsToDisplay = hasCityFilterAndEmpty ? questSets : filteredSets

  return (
    <div className="min-h-screen pb-32 font-sans selection:bg-orange-500/30 transition-colors duration-500" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* ╔══ NAV ══════════════════════════════════════════╗ */}
      <nav
        style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}
        className="fixed top-0 inset-x-0 z-[100] px-5 h-16 flex items-center justify-between shadow-sm"
      >
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <CaretLeft size={18} weight="bold" style={{ color: 'var(--text-primary)' }} />
        </button>
        <p style={{ color: 'var(--text-primary)' }} className="text-[10px] font-black uppercase tracking-[0.4em] text-center">
          Missioni
        </p>
        {/* Map toggle: opens Mappa pre-set to Saghe tab */}
        <button
          onClick={() => navigate('/mappa?tab=saghe')}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          title="Vista mappa"
        >
          <MapPin size={18} weight="fill" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </nav>

      <main className="pt-28 px-5 max-w-lg mx-auto">

        {/* ── Hero ─────────────────────────────────────── */}
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-4"
          >
            <div className="h-[1px] w-8 bg-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">
              Saghe Leggendarie
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[2.8rem] font-black text-zinc-900 leading-[0.9] mb-4 lowercase first-letter:uppercase tracking-tighter"
            style={{ color: 'var(--text-primary)' }}
          >
            Esplora la<br />Puglia Vera.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[13px] text-zinc-500 font-medium leading-relaxed max-w-[85%]"
          >
            Avventure autentiche tra storia, cultura e natura pugliese. Sblocca ogni tappa e diventa leggenda.
          </motion.p>
        </header>

        {/* ── Filtri ──────────────────────────────────── */}
        {!loading && questSets.length > 0 && (
          <section className="mb-14 space-y-6">
            {/* Filtro Città */}
            {cities.length > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} weight="fill" className="text-orange-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Destinazione</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide px-1">
                  {cities.map((city, idx) => (
                    <FilterPill
                      key={idx}
                      active={selectedCity === city}
                      onClick={() => setSelectedCity(city)}
                    >
                      {city === 'Tutte' ? 'Tutta la Puglia' : city}
                    </FilterPill>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Filtro Tipo */}
            {types.length > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Compass size={14} weight="fill" className="text-blue-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Tipologia</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide px-1">
                  {types.map((type, idx) => (
                    <FilterPill
                      key={idx}
                      active={selectedType === type}
                      onClick={() => setSelectedType(type)}
                    >
                      {type === 'Tutti' ? 'Tutte' : type}
                    </FilterPill>
                  ))}
                </div>
              </motion.div>
            )}
          </section>
        )}

        {/* ── Empty city notice ───────────────────────── */}
        <AnimatePresence>
          {hasCityFilterAndEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-10 px-6 py-5 rounded-[2rem] border border-zinc-100 bg-white shadow-sm text-center"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-2xl block mb-2">🌙</span>
              <p className="text-zinc-900 text-[13px] font-black uppercase tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                Nessuna Saga a {selectedCity}
              </p>
              <p className="text-zinc-500 text-[11px] font-medium">
                Esplora le altre avventure disponibili!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Cards Grid ──────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MissionSkeleton />
            </motion.div>
          ) : setsToDisplay.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 px-10"
            >
              <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                <Compass size={32} weight="light" className="text-zinc-300" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-2 uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>Nessuna Saga</h3>
              <p className="text-[13px] text-zinc-400 font-medium tracking-tight">
                Nessuna Saga Leggendaria al momento.<br />Torna presto, l'avventura si prepara.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-12"
            >
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
                  <motion.div
                    key={set.id}
                    variants={item}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/saga/${set.id}/intro`)}
                  >
                    {/* Modern Gallery Card */}
                    <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-sm mb-6 bg-zinc-100 border border-zinc-100" style={{ borderColor: 'var(--border)' }}>
                      <img
                        src={set.image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format'}
                        alt={getLocalized(set, 'title', i18n?.language)}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />

                      {/* Very subtle top gradient for badges only */}
                      <div
                        className="absolute inset-x-0 top-0 h-24 pointer-events-none"
                        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 100%)' }}
                      />

                      {/* Top badges (Fav) */}
                      <div className="absolute top-5 right-5 z-10 flex flex-col items-end gap-2">
                        <button
                          onClick={(e) => handleToggleFavorite(e, set.id)}
                          className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/40 backdrop-blur-xl transition-all active:scale-90 hover:scale-110 shadow-sm"
                          style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
                        >
                          <Heart
                            size={18}
                            weight={favorites.includes(set.id) ? 'fill' : 'bold'}
                            className={favorites.includes(set.id) ? 'text-red-500' : 'text-zinc-900'}
                          />
                        </button>
                      </div>

                      {/* Badge Originals on Image - FORCED WHITE TEXT */}
                      <div className="absolute top-4 left-4 z-10">
                        {(set.is_original || set.isOriginal) && (
                          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 shadow-xl text-on-image">
                            <div className="no-theme-flip w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-black text-white shadow-sm shrink-0">D</div>
                            <span
                              className="text-[10px] font-bold tracking-tight whitespace-nowrap"
                              style={{ color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                            >
                              Originals by Desideri di Puglia
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content Block BELOW Image */}
                    <div className="px-2">
                      <div className="flex items-center gap-3 mb-3">
                        {set.city && (
                          <span className="px-3 py-1 bg-orange-500/10 text-orange-600 text-[8.5px] font-black uppercase tracking-[0.2em] rounded-lg border border-orange-500/20">
                            {set.city}
                          </span>
                        )}
                        {set.distance_km && (
                          <div className="flex items-center gap-1 text-[8.5px] font-black text-zinc-400 uppercase tracking-[0.15em]">
                            <MapPin size={11} weight="fill" className="text-zinc-300" /> {set.distance_km} km
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-start gap-4 mb-4">
                        <h2
                          className="text-[1.8rem] font-black text-zinc-900 leading-[1.05] lowercase first-letter:uppercase group-hover:text-orange-600 transition-colors duration-300"
                          style={{ letterSpacing: '-0.03em', color: 'var(--text-primary)' }}
                        >
                          {getLocalized(set, 'title', i18n?.language)}
                        </h2>

                        <div className="flex items-center gap-2 text-zinc-400 font-black text-[9px] uppercase tracking-[0.2em] shrink-0 pt-2 transition-all duration-500 group-hover:translate-x-1">
                          Inizia <ArrowRight size={14} weight="bold" className="text-orange-500" />
                        </div>
                      </div>

                      {/* Info Row */}
                      <div className="flex items-center justify-between pb-4 border-b border-zinc-100" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[7.5px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5">Tappe</p>
                            <p className="text-[12px] font-black text-zinc-900" style={{ color: 'var(--text-primary)' }}>
                              {set.steps?.length || '—'} luoghi
                            </p>
                          </div>

                          {set.difficulty && (
                            <div>
                              <p className="text-[7.5px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5">Difficoltà</p>
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>{set.difficulty}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {questProgress && (
                          <div className="flex items-center gap-3 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                            <span className="text-[10px] font-black text-zinc-900" style={{ color: 'var(--text-primary)' }}>{progressPercent}%</span>
                            <div className="h-[2px] w-10 bg-zinc-200 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${progressPercent}%`,
                                  backgroundColor: 'var(--accent)'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Social Evidence / Bottom Padding */}
                      <div className="pt-4 flex items-center gap-2">
                        <div className="flex -space-x-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-5 h-5 rounded-full border border-white bg-zinc-200" />
                          ))}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.1em] text-zinc-400 group-hover:text-zinc-600 transition-colors">
                          Saga completata da <span className="text-orange-500 font-black">{set.completions_count || Math.floor(Math.random() * 50) + 12}</span> clubbers
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Signature */}
        <footer className="py-24 flex flex-col items-center gap-5 opacity-40">
          <div className="w-10 h-[1px] bg-zinc-400" />
          <p className="text-[8px] font-black uppercase tracking-[0.6em] text-zinc-500 text-center leading-relaxed">
            Saghe Leggendarie <br /> Desideri Puglia Club © 2026
          </p>
        </footer>
      </main>
    </div>
  )
}

export default Missioni