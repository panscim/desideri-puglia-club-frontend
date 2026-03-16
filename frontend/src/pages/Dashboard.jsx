// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QuestService } from '../services/quest';
import { EventsService } from '../services/events';
import { NotificationService } from '../services/notifications';
import {
  Heart,
  Bell,
  ArrowRight,
  ArrowUpRight as NavigationArrow,
  MapPin,
  Sparkle,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
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

const getCFAContextualLine = () => {
  const h = new Date().getHours();
  if (h < 9)  return 'Inizia bene la mattina';
  if (h < 13) return 'Cosa fai oggi in Puglia?';
  if (h < 17) return 'Il pomeriggio è tutto tuo';
  if (h < 20) return "L'ora giusta per uscire";
  return 'Come finisce questa serata?';
};

const INTENTS = [
  { id: 'mangiare', emoji: '🍽️', label: 'Mangiare qualcosa', sub: 'Ristoranti, osterie, pizzerie' },
  { id: 'vedere',   emoji: '👁️', label: 'Vedere qualcosa di bello', sub: 'Arte, cultura, panorami' },
  { id: 'tappa',    emoji: '🤲', label: 'Una tappa autentica', sub: 'Borghi, cantine, masserie' },
  { id: 'relax',    emoji: '😌', label: 'Rilassarmi', sub: 'Spa, natura, slow' },
  { id: 'serata',   emoji: '🌙', label: 'Vivere la serata', sub: 'Bar, enoteca, musica live' },
];

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
// Palette estratta dalla GIF: bianco + viola/ciano blob
const GIF_BG       = '#F8F8FC'; // bianco con velo lavanda
const GIF_BG_DEEP  = '#F0EEF9'; // lavanda chiarissimo
const GIF_STONE    = '#8A8FB8'; // grigio-viola freddo

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saghe, setSaghe] = useState([]);
  const [activeSagas, setActiveSagas] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [events, setEvents] = useState([]);
  const [news] = useState(DEFAULT_NEWS);
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

  const openCFA = (intentId) => {
    setInitialIntent(intentId);
    setShowNow(true);
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
      <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ background: GIF_BG }}>
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
      style={{ background: GIF_BG, color: '#16243E' }}
    >
      <motion.main
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto overflow-x-hidden pb-28"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >

        {/* ══════════════════════════════════════════
            HERO — GIF + CTA
        ══════════════════════════════════════════ */}
        <div
          className="relative flex flex-col items-center"
          style={{
            background: `linear-gradient(180deg, ${GIF_BG} 0%, ${GIF_BG_DEEP} 60%, ${GIF_BG} 100%)`,
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          {/* Top bar: greeting + notifiche */}
          <div className="w-full flex items-center justify-between px-5 pt-12 pb-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: GIF_STONE }}>
                {getGreeting()}
              </p>
              <p className="text-[18px] font-serif font-black text-[#16243E] leading-tight">
                {profile?.nome || profile?.nickname || 'Esploratore'}
              </p>
            </div>
            <button
              onClick={() => navigate('/notifiche')}
              className="relative w-[42px] h-[42px] rounded-[13px] flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: '#16243E' }}
            >
              <Bell size={19} weight="fill" className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-[10px] h-[10px] bg-red-500 rounded-full border-2" style={{ borderColor: GIF_BG }} />
              )}
            </button>
          </div>

          {/* GIF animazione */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0, 0, 0.2, 1] }}
            className="w-full flex items-center justify-center"
            style={{ height: '52vw', maxHeight: 280, minHeight: 200 }}
          >
            <img
              src="/hero.gif"
              alt=""
              className="h-full w-auto object-contain select-none pointer-events-none"
              style={{ mixBlendMode: 'multiply' }}
            />
          </motion.div>

          {/* Headline + CTA */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center text-center px-6 pb-10 gap-5"
          >
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-[0.3em] mb-2"
                style={{ color: GIF_STONE }}
              >
                Il tuo concierge personale
              </p>
              <h2 className="font-serif font-black text-[#16243E] leading-[0.9] tracking-tight"
                style={{ fontSize: 'clamp(38px, 10vw, 52px)' }}
              >
                Chiedi a Desideri<br />
                <span style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>cosa fare</span>
              </h2>
              <p className="text-[13px] font-medium mt-3 italic" style={{ color: GIF_STONE }}>
                {getCFAContextualLine()}
              </p>
            </div>

            {/* CTA unico */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { setInitialIntent(null); setShowNow(true); }}
              className="flex items-center gap-3 px-8 py-4 rounded-[20px] shadow-xl active:shadow-md transition-all"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #06B6D4 100%)',
                boxShadow: '0 8px 28px rgba(124,58,237,0.35)',
              }}
            >
              <span className="text-white font-black text-[16px] tracking-wide">Cosa faccio adesso?</span>
              <ArrowRight size={18} weight="bold" className="text-white/80" />
            </motion.button>

            {/* Scorciatoie intent */}
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {INTENTS.map(intent => (
                <button
                  key={intent.id}
                  onClick={() => openCFA(intent.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold transition-all active:scale-95"
                  style={{
                    background: 'rgba(168,85,247,0.08)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    color: '#5B21B6',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span>{intent.emoji}</span>
                  {intent.label.split(' ')[0]}
                </button>
              ))}
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

          {/* Notizie ed Eventi */}
          <motion.section variants={fadeUp} className="mb-8">
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
