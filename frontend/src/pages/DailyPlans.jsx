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

const Pill = ({ children, className = '', active = false }) => (
  <span 
    className={`inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded-full border transition-all duration-300 ${className} ${
      active 
      ? 'bg-accent text-white border-accent shadow-sm' 
      : 'bg-surface text-text-muted border-border-default hover:border-accent/50'
    }`}
  >
    {children}
  </span>
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
    <div className="min-h-screen bg-[#FCFAF2] pb-32 font-sans selection:bg-accent/30 overflow-x-hidden">
      {/* ========== NAV ========== */}
      <nav className="fixed top-0 inset-x-0 z-[100] px-6 h-20 flex items-center justify-between bg-[#FCFAF2]/80 backdrop-blur-md border-b border-black/5">
        <button 
          onClick={() => navigate(-1)} 
          className="w-11 h-11 rounded-full bg-white border border-zinc-200 flex items-center justify-center active:scale-95 transition-all shadow-sm"
        >
          <CaretLeft size={22} weight="bold" className="text-text-primary" />
        </button>
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold">Marketplace</span>
            <span className="text-[14px] font-serif font-black italic">I Tuoi Piani</span>
        </div>
        <div className="w-11 h-11 bg-accent/10 rounded-full flex items-center justify-center text-accent">
          <Sparkle size={24} weight="fill" />
        </div>
      </nav>

      <main className="pt-32 px-5 max-w-lg mx-auto">
        {/* Header - Notebook Style */}
        <header className="mb-16 relative">
             <div className="absolute -top-10 -right-4 text-5xl opacity-10 rotate-12 pointer-events-none">🗺️</div>
             
             <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-block bg-accent-gold/10 px-3 py-1 mb-6 -rotate-1"
             >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold">Concierge Privato</span>
             </motion.div>

             <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[42px] font-serif font-black text-text-primary leading-[1.1] mb-6 tracking-tight italic"
             >
                Esplora la <br/>
                <span className="relative">
                    Puglia Vera.
                    <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="absolute left-0 bottom-1 w-full h-4 bg-accent/10 -z-10 origin-left -rotate-1"
                    />
                </span>
             </motion.h2>

             <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[16px] text-text-muted font-medium leading-relaxed font-serif italic max-w-[90%] opacity-80"
             >
                Itinerari d'eccellenza curati dai migliori locator locali. <br/>
                <span className="underline decoration-accent/30 underline-offset-4">Esperienze autentiche</span>, sbloccabili in un tap.
             </motion.p>
        </header>

        {/* Filters - Tabs / Washi Tape */}
        <section className="mb-16 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="relative group">
              <MagnifyingGlass size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-accent" weight="bold" />
              <select 
                className="w-full h-14 pl-14 pr-8 bg-white border border-black/5 rounded-sm text-[11px] font-black appearance-none shadow-sm outline-none focus:ring-2 focus:ring-accent/10 transition-all uppercase tracking-widest text-text-primary"
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              >
                <option value="">Tutta la Puglia</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute top-0 right-0 h-full w-12 flex items-center justify-center pointer-events-none opacity-30">
                <CaretLeft size={16} weight="bold" className="-rotate-90" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5"
          >
            {seasons.map((s, i) => {
              const isActive = filters.season === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setFilters(prev => ({ ...prev, season: prev.season === s.value ? '' : s.value }))}
                  className={`shrink-0 h-10 px-5 flex items-center gap-2 rounded-sm border-b-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    isActive 
                    ? 'bg-accent/15 border-accent text-accent translate-y-px' 
                    : 'bg-white border-black/5 text-text-muted hover:border-accent/40'
                  }`}
                  style={{ transform: i % 2 === 0 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)' }}
                >
                  {s.label}
                </button>
              );
            })}
          </motion.div>
        </section>

        {/* Plans List - Postcard Collection */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {[1, 2].map(i => (
                <div key={i} className="aspect-[4/5] w-full bg-white border border-black/5 shadow-sm rounded-sm animate-pulse" />
              ))}
            </motion.div>
          ) : plans.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center py-20 px-10 bg-white/50 border border-dashed border-black/10 rounded-sm"
            >
              <div className="w-20 h-20 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent/10">
                <MagnifyingGlass size={32} weight="light" className="text-accent/40" />
              </div>
              <h3 className="text-xl font-serif font-black text-text-primary mb-3 italic">Pagina Vuota...</h3>
              <p className="text-[14px] text-text-muted font-medium font-serif italic opacity-60">
                Il nostro concierge sta cercando nuove avventure. <br/>Prova a cambiare i tuoi filtri.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-16"
            >
              {plans.map((plan, idx) => {
                const rotation = idx % 2 === 0 ? '-1.5deg' : '1.5deg';
                return (
                  <motion.div
                    key={plan.id}
                    variants={item}
                    onClick={() => navigate(`/plan/${plan.id}`)}
                    className="group"
                  >
                    <div 
                      className="bg-white p-3 pb-12 shadow-[0_15px_45px_rgba(0,0,0,0.06)] border border-black/5 flex flex-col transition-all duration-500 cursor-pointer relative"
                      style={{ transform: `rotate(${rotation})` }}
                    >
                      {/* Washi Tape */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-7 bg-accent/10 -translate-y-3 rotate-1 z-30 pointer-events-none" />

                      {/* Image Area */}
                      <div className="aspect-[4/4] overflow-hidden relative mb-8 rounded-[2px]">
                        <img 
                          src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                          className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                          alt={plan.title_it}
                        />
                        <div className="absolute inset-0 bg-accent-gold/5 opacity-50" />
                        
                        {/* Price Stamp */}
                        <div className="absolute top-5 right-5 z-20">
                            <div className="w-16 h-16 bg-white border-4 border-dashed border-accent-gold/20 flex flex-col items-center justify-center rotate-12 shadow-md">
                                <span className="text-[8px] font-black uppercase tracking-widest text-accent-gold/60 mb-1 leading-none">Price</span>
                                <span className="text-[16px] font-black text-text-primary leading-none">€{plan.price.toFixed(0)}</span>
                            </div>
                        </div>

                        {/* City Badge - Sticker */}
                        <div className="absolute bottom-5 left-5 z-20">
                            <div className="bg-black/80 backdrop-blur-md px-4 py-1.5 flex items-center gap-2 rounded-sm border border-white/20">
                                <MapPin size={12} weight="fill" className="text-accent" />
                                <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">{plan.city}</span>
                            </div>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="px-5">
                        <div className="flex items-center gap-3 mb-4 opacity-70">
                           <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest">
                                <Calendar size={12} weight="fill" className="text-accent-gold" /> 
                                {seasonLabels[plan.season] || plan.season}
                           </div>
                           <div className="w-1 h-1 rounded-full bg-zinc-300" />
                           <div className="text-[9px] font-black uppercase tracking-widest">
                                {(plan.rating_avg || 4.9).toFixed(1)} Rating
                           </div>
                        </div>
                        
                        <h3 className="text-[30px] font-serif font-black text-text-primary leading-[1.1] mb-8 tracking-tight italic group-hover:text-accent transition-colors">
                          {plan.title_it}
                        </h3>

                        <div className="flex items-center justify-between pt-6 border-t border-black/5">
                           <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full overflow-hidden border border-black/5 bg-zinc-50">
                                    <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-text-muted mb-0.5">Creato da</p>
                                    <p className="text-[12px] font-serif font-black italic text-text-primary leading-none">
                                        {plan.creator?.nome} {plan.creator?.cognome?.charAt(0)}.
                                    </p>
                                </div>
                           </div>
                           
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent group-hover:gap-4 transition-all">
                                Esplora <ArrowRight size={16} weight="bold" />
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Post-it Notes (Social Proof) */}
                    <div className="relative mt-2 px-6 flex justify-end">
                         <div className="bg-white px-4 py-2 shadow-sm border border-black/5 -rotate-2 -translate-y-4 z-10 flex items-center gap-2">
                            <Users size={14} className="text-accent-gold" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                                {plan.purchases_count || 0} clubber hanno svelato questo segreto
                            </span>
                         </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="py-24 flex flex-col items-center gap-6 opacity-40">
          <div className="w-12 h-[2px] bg-accent/20" />
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-500 text-center leading-relaxed">
            Marketplace Esclusivo <br/> 
            <span className="font-serif italic font-black text-[12px] lowercase tracking-normal">Desideri Puglia Club © 2026</span>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default DailyPlans;
