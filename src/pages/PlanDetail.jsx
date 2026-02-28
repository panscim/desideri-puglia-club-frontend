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
  const headerBlur = useTransform(scrollY, [0, 100], [0, 20]);
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.4]);
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
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-zinc-100 border-t-orange-500 rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Loading Puglia...</span>
    </div>
  );

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-[#F9F9F7] font-satoshi text-zinc-900 pb-40">
      
      {/* Mobile Sticky Nav Bar */}
      <motion.nav 
        style={{ backgroundColor: navBg }}
        className="fixed top-0 inset-x-0 z-[1000] px-6 py-4 flex items-center justify-between backdrop-blur-xl border-b border-black/5"
      >
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <CaretLeft size={22} weight="bold" className="text-zinc-900" />
        </button>
        
        <motion.span 
          style={{ opacity: navTitleOpacity }}
          className="text-sm font-black uppercase tracking-widest text-zinc-900"
        >
          {plan.title_it}
        </motion.span>

        <div className="flex items-center gap-4">
          <Share size={22} weight="duotone" className="text-zinc-900" />
          <DotsThreeCircle size={26} weight="duotone" className="text-zinc-900" />
        </div>
      </motion.nav>

      {/* Immersive Header Image */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <motion.img 
          style={{ scale: 1.1, opacity: headerOpacity }}
          src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 header-scrim" />
        
        <div className="absolute inset-x-0 bottom-0 p-8 pt-20">
           <div className="flex items-center gap-2 text-orange-400 mb-3">
             <MapPin size={18} weight="fill" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">{plan.city}, Puglia</span>
           </div>
           <h1 className="text-5xl font-black text-zinc-900 leading-[0.9] lowercase first-letter:uppercase mb-6">
             {plan.title_it}
           </h1>
           <p className="text-zinc-600 font-medium leading-relaxed max-w-sm">
             {plan.description_it}
           </p>
        </div>
      </div>

      <main className="px-6 -mt-4 relative z-10">
        
        {/* Verification Widget */}
        <div className="app-native-card p-6 flex items-center justify-between mb-12 shadow-sm border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-orange-500 border border-zinc-100">
               <CheckCircle size={28} weight="duotone" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Verificato</p>
               <p className="text-sm font-bold">Resident Insider Puglia</p>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-zinc-100" />
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Rating</p>
             <p className="text-sm font-bold">4.9/5.0</p>
          </div>
        </div>

        {/* Itinerary Timeline */}
        {isPurchased && (
          <div className="space-y-12">
            
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-zinc-900 rounded-full" />
                 <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Il Percorso</h2>
               </div>

               <button 
                 onClick={() => setIsRainMode(!isRainMode)}
                 className={`h-10 px-6 rounded-full flex items-center gap-2 border transition-all ${isRainMode ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-white border-zinc-100 text-zinc-600'}`}
               >
                 {isRainMode ? <CloudRain size={18} weight="duotone" /> : <Sun size={18} weight="duotone" />}
                 <span className="text-[9px] font-black uppercase tracking-widest">
                   {isRainMode ? 'Piano B' : 'Opzioni'}
                 </span>
               </button>
            </div>

            <div className="space-y-8 relative">
              <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-zinc-100" />

              {plan.slots?.map((slot, index) => (
                <motion.div 
                  key={slot.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="flex gap-6"
                >
                   <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md border transition-all duration-500 ${isRainMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white border-zinc-100 text-zinc-900'}`}>
                         <Clock size={20} weight="duotone" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-2">{slot.time_label}</span>
                   </div>

                   <div className={`flex-1 app-native-card p-6 ${isRainMode && slot.alt_activity_title_it ? 'bg-blue-50/50 border-blue-100' : ''}`}>
                      <AnimatePresence mode="wait">
                        {isRainMode && slot.alt_activity_title_it ? (
                          <motion.div key="rain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                             <div className="text-blue-600 font-black text-[9px] uppercase tracking-widest mb-2 flex items-center gap-2">
                               <CloudRain size={14} weight="duotone" /> Piano B
                             </div>
                             <h4 className="text-xl font-black text-blue-900 mb-3 lowercase first-letter:uppercase">{slot.alt_activity_title_it}</h4>
                             <p className="text-sm text-blue-800/60 font-medium leading-relaxed mb-6 italic">{slot.alt_activity_description_it}</p>
                          </motion.div>
                        ) : (
                          <motion.div key="sun" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                             <h4 className="text-xl font-black text-zinc-900 mb-3 lowercase first-letter:uppercase">{slot.activity_title_it}</h4>
                             <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-6">{slot.activity_description_it}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button 
                        onClick={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`;
                          window.open(url, '_blank');
                        }}
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${isRainMode ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-white'}`}
                      >
                        <NavigationArrow size={18} weight="duotone" /> Mappa
                      </button>
                   </div>
                </motion.div>
              ))}
            </div>

            {/* Radar Activity Widget */}
            <section className="pt-12">
               <div className="bg-zinc-950 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-8 right-8 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                    <div className="vibe-pulse-v2" />
                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Live Now</span>
                  </div>

                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-8">
                        <Sparkle size={18} weight="fill" className="text-orange-500" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500">Radar Movida</h4>
                     </div>

                     <h2 className="text-3xl font-black text-white mb-4 uppercase">
                        Status: <span className="text-orange-500">{vibeStatus}</span>
                     </h2>

                     <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-10 opacity-80">
                        Rete Resident Desideri attiva. Aggiornato ogni 5min.
                     </p>

                     <div className="sentiment-meter-v2">
                        {[1,2,3,4,5,6,7,8].map(i => (
                          <div key={i} className={`sentiment-meter-step-v2 ${i <= 5 ? 'active' : ''}`} />
                        ))}
                     </div>
                  </div>
               </div>
            </section>

            <footer className="py-20 text-center opacity-30">
               <div className="w-10 h-1 bg-zinc-300 mx-auto mb-4 rounded-full" />
               <p className="text-[10px] font-black uppercase tracking-widest">Private Club Curation</p>
            </footer>
          </div>
        )}

      </main>

      {/* Floating Bottom Action Bar */}
      {!isPurchased && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="floating-bottom-bar"
        >
          <div className="flex flex-col">
             <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Accesso Pro</span>
             <span className="text-lg font-black text-zinc-900">€{plan.price.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={handlePurchase}
            disabled={isBuying}
            className="flex-1 h-14 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-zinc-900/20"
          >
            {isBuying ? "..." : "Sblocca Itinerario"}
            <CreditCard size={20} weight="duotone" />
          </button>
        </motion.div>
      )}

    </div>
  );
};

export default PlanDetail;
