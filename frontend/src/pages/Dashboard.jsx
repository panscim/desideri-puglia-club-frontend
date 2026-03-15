// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QuestService } from '../services/quest';
import { EventsService } from '../services/events';
import { NotificationService } from '../services/notifications';
import {
  MagnifyingGlass,
  Heart,
  Bell,
  Fire,
  ArrowRight,
  ArrowUpRight as NavigationArrow,
  MapPin,
  Compass,
  Bank,
  ForkKnife,
  Waves,
  Sparkle,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import SearchModal from '../components/SearchModal';
import CosaFaccioAdesso from '../components/CosaFaccioAdesso';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buona sera';
};

const getContextualSub = () => {
  const h = new Date().getHours();
  if (h < 9)  return 'Cosa scopri stamattina?';
  if (h < 13) return 'Cosa fai oggi in Puglia?';
  if (h < 17) return 'Il pomeriggio è tutto tuo';
  if (h < 20) return "L'ora giusta per esplorare";
  return 'Come finisci questa serata?';
};

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */

/** Countdown pill for events */
const EventTimer = ({ startDate, endDate }) => {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const fmt = (ms) => {
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        return `${d}g ${h}h ${m}m`;
      };
      if (now < start) setLabel(`Inizia tra: ${fmt(start - now)}`);
      else if (now <= end) setLabel(`Termina tra: ${fmt(end - now)}`);
      else setLabel('Concluso');
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [startDate, endDate]);

  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-full whitespace-nowrap">
      ⏳ {label}
    </span>
  );
};

/** Category pill button */
const CatPill = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-95 ${active
        ? 'bg-[#16243E] text-white border-[#16243E] shadow-md'
        : 'bg-white text-[#4A5670] border-[#EAE3D6] shadow-sm'
      }`}
  >
    <span className="text-[14px]">{icon}</span>
    {label}
  </button>
);

/** Active saga card (vertical list) */
const ActiveSagaCard = ({ saga, onClick }) => (
  <motion.div
    onClick={onClick}
    whileTap={{ scale: 0.985 }}
    className="flex items-center gap-3.5 bg-white border border-[#EAE3D6] rounded-[20px] p-3.5 cursor-pointer shadow-sm group relative overflow-hidden"
  >
    {/* left accent bar on hover */}
    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#D4693A] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

    {/* thumb */}
    <div className="w-[66px] h-[66px] rounded-[14px] overflow-hidden shrink-0 bg-[#EDE3D4] relative">
      <img
        src={saga.sagaImage || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=200'}
        alt={saga.sagaTitle}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
    </div>

    {/* info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#D4693A] bg-[#FBF0EB] border border-[#D4693A]/15 px-2 py-0.5 rounded-full uppercase tracking-wide">
          <span className="w-[5px] h-[5px] rounded-full bg-[#D4693A] animate-pulse" />
          In Corso
        </span>
        {saga.sagaCity && (
          <span className="text-[10px] font-bold text-[#8A95AD]">📍 {saga.sagaCity}</span>
        )}
      </div>
      <p className="text-[16px] font-serif font-black text-[#16243E] leading-snug truncate mb-2">
        {saga.sagaTitle}
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-[5px] bg-[#EDE3D4] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D4693A] to-[#E8845A] rounded-full transition-all duration-1000"
            style={{ width: `${saga.percent}%` }}
          />
        </div>
        <span className="text-[10px] font-black text-[#8A95AD] uppercase tracking-wide whitespace-nowrap">
          {saga.doneSteps}/{saga.totalSteps} · {saga.percent}%
        </span>
      </div>
    </div>

    <span className="text-[#D0C8BC] group-hover:text-[#D4693A] group-hover:translate-x-0.5 transition-all text-xl shrink-0">›</span>
  </motion.div>
);

/** Mission card (horizontal scroll) */
const MissionCard = ({ saga, isFav, onFav, onClick }) => (
  <motion.div
    onClick={onClick}
    whileTap={{ scale: 0.97 }}
    className="w-[252px] shrink-0 snap-start bg-white rounded-[24px] overflow-hidden shadow-md border border-[#EAE3D6] cursor-pointer group flex flex-col"
  >
    {/* image */}
    <div className="h-[144px] relative overflow-hidden bg-[#EDE3D4]">
      <img
        src={saga.image_url || saga.map_image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600'}
        alt={saga.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#16243E]/60 via-transparent to-transparent" />

      {/* city pill */}
      <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-[#16243E]/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
        📍 {saga.city || 'Puglia'}
      </span>

      {/* heart */}
      <button
        onClick={onFav}
        className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center border border-white/15 transition-transform active:scale-90 ${isFav ? 'bg-red-500/85' : 'bg-[#16243E]/70'
          }`}
      >
        <Heart size={15} weight={isFav ? 'fill' : 'bold'} className="text-white" />
      </button>

      {/* originals badge */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/8">
        {(saga.is_original || saga.isOriginal) ? (
          <>
            <span className="w-[18px] h-[18px] rounded-full bg-orange-600 flex items-center justify-center text-[8px] font-black text-white shrink-0">D</span>
            <span className="text-[9px] font-bold text-white">Originals by Desideri di Puglia</span>
          </>
        ) : (
          <span className="text-[9px] font-bold text-white">Certificato da Desideri di Puglia</span>
        )}
      </div>
    </div>

    {/* body */}
    <div className="p-4 flex flex-col flex-1">
      <h4 className="font-serif font-black text-[#16243E] text-[16px] leading-snug mb-3 line-clamp-2 group-hover:text-[#D4693A] transition-colors">
        {saga.title || saga.titolo}
      </h4>
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8A95AD] uppercase tracking-wider mt-auto">
        <NavigationArrow size={12} weight="bold" className="text-[#D4693A]" />
        {saga.totalSteps || 5} tappe
        <span className="w-[3px] h-[3px] rounded-full bg-[#D0C8BC]" />
        {saga.city || 'Puglia'}
      </div>
    </div>
  </motion.div>
);

/** News card */
const NewsCard = ({ item }) => (
  <motion.div
    whileTap={{ scale: 0.97 }}
    className="w-[232px] shrink-0 snap-start bg-white rounded-[24px] overflow-hidden shadow-md border border-[#EAE3D6] cursor-pointer group flex flex-col"
  >
    <div className="h-[128px] relative overflow-hidden bg-[#EDE3D4]">
      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <span className="absolute top-2.5 left-2.5 bg-[#D4693A] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
        {item.category}
      </span>
    </div>
    <div className="p-3.5 flex flex-col flex-1">
      <p className="text-[10px] font-bold text-[#8A95AD] uppercase tracking-wider mb-1.5">
        {new Date(item.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
      </p>
      <h4 className="font-serif font-black text-[#16243E] text-[14px] leading-snug line-clamp-2 mb-2 group-hover:text-[#D4693A] transition-colors">
        {item.title}
      </h4>
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D4693A] mt-auto">
        <Sparkle size={11} weight="fill" /> In evidenza
      </div>
    </div>
  </motion.div>
);

/** Event card */
const EventCard = ({ ev, onClick }) => {
  const d = new Date(ev.data_inizio);
  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="w-[232px] shrink-0 snap-start bg-white rounded-[24px] overflow-hidden shadow-md border border-[#EAE3D6] cursor-pointer group flex flex-col"
    >
      <div className="h-[128px] relative overflow-hidden bg-[#EDE3D4]">
        <img
          src={ev.immagine_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600'}
          alt={ev.titolo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* date badge */}
        <div className="absolute top-2.5 left-2.5 bg-[#16243E]/88 backdrop-blur-md px-2.5 py-1.5 rounded-[10px] text-center min-w-[44px]">
          <p className="text-[9px] font-black text-[#E8845A] uppercase tracking-wider">
            {d.toLocaleString('it-IT', { month: 'short' })}
          </p>
          <p className="font-serif font-black text-white text-[20px] leading-none">{d.getDate()}</p>
        </div>
        <span className="absolute top-2.5 right-2.5 bg-white/90 text-[#16243E] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#16243E]/10">
          Evento
        </span>
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <p className="flex items-center gap-1 text-[10px] font-bold text-[#D4693A] mb-1.5">
          <MapPin size={11} weight="fill" /> {ev.luogo}
        </p>
        <h4 className="font-serif font-black text-[#16243E] text-[14px] leading-snug line-clamp-2 mb-2 group-hover:text-[#D4693A] transition-colors">
          {ev.titolo}
        </h4>
        <div className="mt-auto">
          <EventTimer startDate={ev.data_inizio} endDate={ev.data_fine} />
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────── */
const SectionHeader = ({ title, onMore }) => (
  <div className="flex items-end justify-between px-5 mb-3.5">
    <h2 className="font-serif font-black text-[#16243E] text-[22px] leading-tight tracking-tight">{title}</h2>
    {onMore && (
      <button
        onClick={onMore}
        className="flex items-center gap-1 text-[11px] font-bold text-[#D4693A] active:opacity-70"
      >
        Vedi tutte <ArrowRight size={11} weight="bold" />
      </button>
    )}
  </div>
);

/* ─────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────── */
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-[#EDE3D4] rounded-[16px] ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="px-5 pt-4 flex flex-col gap-5">
    <Skeleton className="h-[72px] w-full" />
    <Skeleton className="h-[40px] w-full" />
    <Skeleton className="h-[60px] w-3/4" />
    <div className="flex gap-3">
      <Skeleton className="h-[180px] w-[252px] shrink-0" />
      <Skeleton className="h-[180px] w-[252px] shrink-0" />
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────── */
const CATS = [
  { id: 'all', icon: '🧭', label: 'Tutti' },
  { id: 'cultura', icon: '🏛️', label: 'Cultura' },
  { id: 'cibo', icon: '🍝', label: 'Cibo' },
  { id: 'natura', icon: '🌿', label: 'Natura' },
  { id: 'concierge', icon: '✨', label: 'Per te' },
];

const DEFAULT_NEWS = [
  {
    id: 'news-1',
    title: 'Nuovi Percorsi a Gallipoli',
    image_url: 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=800',
    category: 'Novità',
    date: '2024-03-20',
  },
  {
    id: 'news-2',
    title: 'Editoriale: Il Barocco Leccese',
    image_url: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=800',
    category: 'Cultura',
    date: '2024-03-18',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saghe, setSaghe] = useState([]);
  const [activeSagas, setActiveSagas] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [events, setEvents] = useState([]);
  const [showNow, setShowNow] = useState(false);
  const [news] = useState(DEFAULT_NEWS);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [activeCat, setActiveCat] = useState('all');

  /* ── data load ── */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setUserLoc({ lat: coords.latitude, lng: coords.longitude }),
        (err) => console.warn('GPS denied', err)
      );
    }
    loadData();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setUnreadCount(await NotificationService.getUnreadCount(profile.id));
    })();
  }, [profile?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeEvents, activeSaghe, userActiveSagas, userFavorites] = await Promise.all([
        EventsService.getActiveEvents(),
        QuestService.getActiveSets(),
        profile?.id ? QuestService.getUserActiveSagas(profile.id) : [],
        profile?.id ? QuestService.getUserFavorites(profile.id) : [],
      ]);
      setEvents(activeEvents || []);
      setSaghe(activeSaghe || []);
      setActiveSagas(userActiveSagas || []);
      setFavorites(userFavorites || []);
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (e, setId) => {
    e.stopPropagation();
    if (!profile?.id) return;
    const res = await QuestService.toggleFavorite(profile.id, setId);
    if (res.success) {
      setFavorites(prev =>
        res.isFavorite ? [...prev, setId] : prev.filter(id => id !== setId)
      );
    }
  };

  /* ── animation variants ── */
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0, 0, 0.2, 1] } },
  };
  const stagger = {
    show: { transition: { staggerChildren: 0.07 } },
  };

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#FDFAF5] flex flex-col overflow-hidden">
        {/* static header */}
        <div className="px-5 pt-14 pb-5">
          <Skeleton className="h-[36px] w-48 mb-1" />
          <Skeleton className="h-[28px] w-32" />
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  /* ── render ── */
  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#FDFAF5] flex flex-col overflow-hidden font-sans text-[#16243E]">

      {/* ════════════════════════════════
          SCROLLABLE BODY WITH COLLAPSIBLE HEADER
      ════════════════════════════════ */}
      <motion.main
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto overflow-x-hidden pb-28"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* 1. GREETING ROW (Scrolls away) */}
        <div className="px-5 pt-14 pb-4">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[11px] font-black text-[#D4693A] uppercase tracking-[0.12em] mb-0.5">
                {getGreeting()}
              </p>
              <h1 className="font-serif font-black text-[#16243E] text-[34px] leading-[1.05] tracking-tight">
                {profile?.nome || profile?.nickname || 'Esploratore'} 👋
              </h1>
              <p className="text-[12px] font-medium text-[#8A95AD] mt-1">
                {getContextualSub()}
              </p>
            </div>

            {/* notif button */}
            <button
              onClick={() => navigate('/notifiche')}
              className="relative w-[46px] h-[46px] rounded-[16px] bg-[#16243E] flex items-center justify-center shadow-lg active:scale-90 transition-transform shrink-0"
            >
              <Bell size={22} weight="fill" className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-[11px] h-[11px] bg-red-500 rounded-full border-2 border-[#FDFAF5]" />
              )}
            </button>
          </div>
        </div>

        {/* 2. STICKY SEARCH BAR — utility, non protagonista */}
        <div className="sticky top-0 z-30 bg-[#FDFAF5]/95 backdrop-blur-md px-5 py-2 -mt-2 mb-1">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center bg-white/80 border border-[#EAE3D6] rounded-2xl px-4 py-2 gap-2.5 active:scale-[0.99] transition-transform"
          >
            <MagnifyingGlass size={16} weight="bold" className="text-[#8A95AD] shrink-0" />
            <span className="flex-1 text-left text-[13px] font-medium text-[#8A95AD] truncate">
              Cerca luoghi, eventi, esperienze…
            </span>
            <span className="text-[11px] font-bold text-[#8A95AD] shrink-0">
              📍 {userLoc ? 'Qui vicino' : 'Barletta'}
            </span>
          </button>
        </div>

        {/* ── Cosa faccio adesso? — HERO CARD ── */}
        <motion.div variants={fadeUp} className="px-5 mt-4">
          <button
            onClick={() => setShowNow(true)}
            className="w-full relative overflow-hidden rounded-[32px] text-left active:scale-[0.97] transition-transform"
            style={{ background: 'linear-gradient(150deg, #A83E1E 0%, #C05828 35%, #D4793A 65%, #C05828 100%)' }}
          >
            {/* Grain texture — feel premium/editorial */}
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-25"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '160px'
              }}
            />

            {/* Animated glow orb — card "respira" */}
            <motion.div
              animate={{ x: [0, 18, -8, 12, 0], y: [0, -12, 8, -6, 0], scale: [1, 1.2, 0.95, 1.1, 1] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-14 -right-14 w-60 h-60 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,175,80,0.55) 0%, transparent 70%)', filter: 'blur(28px)' }}
            />
            {/* Bottom glow */}
            <div className="absolute -bottom-10 -left-6 w-44 h-44 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,100,30,0.25) 0%, transparent 70%)', filter: 'blur(22px)' }}
            />

            <div className="relative px-7 pt-7 pb-7">
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A83E1E]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/70">Il tuo concierge</span>
              </div>

              {/* Titolo enorme — l'impatto è nella scala */}
              <h3 className="text-[58px] font-serif font-black text-white leading-[0.88] tracking-tight mb-6">
                Cosa<br />faccio<br />adesso?
              </h3>

              {/* Hint chips glassmorphism */}
              <div className="flex gap-2 mb-7 flex-wrap">
                {['🍽️ Cena', '😌 Relax', '🌙 Serata', '👥 Amici'].map(hint => (
                  <span key={hint} className="text-[11px] font-bold text-white/85 bg-black/15 border border-white/15 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {hint}
                  </span>
                ))}
              </div>

              {/* Bottom row: descrizione + CTA pill bianca */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-[12px] text-white/50 font-medium leading-relaxed">
                  4 domande<br />3 posti perfetti
                </p>
                <div className="shrink-0 bg-white text-[#A83E1E] font-black text-[12px] uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-2">
                  Inizia <ArrowRight size={14} weight="bold" />
                </div>
              </div>
            </div>
          </button>
        </motion.div>

        {/* ── Category pills ── */}
        <motion.div variants={fadeUp} className="flex gap-2 px-5 pb-1 overflow-x-auto no-scrollbar mt-5">
          {CATS.map(c => (
            <CatPill
              key={c.id}
              icon={c.icon}
              label={c.label}
              active={activeCat === c.id}
              onClick={() => setActiveCat(c.id)}
            />
          ))}
        </motion.div>

        {/* ── Le Mie Saghe ── (solo saghe con almeno 1 tappa completata) */}
        <AnimatePresence>
          {activeSagas.filter(s => s.doneSteps > 0).length > 0 && (
            <motion.section variants={fadeUp} className="mt-7">
              <SectionHeader title="Le Mie Saghe 🗺️" onMore={() => navigate('/missioni')} />
              <div className="px-5 flex flex-col gap-2.5">
                {activeSagas.filter(s => s.doneSteps > 0).map(saga => (
                  <ActiveSagaCard
                    key={saga.questSetId}
                    saga={saga}
                    onClick={() => navigate(`/saga/${saga.questSetId}/intro`)}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Itinerari Section (Personal Diary Style) ── */}
        <div className="px-5 mt-8 mb-4">
          <motion.div
            variants={fadeUp}
            onClick={() => navigate('/daily-plans')}
            className="relative overflow-hidden rounded-[2px] bg-[#FCF9F2] p-7 cursor-pointer active:scale-[0.99] transition-all shadow-xl shadow-black/5 border-l-[12px] border-l-[#EAE3D6] border-y border-r border-[#EDE3D4]"
            style={{
              backgroundImage: `linear-gradient(#EAE3D6 1px, transparent 1px)`,
              backgroundSize: '100% 32px',
              backgroundPosition: '0 16px',
              rotate: '-0.8deg'
            }}
          >
            {/* Decorative Tape/Note effect */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#D4693A]/10 border-x border-[#D4693A]/20 rotate-[-2deg] backdrop-blur-[2px] z-10" />
            
            <div className="relative pl-4">
              <p className="text-[10px] font-black text-[#D4693A] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full border border-[#D4693A] flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-[#D4693A]" />
                </span>
                Appunti di Viaggio
              </p>
              
              <h3 className="font-serif font-black text-[#16243E] text-[24px] leading-[1.1] mb-3">
                Cosa facciamo insieme oggi?
              </h3>
              
              <p className="text-[14px] font-medium text-[#4A5670] italic mb-6 leading-[32px] max-w-[90%]">
                "Il piano per la tua giornata perfetta in Puglia è già pronto, aspetta solo te..."
              </p>
              
              <div className="flex justify-start">
                <button className="bg-[#16243E] text-white text-[12px] font-bold px-7 py-3 rounded-full shadow-lg active:scale-95 transition-transform uppercase tracking-widest flex items-center gap-2">
                  Pianifica la mia giornata
                  <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            </div>

            {/* Subtle paper grain texture overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/natural-paper.png")` }} />
          </motion.div>
        </div>

        {/* ── Saghe Vicine ── */}
        <motion.section variants={fadeUp} className="mt-8">
          <SectionHeader title="Saghe Vicine" onMore={() => navigate('/missioni')} />
          <div className="flex gap-3.5 px-5 overflow-x-auto no-scrollbar snap-x pb-2">
            {saghe.slice(0, 6).map(saga => (
              <MissionCard
                key={saga.id}
                saga={saga}
                isFav={favorites.includes(saga.id)}
                onFav={(e) => toggleFavorite(e, saga.id)}
                onClick={() => navigate(`/saga/${saga.id}/intro`)}
              />
            ))}
          </div>
        </motion.section>

        {/* ── Notizie ed Eventi ── */}
        <motion.section variants={fadeUp} className="mt-8">
          <SectionHeader title="Notizie ed Eventi" onMore={() => navigate('/eventi')} />
          <div className="flex gap-3.5 px-5 overflow-x-auto no-scrollbar snap-x pb-2">
            {news.map(item => (
              <NewsCard key={item.id} item={item} />
            ))}
            {events.map(ev => (
              <EventCard
                key={ev.id}
                ev={ev}
                onClick={() => navigate(`/eventi/${ev.id}`)}
              />
            ))}
          </div>
        </motion.section>

      </motion.main>

      {/* ════════════════════════════════
          SEARCH MODAL
      ════════════════════════════════ */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        saghe={saghe}
      />

      {/* ── Cosa faccio adesso modal ── */}
      <CosaFaccioAdesso
        isOpen={showNow}
        onClose={() => setShowNow(false)}
        userCity={userLoc ? null : 'Barletta'}
      />
    </div>
  );
}
