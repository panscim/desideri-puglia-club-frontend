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
  const heroScale    = useTransform(scrollY, [0, 400], [1.0, 1.05]);

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

  if (loading) return (
    <div className="min-h-screen bg-[#FCFAF2] flex flex-col items-center justify-center gap-10">
      <motion.div 
        className="w-16 h-16 rounded-full bg-white border border-black/5 shadow-sm flex items-center justify-center"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <MapPin size={24} weight="fill" className="text-accent" />
      </motion.div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-accent/40 animate-pulse">Svelando il diario...</p>
    </div>
  );

  if (!plan) return null;

  const creatorName = plan.creator
    ? (`${plan.creator.nome || ''} ${plan.creator.cognome || ''}`).trim() || plan.creator.nickname
    : 'Resident Desideri';

  return (
    <div className="min-h-screen bg-[#FCFAF2] text-text-primary pb-44 overflow-x-hidden font-sans">

      {/* ========== NAV ========== */}
      <nav className="fixed top-0 inset-x-0 z-[1000] px-5 h-20 flex items-center justify-between bg-[#FCFAF2]/80 backdrop-blur-md border-b border-black/5">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-white border border-zinc-200 flex items-center justify-center active:scale-95 transition-all shadow-sm"
        >
          <CaretLeft size={22} weight="bold" className="text-text-primary" />
        </button>

        <div className="flex flex-col items-center text-center max-w-[50%]">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent-gold truncate w-full mb-0.5">
            {plan.city}
          </p>
          <p className="text-[14px] font-serif font-black italic truncate w-full leading-none">
            {plan.title_it}
          </p>
        </div>

        <div className="w-11 h-11 bg-accent/10 rounded-full flex items-center justify-center text-accent">
            <Sparkle size={24} weight="fill" />
        </div>
      </nav>

      {/* ========== HERO PHOTO ========== */}
      <div className="relative pt-32 px-5 mb-16">
        <motion.div 
            initial={{ rotate: -1, y: 20 }}
            animate={{ rotate: -1, y: 0 }}
            className="relative aspect-[4/5] w-full bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-black/5 rounded-[2px]"
        >
            {/* Washi Tape */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-accent/15 backdrop-blur-sm -translate-y-4 rotate-2 z-20 pointer-events-none" />
            
            <div className="w-full h-full overflow-hidden relative rounded-[1px]">
                <motion.img
                    style={{ scale: heroScale }}
                    src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'}
                    className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
                    alt={plan.title_it}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Badge Rating on Photo */}
                <div className="absolute bottom-6 left-6 flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-sm">
                    <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10} weight={(plan.rating_avg || 4.9) >= s ? 'fill' : 'regular'} className="text-accent" />
                        ))}
                    </div>
                    <span className="text-white text-[10px] font-black">{(plan.rating_avg || 4.9).toFixed(1)}</span>
                </div>
            </div>
        </motion.div>

        {/* Floating City Sticker */}
        <motion.div 
            initial={{ scale: 0, rotate: 15 }}
            animate={{ scale: 1, rotate: 12 }}
            className="absolute -bottom-6 -right-2 z-30 bg-black text-white px-6 py-2.5 rounded-sm shadow-xl flex items-center gap-2 border border-white/20"
        >
            <MapPin size={14} weight="fill" className="text-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{plan.city}</span>
        </motion.div>
      </div>

      <main className="px-6 space-y-12 max-w-lg mx-auto">
        
        {/* Title & Lore */}
        <header className="text-center relative py-4">
             <div className="absolute -top-10 left-0 text-6xl opacity-10 -rotate-12 pointer-events-none italic font-serif">"</div>
             <h1 className="text-[44px] font-serif font-black leading-[1] mb-8 text-text-primary tracking-tight italic">
                {plan.title_it}
             </h1>
             <p className="text-[17px] text-text-muted font-medium leading-[1.6] italic font-serif opacity-80 mb-8 max-w-[90%] mx-auto">
                "{plan.description_it}"
             </p>
             <div className="w-12 h-[2px] bg-accent-gold/20 mx-auto" />
        </header>

        {/* Locator Card - ID Badge Style */}
        <motion.div
          initial={{ opacity: 0, y: 10, rotate: -0.5 }}
          animate={{ opacity: 1, y: 0, rotate: -0.5 }}
          className="bg-white p-6 flex flex-col items-center shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-black/5 relative overflow-hidden"
        >
          {/* Header Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-accent/20" />
          
          <div className="flex items-center gap-6 w-full">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-[4px] border border-black/5 overflow-hidden p-1 bg-zinc-50 rotate-1">
                {plan.creator?.avatar_url
                    ? <img src={plan.creator.avatar_url} className="w-full h-full object-cover rounded-[2px]" alt={creatorName} />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-black opacity-20 bg-zinc-100">{creatorName[0]}</div>
                }
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-black/5">
                <CheckCircle size={18} weight="fill" className="text-accent" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent-gold mb-1">Local Expert ID</p>
              <p className="text-[20px] font-serif font-black italic text-text-primary leading-tight mb-2 tracking-tight">{creatorName}</p>
              <div className="flex items-center gap-4 pt-3 border-t border-black/5">
                 <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase tracking-widest text-text-muted">Experience</span>
                    <span className="text-[11px] font-black">Resident Locator</span>
                 </div>
                 <div className="w-px h-6 bg-black/5" />
                 <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase tracking-widest text-text-muted">Global Rating</span>
                    <span className="text-[11px] font-black">{(plan.rating_avg || 4.9).toFixed(1)} / 5</span>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Itinerary Flow */}
        {isPurchased ? (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-16 py-8">

            <div className="flex items-center justify-between sticky top-24 z-50 bg-[#FCFAF2]/80 backdrop-blur-md py-4 px-2 -mx-2">
                <div className="relative">
                    <h2 className="text-[22px] font-serif font-black text-text-primary italic relative z-10 px-2">Il Tuo Percorso</h2>
                    <div className="absolute left-0 bottom-1 w-full h-3 bg-accent/10 -z-0 -rotate-1" />
                </div>
                <button
                    onClick={() => setIsRainMode(v => !v)}
                    className={`h-11 px-6 rounded-sm flex items-center gap-3 border-b-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                    isRainMode
                        ? 'bg-accent/20 border-accent text-accent shadow-sm'
                        : 'bg-white border-black/5 text-text-muted hover:border-accent/40 shadow-sm'
                    }`}
                >
                    {isRainMode ? <CloudRain size={18} weight="fill" /> : <Sun size={18} weight="fill" />}
                    {isRainMode ? 'Piano B Attivo' : 'Meteo'}
                </button>
            </div>

            <div className="relative space-y-12 pl-6">
              {/* Hand-drawn Timeline Line */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent/10 border-l border-dashed border-accent/30 rounded-full" />

              {plan.slots?.map((slot, i) => {
                const rotation = i % 2 === 0 ? '-1deg' : '1deg';
                return (
                    <motion.div key={slot.id} variants={item} className="relative group">
                        
                        {/* Bullet Point */}
                        <div className={`absolute -left-[31px] top-6 w-11 h-11 rounded-full flex items-center justify-center border-4 border-[#FCFAF2] shadow-sm transition-colors duration-500 z-10 ${
                            isRainMode ? 'bg-accent text-white' : 'bg-black text-white'
                        }`}>
                            <Clock size={18} weight="bold" />
                        </div>

                        {/* Note Card */}
                        <motion.div 
                            style={{ rotate: rotation }}
                            className={`p-6 rounded-sm border shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-500 relative ${
                                isRainMode && slot.alt_activity_title_it
                                    ? 'bg-accent-gold/5 border-accent-gold/20'
                                    : 'bg-white border-black/5'
                            }`}
                        >
                            {/* Paper Clip / Tape for first few */}
                            {i === 0 && (
                                <div className="absolute -top-4 right-8 w-10 h-10 bg-accent/20 rounded-full -rotate-12 flex items-center justify-center opacity-40">📌</div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent-gold">
                                    {slot.time_label} • Tappa {i + 1}
                                </span>
                                {isRainMode && slot.alt_activity_title_it && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 text-accent rounded-sm">
                                        <CloudRain size={10} weight="fill" />
                                        <span className="text-[8px] font-black uppercase tracking-widest italic">Piano B</span>
                                    </div>
                                )}
                            </div>

                            <AnimatePresence mode="wait">
                                {isRainMode && slot.alt_activity_title_it ? (
                                    <motion.div key="alt" initial={{ opacity:0, x:5 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-5 }}>
                                        <h4 className="text-[22px] font-serif font-black text-text-primary mb-3 italic tracking-tight">
                                            {slot.alt_activity_title_it}
                                        </h4>
                                        <p className="text-[15px] text-text-muted font-medium font-serif leading-relaxed mb-6 italic opacity-80 line-clamp-3">
                                            {slot.alt_activity_description_it}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div key="main" initial={{ opacity:0, x:5 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-5 }}>
                                        <h4 className="text-[22px] font-serif font-black text-text-primary mb-3 italic tracking-tight">
                                            {slot.activity_title_it}
                                        </h4>
                                        <p className="text-[15px] text-text-muted font-medium font-serif leading-relaxed mb-6 italic opacity-80">
                                            {slot.activity_description_it}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`, '_blank')}
                                className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-black/10 rounded-sm text-[10px] font-black uppercase tracking-widest text-text-primary hover:bg-accent/5 transition-all shadow-sm active:scale-95"
                            >
                                <NavigationArrow size={16} weight="fill" className="text-accent" />
                                Esplora la Posizione
                            </button>
                        </motion.div>
                    </motion.div>
                );
              })}
            </div>

            {/* Radar Section - Field Gadget Aesthetic */}
            <motion.div variants={item} className="rounded-sm overflow-hidden bg-black text-white shadow-2xl relative border border-white/10 group">
              {/* LED Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent pointer-events-none" />
              
              <div className="relative p-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent animate-pulse">
                        <Sparkle size={20} weight="fill" />
                    </div>
                    <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 block mb-0.5">Network Live</span>
                        <span className="text-[12px] font-black uppercase tracking-widest text-white italic">Puglia Vibe Radar</span>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-sm bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Attivo</span>
                  </div>
                </div>

                <div className="space-y-2 mb-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60 italic">Status Attuale</p>
                    <h3 className="text-[40px] font-serif font-black italic uppercase leading-none tracking-tight">
                        {vibeStatus}
                    </h3>
                </div>

                {/* Meter Bars */}
                <div className="flex gap-[4px] items-end h-8 mb-10">
                  {Array.from({ length: 18 }).map((_, i) => {
                    const isActive = i < vibeLevel;
                    const height = `${30 + (Math.sin(i * 0.5) * 10) + (i / 17) * 60}%`;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.1 + i * 0.02, ease: "easeOut" }}
                        className="flex-1 rounded-sm origin-bottom"
                        style={{
                          height,
                          background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                          boxShadow: isActive ? '0 -5px 15px var(--accent-gold)' : 'none'
                        }}
                      />
                    );
                  })}
                </div>

                <p className="text-[9px] font-medium text-zinc-500 text-center uppercase tracking-[0.5em] opacity-60 italic">
                    Resident Sensor · 0.4ms Lag · Puglia District
                </p>
              </div>
            </motion.div>

            <footer className="py-20 flex flex-col items-center gap-6 opacity-30">
               <div className="w-12 h-[2px] bg-accent/20" />
               <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-500 text-center leading-relaxed">
                  Club Privato Desideri Puglia <br/>
                  <span className="font-serif italic font-black text-[11px] lowercase tracking-normal">Documento Riservato © 2026</span>
               </p>
            </footer>
          </motion.div>
        ) : (
          /* Locked State - Teaser Diary */
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 py-10">
            <div className="bg-white p-8 border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rotate-1 rounded-sm relative">
                {/* Tape */}
                <div className="absolute -top-3 left-10 w-20 h-6 bg-accent/10 -rotate-2 z-10" />
                
                <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-accent-gold mb-6 pb-2 border-b border-black/5">Nota Introduttiva</h3>
                <p className="text-[16px] text-text-muted font-medium font-serif leading-relaxed italic opacity-80 mb-10">
                    {plan.description_it}
                </p>
                <div className="flex flex-wrap gap-3">
                    {plan.season && (
                        <div className="px-5 py-2.5 bg-zinc-50 rounded-full border border-black/5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                            <Sun size={14} weight="fill" className="text-accent" /> {seasonLabels[plan.season]}
                        </div>
                    )}
                    {plan.target_audience && (
                         <div className="px-5 py-2.5 bg-zinc-50 rounded-full border border-black/5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                            <Users size={14} weight="fill" className="text-accent" /> {targetLabels[plan.target_audience]}
                         </div>
                    )}
                </div>
            </div>

            {/* Blurred Preview Card */}
            {plan.slots?.[0] && (
              <div className="relative bg-white p-6 border border-black/5 shadow-sm -rotate-1 opacity-60 filter blur-[0.6px]">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent-gold block mb-4">Anteprima Tappa 1</span>
                  <h4 className="text-[24px] font-serif font-black text-text-primary mb-3 italic tracking-tight blur-[4px]">
                    {plan.slots[0].activity_title_it}
                  </h4>
                  <p className="text-[15px] font-serif italic text-text-muted leading-relaxed blur-[3px]">
                    {plan.slots[0].activity_description_it}
                  </p>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#FCFAF2]/40 backdrop-blur-[1px] z-20">
                      <div className="w-14 h-14 bg-black rounded-sm flex items-center justify-center shadow-xl rotate-3">
                        <LockKey size={24} weight="fill" className="text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-primary">Contenuto Proibito</span>
                  </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* ========== CTA BAR ========== */}
      <AnimatePresence>
        {!isPurchased && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 inset-x-0 z-50 px-5 pb-10"
          >
            <div className="bg-white/90 backdrop-blur-xl p-5 flex items-center justify-between shadow-[0_-20px_50px_rgba(0,0,0,0.1)] border border-black/5 rounded-sm max-w-lg mx-auto">
              <div className="pl-3">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-text-muted mb-1">Costo Sblocco</p>
                <p className="text-[28px] font-serif font-black italic leading-none text-text-primary">€{plan.price?.toFixed(0)}</p>
              </div>
              <motion.button
                onClick={handlePurchase}
                disabled={isBuying}
                whileTap={{ scale: 0.96 }}
                className="h-16 px-10 bg-black text-white rounded-sm font-black text-[12px] uppercase tracking-[0.25em] flex items-center gap-3 shadow-2xl disabled:opacity-50 transition-all"
              >
                {isBuying ? 'Attendere...' : <>Svela Ora <CreditCard size={18} weight="fill" /></>}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PlanDetail;
