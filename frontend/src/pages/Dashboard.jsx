// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QuestService } from '../services/quest';
import { EventsService } from '../services/events';
import { NotificationService } from '../services/notifications';
import { supabase } from '../services/supabase';
import {
  Heart,
  Bell,
  ArrowRight,
  ArrowUpRight as NavigationArrow,
  MapPin,
  Sparkle,
} from '@phosphor-icons/react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CosaFaccioAdesso from '../components/CosaFaccioAdesso';
import { motion, AnimatePresence } from 'framer-motion';
import { colors as TOKENS } from '../utils/designTokens';

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buona sera';
};

const getCFAContextualLine = () => {
  const h = new Date().getHours();
  if (h < 9) return 'Da dove comincia questa giornata?';
  if (h < 13) return 'Cosa merita davvero oggi?';
  if (h < 17) return 'Dove ti porta questo pomeriggio?';
  if (h < 20) return "Come finisce questa serata?";
  return 'Come finisce questa serata?';
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

/** Active saga card */
const ActiveSagaCard = ({ saga, onClick }) => (
  <motion.div
    onClick={onClick}
    whileTap={{ scale: 0.985 }}
    className="flex items-center gap-3.5 bg-white border border-[#EAE3D6] rounded-[20px] p-3.5 cursor-pointer shadow-sm group relative overflow-hidden"
  >
    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#D4693A] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    <div className="w-[66px] h-[66px] rounded-[14px] overflow-hidden shrink-0 bg-[#EDE3D4] relative">
      <img
        src={saga.sagaImage || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=200'}
        alt={saga.sagaTitle}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
    </div>
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

/** Mission card */
const MissionCard = ({ saga, isFav, onFav, onClick }) => (
  <motion.div
    onClick={onClick}
    whileTap={{ scale: 0.97 }}
    className="w-[252px] shrink-0 snap-start bg-white rounded-[24px] overflow-hidden shadow-md border border-[#EAE3D6] cursor-pointer group flex flex-col"
  >
    <div className="h-[144px] relative overflow-hidden bg-[#EDE3D4]">
      <img
        src={saga.image_url || saga.map_image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600'}
        alt={saga.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#16243E]/60 via-transparent to-transparent" />
      <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-[#16243E]/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
        📍 {saga.city || 'Puglia'}
      </span>
      <button
        onClick={onFav}
        className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center border border-white/15 transition-transform active:scale-90 ${isFav ? 'bg-red-500/85' : 'bg-[#16243E]/70'}`}
      >
        <Heart size={15} weight={isFav ? 'fill' : 'bold'} className="text-white" />
      </button>
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

const SectionHeader = ({ title, onMore }) => (
  <div className="flex items-end justify-between px-5 mb-3.5">
    <h2 className="font-serif font-black text-[#16243E] text-[22px] leading-tight tracking-tight">{title}</h2>
    {onMore && (
      <button onClick={onMore} className="flex items-center gap-1 text-[11px] font-bold text-[#D4693A] active:opacity-70">
        Vedi tutte <ArrowRight size={11} weight="bold" />
      </button>
    )}
  </div>
);

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-[#EDE3D4] rounded-[16px] ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="px-5 pt-4 flex flex-col gap-5">
    <Skeleton className="h-[72px] w-full" />
    <Skeleton className="h-[280px] w-full" />
    <div className="flex gap-3">
      <Skeleton className="h-[180px] w-[252px] shrink-0" />
      <Skeleton className="h-[180px] w-[252px] shrink-0" />
    </div>
  </div>
);

/* ─────────────────────────────────────────
   DEFAULT NEWS
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────── */
const HERO_BG = TOKENS.bgPrimary;
const HERO_MUTED = TOKENS.textMuted;
const HERO_INK = '#16243E';
const HERO_LINE = TOKENS.border;
const HERO_PARTICLE = '#223A5A';
const HERO_PARTICLE_SOFT = '#8EA1B3';
const HERO_GLOW = 'rgba(255,255,255,0.9)';

const CONCIERGE_PARTICLES = [
  { id: 1, x: '18%', y: '31%', size: 5, depth: 0.9, duration: 7.2, delay: 0.1, color: '#FFFFFF' },
  { id: 2, x: '24%', y: '22%', size: 4, depth: 0.78, duration: 8.1, delay: 0.4, color: '#FFFFFF' },
  { id: 3, x: '31%', y: '18%', size: 4, depth: 0.7, duration: 7.6, delay: 0.8, color: HERO_PARTICLE_SOFT },
  { id: 4, x: '42%', y: '14%', size: 5, depth: 0.95, duration: 6.9, delay: 0.3, color: '#FFFFFF' },
  { id: 5, x: '54%', y: '15%', size: 4, depth: 0.72, duration: 7.4, delay: 1.2, color: HERO_PARTICLE_SOFT },
  { id: 6, x: '66%', y: '20%', size: 4, depth: 0.7, duration: 8.4, delay: 0.5, color: '#FFFFFF' },
  { id: 7, x: '74%', y: '30%', size: 5, depth: 0.92, duration: 7.1, delay: 0.9, color: '#FFFFFF' },
  { id: 8, x: '80%', y: '44%', size: 4, depth: 0.76, duration: 8.5, delay: 1.4, color: HERO_PARTICLE_SOFT },
  { id: 9, x: '74%', y: '58%', size: 5, depth: 0.9, duration: 6.8, delay: 0.6, color: '#FFFFFF' },
  { id: 10, x: '65%', y: '69%', size: 4, depth: 0.7, duration: 7.9, delay: 1.1, color: HERO_PARTICLE_SOFT },
  { id: 11, x: '52%', y: '75%', size: 5, depth: 0.96, duration: 7.3, delay: 0.2, color: '#FFFFFF' },
  { id: 12, x: '39%', y: '74%', size: 4, depth: 0.68, duration: 8.3, delay: 1.6, color: HERO_PARTICLE_SOFT },
  { id: 13, x: '27%', y: '68%', size: 4, depth: 0.72, duration: 7.7, delay: 0.7, color: '#FFFFFF' },
  { id: 14, x: '18%', y: '57%', size: 5, depth: 0.9, duration: 6.7, delay: 1.3, color: '#FFFFFF' },
  { id: 15, x: '14%', y: '44%', size: 4, depth: 0.74, duration: 8, delay: 0.9, color: HERO_PARTICLE_SOFT },
  { id: 16, x: '33%', y: '33%', size: 3, depth: 0.42, duration: 6.5, delay: 0.4, color: HERO_PARTICLE },
  { id: 17, x: '48%', y: '28%', size: 3, depth: 0.38, duration: 6.8, delay: 1.1, color: HERO_PARTICLE_SOFT },
  { id: 18, x: '61%', y: '36%', size: 3, depth: 0.45, duration: 7.1, delay: 0.3, color: HERO_PARTICLE },
  { id: 19, x: '58%', y: '52%', size: 3, depth: 0.35, duration: 6.9, delay: 1.4, color: HERO_PARTICLE_SOFT },
  { id: 20, x: '45%', y: '56%', size: 3, depth: 0.32, duration: 7.4, delay: 0.6, color: HERO_PARTICLE },
  { id: 21, x: '37%', y: '47%', size: 3, depth: 0.36, duration: 6.6, delay: 1.6, color: '#FFFFFF' },
  { id: 22, x: '50%', y: '44%', size: 6, depth: 1, duration: 6.2, delay: 0.2, color: '#FFFFFF' },
  { id: 23, x: '29%', y: '53%', size: 2, depth: 0.24, duration: 7.8, delay: 1.8, color: HERO_PARTICLE_SOFT },
  { id: 24, x: '67%', y: '47%', size: 2, depth: 0.24, duration: 8.2, delay: 1, color: HERO_PARTICLE_SOFT },
];

const AbstractConciergeField = () => (
  <div
    className="relative w-full max-w-[320px] aspect-square"
    style={{ perspective: '900px' }}
  >
    <motion.div
      animate={{ rotate: [0, 6, 0, -6, 0], scale: [1, 1.03, 1] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute inset-[18%] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(34,58,90,0.08) 0%, rgba(34,58,90,0.025) 38%, transparent 72%)',
        filter: 'blur(10px)',
      }}
    />

    <motion.div
      animate={{ opacity: [0.22, 0.46, 0.22], scale: [0.94, 1.08, 0.94] }}
      transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute left-1/2 top-1/2 h-[96px] w-[96px] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.34) 35%, rgba(255,255,255,0.02) 72%)',
        filter: 'blur(10px)',
      }}
    />

    {CONCIERGE_PARTICLES.map((particle) => (
      <motion.div
        key={particle.id}
        animate={{
          x: [0, 12 * particle.depth, -10 * particle.depth, 0],
          y: [0, -10 * particle.depth, 8 * particle.depth, 0],
          scale: [1, 1 + 0.22 * particle.depth, 0.94, 1],
          opacity: [0.26 + 0.2 * particle.depth, 0.9, 0.34, 0.26 + 0.2 * particle.depth],
        }}
        transition={{
          duration: particle.duration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: particle.delay,
        }}
        className="absolute rounded-full"
        style={{
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          background: particle.color,
          boxShadow: `0 0 ${particle.size * 3}px ${HERO_GLOW}`,
          filter: particle.depth > 0.7 ? 'blur(0px)' : 'blur(0.2px)',
          transform: `translateZ(${particle.depth * 28}px)`,
        }}
      />
    ))}
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saghe, setSaghe] = useState([]);
  const [activeSagas, setActiveSagas] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState(DEFAULT_NEWS);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userLoc, setUserLoc] = useState(null);
  const [showNow, setShowNow] = useState(false);
  const [initialIntent, setInitialIntent] = useState(null);

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
      const [activeEvents, activeSaghe, userActiveSagas, userFavorites, newsRows] = await Promise.all([
        EventsService.getActiveEvents(),
        QuestService.getActiveSets(),
        profile?.id ? QuestService.getUserActiveSagas(profile.id) : [],
        profile?.id ? QuestService.getUserFavorites(profile.id) : [],
        fetchDashboardNews(),
      ]);
      setEvents(activeEvents || []);
      setSaghe(activeSaghe || []);
      setActiveSagas(userActiveSagas || []);
      setFavorites(userFavorites || []);
      setNews(newsRows?.length ? newsRows : DEFAULT_NEWS);
    } catch (err) {
      console.error('Dashboard load error', err);
      setNews(DEFAULT_NEWS);
    } finally {
      setLoading(false);
    }
  };

  const openCFA = (intentId = null) => {
    setInitialIntent(intentId);
    setShowNow(true);
  };

  const fetchDashboardNews = async () => {
    const { data, error } = await supabase
      .from('news_items')
      .select('id, title, image_url, category, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(6);

    if (error) {
      console.warn('Dashboard news fallback:', error.message);
      return DEFAULT_NEWS;
    }

    return (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      image_url: item.image_url,
      category: item.category,
      date: item.published_at,
    }));
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

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0, 0, 0.2, 1] } },
  };
  const stagger = {
    show: { transition: { staggerChildren: 0.07 } },
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: HERO_BG }}>
        <div className="px-5 pt-14 pb-5">
          <Skeleton className="h-[36px] w-48 mb-1" />
          <Skeleton className="h-[28px] w-32" />
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden font-sans"
      style={{ background: HERO_BG, color: HERO_INK }}
    >
      <motion.main
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto overflow-x-hidden pb-28"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >

        {/* ══════════════════════════════════════════
            HERO — Concierge + CTA
        ══════════════════════════════════════════ */}
        <div
          className="relative flex flex-col items-center"
          style={{
            background: HERO_BG,
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          {/* Top bar: greeting + notifiche */}
          <div className="w-full flex items-center justify-between px-5 pt-12 pb-2">
            <div className="flex items-center gap-3 min-w-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile?.nome || 'Avatar'}
                  className="w-11 h-11 rounded-full object-cover border border-black/5 shadow-sm shrink-0"
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-black shrink-0"
                  style={{ background: 'rgba(22,36,62,0.08)', color: HERO_INK }}
                >
                  {(profile?.nome || profile?.nickname || 'E').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: HERO_MUTED }}>
                  {getGreeting()}
                </p>
                <p className="text-[18px] font-serif font-black leading-tight truncate" style={{ color: HERO_INK }}>
                  {profile?.nome || profile?.nickname || 'Esploratore'} <span aria-hidden="true">👋</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/notifiche')}
              className="relative w-[42px] h-[42px] rounded-[13px] flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: '#16243E' }}
            >
              <Bell size={19} weight="fill" className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-[10px] h-[10px] bg-red-500 rounded-full border-2" style={{ borderColor: HERO_BG }} />
              )}
            </button>
          </div>

          <motion.div
            variants={fadeUp}
            className="w-full px-5 pt-4 pb-9"
          >
            <div className="relative pt-2 pb-4 overflow-hidden">
              <motion.div
                aria-hidden="true"
                className="absolute inset-x-0 top-2 h-[220px] pointer-events-none"
                animate={{ opacity: [0.55, 0.9, 0.55] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background:
                    'radial-gradient(circle at 85% 28%, rgba(212,121,58,0.14) 0%, rgba(212,121,58,0.04) 24%, transparent 52%), radial-gradient(circle at 18% 78%, rgba(22,36,62,0.11) 0%, rgba(22,36,62,0.02) 32%, transparent 55%)',
                  filter: 'blur(10px)',
                }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute left-0 right-0 top-[124px] h-px"
                animate={{ scaleX: [0.86, 1, 0.86], opacity: [0.35, 0.7, 0.35] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(22,36,62,0.12) 20%, rgba(212,121,58,0.28) 50%, rgba(22,36,62,0.12) 80%, transparent 100%)',
                  transformOrigin: 'center',
                }}
              />

              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 whitespace-nowrap" style={{ color: HERO_MUTED }}>
                  Concierge
                </p>
                <h2
                  className="font-serif font-black leading-[0.98] tracking-tight text-[clamp(32px,8.5vw,54px)] whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ color: HERO_INK }}
                >
                  {getCFAContextualLine()}
                </h2>
                <motion.p
                  className="mt-3 text-[14px] font-medium whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ color: HERO_MUTED }}
                  animate={{ opacity: [0.72, 1, 0.72], x: [0, 2, 0] }}
                  transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Il tuo concierge personale per trovare il posto giusto senza perdere tempo.
                </motion.p>

                <button
                  onClick={() => openCFA()}
                  className="mt-7 w-full flex items-center gap-3 rounded-[22px] text-left transition active:scale-[0.99]"
                >
                  <div
                    className="w-full flex items-center gap-3 rounded-[22px] border px-4 py-4"
                    style={{
                      borderColor: HERO_LINE,
                      background: 'rgba(255,255,255,0.88)',
                      boxShadow: '0 16px 36px rgba(31,41,51,0.07)',
                    }}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full shrink-0" style={{ background: 'rgba(22,36,62,0.08)', color: HERO_INK }}>
                      <Search size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-black whitespace-nowrap" style={{ color: HERO_INK }}>
                        Cerca un posto, un&apos;idea o qualcosa da fare
                      </p>
                      <p className="truncate text-[12px] mt-0.5 whitespace-nowrap" style={{ color: HERO_MUTED }}>
                        Cene, borghi, cocktail, mare, relax, esperienze selezionate
                      </p>
                    </div>
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      className="shrink-0"
                    >
                      <ArrowRight size={18} weight="bold" style={{ color: HERO_MUTED }} />
                    </motion.span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Sezioni sotto il fold — sfondo bianco/caldo ── */}
        <div className="bg-white rounded-t-[32px] -mt-4 pt-8 pb-4" style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}>

          {/* Le Mie Saghe (solo se in corso) */}
          <AnimatePresence>
            {activeSagas.filter(s => s.doneSteps > 0).length > 0 && (
              <motion.section variants={fadeUp} className="mb-8">
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

          {/* Saghe Vicine */}
          <motion.section variants={fadeUp} className="mb-8">
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

          {/* Eventi */}
          <motion.section variants={fadeUp} className="mb-8">
            <SectionHeader title="Eventi" onMore={() => navigate('/eventi')} />
            <div className="flex gap-3.5 px-5 overflow-x-auto no-scrollbar snap-x pb-2">
              {events.map(ev => (
                <EventCard
                  key={ev.id}
                  ev={ev}
                  onClick={() => navigate(`/eventi/${ev.id}`)}
                />
              ))}
            </div>
          </motion.section>

        </div>
      </motion.main>

      {/* CFA Modal */}
      <CosaFaccioAdesso
        isOpen={showNow}
        onClose={() => setShowNow(false)}
        userCity={userLoc ? null : 'Barletta'}
        initialIntent={initialIntent}
      />
    </div>
  );
}
