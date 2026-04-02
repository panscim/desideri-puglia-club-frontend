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
  ArrowUpRight as NavigationArrow,
  Star,
  LockKey,
  Users,
  Timer,
  Info,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

/* ── Helpers ─────────────────────────────────────────────── */
const seasonLabels = { spring: 'Primavera', summer: 'Estate', autumn: 'Autunno', winter: 'Inverno' };
const targetLabels  = { couples: 'Coppie', solo: 'Solo', group: 'Gruppo', family: 'Famiglia' };

/* ── Sub-components ──────────────────────────────────────── */
const Pill = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full border ${className}`}>
    {children}
  </span>
);

/* ── Avatar with colored initials fallback ───────────────── */
const AVATAR_COLORS = [
  ['#FF6B35','#fff'], ['#845EC2','#fff'], ['#0081CF','#fff'],
  ['#00736A','#fff'], ['#C34B4B','#fff'],
];

const CreatorAvatar = ({ src, name }) => {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [bg, fg] = AVATAR_COLORS[idx];
  if (src) return <img src={src} className="w-11 h-11 rounded-[1rem] object-cover" alt={name} />;
  return (
    <div
      className="w-11 h-11 rounded-[1rem] flex items-center justify-center text-sm font-black shrink-0"
      style={{ background: bg, color: fg }}
    >
      {name?.[0]?.toUpperCase()}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const PlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [plan,        setPlan]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(true);
  const [isBuying,    setIsBuying]    = useState(false);
  const [isRainMode,  setIsRainMode]  = useState(false);
  const [vibeStatus,  setVibeStatus]  = useState('Sincronizzazione...');
  const [vibeLevel,   setVibeLevel]   = useState(7);

  useEffect(() => { loadPlan(); fetchVibes(); window.scrollTo(0, 0); }, [id]);

  useEffect(() => {
    if (!plan || authLoading) return;

    let cancelled = false;

    const syncPurchaseState = async () => {
      if (!user) {
        if (!cancelled) {
          setIsPurchased(false);
          setPurchaseLoading(false);
        }
        return;
      }

      setPurchaseLoading(true);
      const ok = await ConciergeService.checkPurchase(user.id, plan.id);

      if (!cancelled) {
        setIsPurchased(ok);
        setPurchaseLoading(false);
      }
    };

    syncPurchaseState();

    return () => {
      cancelled = true;
    };
  }, [plan, user, authLoading]);

  const loadPlan = async () => {
    setLoading(true);
    const data = await ConciergeService.getPlanDetail(id);
    setPlan(data);
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
    if (result.success) {
      toast.success('Giornata sbloccata. Benvenuto.');
      setPurchaseLoading(true);
      const ok = await ConciergeService.checkPurchase(user.id, id);
      setIsPurchased(ok);
      setPurchaseLoading(false);
    }
    setIsBuying(false);
  };

  /* ── Loading screen ───────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center gap-5">
      <motion.div
        className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <MapPin size={20} weight="fill" className="text-orange-500" />
      </motion.div>
      <div className="w-16 h-[1.5px] bg-zinc-100 overflow-hidden rounded-full">
        <motion.div
          className="h-full bg-zinc-900"
          initial={{ x: '-100%' }} animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        />
      </div>
      <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-300">Caricamento</p>
    </div>
  );

  if (!plan) return null;

  const creatorName = plan.creator
    ? (`${plan.creator.nome || ''} ${plan.creator.cognome || ''}`).trim() || plan.creator.nickname
    : 'Resident Desideri';
  const slots = Array.isArray(plan.slots) ? plan.slots : [];

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F9F9F7] text-zinc-900 pb-[250px]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ╔══ NAV ══════════════════════════════════════════╗ */}
      <nav
        style={{ backgroundColor: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        className="fixed top-0 inset-x-0 z-[1000] px-5 h-14 flex items-center justify-between"
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform"
          style={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }}
        >
          <CaretLeft size={17} weight="bold" style={{ color: 'white' }} />
        </button>

        <p style={{ color: 'white' }} className="text-[10px] font-black uppercase tracking-[0.3em] truncate max-w-[50%] text-center">
          {plan.title_it}
        </p>

        <div className="w-9 h-9" /> {/* spacer */}
      </nav>

      {/* ╔══ HERO — Clean, no parallax ═════════════════════╗ */}
      <div className="relative h-[55vw] min-h-[240px] max-h-[380px] w-full overflow-hidden bg-zinc-900 mt-14">
        <img
          src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'}
          className="w-full h-full object-cover"
          alt={plan.title_it}
        />
        {/* Gradient scrim */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.75) 100%)'
        }} />

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5">
          <div className="flex items-center gap-1.5 text-white mb-2">
            <MapPin size={11} weight="fill" className="text-orange-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-80">{plan.city}, Puglia</span>
          </div>
          <h1
            className="text-[2rem] font-black leading-[0.9] text-white lowercase first-letter:uppercase"
            style={{ letterSpacing: '-0.03em', textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}
          >
            {plan.title_it}
          </h1>
        </div>
      </div>

      {/* ╔══ MAIN CONTENT ══════════════════════════════════╗ */}
      <main className="px-4 pt-4 space-y-6 max-w-xl mx-auto">

        {/* ── Creator + rating card ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
          className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm border border-zinc-100"
        >
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <CreatorAvatar src={plan.creator?.avatar_url} name={creatorName} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                <CheckCircle size={11} weight="fill" className="text-orange-500" />
              </div>
            </div>
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-0.5">Locator Verificato</p>
              <p className="text-[13px] font-black text-zinc-900 leading-none">{creatorName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-full">
            <Star size={11} weight="fill" className="text-orange-400" />
            <span className="text-[12px] font-black text-zinc-800">{(plan.rating_avg || 4.9).toFixed(1)}</span>
          </div>
        </motion.div>

        {/* ── Itinerary section ─────────────────────────── */}
        {isPurchased ? (
          <div className="space-y-5">

            <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
              <p className="text-[13px] text-zinc-600 font-medium leading-relaxed italic mb-4">{plan.description_it}</p>
              <div className="flex flex-wrap gap-2">
                {plan.season && <Pill className="bg-zinc-50 border-zinc-100 text-zinc-500"><Sun size={9} weight="fill" className="text-orange-400" /> {seasonLabels[plan.season]}</Pill>}
                {plan.target_audience && <Pill className="bg-zinc-50 border-zinc-100 text-zinc-500"><Users size={9} weight="fill" className="text-orange-400" /> {targetLabels[plan.target_audience]}</Pill>}
                {!!slots.length && <Pill className="bg-zinc-50 border-zinc-100 text-zinc-500"><Timer size={9} weight="fill" className="text-orange-400" /> {slots.length} tappe</Pill>}
              </div>
            </div>

            {/* Weather Toggle — clearly labeled */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black text-zinc-900 uppercase tracking-wide">Piano del Giorno</p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5 flex items-center gap-1">
                    <Info size={10} />
                    Passa al Piano B in caso di pioggia
                  </p>
                </div>
                <button
                  onClick={() => setIsRainMode(v => !v)}
                  className={`flex items-center gap-2 h-9 px-4 rounded-full border font-black text-[9px] uppercase tracking-[0.15em] transition-all duration-300 ${
                    isRainMode
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isRainMode
                      ? <motion.span key="r" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}><CloudRain size={13} weight="duotone" /></motion.span>
                      : <motion.span key="s" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}><Sun size={13} weight="duotone" /></motion.span>
                    }
                  </AnimatePresence>
                  {isRainMode ? 'Piano B' : 'Sole'}
                </button>
              </div>

              {/* Timeline — clear numbered steps */}
              <div className="px-4 pb-4 space-y-3">
                {slots.map((slot, i) => {
                  const showAlt = isRainMode && slot.alt_activity_title_it;
                  return (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                        showAlt ? 'border-blue-100 bg-blue-50/50' : 'border-zinc-100 bg-zinc-50/50'
                      }`}
                    >
                      <div className="p-3.5">
                        {/* step header */}
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 ${showAlt ? 'bg-blue-500' : 'bg-zinc-900'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">
                              {showAlt ? '☂ Piano B' : slot.time_label || `Tappa ${i + 1}`}
                            </span>
                            {slot.time_label && !showAlt && (
                              <span className="flex items-center gap-1 text-[9px] text-zinc-400 font-medium">
                                <Clock size={9} />
                                {slot.time_label}
                              </span>
                            )}
                          </div>
                        </div>

                        <AnimatePresence mode="wait">
                          {showAlt ? (
                            <motion.div key="alt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <h4 className="text-[15px] font-black text-blue-900 mb-1 leading-snug">{slot.alt_activity_title_it}</h4>
                              <p className="text-[12px] text-blue-700/60 leading-relaxed">{slot.alt_activity_description_it}</p>
                            </motion.div>
                          ) : (
                            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <h4 className="text-[15px] font-black text-zinc-900 mb-1 leading-snug">{slot.activity_title_it}</h4>
                              <p className="text-[12px] text-zinc-500 leading-relaxed">{slot.activity_description_it}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`, '_blank')}
                          className={`mt-3 w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${
                            showAlt ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-white'
                          }`}
                        >
                          <NavigationArrow size={12} weight="duotone" />
                          Apri in Mappe
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {!slots.length && (
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5">
                    <p className="text-[12px] font-black text-zinc-800 mb-1">Itinerario in aggiornamento</p>
                    <p className="text-[12px] text-zinc-500 leading-relaxed">
                      Le tappe non sono disponibili in questo momento. Ho lasciato il piano visibile, ma va ricaricato o ripubblicato dal database.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Radar v5 ────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden bg-zinc-950 border border-white/[0.06] shadow-xl">
              <div className="relative p-5">
                <div className="absolute inset-0 opacity-30" style={{
                  background: 'radial-gradient(ellipse 80% 60% at 110% -10%, rgba(249,115,22,0.3), transparent)'
                }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Sparkle size={14} weight="fill" className="text-orange-500" />
                      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500">Radar Movida</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ boxShadow: '0 0 6px rgba(34,197,94,0.9)' }} />
                      <span className="text-[7px] font-black uppercase tracking-[0.3em] text-green-400">Live</span>
                    </div>
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Vibe Attuale</p>
                  <h3 className="text-[2rem] font-black text-white leading-none mb-5 uppercase" style={{ letterSpacing: '-0.04em' }}>
                    {vibeStatus}
                  </h3>
                  <div className="flex gap-[3px] items-end h-5 mb-4">
                    {Array.from({ length: 16 }).map((_, i) => {
                      const isActive = i < vibeLevel;
                      const height = `${40 + (i / 15) * 60}%`;
                      return (
                        <motion.div
                          key={i}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: 0.4 + i * 0.025 }}
                          className="flex-1 rounded-full origin-bottom"
                          style={{
                            height,
                            background: isActive ? `rgba(249,115,22,${0.6 + (i / 15) * 0.4})` : 'rgba(255,255,255,0.06)',
                          }}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[7px] font-medium text-zinc-600 text-center uppercase tracking-[0.4em]">
                    Resident Puglia Network · Real-Time
                  </p>
                </div>
              </div>
            </div>

            {/* Footer signature */}
            <div className="py-8 flex flex-col items-center gap-3 opacity-30">
              <div className="w-6 h-[1px] bg-zinc-500" />
              <p className="text-[7px] font-black uppercase tracking-[0.6em] text-zinc-500">Desideri Puglia · Private Club</p>
            </div>

          </div>

        ) : (
          /* ── Lock / Preview ────────────────────────────── */
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">

            {/* Description card */}
            <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
              <p className="text-[13px] text-zinc-600 font-medium leading-relaxed italic mb-4">{plan.description_it}</p>
              <div className="flex flex-wrap gap-2">
                {plan.season && <Pill className="bg-zinc-50 border-zinc-100 text-zinc-500"><Sun size={9} weight="fill" className="text-orange-400" /> {seasonLabels[plan.season]}</Pill>}
                {plan.target_audience && <Pill className="bg-zinc-50 border-zinc-100 text-zinc-500"><Users size={9} weight="fill" className="text-orange-400" /> {targetLabels[plan.target_audience]}</Pill>}
                {plan.slots?.length && <Pill className="bg-zinc-50 border-zinc-100 text-zinc-500"><Timer size={9} weight="fill" className="text-orange-400" /> {plan.slots.length} tappe</Pill>}
              </div>
            </div>

            {/* Blur preview */}
            {plan.slots?.[0] && (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-100 bg-white">
                <div className="p-4">
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-400 block mb-2">Anteprima</span>
                  <h4 className="text-[16px] font-black text-zinc-900 mb-1 blur-[5px] select-none">{plan.slots[0].activity_title_it}</h4>
                  <p className="text-[12px] text-zinc-400 blur-[4px] select-none leading-relaxed line-clamp-2">{plan.slots[0].activity_description_it}</p>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/60 backdrop-blur-[2px]">
                  <div className="w-9 h-9 rounded-2xl bg-zinc-950 flex items-center justify-center shadow-lg">
                    <LockKey size={16} weight="duotone" className="text-white" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Sblocca per vedere</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Tappe', value: plan.slots?.length || 5 },
                { label: 'Locali', value: plan.slots?.length ? `${plan.slots.length}` : '—' },
                { label: 'Piano B', value: 'Incluso' }
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-3.5 border border-zinc-100 text-center shadow-sm">
                  <p className="text-[15px] font-black text-zinc-900">{s.value}</p>
                  <p className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

          </motion.div>
        )}

      </main>

      {/* ╔══ BOTTOM CTA ════════════════════════════════════╗ */}
      <AnimatePresence>
        {!isPurchased && !purchaseLoading && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-[68px] inset-x-0 z-50 px-4 pb-3 pt-3"
            style={{ background: 'linear-gradient(to top, rgba(249,249,247,1) 60%, rgba(249,249,247,0))' }}
          >
            <div className="bg-white rounded-2xl p-3.5 flex items-center justify-between shadow-[0_6px_40px_rgba(0,0,0,0.12)] border border-zinc-100">
              <div className="pl-1">
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-0.5">Esperienza Completa</p>
                <p className="text-[22px] font-black text-zinc-950" style={{ letterSpacing: '-0.04em' }}>€{plan.price?.toFixed(2)}</p>
              </div>
              <motion.button
                onClick={handlePurchase}
                disabled={isBuying}
                whileTap={{ scale: 0.95 }}
                className="h-12 px-7 bg-zinc-950 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.25em] flex items-center gap-2 shadow-xl shadow-zinc-900/30 disabled:opacity-60"
              >
                {isBuying ? <span className="opacity-60">...</span> : <><CreditCard size={15} weight="duotone" /> Sblocca</>}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PlanDetail;
