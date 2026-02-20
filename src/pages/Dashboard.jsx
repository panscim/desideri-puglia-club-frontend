// src/pages/Dashboard.jsx
import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import { AlbumService } from '../services/album'
import { getLevelByPoints } from '../utils/levels'
import {
  MapPin,
  Lock,
  Eye,
  Rocket
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLocalized } from '../utils/content'

// --- SKELETON UI COMPONENTS ---
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-sand/40 rounded-lg ${className}`} />
)

// --- MAIN COMPONENT ---
const Dashboard = () => {
  const { t, i18n } = useTranslation()
  const { profile } = useAuth()

  // State
  const [loading, setLoading] = useState(true)
  const [missions, setMissions] = useState([])
  const [cards, setCards] = useState([])

  // 1. DATA LOADING
  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  const loadDashboardData = async () => {
    setLoading(true)

    try {
      // 1. Active Missions (Notizie ed Eventi)
      const missionsPromise = supabase
        .from('missioni_catalogo')
        .select('*')
        .eq('attiva', true)
        .order('punti', { ascending: false })
        .limit(2)

      // 2. User Cards (Recent Discoveries & Collection Status)
      const cardsPromise = AlbumService.getAllCards()

      const [missionsRes, cardsData] = await Promise.all([
        missionsPromise,
        cardsPromise
      ])

      if (!missionsRes.error) setMissions(missionsRes.data || [])
      setCards(cardsData || [])

    } catch (err) {
      console.error('[Dashboard] Error loading data', err)
    } finally {
      setLoading(false)
    }
  }

  // --- DERIVED DATA ---
  const unlockedCards = useMemo(() => cards.filter(c => c.isUnlocked), [cards])
  const stats = {
    total: cards.length || 50, // Default to 50 if empty for demo purposes
    unlocked: unlockedCards.length
  }
  const collectionPercentage = stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0

  // Recent Discoveries (Top 5 Unlocked + First 3 Locked)
  const recentDiscoveries = useMemo(() => {
    const unl = unlockedCards.slice(0, 5) // In a real app, sort by unlocked_at desc
    const loc = cards.filter(c => !c.isUnlocked).slice(0, 3)
    return [...unl, ...loc]
  }, [unlockedCards, cards])

  // Card of the Day (Random unlocked or locked card for demo)
  const cardOfTheDay = useMemo(() => {
    if (cards.length === 0) return null
    // Prefer unlocked for better demo, otherwise first card
    const candidates = cards.filter(c => c.image_url)
    return candidates[0] || cards[0]
  }, [cards])

  const currentLevel = useMemo(
    () => getLevelByPoints(profile?.punti_totali || 0) || { id: 1, name: 'Explorer', iconUrl: null },
    [profile?.punti_totali]
  )


  if (loading) {
    return <div className="p-6 space-y-6">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  }

  return (
    <div className="pb-32 bg-[#F9F9F7] min-h-screen font-sans">

      {/* HEADER: Profile Info */}
      <div className="pt-8 px-6 pb-6 flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-sand overflow-hidden border-2 border-white shadow-md">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gold text-white font-bold text-xl">
                {profile?.nickname?.[0] || 'U'}
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gold text-[10px] font-bold text-olive-dark px-2 py-0.5 rounded-full border-2 border-[#F9F9F7] shadow-sm">
            Lvl {currentLevel.id}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-olive-dark font-serif leading-tight">Ciao, {profile?.nome || profile?.nickname || 'Esploratore'}!</h2>
          <div className="text-[10px] font-bold text-gold uppercase tracking-widest flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">military_tech</span>
            Collector Badge
          </div>
        </div>
        <div className="ml-auto">
          <button className="w-10 h-10 rounded-full bg-white border border-sand shadow-sm flex items-center justify-center text-olive-dark hover:bg-stone-50 transition-colors relative">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
          </button>
        </div>
      </div>

      <div className="px-6 space-y-10">

        {/* 1. COLLECTION STATUS */}
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-sand/50 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-olive-light mb-1">Collection Status</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-serif font-bold text-olive-dark leading-none">{stats.unlocked}</span>
              <span className="text-xl font-serif text-olive-light font-medium">/ {stats.total}</span>
            </div>
            <p className="text-xs text-olive-light mt-1">Monuments discovered</p>
          </div>

          {/* Circular Progress (CSS Trick) */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="36" fill="transparent" stroke="#f0f0eb" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="36"
                fill="transparent"
                stroke="#d4af37"
                strokeWidth="8"
                strokeDasharray="226"
                strokeDashoffset={226 - (226 * collectionPercentage) / 100}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute font-bold text-xs text-olive-dark">{collectionPercentage}%</div>
          </div>
        </section>

        {/* 2. DAILY CHALLENGES (Horizontal Scroll Placeholder) */}
        <section>
          <h3 className="text-xl font-bold font-serif text-olive-dark mb-4 px-2">Daily Challenges</h3>

          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-6 px-6">
            {/* Card 1: Active Quest */}
            <div className="min-w-[280px] bg-[#FEF6E4] rounded-[1.5rem] p-5 shadow-sm border border-[#FBE5B4] relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 text-[100px] leading-none text-gold pointer-events-none translate-x-4 translate-y-4 font-serif">
                🏰
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#D49800] mb-1">Active Quest</div>
              <h4 className="text-lg font-bold text-olive-dark mb-6">Visit 3 Castles</h4>

              <div className="relative w-full h-1.5 bg-[#FBE5B4] rounded-full overflow-hidden mb-2">
                <div className="absolute top-0 left-0 h-full bg-[#D49800] w-1/3 rounded-full"></div>
              </div>
              <p className="text-xs text-olive-dark/60 font-medium">1 of 3 completed</p>
            </div>

            {/* Card 2: Side Quest */}
            <div className="min-w-[280px] bg-[#F0F4F8] rounded-[1.5rem] p-5 shadow-sm border border-[#DCE4EC]">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Side Quest</div>
              <h4 className="text-lg font-bold text-olive-dark mb-6">Ancient Steps</h4>

              <div className="relative w-full h-1.5 bg-[#DCE4EC] rounded-full overflow-hidden mb-2">
                <div className="absolute top-0 left-0 h-full bg-slate-400 w-0 rounded-full"></div>
              </div>
              <p className="text-xs text-olive-dark/60 font-medium">Discover your first staircase</p>
            </div>
          </div>
        </section>

        {/* 3. CARD OF THE DAY */}
        {cardOfTheDay && (
          <section>
            <h3 className="text-xl font-bold font-serif text-olive-dark mb-4 px-2">Card of the Day</h3>
            <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-stone-900/20 group">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{ backgroundImage: `url('${cardOfTheDay.image_url}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              <div className="absolute bottom-0 w-full p-6 text-white pb-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-gold px-2.5 py-1 rounded text-[10px] font-bold text-olive-dark uppercase tracking-widest leading-none">
                    {cardOfTheDay.rarity === 'legendary' ? 'LEGENDARY' : cardOfTheDay.rarity === 'rare' ? 'RARE' : 'COMMON'}
                  </span>
                  <span className="text-xs font-medium flex items-center gap-1 text-white/90">
                    <MapPin className="w-3 h-3" /> {cardOfTheDay.city}, Italy
                  </span>
                </div>

                <h2 className="text-4xl font-serif font-bold leading-tight mb-2 drop-shadow-lg">
                  {getLocalized(cardOfTheDay, 'title', i18n?.language)}
                </h2>

                <p className="text-sm text-white/80 line-clamp-2 leading-relaxed mb-6 font-light">
                  {getLocalized(cardOfTheDay, 'description', i18n?.language)}
                </p>

                <Link
                  to="/album"
                  className="w-full bg-white text-olive-dark font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors shadow-lg active:scale-95"
                >
                  <Eye className="w-5 h-5" />
                  View Card Details
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 4. RECENT DISCOVERIES */}
        <section>
          <div className="flex justify-between items-end mb-4 px-2">
            <h3 className="text-xl font-bold font-serif text-olive-dark">Recent Discoveries</h3>
            <Link to="/album" className="text-xs font-bold text-gold uppercase tracking-widest hover:underline">See all</Link>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-6 px-6 snap-x">
            {recentDiscoveries.map((card, idx) => (
              <div key={card.id || `lock-${idx}`} className="snap-start flex flex-col min-w-[120px]">
                {card.isUnlocked ? (
                  <>
                    <div className="w-[120px] h-[120px] rounded-2xl overflow-hidden mb-2 bg-stone-800 shadow-md relative">
                      <img src={card.image_url} alt={card.title} className="w-full h-full object-cover opacity-90" />
                      {/* Simplified Discovery Icon overlay if wanted, keeping it clean for now */}
                    </div>
                    <h4 className="font-bold text-sm text-olive-dark truncate w-[120px]">
                      {getLocalized(card, 'title', i18n?.language)}
                    </h4>
                    <p className="text-[10px] text-olive-light">
                      {card.unlockedAt ? new Date(card.unlockedAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-[120px] h-[120px] rounded-2xl bg-[#E2E8F0] border border-dashed border-[#CBD5E1] flex items-center justify-center mb-2">
                      <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-400 truncate w-[120px]">Locked</h4>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. NOTIZIE ED EVENTI (Missions) */}
        <section>
          <div className="flex justify-between items-end mb-4 px-2">
            <h3 className="text-xl font-bold font-serif text-olive-dark">Notizie ed Eventi</h3>
            <Link to="/missioni" className="text-xs font-bold text-gold uppercase tracking-widest hover:underline">Tutti</Link>
          </div>

          <div className="flex overflow-x-auto gap-5 pb-4 no-scrollbar -mx-6 px-6 snap-x">
            {missions.length > 0 ? missions.map((mission) => (
              <div key={mission.id} className="snap-center min-w-[300px] w-[85vw] max-w-sm bg-white rounded-[2rem] overflow-hidden shadow-lg border border-sand/50 shrink-0">
                {/* Event Image */}
                <div className="h-40 bg-stone-900 relative">
                  <img src={mission.immagine_url || "https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format"} alt={mission.titolo} className="w-full h-full object-cover opacity-80" />

                  {/* Date Badge */}
                  <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-xl text-center shadow-lg">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Sett</div>
                    <div className="text-lg font-bold text-olive-dark leading-none">12</div>
                  </div>

                  {/* Mission Badge & Timer */}
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                    <div className="bg-gold px-3 py-1 rounded text-[10px] font-bold text-olive-dark uppercase tracking-widest shadow-md">
                      Missione Attiva
                    </div>
                    <div className="bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Scade in: 2g 14h
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gold mb-1">
                    Limited Event
                  </div>
                  <h4 className="text-xl font-bold font-serif text-olive-dark mb-2 leading-tight">
                    {getLocalized(mission, 'titolo', i18n?.language)}
                  </h4>
                  <p className="text-xs text-olive-light line-clamp-2 leading-relaxed mb-4">
                    {getLocalized(mission, 'descrizione', i18n?.language)}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-sand/50">
                    <div className="flex flex-col gap-1">
                      {/* Mock Time */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                        <span className="material-symbols-outlined text-[14px]">schedule</span> 18:30 - 22:00
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-gold">Premio: +{mission.punti} pt</div>
                    </div>
                  </div>

                  <Link
                    to={`/missione/${mission.id}`}
                    className="mt-4 w-full bg-gold text-olive-dark font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-[#cda429] transition-colors shadow-md active:scale-95"
                  >
                    Partecipa <Rocket className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            )) : (
              <div className="min-w-full p-8 border border-dashed border-sand rounded-[2rem] text-center text-olive-light text-sm italic">
                Nessun evento o missione attiva al momento.
              </div>
            )}
          </div>
        </section>
      </div>

    </div>
  )
}

export default Dashboard