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
      className="group cursor-pointer bg-white/30 backdrop-blur-sm border border-black/[0.02] p-6 md:p-14 mb-24 hover:shadow-[0_60px_100px_rgba(0,0,0,0.06)] transition-all duration-1000 relative overflow-hidden"
      onClick={() => navigate(`/plan/${plan.id}`)}
    >
      {/* Editorial Decorative Details */}
      <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-accent/5 pointer-events-none" />
      <div className="absolute top-8 right-8 text-[10px] font-black uppercase tracking-[0.6em] text-accent/20 rotate-90 origin-right translate-x-12 translate-y-4">
        Archive Item №{plan.id?.slice(0,4)}
      </div>
      
      <div className="flex flex-col lg:flex-row gap-12 md:gap-20 items-stretch">
        {/* Visual Portion (Cinematic Panoramic Frame - Responsive) */}
        <div className="w-full lg:w-[60%] relative px-4 lg:px-0">
          <div className="aspect-[4/3] lg:aspect-[16/9] overflow-hidden shadow-2xl p-1 bg-white relative transition-all duration-1000 group-hover:shadow-3xl">
              <div className="w-full h-full relative overflow-hidden border border-black/5">
                <img 
                    src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
                    alt={plan.title_it}
                />
              </div>
          </div>
        </div>

        {/* Text Portion (The Narrative Flow) */}
        <div className="w-full lg:w-[40%] flex flex-col justify-center">
          {/* 1. Città */}
          <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-[1px] bg-accent/30" />
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-accent opacity-60">{plan.city}</span>
          </div>

          <div className="space-y-8">
              {/* 2. Categoria */}
              <div className="flex flex-wrap gap-2">
                 {chips.map(chip => <ExperienceChip key={chip} label={chip} />)}
              </div>
              
              {/* 3. Titolo & 4. Payoff */}
              <div className="space-y-5">
                  <h3 className="text-[34px] md:text-[54px] font-serif font-black text-text-primary leading-[0.9] tracking-tighter italic">
                      {plan.title_it}
                  </h3>
                  <div className="w-20 h-1.5 bg-accent-gold/20" />
                  <p className="text-[16px] md:text-[18px] text-text-primary/70 font-serif italic leading-relaxed max-w-xl indent-6">
                      {plan.description_it || "Un percorso sartoriale attraverso gli angoli più segreti della nostra terra, per scoprire ciò che i libri non dicono."}
                  </p>
              </div>

              {/* 5. Dettagli Esperienza */}
              <div className="flex flex-wrap gap-4 py-6 border-y border-black/[0.04]">
                  <div className="flex items-center gap-3">
                      <Timer size={16} weight="bold" className="text-accent/40" />
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black text-text-primary uppercase tracking-wider">{duration}</span>
                          <span className="text-[8px] font-black text-text-muted/30 uppercase tracking-widest">Lettura</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 border-x border-black/[0.04] px-4">
                      <BookOpen size={16} weight="bold" className="text-accent/40" />
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black text-text-primary uppercase tracking-wider">{steps}</span>
                          <span className="text-[8px] font-black text-text-muted/30 uppercase tracking-widest">Percorso</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <Sparkle size={16} weight="bold" className="text-accent/40" />
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black text-text-primary uppercase tracking-wider">{explorations}</span>
                          <span className="text-[8px] font-black text-text-muted/30 uppercase tracking-widest">Popolarità</span>
                      </div>
                  </div>
              </div>

              {/* 6. Autore & 7. CTA */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-10 pt-4">
                  <div className="flex items-center gap-4">
                      <div className="relative">
                          <div className="w-12 h-12 rounded-full border border-black/5 overflow-hidden group-hover:scale-105 transition-transform">
                              <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover" alt="" />
                          </div>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent/40">Curata da</span>
                          <span className="text-[18px] font-serif font-black italic text-text-primary">{plan.creator?.nome || 'Local Expert'}</span>
                      </div>
                  </div>

                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log("Navigating to:", `/plan/${plan.id}`);
                        navigate(`/plan/${plan.id}`);
                    }}
                    className="flex items-center gap-4 group/btn bg-text-primary text-white pl-8 pr-4 h-14 rounded-full shadow-xl hover:bg-accent transition-all duration-700 active:scale-95 group-hover:translate-x-3"
                  >
                      <span className="text-[11px] font-black uppercase tracking-[0.3em]">ENTRA</span>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-accent transition-all">
                          <ArrowRight size={20} weight="bold" />
                      </div>
                  </button>
              </div>
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
    { value: 'Coppie', label: '👩‍❤️‍👨 In Coppia' },
    { value: 'Famiglie', label: '👨‍👩‍👧‍👦 In Famiglia' },
    { value: 'Amici', label: '🍻 Con Amici' },
    { value: 'Solo', label: '🎒 In Solitaria' },
    { value: 'Lusso', label: '✨ Puglia Premium' }
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

            <div className="max-w-2xl mx-auto space-y-5">
                {/* Search Pills & Input */}
                <div className="flex items-center gap-2.5">
                    <div className="relative flex-1 group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-accent/30 group-focus-within:text-accent transition-colors">
                            <MapPin size={20} weight="bold" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Cerca la tua prossima tappa..."
                            className="w-full h-12 pl-12 pr-6 bg-white border border-black/[0.03] rounded-full text-[14px] font-serif italic text-text-primary outline-none focus:border-accent/40 shadow-sm transition-all placeholder:text-text-muted/40"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleLocationClick}
                        className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white border border-black/[0.03] rounded-full text-accent hover:bg-accent hover:text-white transition-all shadow-sm group"
                        title="Usa la mia posizione"
                    >
                        <Compass size={22} weight="bold" className="group-hover:rotate-90 transition-transform duration-700" />
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
            <p className="font-serif italic font-black text-[22px] text-text-primary opacity-30 italic">Desideri Puglia Club — Collection 2026 / Rev. G</p>
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
