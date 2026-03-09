import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConciergeService } from '../services/concierge';
import { 
  CaretLeft, 
  Sparkle,
  Star,
  MagnifyingGlass,
  Users,
  Timer,
  ArrowRight
} from '@phosphor-icons/react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

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

/* ── Cinematic Editorial Elements ────────────────────────────── */
const Stamp = ({ text, className = '' }) => (
  <div className={`w-20 h-20 rounded-full border-2 border-dashed border-accent/20 flex items-center justify-center -rotate-12 opacity-60 select-none ${className}`}>
    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-accent text-center leading-tight">
      {text.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
    </span>
  </div>
);

const EditorialHeader = ({ filters, setFilters, cities, seasons, navigate }) => (
  <motion.nav 
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    className="fixed top-0 inset-x-0 z-[2000] h-20 px-6 md:px-12 flex items-center justify-between bg-[#FCFAF2]/80 backdrop-blur-xl border-b border-black/[0.03]"
  >
    <div className="flex items-center gap-6">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center hover:scale-110 active:scale-90 transition-all text-text-primary"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <div className="hidden md:flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-accent/60">Journal</span>
            <span className="text-[14px] font-serif font-black italic tracking-tight uppercase">Daily Ledger</span>
        </div>
    </div>

    <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center gap-6 overflow-x-auto">
            {seasons.map(s => (
                <button 
                    key={s.value}
                    onClick={() => setFilters(prev => ({ ...prev, season: prev.season === s.value ? '' : s.value }))}
                    className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${filters.season === s.value ? 'text-accent' : 'text-text-muted/40 hover:text-text-primary'}`}
                >
                    {s.label}
                </button>
            ))}
        </div>
        <div className="h-6 w-px bg-black/5 hidden md:block" />
        <select 
            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-text-primary outline-none cursor-pointer border-b border-black/10 pb-1"
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
        >
            <option value="">Tutti i Territori</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
    </div>
  </motion.nav>
);

const CinematicCard = ({ plan, index, navigate }) => {
    const { scrollYProgress } = useScroll();
    const yImage = useTransform(scrollYProgress, [0, 1], [0, -120]);
    const yContent = useTransform(scrollYProgress, [0, 1], [0, -40]);
    
    return (
        <motion.section 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: "-50px" }}
            className="relative h-screen w-full flex items-center justify-center overflow-hidden mb-0 snap-start"
            onClick={() => navigate(`/plan/${plan.id}`)}
        >
            {/* Parallax Image Background */}
            <motion.div 
                style={{ y: yImage }}
                className="absolute inset-0 z-0 scale-110"
            >
                <img 
                    src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                    className="w-full h-full object-cover grayscale-[0.2] transition-all duration-[1s]"
                    alt={plan.title_it}
                />
                <div className="absolute inset-0 bg-black/20" />
            </motion.div>

            {/* Floating Editorial Vellum Card */}
            <motion.div 
                style={{ y: yContent }}
                className="relative z-20 w-[90%] max-w-lg md:max-w-2xl bg-[#FCFAF2]/95 backdrop-blur-md p-8 md:p-14 shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-white/40 group cursor-pointer"
            >
                {/* Texture Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] grayscale contrast-150" 
                     style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/linen-paper.png")` }} />

                <Stamp text={plan.city + " Verified"} className="absolute -top-10 -right-4 z-30" />

                <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-px bg-accent/30" />
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent/60">Registry {index + 1}</span>
                         </div>
                         <div className="flex items-center gap-1.5 text-accent-gold text-[10px] font-black uppercase tracking-widest">
                            <Star size={14} weight="fill" />
                            {(plan.rating_avg || 4.9).toFixed(1)}
                         </div>
                    </div>

                    <h3 className="text-[42px] md:text-[72px] font-serif font-black text-text-primary leading-[0.9] tracking-tighter italic group-hover:text-accent transition-colors duration-500">
                        {plan.title_it}
                    </h3>

                    <p className="text-[17px] md:text-[20px] text-text-muted font-serif italic leading-relaxed opacity-70 line-clamp-3 md:line-clamp-none">
                        {plan.description_it || "Un'esperienza sensoriale attraverso i segreti più autentici della Puglia, curata dai nostri local experts."}
                    </p>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-6">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-full border border-black/5 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                                <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-widest text-text-muted mb-0.5 opacity-40">Compilato da</span>
                                <span className="text-[18px] font-serif font-black italic text-text-primary leading-none">{plan.creator?.nome || 'Expert'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className="text-[24px] font-serif font-black italic text-text-primary">€{plan.price.toFixed(0)}</span>
                                <p className="text-[8px] font-black uppercase tracking-widest text-text-muted/40 mt-0.5">Sblocco Ledger</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center group-hover:scale-110 active:scale-95 transition-all shadow-xl">
                                <ArrowRight size={20} weight="bold" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Viewport Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FCFAF2]/40 via-transparent to-black/20 z-10 pointer-events-none" />
        </motion.section>
    );
};

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
    { value: '', label: 'Tutte le stagioni' },
    { value: 'tutto_anno', label: 'Tutto l\'anno' },
    { value: 'primavera', label: 'Primavera' },
    { value: 'estate', label: 'Estate' },
    { value: 'autunno', label: 'Autunno' },
    { value: 'inverno', label: 'Inverno' }
  ];

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
    <div className="min-h-screen bg-[#FCFAF2] selection:bg-accent/30 overflow-x-hidden relative scroll-smooth">
      <EditorialHeader 
        filters={filters} 
        setFilters={setFilters} 
        cities={cities} 
        seasons={seasons} 
        navigate={navigate} 
      />

      <AnimatePresence mode="wait">
        {loading ? (
             <div className="h-screen flex items-center justify-center bg-[#FCFAF2]">
                <motion.div 
                    animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex flex-col items-center gap-6"
                >
                    <Sparkle size={48} weight="fill" className="text-accent" />
                    <span className="text-[12px] font-serif font-black italic uppercase tracking-[0.4em] text-text-primary">Apertura Registri...</span>
                </motion.div>
             </div>
        ) : plans.length === 0 ? (
            <div className="h-screen flex items-center justify-center bg-[#FCFAF2] px-8">
                <div className="text-center space-y-12">
                    <div className="w-px h-32 bg-accent/20 mx-auto" />
                    <h2 className="text-[32px] md:text-[48px] font-serif font-black text-text-primary italic tracking-tight opacity-40">
                        Nessun capitolo <br/> corrispondente.
                    </h2>
                    <button 
                        onClick={() => setFilters({ city: '', season: '', targetAudience: '' })}
                        className="text-accent text-[12px] font-black uppercase tracking-widest border-b border-accent/40 pb-2 hover:border-accent transition-all"
                    >
                        Reinizializza Archivi
                    </button>
                </div>
            </div>
        ) : (
            <div className="snap-y snap-mandatory h-screen overflow-y-auto overflow-x-hidden scrollbar-hide">
              {plans.map((plan, idx) => (
                    <div key={plan.id} className="snap-start h-screen w-full">
                        <CinematicCard plan={plan} index={idx} navigate={navigate} />
                    </div>
              ))}

              {/* End of results footer */}
              <footer className="snap-start h-[40vh] bg-[#FCFAF2] flex flex-col items-center justify-center gap-8 relative overflow-hidden">
                  <div className="w-[1px] h-24 bg-accent/20" />
                  <p className="text-[9px] font-black uppercase tracking-[0.6em] text-accent/40">Fine della Collezione</p>
                  <p className="font-serif italic font-black text-[18px] text-text-primary opacity-30">Desideri Puglia Club — Archive 2026</p>
                  
                  {/* Faded Stamp background */}
                  <div className="absolute -bottom-10 rotate-6 text-[100px] font-serif font-black italic text-black/[0.02] select-none pointer-events-none whitespace-nowrap">
                     OFFICIAL ARCHIVE PRIVÉ
                  </div>
              </footer>
            </div>
        )}
      </AnimatePresence>

      {/* Scroll Hint */}
      <div className="fixed bottom-10 right-10 z-[2000] flex flex-col items-end gap-3 pointer-events-none opacity-20 hidden md:flex">
           <span className="text-[8px] font-black uppercase tracking-[0.3em] text-text-primary [writing-mode:vertical-lr] mb-2">Esplora</span>
           <div className="w-px h-10 bg-text-primary" />
      </div>
    </div>
  );
};

export default DailyPlans;
