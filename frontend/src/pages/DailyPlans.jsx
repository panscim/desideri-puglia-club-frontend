import { ArrowRight, CaretLeft, Sparkle, Star } from '@phosphor-icons/react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConciergeService } from '../services/concierge';

/* ── Scrapbook Components ───────────────────────────────────── */

const WashiTape = ({ color = '#D4AF37', className = '' }) => (
  <div className={`absolute z-30 opacity-80 pointer-events-none ${className}`} style={{ width: '80px', height: '24px' }}>
    <div 
      className="w-full h-full" 
      style={{ 
        backgroundColor: color,
        maskImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
        clipPath: 'polygon(0% 15%, 5% 0%, 95% 5%, 100% 20%, 98% 85%, 92% 100%, 8% 95%, 0% 80%)'
      }} 
    />
  </div>
);

const Polaroid = ({ src, rotation = 0, caption = '', className = '' }) => (
  <motion.div 
    whileHover={{ scale: 1.05, zIndex: 40 }}
    className={`bg-white p-3 pb-10 shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-black/[0.03] flex flex-col items-center ${className}`}
    style={{ rotate: `${rotation}deg` }}
  >
    <div className="w-full aspect-square overflow-hidden bg-zinc-100 mb-4">
      <img src={src} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" alt="" />
    </div>
    {caption && <span className="font-serif italic text-[10px] text-text-muted/60 lowercase">{caption}</span>}
  </motion.div>
);

const PostIt = ({ children, color = '#FEF9E7', rotation = 2, className = '' }) => (
  <div 
    className={`p-6 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border-l-4 border-black/5 ${className}`}
    style={{ backgroundColor: color, rotate: `${rotation}deg` }}
  >
    <div className="font-serif italic text-[16px] text-text-muted leading-relaxed">
      {children}
    </div>
  </div>
);

const ScrapbookHeader = ({ filters, setFilters, cities, seasons, navigate }) => (
  <motion.nav 
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    className="fixed top-0 inset-x-0 z-[2000] h-20 px-6 md:px-12 flex items-center justify-between bg-[#FCFAF2]/90 backdrop-blur-md border-b border-black/[0.03]"
  >
    <div className="flex items-center gap-6">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-full transition-all text-text-primary"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <div className="hidden lg:flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-accent/60">Journal Archive</span>
            <span className="text-[14px] font-serif font-black italic tracking-tight uppercase">Daily Scrapbook</span>
        </div>
    </div>

    <div className="flex items-center gap-4 md:gap-8">
        <div className="hidden md:flex items-center gap-6">
            {seasons.map(s => (
                <button 
                    key={s.value}
                    onClick={() => setFilters(prev => ({ ...prev, season: prev.season === s.value ? '' : s.value }))}
                    className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all ${filters.season === s.value ? 'text-accent' : 'text-text-muted/40 hover:text-text-primary'}`}
                >
                    {s.label}
                </button>
            ))}
        </div>
        <div className="h-6 w-px bg-black/5 hidden md:block" />
        <select 
            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-text-primary outline-none cursor-pointer border-b-2 border-accent/20 pb-1 hover:border-accent transition-all"
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
        >
            <option value="">Indice Territori</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
    </div>
  </motion.nav>
);

const ScrapbookPage = ({ plan, index, navigate }) => {
    const { scrollYProgress } = useScroll();
    const yArtifacts = useTransform(scrollYProgress, [0, 1], [0, -60]);
    const yMain = useTransform(scrollYProgress, [0, 1], [0, -120]);
    
    return (
        <motion.section 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: "-100px" }}
            className="relative h-screen w-full flex items-center justify-center overflow-hidden snap-start"
            onClick={() => navigate(`/plan/${plan.id}`)}
        >
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04] grayscale contrast-150 z-0" 
                 style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/linen-paper.png")` }} />

            <div className="container mx-auto px-6 md:px-24 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-24">
                
                {/* Visual Cluster (Mixed Media) */}
                <motion.div 
                    style={{ y: yArtifacts }}
                    className="relative w-full md:w-1/2 flex items-center justify-center h-[400px] md:h-auto"
                >
                    <WashiTape color="#D4AF37" className="-top-4 -left-4 z-40 rotate-[15deg]" />
                    <WashiTape color="#5D6D7E" className="-top-2 -right-10 z-30" />
                    
                    {/* Primary Photo */}
                    <div className="relative z-20 w-full max-w-[320px] shadow-2xl skew-y-1 transform group-hover:skew-y-0 transition-transform duration-1000">
                         <img 
                            src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                            alt=""
                         />
                         <div className="absolute inset-0 border-[15px] border-[#FCFAF2]/10 pointer-events-none" />
                    </div>

                    {/* Secondary Artifacts */}
                    <Polaroid 
                        src="https://images.unsplash.com/photo-1516483638261-f4dbaf036963" 
                        rotation={-12} 
                        caption="dettagli" 
                        className="absolute -bottom-10 -left-10 w-44 hidden md:flex" 
                    />
                    <Polaroid 
                        src="https://images.unsplash.com/photo-1513519245088-0e12902e35a6" 
                        rotation={8} 
                        caption="atmosfera" 
                        className="absolute -top-16 -right-10 w-40 hidden md:flex" 
                    />

                    {/* Expert Stamp */}
                    <div className="absolute bottom-4 right-4 z-30 w-24 h-24 border-2 border-dashed border-accent/30 rounded-full flex items-center justify-center -rotate-12 opacity-40 select-none">
                         <span className="text-[8px] font-black uppercase tracking-widest text-accent text-center leading-none">Scrapbook<br/>Approved</span>
                    </div>
                </motion.div>

                {/* Content Area */}
                <motion.div 
                    style={{ y: yMain }}
                    className="w-full md:w-1/2 flex flex-col items-start gap-8 relative z-30"
                >
                    <div className="flex items-center gap-6">
                        <span className="text-[64px] font-serif font-black italic text-accent/10 leading-none select-none">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-accent/60">Registry {plan.city}</span>
                            <div className="flex items-center gap-1.5 text-accent-gold text-[12px] font-black">
                                <Star size={14} weight="fill" />
                                <span>{(plan.rating_avg || 4.9).toFixed(1)}</span>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-[42px] md:text-[68px] font-serif font-black text-text-primary leading-[0.9] tracking-tighter italic">
                        {plan.title_it}
                    </h3>

                    <PostIt rotation={-1.5} className="max-w-md">
                        {plan.description_it || "Un viaggio sensoriale attraverso i segreti più autentici della Puglia, curata dai nostri local experts."}
                    </PostIt>

                    <div className="flex items-center gap-10 pt-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-text-muted/40 mb-1">Creatore</span>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border border-black/5 overflow-hidden grayscale">
                                    <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover" alt="" />
                                </div>
                                <span className="text-[17px] font-serif font-black italic text-text-primary">{plan.creator?.nome || 'Expert'}</span>
                            </div>
                        </div>
                        
                        <div className="h-10 w-px bg-black/5" />

                        <button className="flex items-center gap-4 group">
                             <div className="flex flex-col items-end">
                                <span className="text-[20px] font-serif font-black text-text-primary leading-none">€{plan.price.toFixed(0)}</span>
                                <span className="text-[7px] font-black uppercase tracking-widest text-accent/60 mt-1">Sblocca Diario</span>
                             </div>
                             <div className="w-12 h-12 rounded-full border border-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all shadow-xl group-active:scale-90">
                                <ArrowRight size={20} weight="bold" />
                             </div>
                        </button>
                    </div>

                    {/* Handwritten Marginalia */}
                    <div className="absolute -bottom-16 right-0 opacity-20 pointer-events-none hidden lg:block select-none">
                        <span className="text-[48px] font-serif italic text-accent/40 font-black">- autentico</span>
                    </div>
                </motion.div>
            </div>

            {/* Viewport Vignette (Coffee Stain feel) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(252,250,242,0.6)_100%)] z-10 pointer-events-none" />
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
    { value: '', label: 'Tutto l\'anno' },
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
    setPlans(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FCFAF2] selection:bg-accent/30 overflow-x-hidden relative scroll-smooth">
      {/* Global Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.02]">
           <div className="absolute top-20 left-10 w-64 h-64 border border-black/10 rounded-full rotate-45" />
           <div className="absolute bottom-40 right-10 w-96 h-96 border border-black/10 rounded-full -rotate-12" />
      </div>

      <ScrapbookHeader filters={filters} setFilters={setFilters} cities={cities} seasons={seasons} navigate={navigate} />

      <AnimatePresence mode="wait">
        {loading ? (
             <div className="h-screen flex items-center justify-center bg-[#FCFAF2]">
                <motion.div 
                    animate={{ rotate: [0, 5, 0], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                         <Sparkle size={32} weight="fill" />
                    </div>
                    <span className="text-[12px] font-serif font-black italic uppercase tracking-[0.4em] text-text-primary">Sfogliano gli Appunti...</span>
                </motion.div>
             </div>
        ) : plans.length === 0 ? (
            <div className="h-screen flex items-center justify-center bg-[#FCFAF2] px-8">
                <div className="text-center space-y-12">
                    <h2 className="text-[32px] md:text-[54px] font-serif font-black text-text-primary italic tracking-tight opacity-20">
                        Capitolo non <br/> ancora scritto.
                    </h2>
                    <button 
                        onClick={() => setFilters({ city: '', season: '', targetAudience: '' })}
                        className="text-accent text-[12px] font-black uppercase tracking-widest border-b-2 border-accent/20 pb-2 hover:border-accent transition-all"
                    >
                        Nuova Ricerca
                    </button>
                </div>
            </div>
        ) : (
            <div className="snap-y snap-mandatory h-screen overflow-y-auto overflow-x-hidden scrollbar-hide relative z-20">
              {plans.map((plan, idx) => (
                    <div key={plan.id} className="snap-start h-screen w-full">
                        <ScrapbookPage plan={plan} index={idx} navigate={navigate} />
                    </div>
              ))}

              {/* End Spread */}
              <footer className="snap-start h-screen bg-[#FCFAF2] flex flex-col items-center justify-center gap-12 relative overflow-hidden">
                  <div className="w-[2px] h-32 bg-accent/20" />
                  <div className="text-center space-y-4 px-8">
                      <p className="text-[11px] font-black uppercase tracking-[0.8em] text-accent/40">Fine del Diario</p>
                      <p className="font-serif italic font-black text-[24px] md:text-[32px] text-text-primary opacity-60">
                        La tua prossima storia <br /> inizia qui.
                      </p>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-px bg-black/[0.03] rotate-[15deg]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-px bg-black/[0.03] -rotate-[15deg]" />
              </footer>
            </div>
        )}
      </AnimatePresence>

      {/* Decorative Navigation Dot */}
      <div className="fixed right-10 top-1/2 -translate-y-1/2 flex flex-col gap-4 opacity-20 hidden lg:flex">
          {[1, 2, 3, 4].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-primary" />)}
      </div>
    </div>
  );
};

export default DailyPlans;
