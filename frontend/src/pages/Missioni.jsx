// src/pages/Missioni.jsx
import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { QuestService } from '../services/quest'
import { CaretLeft, MapPin, Compass, Heart, ArrowRight, Sparkle, Bank, ForkKnife, Waves } from '@phosphor-icons/react'
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

// --- FILTER PILLS ---
const CityPill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] px-3.5 py-2 rounded-full border transition-all duration-300 active:scale-95 ${
      active
      ? 'bg-[#16243E] text-white border-[#16243E] shadow-sm'
      : 'bg-white text-[#8A95AD] border-[#EAE3D6] shadow-sm'
    }`}
  >
    {children}
  </button>
)

const TypePill = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 text-[12px] font-bold px-4 py-2.5 rounded-full border transition-all duration-300 active:scale-95 ${
      active
      ? 'bg-[#16243E] text-white border-[#16243E] shadow-md'
      : 'bg-white text-[#4A5670] border-[#EAE3D6] shadow-sm'
    }`}
  >
    {icon && <span className="text-[14px]">{icon}</span>}
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
    <div className="min-h-screen bg-bg-primary pb-32 font-sans selection:bg-accent/30 transition-colors duration-500">

      {/* ╔══ NAV ══════════════════════════════════════════╗ */}
      <nav
        className="fixed top-0 inset-x-0 z-[100] px-6 h-16 flex items-center justify-between bg-bg-primary/80 backdrop-blur-lg border-b border-border-default"
      >
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-surface border border-border-default flex items-center justify-center active:scale-95 transition-all hover:border-accent/30"
        >
          <CaretLeft size={20} weight="bold" className="text-text-primary" />
        </button>
        <p className="overline !text-text-primary !mb-0 !tracking-[0.4em]">
          Saghe
        </p>
        <button
          onClick={() => navigate('/mappa?tab=saghe')}
          className="w-10 h-10 rounded-full bg-surface border border-border-default flex items-center justify-center active:scale-95 transition-all hover:border-accent/30"
          title="Vista mappa"
        >
          <MapPin size={20} weight="fill" className="text-accent" />
        </button>
      </nav>

      <main className="pt-28 px-4 mx-auto max-w-lg">

        {/* ── Hero ─────────────────────────────────────── */}
        <header className="mb-14 relative group">
          {/* Playful Floaties */}
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -right-2 text-3xl select-none pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity"
          >
            🧭
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <div className="bg-accent-gold text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-md rounded-sm -rotate-2 border-b-2 border-black/10">
              Saghe Leggendarie
            </div>
            <Sparkle size={14} weight="fill" className="text-accent-gold animate-pulse" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[52px] font-serif font-black text-text-primary leading-[0.95] mb-6 tracking-tight relative"
          >
            Esplora la<br />
            <span className="relative inline-block">
              Puglia Vera
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute left-0 bottom-1 w-full h-4 bg-accent/20 -z-10 origin-left -rotate-1 rounded-sm"
              />
            </span>
            <span className="text-accent ml-1 italic group-hover:rotate-12 inline-block transition-transform duration-500">.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[16px] text-text-muted font-medium leading-relaxed max-w-[90%] italic"
          >
            "Appunti di viaggio tra borghi, sapori e segreti d'altri tempi – sblocca la tua prossima storia."
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
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={16} weight="fill" className="text-accent" />
                  <span className="overline !text-text-muted !mb-0">Destinazione</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide px-1">
                  {cities.map((city, idx) => (
                    <CityPill
                      key={idx}
                      active={selectedCity === city}
                      onClick={() => setSelectedCity(city)}
                    >
                      {city === 'Tutte' ? 'Tutti' : city}
                    </CityPill>
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
                <div className="flex items-center gap-2 mb-4">
                  <Compass size={16} weight="fill" className="text-accent-gold" />
                  <span className="overline !text-text-muted !mb-0">Tipologia</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide px-1">
                  {types.map((type, idx) => {
                    const getIcon = (t) => {
                      switch(t.toLowerCase()) {
                        case 'tutti': return '🧭';
                        case 'cultura': return '🏛️';
                        case 'storia': return '📜';
                        case 'cibo': return '🍝';
                        case 'gastronomia': return '🍷';
                        case 'natura': return '🌿';
                        case 'outdoor': return '🥾';
                        case 'mare': return '🏖️';
                        case 'borghi': return '🏘️';
                        default: return '✨';
                      }
                    }
                    return (
                      <TypePill
                        key={idx}
                        active={selectedType === type}
                        onClick={() => setSelectedType(type)}
                        icon={getIcon(type)}
                      >
                        {type === 'Tutti' ? 'Tutte' : type}
                      </TypePill>
                    );
                  })}
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
              className="space-y-10 pb-20"
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
                const rotation = (index % 2 === 0 ? '-1.5deg' : '1.5deg')
                const tapeColors = ['bg-accent/20', 'bg-accent-gold/30', 'bg-danger/10', 'bg-sky-400/20']
                const tapeColor = tapeColors[index % tapeColors.length]

                return (
                  <motion.div
                    key={set.id}
                    variants={item}
                    style={{ rotate: rotation }}
                    className="group cursor-pointer bg-[#FCFAF2] rounded-[2rem] p-0 shadow-[0_15px_35px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_45px_rgba(0,0,0,0.12)] transition-all duration-700 overflow-hidden relative"
                    onClick={() => navigate(`/saga/${set.id}/intro`)}
                  >
                    {/* Decorative Tape */}
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-6 ${tapeColor} backdrop-blur-sm z-50 -translate-y-1 rotate-2 rounded-sm border-x border-black/5`} />

                    {/* Modern Gallery Card */}
                    <div className="relative aspect-[16/11] overflow-hidden bg-bg-secondary p-4 pb-0">
                      <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden shadow-inner bg-zinc-200">
                        <img
                          src={set.image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format'}
                          alt={getLocalized(set, 'title', i18n?.language)}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                        {/* Top badges (Fav) */}
                        <div className="absolute top-4 right-4 z-10">
                          <button
                            onClick={(e) => handleToggleFavorite(e, set.id)}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/40 backdrop-blur-xl border border-white/30 transition-all active:scale-90 hover:scale-110 shadow-lg"
                          >
                            <Heart
                              size={18}
                              weight={favorites.includes(set.id) ? 'fill' : 'bold'}
                              className={favorites.includes(set.id) ? 'text-danger' : 'text-white'}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content Block */}
                    <div className="px-6 py-7 relative">
                      {/* Sticker Badge for Originals */}
                      {(set.is_original || set.isOriginal) && (
                        <div className="absolute -top-4 -right-2 rotate-12 z-20">
                          <div className="bg-accent text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-lg rounded-sm border-b-2 border-r-2 border-black/20">
                            Originals
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mb-4">
                        {set.city && (
                          <span className="px-3 py-1 bg-white shadow-sm text-accent text-[9px] font-black uppercase tracking-[0.2em] rounded border border-accent/10">
                            {set.city}
                          </span>
                        )}
                        {set.distance_km && (
                          <div className="flex items-center gap-2 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
                            <MapPin size={12} weight="fill" className="text-accent-gold" /> {set.distance_km} km
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-start gap-4 mb-6">
                        <h2 className="text-[26px] font-serif font-black text-text-primary leading-[1.2] tracking-tight group-hover:text-accent transition-colors duration-300">
                          {getLocalized(set, 'title', i18n?.language)}
                        </h2>

                        <div className="flex items-center gap-1.5 text-accent font-black text-[10px] uppercase tracking-[0.2em] shrink-0 pt-2 transition-all duration-500 group-hover:translate-x-1">
                          Inizia <ArrowRight size={14} weight="bold" />
                        </div>
                      </div>

                      {/* Info Row */}
                      <div className="flex items-center justify-between pb-6 border-b border-border-default/40 border-dashed">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="overline !text-text-muted !mb-0.5 !text-[8px]">Tappe</p>
                            <p className="text-[13px] font-black text-text-primary">
                              {set.steps?.length || '—'} luoghi
                            </p>
                          </div>

                          {set.difficulty && (
                            <div>
                              <p className="overline !text-text-muted !mb-0.5 !text-[8px]">Difficoltà</p>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                                <p className="text-[11px] font-black text-text-primary uppercase tracking-widest">{set.difficulty}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {questProgress && (
                          <div className="flex items-center gap-3 bg-white/50 px-3 py-2 rounded-xl border border-border-default/30 shadow-sm">
                            <span className="text-[10px] font-black text-text-primary">{progressPercent}%</span>
                            <div className="h-1.5 w-12 bg-zinc-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent rounded-full transition-all duration-1000"
                                style={{
                                  width: `${progressPercent}%`
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Social Evidence */}
                      <div className="pt-5 flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {[
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop',
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop',
                            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop'
                          ].map((url, i) => (
                            <img 
                              key={i} 
                              src={url} 
                              alt="Clubber"
                              className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm bg-zinc-200" 
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-text-muted italic">
                          Saga completata da <span className="text-accent font-black">{set.completions_count || Math.floor(Math.random() * 50) + 12}</span> clubbers
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