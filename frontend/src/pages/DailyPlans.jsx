import { ArrowRight, CaretLeft, Sparkle, Star, MapPin, Compass, Timer, BookOpen, Users } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConciergeService } from '../services/concierge';

/* ── Luxe Editorial Components ────────────────────────────── */

const PaperTexture = () => (
  <div className="fixed inset-0 pointer-events-none opacity-[0.03] grayscale contrast-150 z-[1]" 
       style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/linen-paper.png")` }} />
);

const ExperienceChip = ({ label }) => (
  <span className="px-3 py-1 bg-black/[0.03] border border-black/[0.05] rounded-full text-[9px] font-black uppercase tracking-widest text-text-muted/60">
    {label}
  </span>
);

const PlanCard = ({ plan, navigate }) => {
  // Simulating metadata for editorial depth
  const duration = plan.duration || "8 min";
  const steps = plan.steps_count || "5 tappe";
  const explorations = "1.2k esplorazioni";
  const chips = plan.tags || ["Storia", "Food", "Autentico"];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="group cursor-pointer bg-white/40 backdrop-blur-sm border border-black/[0.03] p-6 md:p-12 mb-24 hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-1000 relative overflow-hidden"
      onClick={() => navigate(`/plan/${plan.id}`)}
    >
      {/* Editorial Decorative Corner */}
      <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-accent/10 pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row gap-12 md:gap-20">
        {/* Visual Portion (The Cover) */}
        <div className="w-full lg:w-[42%] relative">
          <div className="aspect-[3/4] overflow-hidden shadow-2xl border-[15px] border-white relative group-hover:border-white/80 transition-all duration-1000">
              <img 
                  src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  alt={plan.title_it}
              />
              <div className="absolute inset-0 bg-black/[0.02]" />
          </div>
          {/* Deckled Edge Location Tag */}
          <div className="absolute -bottom-6 -left-6 bg-accent text-white px-6 py-3 shadow-2xl rotate-[-3deg] flex flex-col items-start translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
              <span className="text-[7px] font-black uppercase tracking-[0.4em] opacity-60 mb-0.5 whitespace-nowrap">Destinazione</span>
              <span className="text-[12px] font-black uppercase tracking-widest whitespace-nowrap">{plan.city}</span>
          </div>
        </div>

        {/* Text Portion (The Feature) */}
        <div className="w-full lg:w-[58%] flex flex-col justify-center space-y-10">
          <div className="space-y-6">
              <div className="flex flex-wrap gap-2 mb-2">
                 {chips.map(chip => <ExperienceChip key={chip} label={chip} />)}
              </div>
              
              <div className="space-y-4">
                  <h3 className="text-[42px] md:text-[64px] font-serif font-black text-text-primary leading-[1] tracking-tighter italic group-hover:text-accent transition-colors duration-700">
                      {plan.title_it}
                  </h3>
                  <p className="text-[18px] md:text-[22px] text-text-primary/80 font-serif italic leading-relaxed max-w-xl">
                      {plan.description_it || "Un itinerario curato dai nostri esperti locali per farti vivere l'anima più autentica della Puglia."}
                  </p>
              </div>
          </div>

          {/* Value Metadata Layer */}
          <div className="flex flex-wrap gap-8 py-6 border-y border-black/[0.05]">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/5 flex items-center justify-center text-accent/60">
                      <Timer size={18} weight="bold" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[12px] font-black text-text-primary uppercase tracking-wider">{duration}</span>
                      <span className="text-[8px] font-black text-text-muted/40 uppercase tracking-widest">Lettura</span>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/5 flex items-center justify-center text-accent/60">
                      <BookOpen size={18} weight="bold" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[12px] font-black text-text-primary uppercase tracking-wider">{steps}</span>
                      <span className="text-[8px] font-black text-text-muted/40 uppercase tracking-widest">Percorso</span>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/5 flex items-center justify-center text-accent/60">
                      <Sparkle size={18} weight="bold" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[12px] font-black text-text-primary uppercase tracking-wider">{explorations}</span>
                      <span className="text-[8px] font-black text-text-muted/40 uppercase tracking-widest">Popolarità</span>
                  </div>
              </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
              {/* Refined Creator Badge */}
              <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden relative group-hover:scale-110 transition-transform">
                      <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-serif italic font-black text-accent opacity-80 decoration-accent/20 underline underline-offset-4">Curata da</span>
                      <span className="text-[19px] font-serif font-black italic text-text-primary">{plan.creator?.nome || 'Local Expert'}</span>
                  </div>
              </div>

              <button className="flex items-center gap-6 group/btn bg-text-primary text-white pl-10 pr-4 h-14 rounded-full shadow-2xl hover:bg-accent transition-all duration-500 active:scale-95 group-hover:translate-x-2">
                  <span className="text-[12px] font-black uppercase tracking-[0.2em]">Esplora l'Itinerario</span>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-accent transition-all">
                      <ArrowRight size={20} weight="bold" />
                  </div>
              </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DailyPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    targetAudience: '',
    season: ''
  });

  const types = [
    { value: 'Coppie', label: 'In Coppia' },
    { value: 'Famiglie', label: 'In Famiglia' },
    { value: 'Amici', label: 'Con Amici' },
    { value: 'Solo', label: 'In Solitaria' },
    { value: 'Lusso', label: 'Puglia Premium' }
  ];

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadPlans();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [filters, searchTerm]);

  const loadPlans = async () => {
    setLoading(true);
    const data = await ConciergeService.getDailyPlans({ ...filters, city: searchTerm || filters.city });
    setPlans(data || []);
    setLoading(false);
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setSearchTerm('Bari'); // Simulated nearest city
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF2] selection:bg-accent/30 overflow-x-hidden relative">
      <PaperTexture />

      {/* Compact Luxe Header */}
      <header className="sticky top-0 z-[1000] bg-[#FCFAF2]/95 backdrop-blur-xl border-b border-black/[0.03] pt-6 pb-8">
        <div className="container mx-auto px-6 md:px-12">
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={() => navigate(-1)} 
                    className="w-12 h-12 flex items-center justify-center hover:bg-black/5 rounded-full transition-all text-text-primary"
                >
                    <CaretLeft size={28} weight="bold" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.8em] text-accent/40 mb-1">Archive de Luxe</span>
                    <h1 className="text-[22px] font-serif font-black italic tracking-tighter uppercase">Daily Journal</h1>
                </div>
                <div className="w-12" />
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Search Pills & Input */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-accent/30 group-focus-within:text-accent transition-colors">
                            <MapPin size={22} weight="bold" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Cerca la tua prossima tappa..."
                            className="w-full h-14 pl-16 pr-8 bg-white border border-black/[0.03] rounded-full text-[15px] font-serif italic text-text-primary outline-none focus:border-accent/40 shadow-sm transition-all placeholder:text-text-muted/40"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleLocationClick}
                        className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-white border border-black/[0.03] rounded-full text-accent hover:bg-accent hover:text-white transition-all shadow-sm group"
                        title="Usa la mia posizione"
                    >
                        <Compass size={24} weight="bold" className="group-hover:rotate-90 transition-transform duration-700" />
                    </button>
                </div>

                {/* Itinerary Type Filters (Cleaner) */}
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar justify-center pt-2">
                    {types.map(t => (
                        <button 
                            key={t.value}
                            onClick={() => setFilters(prev => ({ ...prev, targetAudience: prev.targetAudience === t.value ? '' : t.value }))}
                            className={`px-6 h-10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filters.targetAudience === t.value ? 'bg-accent-gold text-white shadow-xl shadow-accent-gold/30' : 'bg-white/40 border border-black/5 text-text-muted hover:border-accent-gold/40'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </header>

      <main className="container mx-auto px-6 md:px-12 lg:px-24 pt-6 pb-32">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="py-32 flex flex-col items-center">
                 <motion.div 
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="relative w-20 h-20 mb-10"
                 >
                    <div className="absolute inset-0 border-2 border-dashed border-accent/20 rounded-full" />
                    <Sparkle size={32} weight="fill" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent/10" />
                 </motion.div>
                 <span className="text-[12px] font-serif italic text-text-muted tracking-widest uppercase opacity-40">Consultando l'Archivio</span>
            </div>
          ) : plans.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
              <h2 className="text-[36px] md:text-[52px] font-serif font-black text-text-primary italic tracking-tight opacity-10 mb-10">
                  Capitolo non rintracciato.
              </h2>
              <button 
                  onClick={() => { setSearchTerm(''); setFilters({ city: '', targetAudience: '', season: '' }); }}
                  className="px-12 h-14 bg-accent text-white text-[12px] font-black uppercase tracking-widest rounded-full shadow-2xl hover:scale-105 transition-all"
              >
                  Torna all'Indice
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key={searchTerm + filters.targetAudience}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-7xl mx-auto"
            >
                {plans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} navigate={navigate} />
                ))}
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center pt-20 border-t border-black/[0.03]">
            <p className="text-[11px] font-black uppercase tracking-[1em] text-accent/20 mb-4">Finis Terrae</p>
            <p className="font-serif italic font-black text-[22px] text-text-primary opacity-30 italic">Desideri Puglia Club — Collection 2026</p>
        </footer>
      </main>

      {/* Decorative Ink Stamp */}
      <div className="fixed bottom-12 left-12 z-0 opacity-[0.03] rotate-[-8deg] pointer-events-none select-none hidden 2xl:block">
           <div className="w-56 h-56 border-8 border-dashed border-accent/40 rounded-full flex flex-col items-center justify-center text-accent font-black uppercase tracking-[0.3em] text-[14px]">
                <span className="mb-2">Official</span>
                <span className="text-[20px] mb-2">Heritage</span>
                <span>Archive</span>
           </div>
      </div>
    </div>
  );
};

export default DailyPlans;
