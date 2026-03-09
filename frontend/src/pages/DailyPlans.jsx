import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConciergeService } from '../services/concierge';
import { 
  MapPin, 
  CaretLeft, 
  Sparkle, 
  Users, 
  Calendar, 
  CurrencyEur, 
  MagnifyingGlass,
  ArrowRight,
  Star,
  CheckCircle,
  TrendUp
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

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
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { 
      duration: 1, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  }
};

/* ── Sophisticated Elements ─────────────────────────────────── */
const VerticalIndex = ({ text, side = 'left' }) => (
  <div className={`fixed ${side === 'left' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 z-[50] pointer-events-none hidden md:block`}>
    <span className="text-[10px] font-black uppercase tracking-[0.8em] text-accent/20 [writing-mode:vertical-lr] rotate-180">
      {text}
    </span>
  </div>
);

const NumberAnchor = ({ num }) => (
  <div className="absolute -top-16 -left-12 text-[180px] font-serif font-black italic text-black/[0.03] leading-none pointer-events-none select-none z-0">
    {num < 10 ? `0${num}` : num}
  </div>
);

const Stamp = ({ text, className = '' }) => (
  <div className={`w-16 h-16 rounded-full border-2 border-dashed border-accent/20 flex items-center justify-center -rotate-12 opacity-40 select-none ${className}`}>
    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-accent text-center leading-tight">
      {text.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
    </span>
  </div>
);

const LineDetails = () => (
  <svg className="absolute -bottom-4 -right-2 w-24 h-8 opacity-10 pointer-events-none" viewBox="0 0 100 30" fill="none">
    <path d="M5 25C20 22 40 28 95 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M10 20C25 18 45 22 85 20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const DailyPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    season: '',
    targetAudience: ''
  });

  const cities = ['Barletta', 'Bari', 'Trani', 'Andria', 'Polignano a Mare', 'Monopoli'];
  const seasons = [
    { value: 'tutto_anno', label: 'Tutto l\'anno' },
    { value: 'primavera', label: 'Primavera' },
    { value: 'estate', label: 'Estate' },
    { value: 'autunno', label: 'Autunno' },
    { value: 'inverno', label: 'Inverno' }
  ];

  const seasonLabels = {
    tutto_anno: 'Tutto l\'anno',
    primavera: 'Primavera',
    estate: 'Estate',
    autunno: 'Autunno',
    inverno: 'Inverno'
  };

  useEffect(() => {
    loadPlans();
  }, [filters]);

  const loadPlans = async () => {
    setLoading(true);
    const [data] = await Promise.all([
      ConciergeService.getDailyPlans(filters),
      new Promise(resolve => setTimeout(resolve, 800))
    ]);
    setPlans(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FCFAF2] pb-32 font-sans selection:bg-accent/30 overflow-x-hidden relative">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] grayscale contrast-150 z-[2000]" 
           style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/linen-paper.png")` }} />

      {/* ========== NAV ========== */}
      <nav className="fixed top-0 inset-x-0 z-[1000] px-6 h-20 flex items-center justify-between border-b border-black/[0.03] bg-[#FCFAF2]/80 backdrop-blur-md">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center hover:scale-110 active:scale-90 transition-all text-text-primary"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <div className="flex flex-col items-center">
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-accent/60 mb-0.5">Registry</span>
            <span className="text-[15px] font-serif font-black italic tracking-tight uppercase">Daily Ledger</span>
        </div>
        <div className="w-10 h-10 flex items-center justify-center text-accent">
          <Sparkle size={24} weight="fill" />
        </div>
      </nav>

      <VerticalIndex text="Puglia Private Archive" side="left" />
      <VerticalIndex text="Curated Travel Collection" side="right" />

      <main className="pt-44 px-6 md:px-24 max-w-4xl mx-auto relative z-10">
        
        {/* Header - Editorial Minimalism */}
        <header className="mb-44 relative">
             <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-12 flex items-center gap-4 overflow-hidden"
             >
                <div className="w-12 h-px bg-accent/30" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">Collezione 2026</span>
             </motion.div>

             <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[64px] md:text-[84px] font-serif font-black text-text-primary leading-[0.85] mb-12 tracking-tighter italic"
             >
                Momenti <br/>
                <span className="text-accent underline decoration-accent/10 underline-offset-[20px]">Eterni.</span>
             </motion.h2>

             <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[18px] md:text-[22px] text-text-muted font-medium leading-[1.5] font-serif italic max-w-xl opacity-60"
             >
                Un registro curato di avventure senza tempo. <br/>
                Oltre la superficie, nel cuore della Puglia.
             </motion.p>
        </header>

        {/* Filters - Linear & Clean */}
        <section className="mb-44 flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-black/[0.05] pb-12">
          <div className="flex-1 max-w-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-text-muted/40 mb-4 px-1">Destinazione</p>
            <div className="relative group">
                <select 
                    className="w-full h-12 bg-transparent text-[14px] font-black uppercase tracking-widest text-text-primary outline-none cursor-pointer"
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                >
                    <option value="">Tutti i Territori</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                    <CaretLeft size={16} weight="bold" className="-rotate-90" />
                </div>
            </div>
          </div>

          <div className="flex gap-10 overflow-x-auto scrollbar-hide">
            {seasons.map((s) => {
              const isActive = filters.season === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setFilters(prev => ({ ...prev, season: prev.season === s.value ? '' : s.value }))}
                  className={`shrink-0 flex flex-col items-start gap-2 group transition-all ${
                    isActive ? 'opacity-100' : 'opacity-30 hover:opacity-100'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">{s.label}</span>
                  <div className={`h-[3px] rounded-full bg-accent transition-all duration-500 ${isActive ? 'w-full' : 'w-0 group-hover:w-6'}`} />
                </button>
              );
            })}
          </div>
        </section>

        {/* Plans List - The Ledger Spread */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="space-y-44 py-10">
              {[1, 2].map(i => (
                <div key={i} className="flex flex-col md:flex-row gap-16 animate-pulse">
                    <div className="w-full md:w-1/2 aspect-[4/5] bg-black/[0.02]" />
                    <div className="w-full md:w-1/2 space-y-6 pt-12">
                        <div className="h-4 w-24 bg-black/[0.02]" />
                        <div className="h-16 w-full bg-black/[0.02]" />
                        <div className="h-24 w-full bg-black/[0.02]" />
                    </div>
                </div>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center py-44 flex flex-col items-center gap-10"
            >
              <div className="w-px h-32 bg-accent/20" />
              <h3 className="text-[32px] font-serif font-black text-text-primary italic tracking-tight text-center">
                Nuovi capitoli in fase di <br/> redazione.
              </h3>
              <p className="text-[17px] text-text-muted font-serif italic opacity-40">Modifica i filtri per svelare altri archivi.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-64"
            >
              {plans.map((plan, idx) => {
                const isOdd = idx % 2 !== 0;
                return (
                  <motion.div
                    key={plan.id}
                    variants={item}
                    onClick={() => navigate(`/plan/${plan.id}`)}
                    className={`relative flex flex-col ${isOdd ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 md:gap-24 items-center group cursor-pointer`}
                  >
                    <NumberAnchor num={idx + 1} />

                    {/* Image Column - The Spread Photo */}
                    <div className="w-full md:w-[55%] relative">
                        <div className={`aspect-[4/5] overflow-hidden relative shadow-[0_50px_100px_rgba(0,0,0,0.06)] grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 ${isOdd ? 'translate-y-12' : ''}`}>
                            <img 
                                src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                                className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
                                alt={plan.title_it}
                            />
                            {/* Gradient Reveal */}
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </div>
                        
                        {/* Floating Metadata (Marginalia) */}
                        <div className={`absolute -bottom-8 ${isOdd ? '-left-8' : '-right-8'} z-20 pointer-events-none`}>
                            <div className="bg-white/95 backdrop-blur-md p-6 border border-black/[0.03] shadow-2xl flex flex-col gap-1 min-w-[140px]">
                                <span className="text-[7px] font-black uppercase tracking-[0.4em] text-accent/60">Posizione</span>
                                <span className="text-[13px] font-black uppercase tracking-widest text-text-primary">{plan.city}</span>
                            </div>
                        </div>
                    </div>

                    {/* Text Column - Editorial Content */}
                    <div className="w-full md:w-[45%] flex flex-col items-start gap-8 py-10 relative">
                        <div className="flex items-center gap-4">
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-gold">Expertise {idx + 1}</span>
                            <div className="w-8 h-[1px] bg-black/10" />
                        </div>

                        <h3 className="text-[44px] md:text-[54px] font-serif font-black text-text-primary leading-[0.9] tracking-tighter italic group-hover:text-accent transition-colors duration-700">
                            {plan.title_it}
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted/60">
                                <span>{(plan.rating_avg || 4.9).toFixed(1)} Rating</span>
                                <span className="w-1 h-1 rounded-full bg-black/10" />
                                <span>€{plan.price.toFixed(0)} Sblocco</span>
                            </div>
                            <p className="text-[15px] font-serif italic text-text-muted leading-relaxed opacity-60 line-clamp-3">
                                {plan.description_it || "Un'esperienza curata nel dettaglio dai nostri esperti locall."}
                            </p>
                        </div>

                        <div className="flex items-center gap-6 pt-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-black/[0.05] grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[7px] font-black uppercase tracking-widest text-text-muted mb-0.5">Creato da</span>
                                <span className="text-[15px] font-serif font-black italic text-text-primary leading-none">{plan.creator?.nome || 'Expert'}</span>
                            </div>
                        </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="py-64 flex flex-col items-center gap-12 relative overflow-hidden">
          <div className="w-[1px] h-32 bg-accent/20" />
          <div className="text-center space-y-4">
             <p className="text-[11px] font-black uppercase tracking-[0.8em] text-accent/30">End of Ledger</p>
             <p className="font-serif italic font-black text-[15px] text-text-muted opacity-40">Desideri Puglia Club — Private Archive 2026</p>
          </div>
          
          {/* Faded Stamp background */}
          <div className="absolute -bottom-20 rotate-12 text-[120px] font-serif font-black italic text-black/[0.02] select-none pointer-events-none whitespace-nowrap">
             DESIDERI PUGLIA CLUB OFFICIAL ARCHIVE
          </div>
        </footer>
      </main>
    </div>
  );
};

export default DailyPlans;
