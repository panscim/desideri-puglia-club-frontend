// src/pages/Dashboard.jsx
import { useEffect, useState, useMemo, memo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import { getLevelByPoints, getProgressToNextLevel } from '../utils/levels'
import {
  Target,
  Trophy,
  Star,
  Crown,
  Medal,
  Award,
  ArrowRight,
  Clock,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLocalized } from '../utils/content'

// --- HELPERS DATE (Invariati) ---
const TZ = 'Europe/Rome'
function romeNow(base = new Date()) {
  const parts = new Intl.DateTimeFormat('it-IT', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(base)
    .reduce((acc, p) => ((acc[p.type] = p.value), acc), {})
  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  )
}

function monthRangeRome(base = new Date()) {
  const now = romeNow(base)
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
  return {
    start,
    end,
    key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
  }
}

// --- SKELETON UI COMPONENTS (Per la velocità percepita) ---
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-sand/40 rounded-lg ${className}`} />
)

const HeroSkeleton = () => (
  <section className="relative overflow-hidden rounded-3xl border border-sand bg-white/50 p-5 md:p-7 h-[260px] flex flex-col justify-between">
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
      <Skeleton className="w-20 h-20 rounded-full" />
    </div>
    <Skeleton className="h-3 w-full mt-4" />
  </section>
)

const CardSkeleton = () => (
  <div className="rounded-2xl border border-sand bg-white p-4 h-32 space-y-3">
    <div className="flex justify-between">
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
)

const ListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-14 w-full" />
    ))}
  </div>
)

// --- MAIN COMPONENT ---
const Dashboard = () => {
  const { t, i18n } = useTranslation() // i18n needed for language
  const { profile } = useAuth()

  // State
  const [missions, setMissions] = useState([])
  const [dailyMissions, setDailyMissions] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [prizes, setPrizes] = useState([])
  const [completedMonthCount, setCompletedMonthCount] = useState(0)
  const [completedTotalCount, setCompletedTotalCount] = useState(0)
  const [isPartner, setIsPartner] = useState(false)

  const [loading, setLoading] = useState(true)
  const [boostRemaining, setBoostRemaining] = useState(null)

  // 0. BOOST TIMER
  useEffect(() => {
    if (!profile?.boost_expires_at) return

    const checkBoost = () => {
      const expires = new Date(profile.boost_expires_at)
      const now = new Date()
      const diff = expires - now

      if (diff <= 0) {
        setBoostRemaining(null)
      } else {
        const hours = Math.floor(diff / 3600000)
        const mins = Math.floor((diff % 3600000) / 60000)
        setBoostRemaining(`${hours}h ${mins}m`)
      }
    }

    checkBoost()
    const interval = setInterval(checkBoost, 60000)
    return () => clearInterval(interval)
  }, [profile?.boost_expires_at])

  // 1. CARICAMENTO DATI (Parallelo)
  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])



  const loadDashboardData = async () => {
    setLoading(true)
    const { start, end, key: currentMonthKey } = monthRangeRome()

    // --- PREPARAZIONE PROMISE (Tutte insieme) ---

    // A. Missioni Consigliate
    const missionsPromise = supabase
      .from('missioni_catalogo')
      .select('*')
      .eq('attiva', true)
      .order('punti', { ascending: false })
      .limit(3)

    // B. Missioni Giornaliere
    const dailyPromise = supabase
      .from('missioni_catalogo')
      .select('*')
      .eq('attiva', true)
      .eq('cadenza', 'giornaliera')
      .order('punti', { ascending: false })
      .limit(3)

    // C. Classifica
    const leaderboardPromise = supabase
      .from('utenti')
      .select('id, nickname, punti_mensili, punti_totali, livello, avatar_url')
      .order('punti_mensili', { ascending: false })
      .limit(5)

    // D. PREMI (Logica ESATTA del vecchio codice ripristinata)
    const prizesPromise = (async () => {
      let finalData = []

      // Tentativo 1: per 'mese'
      let { data, error } = await supabase
        .from('premi_mensili')
        .select('*')
        .eq('mese', currentMonthKey)
        .order('posizione')

      if (!error) finalData = data || []

      // Tentativo 2: per 'mese_key' se vuoto
      if (finalData.length === 0) {
        const { data: altData, error: altErr } = await supabase
          .from('premi_mensili')
          .select('*')
          .eq('mese_key', currentMonthKey)
          .order('posizione')
        if (!altErr) finalData = altData || []
      }

      // Tentativo 3: Ultimi inseriti se ancora vuoto
      if (finalData.length === 0) {
        const { data: latest, error: latestErr } = await supabase
          .from('premi_mensili')
          .select('*')
          .order('mese', { ascending: false })
          .limit(3)
        if (!latestErr) finalData = latest || []
      }

      return finalData
    })()

    // E. Statistiche Utente
    let monthStatPromise = Promise.resolve({ count: 0 })
    let totalStatPromise = Promise.resolve({ count: 0 })

    if (profile?.id) {
      monthStatPromise = supabase
        .from('missioni_inviate')
        .select('*', { count: 'exact', head: true })
        .eq('id_utente', profile.id)
        .eq('stato', 'Approvata')
        .gte('data_creazione', start.toISOString())
        .lt('data_creazione', end.toISOString())

      totalStatPromise = supabase
        .from('missioni_inviate')
        .select('*', { count: 'exact', head: true })
        .eq('id_utente', profile.id)
        .eq('stato', 'Approvata')
    }

    try {
      // --- ESECUZIONE PARALLELA ---
      const [
        missionsRes,
        dailyRes,
        leaderboardRes,
        prizesData,
        monthStatRes,
        totalStatRes
      ] = await Promise.all([
        missionsPromise,
        dailyPromise,
        leaderboardPromise,
        prizesPromise,
        monthStatPromise,
        totalStatPromise
      ])

      // --- ASSEGNAZIONE RISULTATI ---
      if (!missionsRes.error) setMissions(missionsRes.data || [])
      if (!dailyRes.error) setDailyMissions(dailyRes.data || [])
      if (!leaderboardRes.error) setLeaderboard(leaderboardRes.data || [])

      // Qui ora ci sono i dati sicuri calcolati come nel vecchio codice
      setPrizes(prizesData || [])

      if (profile?.id) {
        setCompletedMonthCount(monthStatRes.count || 0)
        setCompletedTotalCount(totalStatRes.count || 0)
        setIsPartner(!!profile.partner_id)
      }

    } catch (err) {
      console.error('[Dashboard] Error loading data', err)
    } finally {
      setLoading(false)
    }
  }



  // --- UI HELPERS (Memoized for performance) ---
  const fallbackLevel = { id: 1, slug: 'forester-gargano', name: 'Forester del Gargano', minPoints: 0, icon: '🌲', iconUrl: '/levels/foresta.png' }

  // Memoize expensive level calculations
  const currentLevel = useMemo(
    () => getLevelByPoints(profile?.punti_totali || 0) || fallbackLevel,
    [profile?.punti_totali]
  )

  const progress = useMemo(
    () => getProgressToNextLevel(profile?.punti_totali || 0) || { percentage: 0, pointsNeeded: 0 },
    [profile?.punti_totali]
  )

  const iconForMission = (tipo) => {
    const t = String(tipo || '').toLowerCase()
    const map = { live: '📷', galleria: '🖼️', link: '🔗', button: '🖱️', bottone: '🖱️' }
    return map[t] || '🎯'
  }

  const SectionTitle = ({ icon: Icon, children, right }) => (
    <div className="flex items-center justify-between mb-4 mt-8 first:mt-0">
      <h3 className="text-xl font-bold font-serif text-olive-dark flex items-center gap-2">
        {Icon ? <Icon className="w-5 h-5 text-gold" /> : <Award className="w-5 h-5 text-gold" />}
        <span>{children}</span>
      </h3>
      {right}
    </div>
  )

  return (
    <div className="space-y-8 pb-10">

      {/* ⚡ BOOST BANNER */}
      {boostRemaining ? (
        <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-4 shadow-lg animate-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Zap size={80} />
          </div>
          <div className="relative z-10 flex items-center gap-4 text-white">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {t('dashboard.boost_active', { multiplier: profile?.boost_multiplier || 1.5 })}
              </h3>
              <p className="text-white/80 text-sm flex items-center gap-1.5 mt-0.5">
                <Clock size={14} /> {t('dashboard.boost_expires', { time: boostRemaining })}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Link
          to="/boost"
          className="block w-full mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400/10 to-purple-500/10 border border-amber-300/30 p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99] text-left no-underline"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-olive-dark text-sm leading-tight">
                ⚡ {t('dashboard.activate_boost')}
              </h3>
              <p className="text-olive-light text-xs mt-0.5">
                {t('dashboard.boost_desc')}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-olive-light shrink-0" />
          </div>
        </Link>
      )}

      {/* 1. HERO SECTION (Livello/Punti) */}
      {loading ? <HeroSkeleton /> : (
        <section className="relative overflow-hidden rounded-3xl border border-sand bg-gradient-to-br from-olive-dark/5 via-white to-sand/70 shadow-[0_18px_40px_rgba(0,0,0,0.08)] p-6 md:p-8 transition-all duration-500 ease-in-out">
          <div className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
            <div className="flex-1 min-w-0 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-sand/60 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-olive-dark/80 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                <span>Club Member</span>
              </div>

              <div>
                <h2 className="text-3xl font-bold font-serif text-olive-dark leading-tight">
                  {t('dashboard.hello')}{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10">{profile?.nome || profile?.nickname || t('dashboard.guest')}</span>
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-gold/30 -z-0"></span>
                  </span>
                </h2>
                <p className="mt-2 text-olive-light max-w-md text-sm md:text-base leading-relaxed font-sans">
                  {t('dashboard.subtitle')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-olive-dark text-white px-4 py-1.5 rounded-full shadow-sm text-xs">
                  <span className="font-serif italic text-gold">{t('dashboard.level')}</span>
                  <span className="font-semibold tracking-wide uppercase font-sans">{currentLevel.name}</span>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-white border border-sand text-xs font-medium text-olive-dark">
                  {t('dashboard.total_points', { points: profile?.punti_totali || 0 })}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4 min-w-[200px]">
              <div className="relative group">
                <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative w-24 h-24 rounded-full bg-sand/30 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-lg">
                  {currentLevel?.iconUrl ? (
                    <img src={currentLevel.iconUrl} alt={currentLevel.name} className="w-16 h-16 object-contain drop-shadow-md" />
                  ) : (
                    <span className="text-4xl">{currentLevel?.icon || '🌱'}</span>
                  )}
                </div>
              </div>

              <Link to="/missioni" className="btn-primary w-full md:w-auto text-center justify-center text-sm py-2.5 shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all">
                {t('dashboard.new_mission')}
              </Link>
            </div>
          </div>

          <div className="relative mt-8 border-t border-olive-dark/5 pt-5">
            <div className="flex justify-between mb-2 text-xs font-medium tracking-wide">
              <span className="text-olive-dark">{t('dashboard.next_level')}</span>
              <span className="text-olive-light">{t('dashboard.missing_points', { points: progress.pointsNeeded })}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-sand/50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-amber-400 shadow-[0_0_10px_rgba(212,163,115,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="mt-3 flex gap-4 text-[10px] text-olive-light uppercase tracking-wider font-semibold">
              <span>{t('dashboard.missions_month')}: <b className="text-olive-dark">{completedMonthCount}</b></span>
              <span>{t('dashboard.total')}: <b className="text-olive-dark">{completedTotalCount}</b></span>
            </div>
          </div>
        </section>
      )}



      {/* 3. PARTNER CTA */}
      <section className="rounded-3xl bg-olive-dark text-sand p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-olive-dark/10">
        <div className="flex-1">
          <h3 className="text-xl font-serif italic text-gold mb-1">
            {isPartner ? t('dashboard.partner_area') : t('dashboard.become_partner')}
          </h3>
          <p className="text-sm text-sand/80 font-light leading-relaxed max-w-lg">
            {isPartner
              ? t('dashboard.partner_area_desc')
              : t('dashboard.partner_desc')}
          </p>
        </div>
        <Link to={isPartner ? "/partner/dashboard" : "/partner/join"} className="px-6 py-3 bg-sand text-olive-dark text-xs font-bold uppercase tracking-widest rounded-full hover:bg-white transition-colors">
          {isPartner ? t('dashboard.access_dashboard') : t('dashboard.apply_now')}
        </Link>
      </section>

      {/* 4. DAILY MISSIONS */}
      <div>
        <SectionTitle icon={Clock} right={<Link to="/missioni" className="text-xs font-bold underline decoration-gold/50 hover:decoration-gold text-olive-dark">{t('dashboard.all_missions')}</Link>}>
          {t('dashboard.today_missions')}
        </SectionTitle>
        <div className="grid md:grid-cols-3 gap-4">
          {loading ? (
            <> <CardSkeleton /><CardSkeleton /><CardSkeleton /> </>
          ) : dailyMissions.length > 0 ? (
            dailyMissions.map(m => <MissionCard key={m.id} mission={m} icon={iconForMission(m.tipo_verifica)} daily t={t} i18n={i18n} />)
          ) : (
            <div className="col-span-3 p-8 border border-dashed border-sand rounded-3xl text-center text-olive-light text-sm italic">
              {t('dashboard.no_daily')}
            </div>
          )}
        </div>
      </div>

      {/* 5. SUGGESTED MISSIONS */}
      <div>
        <SectionTitle icon={Target}>{t('dashboard.suggested_missions')}</SectionTitle>
        <div className="grid md:grid-cols-3 gap-4">
          {loading ? (
            <> <CardSkeleton /><CardSkeleton /><CardSkeleton /> </>
          ) : missions.length > 0 ? (
            missions.map(m => <MissionCard key={m.id} mission={m} icon={iconForMission(m.tipo_verifica)} t={t} i18n={i18n} />)
          ) : (
            <div className="col-span-3 p-8 border border-dashed border-sand rounded-3xl text-center text-olive-light text-sm">
              {t('dashboard.explore_catalog')}
            </div>
          )}
        </div>
      </div>

      {/* 6. LEADERBOARD & PRIZES */}
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-7">
          <SectionTitle icon={Trophy} right={<Link to="/classifica" className="text-xs font-bold underline decoration-gold/50 hover:decoration-gold text-olive-dark">{t('dashboard.view_full')}</Link>}>
            {t('dashboard.leaderboard_month')}
          </SectionTitle>
          <div className="bg-white rounded-3xl border border-sand p-2 shadow-sm">
            {loading ? (
              <ListSkeleton />
            ) : leaderboard.length > 0 ? (
              <LeaderboardView users={leaderboard} />
            ) : (
              <p className="text-center py-10 text-olive-light text-sm">{t('dashboard.no_points')}</p>
            )}
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col">
          <SectionTitle icon={Star} right={<Link to="/premi" className="text-xs font-bold underline decoration-gold/50 hover:decoration-gold text-olive-dark">{t('dashboard.details')}</Link>}>
            {t('dashboard.prizes_month')}
          </SectionTitle>
          <div className="flex-1 space-y-3">
            {loading ? (
              <ListSkeleton />
            ) : prizes.length > 0 ? (
              prizes.map((p) => (
                <div key={p.id} className="group flex items-center gap-4 p-4 rounded-3xl bg-white border border-sand hover:border-gold/50 transition-colors shadow-sm">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-sand/30 text-2xl group-hover:scale-110 transition-transform">
                    {p.posizione === 1 ? '🥇' : p.posizione === 2 ? '🥈' : '🥉'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-olive-light uppercase tracking-wider mb-0.5">{t('dashboard.position')} {p.posizione}</p>
                    <h4 className="font-bold text-olive-dark text-sm truncate">
                      {getLocalized(p, 'titolo', i18n.language)}
                    </h4>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center p-6 border border-dashed border-sand rounded-3xl bg-sand/10 text-olive-light text-xs text-center">
                {t('dashboard.prizes_soon')}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

// --- SUB COMPONENTS (Memoized to prevent unnecessary re-renders) ---

const MissionCard = memo(({ mission, icon, daily, t, i18n }) => (
  <Link to={`/missione/${mission.id}`} className="group relative flex flex-col justify-between rounded-3xl bg-white border border-sand/40 p-6 shadow-sm hover:shadow-xl hover:border-gold/40 hover:-translate-y-1 transition-all duration-300">
    <div>
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-sand/20 flex items-center justify-center text-2xl text-olive-dark group-hover:bg-gold group-hover:text-white transition-colors">
          {icon}
        </div>
        {daily && (
          <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wide">
            {t ? t('dashboard.today_badge') : 'Today'}
          </span>
        )}
      </div>
      <h4 className="font-bold font-serif text-lg text-olive-dark mb-2 line-clamp-1">
        {getLocalized(mission, 'titolo', i18n?.language)}
      </h4>
      <p className="text-sm text-olive-light line-clamp-2 leading-relaxed font-sans">
        {getLocalized(mission, 'descrizione', i18n?.language)}
      </p>
    </div>
    <div className="mt-4 pt-4 border-t border-sand/30 flex justify-between items-center">
      <span className="text-[10px] text-olive-light font-medium uppercase tracking-wider">
        {mission.tipo_verifica}
      </span>
      <span className="font-bold text-gold text-sm font-serif">+{mission.punti} pt</span>
    </div>
  </Link>
))

const LeaderboardView = memo(({ users }) => (
  <div className="space-y-1">
    {users.map((user, idx) => {
      const isTop = idx === 0;
      return (
        <div key={user.id} className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${isTop ? 'bg-gradient-to-r from-gold/10 to-transparent border border-gold/20' : 'hover:bg-sand/20'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-6 text-center font-bold ${isTop ? 'text-gold text-lg' : 'text-olive-light text-sm'}`}>
              {idx + 1}
            </div>
            <div className={`relative w-10 h-10 rounded-full overflow-hidden bg-sand border-2 ${isTop ? 'border-gold' : 'border-white'}`}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.nickname} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-olive-dark/40 text-xs">
                  {user.nickname?.[0]}
                </div>
              )}
            </div>
            <div>
              <p className={`font-bold leading-none ${isTop ? 'text-olive-dark' : 'text-olive-dark/80'}`}>{user.nickname}</p>
              <p className="text-olive-light text-xs">{user.livello}</p>
            </div>
          </div>
          <div className="font-bold text-olive-dark">{user.punti_mensili}</div>
        </div>
      )
    })}
  </div>
))

export default Dashboard