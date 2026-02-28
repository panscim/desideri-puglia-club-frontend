import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConciergeService } from '../services/concierge';
import { useAuth } from '../contexts/AuthContext';
import { 
  CaretLeft, 
  MapPin, 
  CloudRain, 
  Sun, 
  Sparkle,
  CreditCard,
  CheckCircle,
  Clock,
  NavigationArrow,
  Star,
  LockKey,
  Users,
  Timer
} from '@phosphor-icons/react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';

/* ── Helpers ─────────────────────────────────────────────── */
const seasonLabels = { spring: 'Primavera', summer: 'Estate', autumn: 'Autunno', winter: 'Inverno' };
const targetLabels  = { couples: 'Coppie', solo: 'Solo', group: 'Gruppo', family: 'Famiglia' };

/* ── Variants ────────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } }
};

/* ── Sub-components ──────────────────────────────────────── */
const Pill = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full border ${className}`}>
    {children}
  </span>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const PlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [plan,        setPlan]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isBuying,    setIsBuying]    = useState(false);
  const [isRainMode,  setIsRainMode]  = useState(false);
  const [vibeStatus,  setVibeStatus]  = useState('Sincronizzazione...');
  const [vibeLevel,   setVibeLevel]   = useState(7);

  const { scrollY } = useScroll();
  const heroScale    = useTransform(scrollY, [0, 400], [1.0, 1.15]);
  const navBg        = useTransform(scrollY, [140, 220], ['rgba(249,249,247,0)', 'rgba(249,249,247,0.92)']);
  const navBorder    = useTransform(scrollY, [140, 220], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.05)']);
  const titleOpacity = useTransform(scrollY, [200, 280], [0, 1]);

  useEffect(() => { loadPlan(); fetchVibes(); window.scrollTo(0, 0); }, [id, user]);

  const loadPlan = async () => {
    setLoading(true);
    const data = await ConciergeService.getPlanDetail(id);
    setPlan(data);
    if (user && data) {
      const ok = await ConciergeService.checkPurchase(user.id, id);
      setIsPurchased(ok);
    }
    setLoading(false);
  };

  const fetchVibes = async () => {
    const vibes = await ConciergeService.getLiveVibes();
    if (vibes?.length) {
      const lvl = vibes[0].vibe_level;
      const labels = ['Pace & Relax', 'Atmosfera Vivace', 'Picco Movida'];
      setVibeStatus(labels[lvl - 1] || 'In Attività');
      setVibeLevel(Math.min(14, Math.round(lvl * 4.5)));
    } else {
      setVibeStatus('Chill Vibe');
      setVibeLevel(5);
    }
  };

  const handlePurchase = async () => {
    if (!user) { toast.error('Accedi prima di sbloccare'); navigate('/login'); return; }
    setIsBuying(true);
    const result = await ConciergeService.purchasePlan(user.id, id);
    if (result.success) { toast.success('Giornata sbloccata. Benvenuto.'); setIsPurchased(true); }
    setIsBuying(false);
  };

  /* ── Loading screen ───────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center gap-7">
      <motion.div 
        className="w-14 h-14 rounded-[1.75rem] bg-zinc-950 flex items-center justify-center"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <MapPin size={22} weight="fill" className="text-orange-500" />
      </motion.div>
      <div className="w-20 h-[1.5px] bg-zinc-100 overflow-hidden rounded-full">
        <motion.div 
          className="h-full bg-zinc-900"
          initial={{ x: '-100%' }} animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        />
      </div>
      <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-300">Desideri Puglia</p>
    </div>
  );

  if (!plan) return null;

  const creatorName = plan.creator
    ? (`${plan.creator.nome || ''} ${plan.creator.cognome || ''}`).trim() || plan.creator.nickname
    : 'Resident Desideri';

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F9F9F7] text-zinc-900 pb-44" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.015em' }}>

      {/* ╔══ NAV ══════════════════════════════════════════╗ */}
      <motion.nav
        style={{ backgroundColor: navBg, borderBottomColor: navBorder }}
        className="fixed top-0 inset-x-0 z-[1000] px-5 h-16 flex items-center justify-between border-b backdrop-blur-3xl"
      >
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-zinc-100 shadow-sm flex items-center justify-center active:scale-90 transition-transform">
          <CaretLeft size={18} weight="bold" />
        </button>

        <motion.p style={{ opacity: titleOpacity }} className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 truncate max-w-[50%] text-center">
          {plan.title_it}
        </motion.p>

        <div className="flex items-center gap-1">
          <button className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform opacity-50 hover:opacity-100">
            <Star size={20} weight="duotone" />
          </button>
        </div>
      </motion.nav>

      {/* ╔══ HERO ══════════════════════════════════════════╗ */}
      <div className="relative h-[72vh] w-full overflow-hidden bg-zinc-900">
        <motion.img
          style={{ scale: heroScale }}
          src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'}
          className="w-full h-full object-cover"
          alt={plan.title_it}
        />
        {/* Gradient scrim */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, transparent 38%, rgba(0,0,0,0.06) 70%, rgba(0,0,0,0.88) 100%)'
        }} />

        {/* Top-right: season & target pills */}
        <div className="absolute top-20 right-5 flex flex-col items-end gap-2">
          {plan.season && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <Pill className="bg-white/10 border-white/20 text-white backdrop-blur-md">
                <Sun size={10} weight="fill" /> {seasonLabels[plan.season] || plan.season}
              </Pill>
            </motion.div>
          )}
          {plan.target_audience && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }}>
              <Pill className="bg-white/10 border-white/20 text-white backdrop-blur-md">
                <Users size={10} weight="fill" /> {targetLabels[plan.target_audience] || plan.target_audience}
              </Pill>
            </motion.div>
          )}
        </div>

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-10">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-orange-400 mb-4">
            <MapPin size={14} weight="fill" />
            <span className="text-[9px] font-black uppercase tracking-[0.45em]">{plan.city}, Puglia</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
            className="text-[3.5rem] font-black text-white leading-[0.88] mb-5 lowercase first-letter:uppercase"
            style={{ letterSpacing: '-0.04em', textShadow: '0 4px 32px rgba(0,0,0,0.3)' }}
          >
            {plan.title_it}
          </motion.h1>

          {/* Star rating row */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={12} weight={(plan.rating_avg || 4.9) >= s ? 'fill' : 'regular'} className="text-orange-400" />
              ))}
            </div>
            <span className="text-white/50 text-[10px] font-medium">{(plan.rating_avg || 4.9).toFixed(1)}</span>
            <span className="text-white/20 text-[10px]">·</span>
            <span className="text-white/50 text-[10px] font-medium">Giornata Premium</span>
          </motion.div>
        </div>
      </div>

      {/* ╔══ MAIN CONTENT ══════════════════════════════════╗ */}
      <main className="px-5 -mt-8 relative z-10 space-y-8">

        {/* ── Locator card ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.45, ease: [0.16, 1, 0.3, 1], duration: 0.7 }}
          className="bg-white/80 backdrop-blur-2xl rounded-[1.75rem] px-5 py-4 flex items-center justify-between shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-white/70"
        >
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              {plan.creator?.avatar_url
                ? <img src={plan.creator.avatar_url} className="w-11 h-11 rounded-[1rem] object-cover" alt={creatorName} />
                : (
                  <div className="w-11 h-11 rounded-[1rem] bg-zinc-100 flex items-center justify-center text-zinc-700 text-xs font-black">
                    {creatorName[0]?.toUpperCase()}
                  </div>
                )
              }
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                <CheckCircle size={13} weight="fill" className="text-orange-500" />
              </div>
            </div>
            <div>
              <p className="text-[7.5px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">Locator Verificato</p>
              <p className="text-[13px] font-black text-zinc-900 leading-none" style={{ letterSpacing: '-0.02em' }}>{creatorName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-[1px] h-8 bg-zinc-100" />
            <div className="text-right">
              <p className="text-[7.5px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">Rating</p>
              <p className="text-[13px] font-black text-zinc-900 leading-none">{(plan.rating_avg || 4.9).toFixed(1)} <span className="text-zinc-300 font-medium text-[10px]">/ 5</span></p>
            </div>
          </div>
        </motion.div>

        {/* ── Itinerary section ─────────────────────────── */}
        {isPurchased ? (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">

            {/* Section header */}
            <motion.div variants={item} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-px h-7 bg-zinc-200 rounded-full" />
                <h2 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.35em]">La Giornata</h2>
              </div>
              <button
                onClick={() => setIsRainMode(v => !v)}
                className={`h-10 px-5 rounded-full flex items-center gap-2 border font-black text-[8px] uppercase tracking-[0.2em] transition-all duration-500 ${
                  isRainMode
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white border-zinc-100 text-zinc-600 hover:border-zinc-200'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isRainMode
                    ? <motion.span key="r" initial={{ opacity:0, rotate:-90 }} animate={{ opacity:1, rotate:0 }} exit={{ opacity:0 }}><CloudRain size={15} weight="duotone" /></motion.span>
                    : <motion.span key="s" initial={{ opacity:0, rotate:90 }} animate={{ opacity:1, rotate:0 }} exit={{ opacity:0 }}><Sun size={15} weight="duotone" /></motion.span>
                  }
                </AnimatePresence>
                {isRainMode ? 'Piano B' : 'Meteo'}
              </button>
            </motion.div>

            {/* Slots timeline */}
            <div className="relative space-y-8">
              <div className="absolute left-[21px] top-7 bottom-7 w-px bg-zinc-100" />

              {plan.slots?.map((slot, i) => (
                <motion.div key={slot.id} variants={item} className="flex gap-5">

                  {/* Timeline node */}
                  <div className="shrink-0 flex flex-col items-center gap-2 z-10">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-500 shadow-sm ${
                      isRainMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
                    }`}>
                      <Clock size={18} weight="duotone" className={isRainMode ? 'text-white' : 'text-zinc-700'} />
                    </div>
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-300">{slot.time_label}</span>
                  </div>

                  {/* Card */}
                  <div className={`flex-1 rounded-[1.5rem] p-5 border transition-all duration-500 ${
                    isRainMode && slot.alt_activity_title_it
                      ? 'bg-blue-50/60 border-blue-100'
                      : 'bg-white border-zinc-100/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
                  }`}>
                    <AnimatePresence mode="wait">
                      {isRainMode && slot.alt_activity_title_it ? (
                        <motion.div key="alt" initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }} transition={{ duration: 0.3 }}>
                          <div className="flex items-center gap-1.5 text-blue-500 mb-3">
                            <CloudRain size={12} weight="duotone" />
                            <span className="text-[7.5px] font-black uppercase tracking-[0.3em]">Piano B</span>
                          </div>
                          <h4 className="text-xl font-black text-blue-900 mb-2 lowercase first-letter:uppercase" style={{ letterSpacing: '-0.035em' }}>
                            {slot.alt_activity_title_it}
                          </h4>
                          <p className="text-[13px] text-blue-800/55 font-medium leading-relaxed mb-5 italic">{slot.alt_activity_description_it}</p>
                        </motion.div>
                      ) : (
                        <motion.div key="main" initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }} transition={{ duration: 0.3 }}>
                          <span className="text-[7.5px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-3 block">Tappa {i + 1}</span>
                          <h4 className="text-xl font-black text-zinc-900 mb-2 lowercase first-letter:uppercase" style={{ letterSpacing: '-0.035em' }}>
                            {slot.activity_title_it}
                          </h4>
                          <p className="text-[13px] text-zinc-500 font-medium leading-relaxed mb-5">{slot.activity_description_it}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`, '_blank')}
                      className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] transition-all active:scale-[0.97] ${
                        isRainMode ? 'bg-blue-600 text-white' : 'bg-zinc-950 text-white'
                      }`}
                    >
                      <NavigationArrow size={14} weight="duotone" />
                      Apri in Mappe
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Radar v5 ────────────────────────────────── */}
            <motion.div variants={item} className="rounded-[2rem] overflow-hidden bg-zinc-950 border border-white/[0.06] shadow-2xl">
              <div className="relative p-7">
                {/* BG glow */}
                <div className="absolute inset-0 opacity-40" style={{
                  background: 'radial-gradient(ellipse 80% 60% at 110% -10%, rgba(249,115,22,0.22), transparent)'
                }} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <Sparkle size={16} weight="fill" className="text-orange-500" />
                      <span className="text-[8.5px] font-black uppercase tracking-[0.4em] text-zinc-500">Radar Movida</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />
                      <span className="text-[7px] font-black uppercase tracking-[0.3em] text-green-500">Live</span>
                    </div>
                  </div>

                  <p className="text-[8.5px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Vibe Attuale</p>
                  <h3 className="text-[2.4rem] font-black text-white leading-none mb-8 uppercase" style={{ letterSpacing: '-0.04em' }}>
                    {vibeStatus}
                  </h3>

                  {/* Meter */}
                  <div className="flex gap-[3px] items-end h-5 mb-6">
                    {Array.from({ length: 16 }).map((_, i) => {
                      const isActive = i < vibeLevel;
                      const height = `${40 + (i / 15) * 60}%`;
                      return (
                        <motion.div
                          key={i}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: 0.6 + i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                          className="flex-1 rounded-full origin-bottom"
                          style={{
                            height,
                            background: isActive
                              ? `rgba(249,115,22,${0.4 + (i / 15) * 0.6})`
                              : 'rgba(255,255,255,0.06)',
                            boxShadow: isActive ? `0 0 8px rgba(249,115,22,${0.15 + (i / 15) * 0.3})` : 'none'
                          }}
                        />
                      );
                    })}
                  </div>

                  <p className="text-[8px] font-medium text-zinc-600 text-center uppercase tracking-[0.3em] opacity-50">
                    Resident Puglia Network · Real-Time
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Footer signature */}
            <motion.div variants={item} className="py-16 flex flex-col items-center gap-4 opacity-30">
              <div className="w-8 h-[1px] bg-zinc-500" />
              <p className="text-[7.5px] font-black uppercase tracking-[0.6em] text-zinc-600">Desideri Puglia · Private Club</p>
            </motion.div>

          </motion.div>

        ) : (
          /* ── Lock / Preview ────────────────────────────── */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-6">

            {/* Description card */}
            <div className="bg-white rounded-[1.75rem] p-6 border border-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <p className="text-[13px] text-zinc-600 font-medium leading-relaxed italic mb-5">{plan.description_it}</p>
              <div className="flex flex-wrap gap-2">
                {plan.season && <Pill className="bg-zinc-50 border-zinc-100 text-zinc-500"><Sun size={10} weight="fill" className="text-orange-400" /> {seasonLabels[plan.season]}</Pill>}
                {plan.target_audience && <Pill className="bg-zinc-50 border-zinc-100 text-zinc-500"><Users size={10} weight="fill" className="text-orange-400" /> {targetLabels[plan.target_audience]}</Pill>}
                {plan.slots?.length && <Pill className="bg-zinc-50 border-zinc-100 text-zinc-500"><Timer size={10} weight="fill" className="text-orange-400" /> {plan.slots.length} tappe</Pill>}
              </div>
            </div>

            {/* Blur preview of first slot */}
            {plan.slots?.[0] && (
              <div className="relative rounded-[1.75rem] overflow-hidden border border-zinc-100">
                <div className="p-5 bg-white">
                  <span className="text-[7.5px] font-black uppercase tracking-[0.3em] text-zinc-400 block mb-3">Anteprima</span>
                  <h4 className="text-xl font-black text-zinc-900 mb-2 lowercase first-letter:uppercase blur-[5px] select-none" style={{ letterSpacing: '-0.03em' }}>
                    {plan.slots[0].activity_title_it}
                  </h4>
                  <p className="text-[13px] text-zinc-400 blur-[4px] select-none leading-relaxed line-clamp-2">
                    {plan.slots[0].activity_description_it}
                  </p>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/60 backdrop-blur-[2px]">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-950 flex items-center justify-center shadow-xl">
                    <LockKey size={18} weight="duotone" className="text-white" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Sblocca per vedere</p>
                </div>
              </div>
            )}

            {/* Slot count teaser */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Tappe', value: plan.slots?.length || 5 },
                { label: 'Locali', value: plan.slots?.length ? `${plan.slots.length} posti` : '—' },
                { label: 'Piano B', value: 'Incluso' }
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-4 border border-zinc-100 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                  <p className="text-lg font-black text-zinc-900" style={{ letterSpacing: '-0.03em' }}>{s.value}</p>
                  <p className="text-[7.5px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

          </motion.div>
        )}

      </main>

      {/* ╔══ BOTTOM CTA ════════════════════════════════════╗ */}
      <AnimatePresence>
        {!isPurchased && (
          <motion.div
            initial={{ y: 110, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 110, opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 inset-x-0 z-50 px-5 pb-8 pt-4"
            style={{ background: 'linear-gradient(to top, rgba(249,249,247,1) 70%, rgba(249,249,247,0))' }}
          >
            <div className="bg-white rounded-[1.75rem] p-4 flex items-center justify-between shadow-[0_8px_48px_rgba(0,0,0,0.12)] border border-zinc-100">
              <div className="pl-1">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-0.5">Esperienza Completa</p>
                <p className="text-2xl font-black text-zinc-950" style={{ letterSpacing: '-0.045em' }}>€{plan.price?.toFixed(2)}</p>
              </div>
              <motion.button
                onClick={handlePurchase}
                disabled={isBuying}
                whileTap={{ scale: 0.95 }}
                className="h-14 px-8 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] flex items-center gap-2 shadow-xl shadow-zinc-900/30 disabled:opacity-60"
              >
                {isBuying ? (
                  <span className="opacity-60">...</span>
                ) : (
                  <>Sblocca <CreditCard size={16} weight="duotone" /></>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PlanDetail;
