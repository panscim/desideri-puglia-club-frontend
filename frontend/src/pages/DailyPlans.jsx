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
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] grayscale contrast-150 z-[1000]" 
           style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/linen-paper.png")` }} />

      {/* ========== NAV ========== */}
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 h-20 flex items-center justify-between border-b border-black/[0.03] bg-[#FCFAF2]/80 backdrop-blur-md">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center hover:scale-110 active:scale-90 transition-all text-text-primary"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <div className="flex flex-col items-center">
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-accent/60 mb-0.5">Archive</span>
            <span className="text-[15px] font-serif font-black italic tracking-tight">Esplora Piani</span>
        </div>
        <div className="w-10 h-10 flex items-center justify-center text-accent">
          <Sparkle size={24} weight="fill" />
        </div>
      </nav>

      <main className="pt-36 px-6 max-w-lg mx-auto relative z-10">
        
        {/* Header - Editorial Style */}
        <header className="mb-24 relative">
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-12 -left-4 w-24 h-24 border border-accent/10 rounded-full flex items-center justify-center -rotate-12 pointer-events-none"
             >
                <div className="w-20 h-20 border border-dashed border-accent/20 rounded-full" />
                <span className="absolute text-[8px] font-black uppercase tracking-widest text-accent/40 text-center">Premium<br/>Collection</span>
             </motion.div>

             <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[48px] font-serif font-black text-text-primary leading-[1] mb-8 tracking-tighter italic"
             >
                Le Giornate <br/>
                <span className="text-accent underline decoration-accent/20 underline-offset-[12px]">Perfette.</span>
             </motion.h2>

             <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[17px] text-text-muted font-medium leading-relaxed font-serif italic max-w-[95%] opacity-70"
             >
                Una collezione curata di segreti pugliesi. <br/>
                Ogni piano è un capitolo di un viaggio senza tempo.
             </motion.p>
        </header>

        {/* Filters - Minimal Washi Style */}
        <section className="mb-24 flex flex-col gap-8">
          <div className="relative group">
            <MagnifyingGlass size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-accent/60" weight="bold" />
            <select 
              className="w-full h-14 pl-14 pr-8 bg-transparent border-b border-black/10 text-[12px] font-black uppercase tracking-widest text-text-primary outline-none focus:border-accent transition-colors"
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            >
              <option value="">Destinazioni</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-20 pointer-events-none">
                <CaretLeft size={14} weight="bold" className="-rotate-90" />
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {seasons.map((s) => {
              const isActive = filters.season === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setFilters(prev => ({ ...prev, season: prev.season === s.value ? '' : s.value }))}
                  className={`shrink-0 h-9 px-6 flex items-center rounded-sm text-[10px] font-black uppercase tracking-widest transition-all relative ${
                    isActive 
                    ? 'text-accent' 
                    : 'text-text-muted opacity-50 hover:opacity-100'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                        layoutId="activeFilter"
                        className="absolute inset-x-0 -bottom-1 h-[3px] bg-accent/20 rounded-full"
                    />
                  )}
                  {s.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Plans List - Artifact Collection */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="space-y-16 py-10">
              {[1, 2].map(i => (
                <div key={i} className="aspect-[3/4] w-full bg-white/50 animate-pulse border border-black/[0.03]" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center py-24 flex flex-col items-center gap-6"
            >
              <div className="w-1 h-20 bg-accent/10" />
              <h3 className="text-2xl font-serif font-black text-text-primary italic">Nessun capitolo trovato.</h3>
              <p className="text-[15px] text-text-muted font-serif italic opacity-60">Il diario è ancora da scrivere per questi filtri.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-32"
            >
              {plans.map((plan, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <motion.div
                    key={plan.id}
                    variants={item}
                    onClick={() => navigate(`/plan/${plan.id}`)}
                    className={`relative flex flex-col ${isEven ? 'items-start' : 'items-end'}`}
                  >
                    {/* Marginalia Note */}
                    <div className={`absolute -top-12 ${isEven ? 'right-0' : 'left-0'} max-w-[120px] pointer-events-none`}>
                        <p className={`text-[12px] font-serif italic text-text-muted/40 leading-tight ${isEven ? 'text-right' : 'text-left'}`}>
                            {idx === 0 ? "Scelto dai nostri esperti per te." : idx === 1 ? "Un'avventura autentica." : "Segreti da svelare."}
                        </p>
                    </div>

                    <div className="w-[90%] group cursor-pointer relative">
                      
                      {/* Authenticity Stamp */}
                      <Stamp text={plan.city + " Verified"} className={`absolute -top-8 ${isEven ? '-right-6' : '-left-6'} z-30`} />

                      {/* Main Card Artifact */}
                      <div className="bg-white p-4 pb-14 shadow-[0_30px_90px_rgba(0,0,0,0.04)] border border-black/[0.03] flex flex-col relative">
                        
                        {/* Museum Mount Image Area */}
                        <div className="aspect-[3/4] overflow-hidden relative mb-10 bg-zinc-50 p-2 border border-black/[0.02]">
                            <div className="w-full h-full overflow-hidden relative grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000">
                                <img 
                                    src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                    alt={plan.title_it}
                                />
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            </div>
                            
                            {/* Category Washi Tape */}
                            <div className="absolute top-4 left-4 z-20">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-accent/20 -rotate-2 scale-110" />
                                    <span className="relative bg-white/90 backdrop-blur-sm px-3 py-1 text-[8px] font-black uppercase tracking-[0.3em] text-accent border border-accent/10">
                                        {plan.target_audience || 'Exclusive'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="px-2">
                             <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-accent-gold">
                                    <Star size={12} weight="fill" />
                                    {(plan.rating_avg || 4.9).toFixed(1)}
                                </div>
                                <div className="w-[1px] h-3 bg-black/10" />
                                <div className="text-[9px] font-black uppercase tracking-widest text-text-muted/60">
                                    Archive No. {plan.id.slice(0, 4)}
                                </div>
                             </div>

                             <h3 className="text-[34px] font-serif font-black text-text-primary leading-[1] mb-10 tracking-tighter italic group-hover:text-accent transition-colors">
                                {plan.title_it}
                             </h3>

                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-full border border-black/[0.05] overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                                        <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover" alt="" />
                                     </div>
                                     <span className="text-[14px] font-serif font-black italic opacity-60">{plan.creator?.nome || 'Expert'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[18px] font-serif font-black italic text-text-primary">€{plan.price.toFixed(0)}</span>
                                    <p className="text-[7px] font-black uppercase tracking-widest text-text-muted mt-0.5">Sblocco</p>
                                </div>
                             </div>
                        </div>

                        <LineDetails />
                      </div>

                      {/* Social Proof Decoration */}
                      <div className={`mt-6 flex ${isEven ? 'justify-start' : 'justify-end'}`}>
                         <div className="flex items-center gap-3 opacity-30 group-hover:opacity-60 transition-opacity">
                            <Users size={16} weight="light" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{plan.purchases_count || 0} Membri Hanno Visitato</span>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="py-32 flex flex-col items-center gap-8 relative">
          <div className="w-1 h-12 bg-accent/20" />
          <div className="text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.6em] text-accent/40 mb-4">Fine Collezione</p>
             <p className="font-serif italic font-black text-[13px] text-text-muted">Desideri Puglia Club — Private Archive</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default DailyPlans;
