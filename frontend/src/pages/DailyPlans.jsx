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
    // Artificially wait a bit for that "premium" feeling loader
    const [data] = await Promise.all([
      ConciergeService.getDailyPlans(filters),
      new Promise(resolve => setTimeout(resolve, 800))
    ]);
    setPlans(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary pb-32 font-sans selection:bg-accent/30 transition-colors duration-500">
      {/* ╔══ NAV ══════════════════════════════════════════╗ */}
      <nav 
        className="fixed top-0 inset-x-0 z-[100] px-6 h-16 flex items-center justify-between bg-bg-primary/80 backdrop-blur-lg border-b border-border-default"
      >
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-full bg-surface border border-border-default flex items-center justify-center active:scale-95 transition-all hover:border-accent/30"
        >
          <CaretLeft size={20} weight="bold" className="text-text-primary" />
        </button>
        <p className="overline !text-text-primary !mb-0 !tracking-[0.4em]">Marketplace</p>
        <div className="w-10 h-10 rounded-full flex items-center justify-center">
          <Sparkle size={24} weight="fill" className="text-accent-gold" />
        </div>
      </nav>

      <main className="pt-28 px-5 max-w-lg mx-auto">
        {/* Hero Section */}
        <header className="mb-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-5"
          >
            <div className="h-[1px] w-8 bg-accent" />
            <span className="overline !text-accent !mb-0">Concierge Privato</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[48px] font-serif font-black text-text-primary leading-[1] mb-5 tracking-tight"
          >
            Esplora la <br/>Puglia Vera.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[15px] text-text-muted font-medium leading-relaxed max-w-[90%]"
          >
            Itinerari d'eccellenza curati dai migliori locator locali. Esperienze autentiche, sbloccabili in un tap.
          </motion.p>
        </header>

        {/* ── Search & Filters ─────────────────────────── */}
        <section className="mb-16 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              <MagnifyingGlass size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-accent" weight="bold" />
              <select 
                className="w-full h-16 pl-16 pr-8 bg-surface border border-border-default rounded-pill text-[12px] font-black appearance-none shadow-sm outline-none focus:border-accent transition-all uppercase tracking-widest text-text-primary"
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              >
                <option value="">Tutta la Puglia</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide px-1"
          >
            {seasons.map((s, i) => (
              <button
                key={s.value}
                onClick={() => setFilters(prev => ({ ...prev, season: prev.season === s.value ? '' : s.value }))}
              >
                <Pill active={filters.season === s.value}>
                  {s.label}
                </Pill>
              </button>
            ))}
          </motion.div>
        </section>

        {/* ── Plans Grid ─────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              {[1, 2].map(i => (
                <div key={i} className="aspect-[4/5] w-full bg-zinc-100 animate-pulse rounded-[3rem]" />
              ))}
            </motion.div>
          ) : plans.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center py-24 px-10"
            >
              <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                <MagnifyingGlass size={32} weight="light" className="text-zinc-300" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-2 uppercase tracking-tighter">Nessun piano trovato</h3>
              <p className="text-[13px] text-zinc-400 font-medium tracking-tight">Il nostro concierge sta lavorando a nuove rotte. <br/>Prova a cambiare i filtri.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-12"
            >
              {plans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  variants={item}
                  onClick={() => navigate(`/plan/${plan.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.12)] mb-7 bg-zinc-950 no-theme-flip text-on-image">
                    <img 
                      src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                      alt={plan.title_it}
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.15) 80%, transparent 100%)' }} />
                    
                    {/* Badge Price / Tag */}
                    <div className="absolute top-7 right-7 flex flex-col items-end gap-2">
                      <div className="bg-white/15 backdrop-blur-xl border border-white/20 px-5 py-2.5 rounded-2xl shadow-2xl">
                        <span className="text-[11px] font-black text-white tracking-widest uppercase">€{plan.price.toFixed(0)}</span>
                      </div>
                      {plan.purchases_count > 5 && (
                        <div className="bg-orange-500 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                          <TrendUp size={12} weight="bold" className="text-white" />
                          <span className="text-[8px] font-black text-white uppercase tracking-widest">Popolare</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 p-10 w-full">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="px-4 py-1.5 bg-black/40 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/20 backdrop-blur-md">
                          {plan.city}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">
                           <Calendar size={14} weight="fill" className="text-accent-gold" /> {seasonLabels[plan.season] || plan.season}
                        </div>
                      </div>
                      
                      <h3 className="text-[34px] font-serif font-black text-white leading-[1] mb-8 tracking-tight group-hover:translate-x-1 transition-transform duration-500">
                        {plan.title_it}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-2xl border border-white/30 overflow-hidden bg-white/10 p-0.5 group-hover:border-orange-500/50 transition-colors">
                              <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover rounded-[0.8rem]" alt="" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#f97316' }}>
                              <CheckCircle size={13} weight="fill" style={{ color: 'white' }} />
                            </div>
                          </div>
                          <div>
                            <p className="text-[7.5px] font-black uppercase tracking-[0.3em] text-white/60 mb-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>Creato da</p>
                            <p className="text-[13px] font-black text-white leading-none tracking-tight" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                              {plan.creator?.nome} {plan.creator?.cognome?.charAt(0)}.
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end mb-1">
                            {[1].map(s => (
                              <Star key={s} size={12} weight="fill" className="text-orange-500" />
                            ))}
                            <span className="text-[13px] font-black text-white ml-0.5">{(plan.rating_avg || 4.9).toFixed(1)}</span>
                          </div>
                          <p className="text-[7.5px] font-black uppercase tracking-[0.2em] text-white/60 italic" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>Global Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subtle Sub-Footer for Social Proof */}
                  <div className="px-6 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-5 text-text-muted text-[10px] font-black uppercase tracking-[0.25em]">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-primary bg-bg-secondary" />
                          ))}
                        </div>
                        <span>
                           Sbloccato da {plan.purchases_count || 0} clubber
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-accent font-black text-[10px] uppercase tracking-[0.25em] group-hover:gap-5 transition-all duration-500">
                      Svela itinerario <ArrowRight size={16} weight="bold" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Signature */}
        <footer className="py-24 flex flex-col items-center gap-5 opacity-40">
          <div className="w-10 h-[1px] bg-zinc-400" />
          <p className="text-[8px] font-black uppercase tracking-[0.6em] text-zinc-500 text-center leading-relaxed">
            Marketplace Esclusivo <br/> Desideri Puglia Club © 2026
          </p>
        </footer>
      </main>
    </div>
  );
};

export default DailyPlans;
