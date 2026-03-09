import { ArrowRight, CaretLeft, Sparkle, Star, MapPin, Compass } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConciergeService } from '../services/concierge';

/* ── Serene Scrapbook Components ────────────────────────────── */

const PaperTexture = () => (
  <div className="fixed inset-0 pointer-events-none opacity-[0.03] grayscale contrast-150 z-[1]" 
       style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/linen-paper.png")` }} />
);

const SectionDivider = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-16 h-px bg-black/5" />
    <Sparkle size={12} weight="fill" className="mx-4 text-accent/30" />
    <div className="w-16 h-px bg-black/5" />
  </div>
);

const PlanCard = ({ plan, navigate }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    className="group cursor-pointer bg-white/50 backdrop-blur-sm border border-black/5 p-6 md:p-10 mb-20 hover:shadow-2xl transition-all duration-700 relative overflow-hidden"
    onClick={() => navigate(`/plan/${plan.id}`)}
  >
    {/* Subtle Tactile Accents */}
    <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-accent/10 pointer-events-none" />
    
    <div className="flex flex-col lg:flex-row gap-10 md:gap-16">
      {/* Visual Portion */}
      <div className="w-full lg:w-[45%] relative">
        <div className="aspect-[4/5] overflow-hidden shadow-xl border-[12px] border-white relative">
            <img 
                src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                alt={plan.title_it}
            />
            <div className="absolute inset-0 bg-black/5" />
        </div>
        {/* Handmade Tag */}
        <div className="absolute -bottom-4 -left-4 bg-accent text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-lg rotate-[-2deg]">
            {plan.city}
        </div>
      </div>

      {/* Text Portion */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center space-y-6">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold">
                {plan.target_audience || 'Esperienza Unica'}
            </span>
            <div className="flex items-center gap-1.5 text-accent text-[12px] font-black">
                <Star size={14} weight="fill" />
                {(plan.rating_avg || 4.9).toFixed(1)}
            </div>
        </div>

        <h3 className="text-[36px] md:text-[52px] font-serif font-black text-text-primary leading-[1.1] tracking-tighter italic">
            {plan.title_it}
        </h3>

        <p className="text-[16px] md:text-[18px] text-text-muted font-serif italic leading-relaxed opacity-70">
            {plan.description_it || "Un itinerario curato dai nostri esperti locali per farti vivere l'anima più autentica della Puglia."}
        </p>

        <div className="flex items-center justify-between pt-6 border-t border-black/5">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-black/5 overflow-hidden border border-black/5 grayscale">
                    <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-40">Creatore</span>
                    <span className="text-[15px] font-serif font-black italic text-text-primary">{plan.creator?.nome || 'Expert'}</span>
                </div>
            </div>

            <button className="flex items-center gap-4 group/btn bg-accent text-white px-8 h-12 rounded-full shadow-lg hover:shadow-accent/20 transition-all active:scale-95">
                <span className="text-[11px] font-black uppercase tracking-widest">Scopri</span>
                <ArrowRight size={18} weight="bold" className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  </motion.div>
);

const DailyPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    targetAudience: '',
    season: ''
  });

  const cities = ['Barletta', 'Bari', 'Trani', 'Andria', 'Polignano a Mare', 'Monopoli'];
  const types = [
    { value: 'Coppie', label: 'In Coppia' },
    { value: 'Famiglie', label: 'In Famiglia' },
    { value: 'Amici', label: 'Con Amici' },
    { value: 'Solo', label: 'In Solitaria' },
    { value: 'Lusso', label: 'Puglia Premium' }
  ];

  useEffect(() => {
    loadPlans();
  }, [filters]);

  const loadPlans = async () => {
    setLoading(true);
    const data = await ConciergeService.getDailyPlans(filters);
    setPlans(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FCFAF2] selection:bg-accent/30 overflow-x-hidden relative">
      <PaperTexture />

      {/* Cleaner Header / Filter Control */}
      <header className="sticky top-0 z-[1000] bg-[#FCFAF2]/90 backdrop-blur-md border-b border-black/5 pt-6 pb-8">
        <div className="container mx-auto px-6 md:px-12">
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={() => navigate(-1)} 
                    className="w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-full transition-all text-text-primary"
                >
                    <CaretLeft size={24} weight="bold" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase tracking-[0.6em] text-accent/60 mb-0.5">Desideri Puglia Club</span>
                    <h1 className="text-[20px] font-serif font-black italic tracking-tight uppercase">Daily Journal</h1>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="w-full md:w-auto min-w-[200px] relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40 group-hover:text-accent transition-colors">
                        <MapPin size={18} weight="bold" />
                    </div>
                    <select 
                        className="w-full h-12 pl-12 pr-6 bg-white border border-black/5 rounded-full text-[12px] font-black uppercase tracking-widest text-text-primary outline-none focus:border-accent/40 shadow-sm appearance-none cursor-pointer"
                        value={filters.city}
                        onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                    >
                        <option value="">Tutti i Territori</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="w-full md:w-auto min-w-[200px] relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40 group-hover:text-accent transition-colors">
                        <Compass size={18} weight="bold" />
                    </div>
                    <select 
                        className="w-full h-12 pl-12 pr-6 bg-white border border-black/5 rounded-full text-[12px] font-black uppercase tracking-widest text-text-primary outline-none focus:border-accent/40 shadow-sm appearance-none cursor-pointer"
                        value={filters.targetAudience}
                        onChange={(e) => setFilters(prev => ({ ...prev, targetAudience: e.target.value }))}
                    >
                        <option value="">Tipo di Itinerario</option>
                        {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                {filters.city || filters.targetAudience ? (
                    <button 
                        onClick={() => setFilters({ city: '', targetAudience: '', season: '' })}
                        className="text-[10px] font-black uppercase tracking-widest text-accent/60 hover:text-accent transition-all pb-1 border-b border-accent/20"
                    >
                        Reset
                    </button>
                ) : null}
            </div>
        </div>
      </header>

      <main className="container mx-auto px-6 md:px-24 pt-16 pb-32">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="py-32 flex flex-col items-center">
                 <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex flex-col items-center gap-6"
                 >
                    <Sparkle size={48} weight="fill" className="text-accent/20" />
                    <span className="text-[11px] font-serif italic text-text-muted">Consultando gli archivi...</span>
                 </motion.div>
            </div>
          ) : plans.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center space-y-8"
            >
              <h2 className="text-[32px] md:text-[44px] font-serif font-black text-text-primary italic tracking-tight opacity-20">
                  Nessun racconto <br/> trovato per questa ricerca.
              </h2>
              <button 
                  onClick={() => setFilters({ city: '', targetAudience: '', season: '' })}
                  className="px-10 h-14 bg-accent text-white text-[12px] font-black uppercase tracking-widest rounded-full shadow-xl hover:scale-105 transition-all"
              >
                  Mostra Tutti i Piani
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key={filters.city + filters.targetAudience}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-6xl mx-auto"
            >
                {plans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} navigate={navigate} />
                ))}
            </motion.div>
          )}
        </AnimatePresence>

        <SectionDivider />

        <footer className="text-center pt-16 opacity-30 pointer-events-none">
            <p className="text-[10px] font-black uppercase tracking-[0.8em] text-text-muted mb-4">The End of Record</p>
            <p className="font-serif italic font-black text-[18px] text-text-primary">Desideri Puglia Club — Journal 2026</p>
        </footer>
      </main>

      {/* Decorative Stamp for physical feel */}
      <div className="fixed bottom-12 right-12 z-0 opacity-10 rotate-[-12deg] pointer-events-none select-none hidden lg:block">
           <div className="w-32 h-32 border-4 border-dashed border-accent/40 rounded-full flex items-center justify-center text-accent text-center font-black uppercase tracking-widest text-[10px] leading-tight p-4">
                Private<br/>Expert<br/>Archive
           </div>
      </div>
    </div>
  );
};

export default DailyPlans;
