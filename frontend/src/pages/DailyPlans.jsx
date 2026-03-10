import { ArrowRight, CaretLeft, Sparkle, MapPin, Compass, Timer, Users, Sun, CloudSnow } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConciergeService } from '../services/concierge';

/* ────────────────────────────────────────────────────────────
   SCRAPBOOK HELPERS
────────────────────────────────────────────────────────────── */

// Deterministic slight rotation per card for scrapbook feel
const getRotation = (id = '') => {
  const n = id.charCodeAt(0) + id.charCodeAt(1 % id.length || 0);
  const rotations = [-2, -1.5, -1, 0.5, 1, 1.5, 2];
  return rotations[n % rotations.length];
};

// Tape colors (CSS-in-JSX)
const TAPE_COLORS = ['#f5e6aa', '#aacdf5', '#f5b8aa', '#b8f5aa', '#dbaaf5'];
const getTapeColor = (id = '') => TAPE_COLORS[id.charCodeAt(0) % TAPE_COLORS.length];

// Colored tag accents
const TAG_PALETTES = [
  { bg: '#FFF3E0', text: '#E65100' },
  { bg: '#E3F2FD', text: '#0D47A1' },
  { bg: '#F3E5F5', text: '#6A1B9A' },
  { bg: '#E8F5E9', text: '#1B5E20' },
  { bg: '#FCE4EC', text: '#880E4F' },
];
const getTagPalette = (idx) => TAG_PALETTES[idx % TAG_PALETTES.length];

/* ────────────────────────────────────────────────────────────
   POLAROID PLAN CARD
────────────────────────────────────────────────────────────── */
const PlanCard = ({ plan, navigate, index }) => {
  const rotation = getRotation(plan.id || String(index));
  const tapeColor = getTapeColor(plan.id || String(index));
  const chips = plan.tags || ['Autentico', 'Locale'];
  const steps = plan.steps_count || '5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: rotation }}
      whileInView={{ opacity: 1, y: 0, rotate: rotation }}
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ rotate: 0, scale: 1.02, zIndex: 10 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="cursor-pointer relative"
      style={{ transformOrigin: 'center center' }}
      onClick={() => navigate(`/plan/${plan.id}`)}
    >
      {/* Tape strip at top */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-6 rounded-sm opacity-80 z-10"
        style={{ background: tapeColor, filter: 'blur(0.3px)' }}
      />

      {/* Polaroid frame */}
      <div className="bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] p-3 pb-5 rounded-sm">
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden mb-4 bg-zinc-100">
          <img
            src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=800'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt={plan.title_it}
            loading="lazy"
          />
          {/* City badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            <MapPin size={9} weight="fill" className="text-orange-500" />
            <span className="text-[9px] font-black uppercase tracking-wide text-zinc-700">{plan.city || 'Puglia'}</span>
          </div>
          {/* Steps pill */}
          <div className="absolute top-2.5 right-2.5 bg-zinc-950/80 text-white px-2 py-1 rounded-full flex items-center gap-1">
            <Timer size={9} />
            <span className="text-[9px] font-black">{steps} tappe</span>
          </div>
        </div>

        {/* Text area — handwritten feel */}
        <div className="px-1">
          {/* Tags row */}
          <div className="flex flex-wrap gap-1 mb-2">
            {chips.slice(0, 2).map((chip, i) => {
              const { bg, text } = getTagPalette(i + index);
              return (
                <span
                  key={chip}
                  className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={{ background: bg, color: text }}
                >
                  {chip}
                </span>
              );
            })}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-black text-zinc-900 leading-snug mb-1 line-clamp-2" style={{ fontFamily: "'Georgia', serif", letterSpacing: '-0.01em' }}>
            {plan.title_it}
          </h3>

          {/* Description — caption style */}
          <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 italic mb-3">
            {plan.description_it || 'Un percorso autentico attraverso la Puglia più vera.'}
          </p>

          {/* Bottom row */}
          <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5">
            <div className="flex items-center gap-1.5">
              {plan.creator?.avatar_url ? (
                <img src={plan.creator.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[8px] font-black text-orange-500">
                  {(plan.creator?.nome || 'L')[0]}
                </div>
              )}
              <span className="text-[9px] text-zinc-400 font-medium">{plan.creator?.nome || 'Local Expert'}</span>
            </div>
            <div className="flex items-center gap-1 text-orange-500">
              <span className="text-[9px] font-black uppercase tracking-wide">Apri</span>
              <ArrowRight size={11} weight="bold" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ────────────────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────────────────── */
const DailyPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ city: '', targetAudience: '', season: '' });

  const types = [
    { value: 'Coppie', label: '👩‍❤️‍👨 Coppia' },
    { value: 'Famiglie', label: '👨‍👩‍👧 Famiglia' },
    { value: 'Amici', label: '🍻 Amici' },
    { value: 'Solo', label: '🎒 Solo' },
    { value: 'Lusso', label: '✨ Premium' },
  ];

  useEffect(() => {
    const t = setTimeout(() => loadPlans(), 300);
    return () => clearTimeout(t);
  }, [filters, searchTerm]);

  const loadPlans = async () => {
    setLoading(true);
    const data = await ConciergeService.getDailyPlans({ ...filters, city: searchTerm || filters.city });
    setPlans(data || []);
    setLoading(false);
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => setSearchTerm('Bari'));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4EC] overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Cork board texture overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/cream-paper.png")` }}
      />

      {/* ────── HEADER ────── */}
      <header className="sticky top-0 z-[100] bg-[#F8F4EC]/95 backdrop-blur-xl border-b border-black/[0.05] px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center bg-white border border-black/5 rounded-full shadow-sm active:scale-90 transition-transform"
          >
            <CaretLeft size={18} weight="bold" className="text-zinc-800" />
          </button>

          <div className="text-center">
            {/* Scrapbook-style title with stamp feel */}
            <div className="relative inline-block">
              <div className="absolute -inset-1.5 border-2 border-zinc-800/10 rounded-sm rotate-[-0.5deg]" />
              <h1 className="relative text-[20px] font-black uppercase tracking-[0.15em] text-zinc-900" style={{ fontFamily: "'Georgia', serif" }}>
                Daily Journal
              </h1>
            </div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.4em] mt-0.5">Puglia · Collection 2026</p>
          </div>

          <div className="w-9" /> {/* spacer */}
        </div>

        {/* Search row */}
        <div className="flex items-center gap-2 max-w-lg mx-auto mb-3">
          <div className="relative flex-1">
            <MapPin size={16} weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cerca la tua prossima tappa..."
              className="w-full h-10 pl-9 pr-4 bg-white border border-black/[0.06] rounded-full text-[13px] text-zinc-800 italic outline-none focus:border-orange-400/50 shadow-sm placeholder:text-zinc-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleLocationClick}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white border border-black/[0.06] rounded-full text-zinc-500 hover:text-orange-500 transition-colors shadow-sm active:scale-90"
          >
            <Compass size={18} weight="bold" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 max-w-lg mx-auto">
          {types.map(t => (
            <button
              key={t.value}
              onClick={() => setFilters(prev => ({ ...prev, targetAudience: prev.targetAudience === t.value ? '' : t.value }))}
              className={`flex-shrink-0 px-3.5 h-8 rounded-full text-[10px] font-black uppercase tracking-wide transition-all whitespace-nowrap ${
                filters.targetAudience === t.value
                  ? 'bg-zinc-900 text-white shadow-md'
                  : 'bg-white border border-black/[0.06] text-zinc-600 shadow-sm'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ────── MAIN CONTENT ────── */}
      <main className="relative z-[1] px-4 pt-6 pb-24 max-w-2xl mx-auto">

        <AnimatePresence mode="wait">
          {loading ? (
            /* Skeleton */
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-5 mt-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white shadow-md p-3 pb-5 rounded-sm">
                    <div className="aspect-[4/3] bg-zinc-200 rounded-sm mb-4" />
                    <div className="h-3 bg-zinc-200 rounded-full mb-2 w-2/3" />
                    <div className="h-2.5 bg-zinc-100 rounded-full w-full mb-1" />
                    <div className="h-2.5 bg-zinc-100 rounded-full w-3/4" />
                  </div>
                </div>
              ))}
            </motion.div>

          ) : plans.length === 0 ? (
            /* Empty */
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-[22px] font-black italic text-zinc-900 mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                Nessuna tappa trovata
              </h2>
              <p className="text-[13px] text-zinc-400 mb-6">Prova a rimuovere i filtri</p>
              <button
                onClick={() => { setSearchTerm(''); setFilters({ city: '', targetAudience: '', season: '' }); }}
                className="px-8 h-11 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg"
              >
                Rimuovi filtri
              </button>
            </motion.div>

          ) : (
            /* Cards grid — masonry-like 2-col scrapbook */
            <motion.div
              key={searchTerm + filters.targetAudience}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-x-4 gap-y-10 pt-4"
            >
              {plans.map((plan, index) => (
                <PlanCard key={plan.id} plan={plan} navigate={navigate} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer note */}
        {!loading && plans.length > 0 && (
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16 pt-8 border-t border-black/[0.05]"
          >
            {/* Rubber stamp feel */}
            <div className="inline-block border-2 border-zinc-900/10 rounded-sm px-6 py-3 rotate-[-1deg]">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-400">Fine Archivio · Rev. J</p>
              <p className="text-[11px] font-black text-zinc-300 italic mt-0.5" style={{ fontFamily: "'Georgia', serif" }}>
                Desideri Puglia Club
              </p>
            </div>
          </motion.footer>
        )}
      </main>
    </div>
  );
};

export default DailyPlans;
