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
  ArrowRight,
  Clock,
  Waves
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
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
      setVibeStatus('ATMOSFERA RELAX');
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
      toast.success('Esperienza Sbloccata correttamente.');
      setIsPurchased(true);
    }
    setIsBuying(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-zinc-100 border-t-orange-500 rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Desideri Puglia...</span>
    </div>
  );

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-[#F9F9F7] font-satoshi text-zinc-900 pb-20">
      
      {/* Header Premium Polished */}
      <nav className="sticky top-0 z-[100] premium-nav-blur px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="group flex items-center gap-3 text-zinc-900 font-black hover:opacity-60 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
              <CaretLeft size={20} weight="bold" />
            </div>
            <span className="text-xs uppercase tracking-[0.2em]">Curation</span>
          </button>
          
          <div className="flex items-center gap-8">
            <Share size={24} weight="duotone" className="text-zinc-400 hover:text-zinc-900 cursor-pointer transition-all active:scale-90" />
            <DotsThreeCircle size={28} weight="duotone" className="text-zinc-400 hover:text-zinc-900 cursor-pointer transition-all active:scale-90" />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-16">
        
        {/* Hero Section: Extreme Polish */}
        <header className="mb-32">
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[3rem] overflow-hidden mb-16 shadow-premium-xl group">
            <img 
              src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
            
            <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 text-orange-400 mb-4 animate-pulse">
                  <MapPin size={22} weight="fill" />
                  <span className="text-xs font-black uppercase tracking-[0.3em]">{plan.city}, Puglia</span>
                </div>
                <h1 className="text-5xl md:text-8xl text-white font-black leading-[0.9] drop-shadow-2xl lowercase first-letter:uppercase">
                  {plan.title_it}
                </h1>
              </div>
              
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-3xl">
                 <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Copertura Live Attiva</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-20 items-start px-4">
            <div className="md:col-span-8">
              <p className="text-xl md:text-2xl text-zinc-500 font-medium leading-relaxed max-w-3xl">
                {plan.description_it}
              </p>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end">
               <div className="flex items-center gap-4 px-8 py-4 bg-white rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                    <CheckCircle size={28} weight="duotone" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1.5">Garanzia</p>
                    <p className="text-sm font-bold text-zinc-900 leading-none">Local Verified</p>
                  </div>
               </div>
            </div>
          </div>
        </header>

        {/* Content Flow */}
        <div className="relative">
          
          {/* Purchase Experience: Polished */}
          {!isPurchased && (
            <div className="absolute inset-x-0 -top-20 z-50 pt-32 flex flex-col items-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card-v1 p-16 text-center max-w-xl w-full bg-white shadow-premium-xl border-orange-500/5"
              >
                 <div className="w-20 h-20 bg-orange-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-orange-100">
                    <LockKey size={40} weight="duotone" className="text-orange-500" />
                 </div>
                 <h3 className="text-4xl font-black text-zinc-950 mb-6 lowercase first-letter:uppercase">Esperienza Pro</h3>
                 <p className="text-zinc-500 text-lg font-medium mb-12 leading-relaxed">
                   Sblocca l'itinerario completo dei nostri *Local Resident*. Include posizioni segrete e il Piano B per ogni meteo.
                 </p>
                 <button 
                   onClick={handlePurchase}
                   disabled={isBuying}
                   className="group w-full h-20 bg-zinc-950 text-white rounded-[2rem] font-black text-base uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-black transition-all active:scale-95 disabled:opacity-50 overflow-hidden relative"
                 >
                   <AnimatePresence mode="wait">
                     {isBuying ? (
                       <motion.span key="loading" initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-3">
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         Elaborazione...
                       </motion.span>
                     ) : (
                       <motion.span key="button" initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-3">
                         Sblocca Ora — €{plan.price.toFixed(2)}
                         <CreditCard size={24} weight="duotone" />
                       </motion.span>
                     )}
                   </AnimatePresence>
                 </button>
              </motion.div>
              
              {/* Visual Preview */}
              <div className="mt-[-250px] w-full opacity-10 blur-xl pointer-events-none select-none grayscale">
                 {[1,2,3].map(i => (
                   <div key={i} className="premium-card-v1 h-60 mb-16" />
                 ))}
              </div>
            </div>
          )}

          {/* Recovered v1 Itinerary: Polished Spacing */}
          {isPurchased && (
            <div className="space-y-24">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-24 px-4">
                 <div className="flex items-center gap-4">
                   <div className="w-2 h-8 bg-zinc-950 rounded-full" />
                   <h2 className="text-3xl font-black text-zinc-950 uppercase tracking-tighter">L'Itinerario</h2>
                 </div>

                 <button 
                   onClick={() => setIsRainMode(!isRainMode)}
                   className={`h-14 px-10 rounded-[2rem] flex items-center gap-4 border-2 transition-all shadow-sm hover:shadow-md ${isRainMode ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white border-zinc-100 text-zinc-600'}`}
                 >
                   {isRainMode ? <CloudRain size={24} weight="duotone" /> : <Sun size={24} weight="duotone" />}
                   <span className="text-xs font-black uppercase tracking-[0.2em]">
                     {isRainMode ? 'Piano B Attivo' : 'Cerca Piano B'}
                   </span>
                 </button>
              </div>

              <div className="space-y-20 relative px-4">
                {/* Visual Line: More Subtle */}
                <div className="absolute left-[27px] top-10 bottom-10 w-[2px] bg-zinc-100" />

                {plan.slots?.map((slot, index) => (
                  <motion.div 
                    key={slot.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex gap-12 relative"
                  >
                     {/* Time Marker: Polished */}
                     <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-premium-xl border transition-all duration-700 ${isRainMode ? 'bg-blue-600 border-blue-400 text-white animate-pulse' : 'bg-white border-zinc-50 text-zinc-950'}`}>
                           <Clock size={24} weight="duotone" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 bg-white px-2 py-1">{slot.time_label}</span>
                     </div>

                     {/* Content Card v1: Polished Padding & Text */}
                     <div className={`flex-1 premium-card-v1 p-10 md:p-12 hover:border-zinc-200 ${isRainMode && slot.alt_activity_title_it ? 'rain-mode-b-bg' : 'bg-white'}`}>
                        <AnimatePresence mode="wait">
                          {isRainMode && slot.alt_activity_title_it ? (
                            <motion.div 
                              key="rain"
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -15 }}
                            >
                               <div className="flex items-center gap-3 mb-6 text-blue-600">
                                  <CloudRain size={20} weight="duotone" />
                                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Alternativa Pioggia</span>
                               </div>
                               <h4 className="text-3xl md:text-4xl font-black text-blue-950 mb-6 lowercase first-letter:uppercase leading-tight">{slot.alt_activity_title_it}</h4>
                               <p className="text-lg text-blue-800/60 font-medium leading-relaxed mb-10 italic">{slot.alt_activity_description_it}</p>
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="sun"
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -15 }}
                            >
                               <h4 className="text-3xl md:text-4xl font-black text-zinc-950 mb-6 lowercase first-letter:uppercase leading-tight">{slot.activity_title_it}</h4>
                               <p className="text-lg text-zinc-500 font-medium leading-relaxed mb-10">{slot.activity_description_it}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <button 
                            onClick={() => {
                              const url = `https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`;
                              window.open(url, '_blank');
                            }}
                            className={`w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all shadow-lg active:scale-95 ${isRainMode ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-zinc-950 text-white hover:bg-black shadow-zinc-900/10'}`}
                          >
                            <Compass size={22} weight="duotone" />
                            Avvia Navigatore
                          </button>
                        </div>
                     </div>
                  </motion.div>
                ))}
              </div>

              {/* Radar Sentiment Dashboard: Extreme WOW */}
              <section className="mt-48 px-4">
                <div className="bg-zinc-950 rounded-[4rem] p-16 md:p-24 relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] group">
                  
                  {/* Visual Background Effects */}
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/5" />
                  <Waves size={300} weight="duotone" className="absolute -bottom-32 -left-32 text-white/5 opacity-40 group-hover:rotate-12 transition-transform duration-1000" />
                  
                  <div className="absolute top-12 right-12 flex items-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/10 backdrop-blur-md">
                    <div className="vibe-pulse" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em]">Analisi Real-Time</span>
                  </div>

                  <div className="relative z-10">
                     <div className="flex items-center gap-3 justify-center md:justify-start mb-10">
                        <Sparkle size={24} weight="fill" className="text-orange-500" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">Radar della Movida</h4>
                     </div>

                     <h2 className="text-5xl md:text-8xl font-black text-white mb-8 leading-[0.9] uppercase italic">
                        STATUS: <br/>
                        <span className="text-orange-500 underline decoration-white/10 underline-offset-[16px]">{vibeStatus}</span>
                     </h2>

                     <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed mb-16 opacity-80">
                        Dati basati sulla rete di *Resident Desideri* attivi sul territorio. Aggiornato ogni 5 minuti per garantirti la migliore "sentiment" della zona.
                     </p>

                     {/* Sentiment Level Meter 2.0 */}
                     <div className="max-w-xl">
                        <div className="flex justify-between items-end mb-4 px-1">
                           <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Atmosfera</span>
                              <span className="text-xs font-bold text-white uppercase tracking-widest">Tranquillo</span>
                           </div>
                           <div className="flex flex-col gap-1 items-end">
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Livello</span>
                              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Massima Movida</span>
                           </div>
                        </div>
                        <div className="sentiment-meter h-2 md:h-3">
                           {[1,2,3,4,5,6,7,8,9,10].map(i => (
                             <div key={i} className={`sentiment-meter-step ${i <= 7 ? 'active' : 'bg-white/5'}`} />
                           ))}
                        </div>
                     </div>
                  </div>
                </div>
              </section>

              <footer className="spacing-executive-xl text-center border-t border-zinc-100 pt-24">
                 <div className="w-16 h-2 bg-orange-500 rounded-full mx-auto mb-10 shadow-lg shadow-orange-500/20" />
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-300">Fine della Regia Desideri Puglia Club</p>
                 <p className="mt-4 text-[9px] font-bold text-zinc-300 uppercase italic">© 2026 Private Curation</p>
              </footer>
            </div>
          )}

        </div>

      </main>
    </div>
  );
};

export default PlanDetail;
