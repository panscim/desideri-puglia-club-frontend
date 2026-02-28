import React, { useEffect, useState } from 'react';
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
  CreditCard,
  CheckCircle,
  Clock,
  Waves,
  NavigationArrow
} from '@phosphor-icons/react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';

const PlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isRainMode, setIsRainMode] = useState(false);
  const [vibeStatus, setVibeStatus] = useState('Sincronizzazione...');

  const { scrollY } = useScroll();
  const headerScale = useTransform(scrollY, [0, 300], [1.1, 1.2]);
  const navBg = useTransform(scrollY, [150, 250], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)']);
  const navTitleOpacity = useTransform(scrollY, [200, 300], [0, 1]);

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
      const levels = ['Pace & Relax', 'Atmosfera Vivace', '🔥 Picco Movida'];
      setVibeStatus(levels[recentVibe.vibe_level - 1] || 'In Attività');
    } else {
      setVibeStatus('CHILL VIBE');
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Accedi per sbloccare l\'esperienza');
      navigate('/login');
      return;
    }
    setIsBuying(true);
    const result = await ConciergeService.purchasePlan(user.id, id);
    if (result.success) {
      toast.success('Esperienza Sbloccata.');
      setIsPurchased(true);
    }
    setIsBuying(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-[2px] bg-zinc-100 relative overflow-hidden">
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-orange-500"
        />
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">Puglia Club</span>
    </div>
  );

  if (!plan) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] font-satoshi text-zinc-900 pb-40">
      
      {/* Ultra-Elegant Nav Bar */}
      <motion.nav 
        style={{ backgroundColor: navBg }}
        className="fixed top-0 inset-x-0 z-[1000] px-6 py-5 flex items-center justify-between backdrop-blur-3xl border-b border-black/[0.03]"
      >
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-black/5 flex items-center justify-center active:scale-90 transition-transform"
        >
          <CaretLeft size={20} weight="bold" className="text-zinc-900" />
        </button>
        
        <motion.span 
          style={{ opacity: navTitleOpacity }}
          className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900"
        >
          {plan.title_it}
        </motion.span>

        <div className="flex items-center gap-4">
          <Share size={20} weight="duotone" className="text-zinc-900 opacity-60 hover:opacity-100 transition-opacity" />
          <DotsThreeCircle size={24} weight="duotone" className="text-zinc-900 opacity-60 hover:opacity-100 transition-opacity" />
        </div>
      </motion.nav>

      {/* Immersive Header Image (Ultra-Elegance) */}
      <div className="relative h-[68vh] w-full overflow-hidden bg-zinc-900">
        <motion.img 
          style={{ scale: headerScale }}
          src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
          className="w-full h-full object-cover grayscale-[20%]"
        />
        <div className="absolute inset-0 header-scrim" />
        
        <div className="absolute inset-x-0 bottom-0 p-8 pb-12">
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="flex items-center gap-2 text-orange-400 mb-5"
           >
             <MapPin size={16} weight="fill" />
             <span className="text-[9px] font-black uppercase tracking-[0.4em] brightness-125">{plan.city}, Puglia</span>
           </motion.div>
           <motion.h1 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-6xl font-black text-white leading-[0.9] tracking-tighter-lux mb-8 lowercase first-letter:uppercase drop-shadow-2xl"
           >
             {plan.title_it}
           </motion.h1>
           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="text-white/60 font-medium leading-relaxed max-w-sm text-sm italic"
           >
             {plan.description_it}
           </motion.p>
        </div>
      </div>

      <main className="px-6 -mt-10 relative z-10">
        
        {/* Locator Widget: Digital Haute Couture */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-magazine-card px-5 py-3.5 flex items-center justify-between mb-12 border-white/60"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {plan.creator?.avatar_url ? (
                <img 
                  src={plan.creator.avatar_url} 
                  className="w-11 h-11 rounded-2xl object-cover border border-orange-500/10"
                  alt={plan.creator.nickname || 'Locator'}
                />
              ) : (
                <div className="w-11 h-11 bg-zinc-50 rounded-2xl flex items-center justify-center text-orange-500 border border-zinc-100 text-[10px] font-black">
                  {plan.creator?.nickname?.[0] || 'L'}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                <CheckCircle size={14} weight="fill" className="text-orange-500" />
              </div>
            </div>
            <div className="flex flex-col">
               <span className="text-[7.5px] font-black uppercase tracking-[0.3em] text-zinc-400 leading-none mb-1.5 italic">Locator Verificato</span>
               <span className="text-sm font-black text-zinc-900 leading-none tracking-tight">
                 {plan.creator ? `${plan.creator.nome || ''} ${plan.creator.cognome || ''}`.trim() || plan.creator.nickname : 'Resident Desideri'}
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
             <div className="h-6 w-[1.5px] bg-zinc-200/40" />
             <div className="flex flex-col items-end">
                <span className="text-[7.5px] font-black uppercase tracking-[0.3em] text-zinc-400 leading-none mb-1.5 italic">Rating</span>
                <span className="text-sm font-black text-zinc-900 leading-none">{plan.rating_avg?.toFixed(1) || '4.9'} <span className="text-[10px] text-zinc-300 font-medium">/ 5</span></span>
             </div>
          </div>
        </motion.div>

        {/* Itinerary Timeline (Ultra-Elegance) */}
        {isPurchased && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >
            
            <motion.div variants={itemVariants} className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                 <div className="w-[1px] h-6 bg-zinc-300 rounded-full" />
                 <h2 className="text-sm font-black text-zinc-900 uppercase tracking-[0.3em]">Orizzonte Puglia</h2>
               </div>

               <button 
                 onClick={() => setIsRainMode(!isRainMode)}
                 className={`h-11 px-6 rounded-full flex items-center gap-2 border transition-all duration-700 ${isRainMode ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/20' : 'bg-white border-zinc-100 text-zinc-600 hover:border-zinc-300'}`}
               >
                 <AnimatePresence mode="wait">
                   {isRainMode ? (
                     <motion.div key="rain" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                       <CloudRain size={18} weight="duotone" />
                     </motion.div>
                   ) : (
                     <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                       <Sun size={18} weight="duotone" />
                     </motion.div>
                   )}
                 </AnimatePresence>
                 <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                   {isRainMode ? 'Piano B' : 'Variazioni'}
                 </span>
               </button>
            </motion.div>

            <div className="space-y-10 relative">
              <div className="absolute left-[23px] top-6 bottom-6 w-[1.5px] bg-zinc-100/50" />

              {plan.slots?.map((slot, index) => (
                <motion.div 
                  key={slot.id}
                  variants={itemVariants}
                  className="flex gap-6"
                >
                   <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center shadow-lg border transition-all duration-700 ${isRainMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white border-white text-zinc-900'}`}>
                         <Clock size={20} weight="duotone" />
                      </div>
                      <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-zinc-300 mt-2.5">{slot.time_label}</span>
                   </div>

                   <div className={`flex-1 glass-magazine-card p-6 !rounded-[2.25rem] border-white transition-colors duration-700 ${isRainMode && slot.alt_activity_title_it ? 'bg-blue-50/40 border-blue-100/50' : ''}`}>
                      <AnimatePresence mode="wait">
                        {isRainMode && slot.alt_activity_title_it ? (
                          <motion.div key="rain" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                             <div className="text-blue-500 font-black text-[8px] uppercase tracking-[0.3em] mb-3 flex items-center gap-2 italic">
                               <CloudRain size={14} weight="duotone" /> Alternativa
                             </div>
                             <h4 className="text-2xl font-black text-blue-900 mb-3 tracking-tighter-lux lowercase first-letter:uppercase">{slot.alt_activity_title_it}</h4>
                             <p className="text-sm text-blue-800/60 font-medium leading-relaxed mb-8 italic">{slot.alt_activity_description_it}</p>
                          </motion.div>
                        ) : (
                          <motion.div key="sun" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                             <h4 className="text-2xl font-black text-zinc-900 mb-3 tracking-tighter-lux lowercase first-letter:uppercase">{slot.activity_title_it}</h4>
                             <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-8">{slot.activity_description_it}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button 
                        onClick={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`;
                          window.open(url, '_blank');
                        }}
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 ${isRainMode ? 'bg-blue-600 text-white' : 'bg-zinc-950 text-white'}`}
                      >
                        <NavigationArrow size={16} weight="duotone" /> Posizione Live
                      </button>
                   </div>
                </motion.div>
              ))}
            </div>

            {/* Radar Activity Widget v4: The Masterpiece */}
            <motion.section variants={itemVariants} className="pt-16 pb-12 px-2">
               <div className="bg-zinc-950 rounded-[3rem] p-8 relative overflow-hidden shadow-2xl border border-white/[0.08]">
                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15),transparent_50%)]" />
                  
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-2">
                           <Sparkle size={18} weight="fill" className="text-orange-500" />
                           <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500">Live Pulse</h4>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                          <div className="vibe-pulse-v2 !w-2 !h-2" />
                          <span className="text-[7.5px] font-black text-green-500 uppercase tracking-[0.3em]">Network Attivo</span>
                        </div>
                     </div>

                     <div className="mb-12">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] block mb-2 italic">Radar della Movida</span>
                        <h2 className="text-4xl font-black text-white uppercase leading-none tracking-tighter-lux">
                           {vibeStatus}
                        </h2>
                     </div>

                     <div className="sentiment-meter-v2 !h-[6px] !gap-[3px]">
                        {[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(i => (
                          <div key={i} className={`sentiment-meter-step-v2 !rounded-full ${i <= 10 ? 'active !bg-orange-500 !shadow-[0_0_12px_rgba(249,115,22,0.3)]' : 'bg-white/5'}`} />
                        ))}
                     </div>
                     
                     <p className="text-[8px] font-medium text-zinc-600 mt-6 leading-relaxed opacity-60 uppercase tracking-widest text-center">
                        Cifratura Resident Puglia — Sincronizzazione Real-Time
                     </p>
                  </div>
               </div>
            </motion.section>

            <footer className="py-24 text-center opacity-40">
               <div className="w-12 h-[1px] bg-zinc-400 mx-auto mb-6" />
               <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-500">Desideri Puglia Private Club</p>
            </footer>
          </motion.div>
        )}

      </main>

      {/* Floating Bottom Action Bar: Ultra-Elegant */}
      <AnimatePresence>
        {!isPurchased && (
          <motion.div 
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="floating-bottom-bar !backdrop-blur-3xl !py-5 !bg-white/90"
          >
            <div className="flex flex-col gap-0.5">
               <span className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] italic">Full Experience</span>
               <span className="text-2xl font-black text-zinc-900 tracking-tighter-lux">€{plan.price.toFixed(2)}</span>
            </div>
            
            <button 
              onClick={handlePurchase}
              disabled={isBuying}
              className="w-48 h-14 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-zinc-900/40 active:scale-95 transition-all"
            >
              {isBuying ? "..." : "Sblocca"}
              <CreditCard size={18} weight="duotone" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PlanDetail;
