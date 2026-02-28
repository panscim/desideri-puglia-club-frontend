import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConciergeService } from '../services/concierge';
import { useAuth } from '../contexts/AuthContext';
import { 
  CaretLeft, 
  MapPin, 
  CloudRain, 
  Sun, 
  Compass,
  LockKey, 
  Share,
  DotsThreeCircle,
  Wine,
  Sparkle,
  ArrowRight,
  Eye
} from '@phosphor-icons/react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';

const PlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const containerRef = useRef(null);
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isRainMode, setIsRainMode] = useState(false);
  const [vibeStatus, setVibeStatus] = useState('CALIBRATING...');

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const titleY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  useEffect(() => {
    loadPlan();
    fetchVibes();
    window.scrollTo(0, 0);
  }, [id, user]);

  const loadPlan = async () => {
    setLoading(true);
    const data = await ConciergeService.getPlanDetail(id);
    setPlan(data);
    
    if (user && data) {
      const purchased = await ConciergeService.checkPurchase(user.id, id);
      setIsPurchased(purchased);
    }
    setLoading(false);
  };

  const fetchVibes = async () => {
    const vibes = await ConciergeService.getLiveVibes();
    if (vibes && vibes.length > 0) {
      const recentVibe = vibes[0];
      const levels = ['QUIET VIBE', 'LIVE ENERGY', '🔥 PEAK PARTY'];
      setVibeStatus(levels[recentVibe.vibe_level - 1] || 'ACTIVE');
    } else {
      setVibeStatus('CHILL');
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Sign in to unlock the experience');
      navigate('/login');
      return;
    }
    setIsBuying(true);
    const result = await ConciergeService.purchasePlan(user.id, id);
    if (result.success) {
      toast.success('Experience Unlocked.');
      setIsPurchased(true);
    }
    setIsBuying(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans tracking-tighter">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} 
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="text-white text-3xl font-black italic"
      >
        DESIDERI
      </motion.div>
      <div className="mt-8 w-48 h-[1px] bg-zinc-800 relative overflow-hidden">
         <motion.div 
           animate={{ x: [-200, 200] }}
           transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
           className="absolute inset-0 w-24 bg-orange-500"
         />
      </div>
    </div>
  );

  if (!plan) return null;

  return (
    <div ref={containerRef} className={`min-h-screen bg-noise ${isRainMode ? 'bg-slate-950' : 'bg-zinc-50'} transition-colors duration-1000`}>
      
      {/* Dynamic Rain Overlay */}
      <AnimatePresence>
        {isRainMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rain-atmospheric-overlay"
          />
        )}
      </AnimatePresence>

      {/* Floating Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-3rem)] max-w-xl">
        <div className="glass-premium-dark rounded-full px-6 py-3 flex items-center justify-between border border-white/10">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-white/60 tracking-[0.2em] uppercase">Puglia • {plan.city}</span>
          </div>

          <div className="flex items-center gap-4 text-white">
            <Share size={20} className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer" />
            <DotsThreeCircle size={22} className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer" />
          </div>
        </div>
      </nav>

      {/* Immersive Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <motion.div 
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-zinc-950/90" />
        </motion.div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-32 px-8">
           <motion.div 
             style={{ y: titleY }}
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
             className="text-center max-w-2xl"
           >
              <div className="flex items-center justify-center gap-2 mb-6 animate-float">
                <Sparkle size={20} weight="fill" className="text-orange-500" />
                <span className="text-xs font-black text-white/60 tracking-[0.4em] uppercase">Private Experience</span>
              </div>
              <h1 className="text-premium-display text-7xl md:text-9xl text-white mb-8 drop-shadow-2xl">
                {plan.title_it}
              </h1>
              <p className="text-premium-body text-xl text-white/50 leading-relaxed max-w-lg mx-auto italic">
                {plan.description_it}
              </p>
           </motion.div>

           <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-16 flex flex-col items-center gap-4"
           >
             <div className="w-[1px] h-20 bg-gradient-to-b from-orange-500 to-transparent" />
             <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Explore Story</span>
           </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <main className="relative z-20 max-w-5xl mx-auto px-6 py-24">
        
        {/* Purchase Lock (Premium Glass Card) */}
        {!isPurchased && (
          <div className="mt-[-150px] relative">
             <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-premium-dark rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden"
             >
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />

                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-white/10 group-hover:scale-110 transition-transform duration-500 transition-all">
                  <LockKey size={40} className="text-orange-500" />
                </div>
                
                <h2 className="text-premium-display text-4xl text-white mb-6">PREMIUM ACCESS</h2>
                <p className="text-stone-400 text-lg mb-12 max-w-[40ch] mx-auto leading-relaxed">
                  Unlock the full private narrative, secret locations, and real-time vibe mapping.
                </p>

                <button 
                  onClick={handlePurchase}
                  disabled={isBuying}
                  className="group relative w-full max-w-md h-20 bg-white text-zinc-950 rounded-2xl font-black text-xl overflow-hidden active:scale-95 transition-all"
                >
                  <div className="absolute inset-0 bg-orange-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <span className="relative z-10 flex items-center justify-center gap-3 group-hover:text-white transition-colors duration-500">
                    {isBuying ? "UNSEALING..." : `UNLOCK EXPERIENCE • €${plan.price.toFixed(2)}`}
                    <ArrowRight size={24} weight="bold" />
                  </span>
                </button>
             </motion.div>
          </div>
        )}

        {/* The Premium Timeline */}
        {isPurchased && (
          <div className="space-y-32">
            
            {/* Header Controls */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-8 mb-20">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 glass-premium-dark rounded-xl flex items-center justify-center text-white">
                    <MapPin size={24} weight="fill" className="text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-premium-display text-2xl text-orange-500 uppercase">THE Curation</h3>
                    <p className="text-stone-400 text-sm font-bold opacity-50">BY DESIDERI PUGLIA • APPROVED</p>
                  </div>
               </div>

               <button 
                 onClick={() => setIsRainMode(!isRainMode)}
                 className={`group h-16 px-8 rounded-2xl glass-premium flex items-center gap-4 transition-all overflow-hidden ${isRainMode ? 'border-blue-500' : 'border-white/10'}`}
               >
                 <AnimatePresence mode="wait">
                   {isRainMode ? (
                     <motion.div key="rain" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-3">
                        <CloudRain size={24} weight="fill" className="text-blue-500" />
                        <span className="text-blue-400 font-black tracking-widest text-[10px] uppercase">Piano B Active</span>
                     </motion.div>
                   ) : (
                     <motion.div key="sun" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-3">
                        <Sun size={24} weight="fill" className="text-orange-500" />
                        <span className="text-orange-500 font-black tracking-widest text-[10px] uppercase">Weather: Good</span>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </button>
            </header>

            {/* Timeline Experience */}
            <div className="space-y-40">
              {plan.slots?.map((slot, index) => (
                <motion.div 
                  key={slot.id}
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-12 group"
                >
                   {/* Left Col: Time & Branding */}
                   <div className="md:col-span-3 flex flex-col justify-center items-start md:items-end text-left md:text-right gap-4">
                      <span className="text-premium-display text-7xl text-orange-500/20 group-hover:text-orange-500/100 transition-colors duration-700">
                        {slot.time_label.split(':')[0]}<span className="text-2xl align-top">.{slot.time_label.split(':')[1]}</span>
                      </span>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">Step {index + 1}</span>
                         <div className="w-8 h-[2px] bg-orange-500/50" />
                      </div>
                   </div>

                   {/* Right Col: Immersive Content Cards */}
                   <div className="md:col-span-9">
                      <div className="glass-premium rounded-[3rem] p-8 md:p-12 relative overflow-hidden group-hover:border-white/30 transition-all duration-700">
                         {/* Dynamic Background Mesh based on Rain Mode */}
                         <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${isRainMode ? 'bg-blue-600 blur-[80px]' : 'bg-orange-600 blur-[80px]'}`} />

                         <AnimatePresence mode="wait">
                            {isRainMode && slot.alt_activity_title_it ? (
                              <motion.div 
                                key="alt"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="relative z-10"
                              >
                                <div className="flex items-center gap-2 mb-6 text-blue-400">
                                   <CloudRain size={20} weight="fill" />
                                   <span className="text-xs font-black uppercase tracking-widest">Atmospheric Backup</span>
                                </div>
                                <h4 className="text-premium-display text-4xl md:text-6xl text-white mb-6 uppercase leading-tight">
                                  {slot.alt_activity_title_it}
                                </h4>
                                <p className="text-premium-body text-xl text-stone-300 mb-10 max-w-xl leading-relaxed italic">
                                  {slot.alt_activity_description_it}
                                </p>
                              </motion.div>
                            ) : (
                              <motion.div 
                                key="main"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="relative z-10"
                              >
                                <h4 className="text-premium-display text-4xl md:text-6xl text-white mb-6 uppercase leading-tight group-hover:tracking-tight transition-all duration-700">
                                  {slot.activity_title_it}
                                </h4>
                                <p className="text-premium-body text-xl text-stone-300 mb-10 max-w-xl leading-relaxed">
                                  {slot.activity_description_it}
                                </p>
                              </motion.div>
                            )}
                         </AnimatePresence>

                         <div className="flex items-center justify-between pt-10 border-t border-white/5">
                            <button 
                              onClick={() => {
                                const url = `https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`;
                                window.open(url, '_blank');
                              }}
                              className="flex items-center gap-4 text-white hover:text-orange-500 transition-colors"
                            >
                               <div className="w-14 h-14 glass-premium-dark rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                 <Compass size={28} weight="fill" />
                               </div>
                               <span className="text-xs font-black tracking-widest uppercase">GPS NAVIGATION</span>
                            </button>

                            <div className="hidden md:flex items-center gap-1 opacity-20">
                               <Sparkle size={16} />
                               <Sparkle size={16} />
                               <Sparkle size={16} />
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
              ))}
            </div>

            {/* Radar Movida - High-Fidelity Experience Card */}
            <section className="relative mt-40">
               <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="glass-premium-dark rounded-[4rem] p-12 md:p-24 relative overflow-hidden text-center group"
               >
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/5 via-transparent to-blue-500/5" />
                  
                  <Wine size={200} weight="fill" className="absolute -bottom-20 -left-20 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                  <Eye size={150} weight="fill" className="absolute -top-10 -right-10 text-white/5 -rotate-12" />

                  <div className="relative z-10 flex flex-col items-center gap-8">
                     <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_20px_green]" />
                        <span className="text-xs font-black text-white/40 tracking-[0.5em] uppercase">Private Live Analytics</span>
                     </div>
                     
                     <h2 className="text-premium-display text-6xl md:text-8xl text-white uppercase italic">
                       CURRENT STATUS: <br/>
                       <span className="text-orange-500 underline decoration-white/10 underline-offset-[20px]">{vibeStatus}</span>
                     </h2>

                     <p className="text-stone-400 text-lg max-w-[50ch]">
                        Our residents are active on the ground. This stream updates every 5 minutes 
                        to ensure you are at the heart of Puglia's energy.
                     </p>
                  </div>
               </motion.div>
            </section>

            <footer className="py-40 text-center relative">
               <div className="w-12 h-[1px] bg-orange-500 mx-auto mb-10" />
               <p className="text-premium-display text-2xl text-white/30 tracking-[0.5em] uppercase">End of Curation</p>
            </footer>
          </div>
        )}

      </main>
    </div>
  );
};

export default PlanDetail;
