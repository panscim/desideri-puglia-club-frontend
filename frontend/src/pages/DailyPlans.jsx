import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConciergeService } from '../services/concierge';
import { 
  CaretLeft, 
  Sparkle,
  Star,
  MagnifyingGlass,
  Users,
  Timer
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

/* ── Cinematic Elements ────────────────────────────────────── */
const ArchiveBar = ({ filters, setFilters, cities, seasons }) => (
  <motion.nav 
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    className="fixed top-0 inset-x-0 z-[2000] h-24 px-8 flex items-center justify-between bg-black/20 backdrop-blur-xl border-b border-white/5"
  >
    <div className="flex items-center gap-8">
      <div className="flex flex-col">
        <span className="text-[8px] font-black uppercase tracking-[0.5em] text-accent/80">Cinematic</span>
        <span className="text-[14px] font-serif font-black italic text-white uppercase tracking-tighter">Archive</span>
      </div>
      <div className="h-8 w-px bg-white/10 hidden md:block" />
      <div className="hidden md:flex items-center gap-6">
          <select 
            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white/60 outline-none cursor-pointer hover:text-white transition-colors"
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
          >
            <option value="" className="bg-zinc-900">Territori</option>
            {cities.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
          </select>
          <div className="flex gap-4">
            {seasons.slice(1).map(s => (
                <button 
                    key={s.value}
                    onClick={() => setFilters(prev => ({ ...prev, season: prev.season === s.value ? '' : s.value }))}
                    className={`text-[9px] font-black uppercase tracking-widest transition-all ${filters.season === s.value ? 'text-accent' : 'text-white/40 hover:text-white'}`}
                >
                    {s.label}
                </button>
            ))}
          </div>
      </div>
    </div>
    
    <div className="flex items-center gap-4">
       <div className="hidden md:flex flex-col items-end mr-4">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/30 text-right">Selected Experience</span>
          <span className="text-[10px] font-serif italic text-white/60">Puglia, IT</span>
       </div>
       <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-accent">
          <Sparkle size={20} weight="fill" />
       </div>
    </div>
  </motion.nav>
);

const CinematicPlan = ({ plan, index, navigate }) => {
    const { scrollYProgress } = useScroll();
    const yTransform = useTransform(scrollYProgress, [0, 1], [0, -100]);
    
    return (
        <motion.section 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: "-100px" }}
            className="relative h-[90vh] md:h-screen w-full flex items-center justify-center overflow-hidden group mb-32 md:mb-0"
            onClick={() => navigate(`/plan/${plan.id}`)}
        >
            {/* Background Parallax Image */}
            <motion.div 
                style={{ y: yTransform }}
                className="absolute inset-0 z-0 scale-110"
            >
                <img 
                    src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                    className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 transition-all duration-[2s] ease-out brightness-50 group-hover:brightness-[0.65]"
                    alt={plan.title_it}
                />
            </motion.div>

            {/* Architecture Typography Overlays */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden">
                <motion.h2 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 0.07 }}
                    className="text-[20vw] font-serif font-black italic whitespace-nowrap text-white leading-none select-none"
                >
                    {plan.city.toUpperCase()}
                </motion.h2>
            </div>

            {/* Content Container */}
            <div className="relative z-20 container mx-auto px-8 md:px-24 flex flex-col md:flex-row items-end md:items-center justify-between h-full py-32">
                <div className="max-w-xl flex flex-col items-start gap-6 md:gap-10">
                    <motion.div 
                        initial={{ x: -30, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-4"
                    >
                        <div className="w-12 h-px bg-accent" />
                        <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] text-accent font-sans">Experience {index + 1}</span>
                    </motion.div>

                    <motion.h3 
                        initial={{ y: 40, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-[48px] md:text-[96px] font-serif font-black text-white leading-[0.9] tracking-tighter italic drop-shadow-2xl"
                    >
                        {plan.title_it}
                    </motion.h3>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-[16px] md:text-[20px] text-white/60 font-serif italic max-w-md leading-relaxed"
                    >
                        {plan.description_it || "Un viaggio sensoriale curato nei minimi dettagli per svelare l'anima segreta del territorio."}
                    </motion.p>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center gap-8 mt-4"
                    >
                        <button className="px-10 h-14 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] hover:bg-accent hover:text-white transition-all duration-500 rounded-none shadow-2xl">
                            Svela Percorso
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1 leading-none">Rating</span>
                            <div className="flex items-center gap-1.5 text-accent text-[18px] font-serif italic font-black">
                                <Star size={16} weight="fill" />
                                <span>{(plan.rating_avg || 4.9).toFixed(1)}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="hidden lg:flex flex-col items-end gap-6"
                >
                    <div className="w-56 aspect-[3/4] border border-white/10 p-2 overflow-hidden shadow-2xl">
                        <img 
                            src={plan.creator?.avatar_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                            alt="" 
                        />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Curato da</p>
                        <p className="text-[20px] font-serif font-black italic text-white leading-none">{plan.creator?.nome || 'Local Expert'}</p>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Progress/Index */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30 opacity-40 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black text-white/40">{index + 1}</span>
                <div className="w-16 h-px bg-white/20 relative">
                     <motion.div 
                        className="absolute inset-y-0 left-0 bg-accent"
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        transition={{ duration: 1.5 }}
                     />
                </div>
                <span className="text-[10px] font-black text-white/40">06</span>
            </div>

            {/* Viewport Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-10 pointer-events-none" />
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
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-accent/30 overflow-x-hidden relative scroll-smooth">
      <ArchiveBar filters={filters} setFilters={setFilters} cities={cities} seasons={seasons} />

      <AnimatePresence mode="wait">
        {loading ? (
             <div className="h-screen flex items-center justify-center bg-black">
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Sparkle size={48} weight="fill" className="text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.8em] text-white/20">Apertura Archivi</span>
                </motion.div>
             </div>
        ) : plans.length === 0 ? (
            <div className="h-screen flex items-center justify-center bg-black px-8">
                <div className="text-center space-y-8">
                    <h2 className="text-[48px] md:text-[64px] font-serif font-black text-white/20 italic tracking-tighter">Nessuna Storia <br/> Coincidente.</h2>
                    <button 
                        onClick={() => setFilters({ city: '', season: '', targetAudience: '' })}
                        className="text-accent text-[12px] font-black uppercase tracking-widest border-b border-accent/20 pb-1"
                    >
                        Reinizializza Archivi
                    </button>
                </div>
            </div>
        ) : (
            <div className="snap-y snap-mandatory h-screen overflow-y-auto overflow-x-hidden scrollbar-hide">
              {plans.map((plan, idx) => (
                    <div key={plan.id} className="snap-start h-screen w-full">
                        <CinematicPlan plan={plan} index={idx} navigate={navigate} />
                    </div>
              ))}
            </div>
        )}
      </AnimatePresence>

      {/* Floating Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="fixed bottom-12 left-12 z-[2000] w-14 h-14 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white hover:text-black transition-all group active:scale-90"
      >
        <CaretLeft size={24} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* Luxury Scroll Hint */}
      <div className="fixed bottom-12 right-12 z-[2000] flex flex-col items-end gap-4 pointer-events-none opacity-40">
           <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white [writing-mode:vertical-lr] mb-2">Scroll To Explore</span>
           <div className="w-px h-12 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  );
};

export default DailyPlans;
