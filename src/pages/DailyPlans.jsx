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
  ArrowRight
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const audiences = [
    { value: 'tutti', label: 'Tutti' },
    { value: 'coppie', label: 'Coppie' },
    { value: 'famiglie', label: 'Famiglie' },
    { value: 'giovani', label: 'Giovani' }
  ];

  useEffect(() => {
    loadPlans();
  }, [filters]);

  const loadPlans = async () => {
    setLoading(true);
    const data = await ConciergeService.getDailyPlans(filters);
    setPlans(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] pb-24 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F9F9F7]/80 backdrop-blur-xl border-b border-black/5 p-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Concierge Marketplace</h1>
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-black/5">
          <Sparkle size={20} weight="fill" className="text-orange-500" />
        </div>
      </header>

      <main className="pt-28 px-6 max-w-lg mx-auto">
        <div className="mb-10">
          <h2 className="text-4xl font-serif font-bold text-slate-900 leading-tight mb-2">Piani di Giornata</h2>
          <p className="text-sm text-slate-500 font-medium">Itinerari esclusivi curati dai creator locali.</p>
        </div>

        {/* Search & Filters */}
        <section className="mb-10 space-y-4">
          <div className="relative">
            <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              className="w-full h-14 pl-12 pr-6 bg-white border border-black/5 rounded-2xl text-sm font-bold appearance-none shadow-sm outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            >
              <option value="">Tutta la Puglia</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {seasons.map(s => (
              <button
                key={s.value}
                onClick={() => setFilters(prev => ({ ...prev, season: prev.season === s.value ? '' : s.value }))}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                  filters.season === s.value 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-400 border-black/5'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        {/* Plans Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-6"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-[4/3] w-full bg-slate-200 animate-pulse rounded-[2.5rem]" />
              ))}
            </motion.div>
          ) : plans.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-center py-20 px-10"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-black/5">
                <MagnifyingGlass size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-400 mb-2">Nessun piano trovato</h3>
              <p className="text-sm text-slate-400">Prova a cambiare i filtri di ricerca.</p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 gap-8"
            >
              {plans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => navigate(`/plan/${plan.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl mb-4">
                    <img 
                      src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={plan.title_it}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    
                    {/* Badge Price */}
                    <div className="absolute top-6 right-6">
                      <div className="bg-white/20 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-xl">
                        <span className="text-xs font-black text-white">€{plan.price.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 p-8 w-full">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-orange-500/30">
                          {plan.city}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] font-black text-white/50 uppercase tracking-widest">
                           <Calendar size={12} weight="fill" /> {plan.season}
                        </div>
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-white mb-2 leading-tight">
                        {plan.title_it}
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/10 p-0.5">
                          <img src={plan.creator?.foto_profilo || '/logo.png'} className="w-full h-full object-cover rounded-full" alt="" />
                        </div>
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{plan.creator?.nickname || 'Local Creator'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-2 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Users size={16} /> {plan.target_audience}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sparkle size={16} className="text-orange-500" /> {plan.rating_avg > 0 ? plan.rating_avg.toFixed(1) : 'New'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-orange-500 font-black text-[10px] uppercase tracking-widest group-hover:gap-3 transition-all">
                      Scopri di più <ArrowRight size={14} weight="bold" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DailyPlans;
