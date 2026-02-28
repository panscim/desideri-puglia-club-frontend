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
  Info,
  ArrowRight,
  Clock
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
  const [vibeStatus, setVibeStatus] = useState('Analisi in corso...');

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
      const levels = ['Tranquillo', 'Vivace', '🔥 Picco Movida'];
      setVibeStatus(levels[recentVibe.vibe_level - 1] || 'Attivo');
    } else {
      setVibeStatus('Atmosfera Relax');
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
      toast.success('Esperienza sbloccata correttamente.');
      setIsPurchased(true);
    }
    setIsBuying(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
    </div>
  );

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-32">
      
      {/* Executive Static Header */}
      <nav className="sticky top-0 z-[100] exec-nav-blur px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-950 font-semibold hover:opacity-70 transition-opacity"
          >
            <CaretLeft size={20} weight="bold" />
            <span className="text-sm uppercase tracking-wider">Indietro</span>
          </button>
          
          <div className="hidden md:flex items-center gap-2">
             <div className="w-2 h-2 bg-orange-500 rounded-full" />
             <span className="text-[11px] font-bold text-zinc-500 tracking-[0.2em] uppercase">Puglia • Curation</span>
          </div>

          <div className="flex items-center gap-5 text-zinc-400">
            <Share size={20} className="hover:text-zinc-950 transition-colors cursor-pointer" />
            <DotsThreeCircle size={24} className="hover:text-zinc-950 transition-colors cursor-pointer" />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-12">
        
        {/* Hero Section: Clean & Professional */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24">
           
           <div className="lg:col-span-12">
             <div className="exec-card shadow-lg mb-12">
               <img 
                 src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
                 className="w-full h-[50vh] object-cover"
                 alt=""
               />
             </div>
           </div>

           <div className="lg:col-span-8">
              <div className="flex items-center gap-2 text-orange-600 mb-6">
                <MapPin size={18} weight="fill" />
                <span className="text-sm font-bold uppercase tracking-widest">{plan.city}, Puglia</span>
              </div>
              <h1 className="text-exec-header text-4xl md:text-6xl text-zinc-950 mb-8 lowercase first-letter:uppercase">
                {plan.title_it}
              </h1>
              <p className="text-exec-body text-xl text-zinc-600 leading-relaxed mb-10">
                {plan.description_it}
              </p>
           </div>

           <div className="lg:col-span-4 lg:sticky lg:top-28">
              <div className="exec-card p-8 bg-white">
                 <div className="flex items-center justify-between mb-6">
                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Esperienza</span>
                    <Info size={18} className="text-zinc-300" />
                 </div>
                 
                 {!isPurchased ? (
                   <div>
                     <div className="text-3xl font-bold text-zinc-950 mb-2">€{plan.price.toFixed(2)}</div>
                     <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                        Sblocca l'itinerario completo curato dai nostri local resident.
                     </p>
                     <button 
                       onClick={handlePurchase}
                       disabled={isBuying}
                       className="w-full h-14 bg-zinc-950 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                     >
                       {isBuying ? "Elaborazione..." : "Sblocca Ora"}
                       <ArrowRight size={18} weight="bold" />
                     </button>
                   </div>
                 ) : (
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 text-green-600 font-bold">
                        <LockKey size={20} weight="fill" />
                        <span>Contenuto sbloccato</span>
                      </div>
                      <button 
                         onClick={() => setIsRainMode(!isRainMode)}
                         className={`w-full py-3 rounded-xl flex items-center justify-center gap-3 border transition-all ${isRainMode ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
                      >
                         {isRainMode ? <CloudRain size={20} weight="fill" /> : <Sun size={20} weight="bold" />}
                         <span className="text-sm font-bold uppercase tracking-widest">
                           {isRainMode ? 'Piano B Attivo' : 'Cerca Piano B'}
                         </span>
                      </button>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {isPurchased && (
          <div className="max-w-4xl mx-auto space-y-24">
            
            <div className="border-t border-zinc-200 pt-24">
              <h2 className="text-exec-header text-3xl text-zinc-950 mb-16 uppercase tracking-wider text-center">
                L'Itinerario
              </h2>

              <div className="space-y-16">
                {plan.slots?.map((slot, index) => (
                  <div key={slot.id} className="relative pl-12 md:pl-0">
                    
                    {/* Professional Timeline Dot */}
                    <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-4">
                       <div className="exec-timeline-marker" />
                       {index !== plan.slots.length - 1 && <div className="exec-timeline-line" />}
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 items-start ${index % 2 === 0 ? 'md:text-right' : 'md:flex-row-reverse'}`}>
                       
                       {/* Left Content (Time) */}
                       <div className={`${index % 2 === 0 ? 'md:order-1' : 'md:order-2 md:text-left'}`}>
                          <div className="flex items-center gap-3 justify-start md:justify-end mb-4">
                             <Clock size={16} className="text-zinc-300" />
                             <span className="text-2xl font-bold text-zinc-300">{slot.time_label}</span>
                          </div>
                       </div>

                       {/* Right Content (Activity Card) */}
                       <div className={`exec-card p-8 bg-white border-0 shadow-sm hover:shadow-md transition-shadow ${index % 2 === 0 ? 'md:order-2 md:text-left' : 'md:order-1 md:text-right'}`}>
                          <AnimatePresence mode="wait">
                             {isRainMode && slot.alt_activity_title_it ? (
                               <motion.div 
                                 key="alt"
                                 initial={{ opacity: 0, y: 5 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="exec-rain-hint pl-6 py-2"
                               >
                                  <div className="flex items-center gap-2 mb-3 text-blue-600">
                                    <CloudRain size={16} weight="fill" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest italic">Opzione Pioggia</span>
                                  </div>
                                  <h4 className="text-exec-header text-2xl text-zinc-950 mb-3 lowercase first-letter:uppercase">{slot.alt_activity_title_it}</h4>
                                  <p className="text-exec-body text-zinc-500 text-sm leading-relaxed">{slot.alt_activity_description_it}</p>
                               </motion.div>
                             ) : (
                               <motion.div 
                                 key="main"
                                 initial={{ opacity: 0, y: 5 }}
                                 animate={{ opacity: 1, y: 0 }}
                               >
                                  <h4 className="text-exec-header text-2xl text-zinc-950 mb-3 lowercase first-letter:uppercase">{slot.activity_title_it}</h4>
                                  <p className="text-exec-body text-zinc-500 text-sm leading-relaxed">{slot.activity_description_it}</p>
                               </motion.div>
                             )}
                          </AnimatePresence>

                          <div className={`mt-8 flex items-center ${index % 2 === 0 ? 'justify-start' : 'md:justify-end justify-start'}`}>
                            <button 
                              onClick={() => {
                                const url = `https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`;
                                window.open(url, '_blank');
                              }}
                              className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-orange-600 transition-colors flex items-center gap-2"
                            >
                              Apri in Mappa <Compass size={14} weight="fill" />
                            </button>
                          </div>
                       </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar Movida - Executive Dashboard View */}
            <section className="mt-40 border-t border-zinc-200 pt-32 mb-20">
               <div className="exec-card-dark p-12 relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="relative z-10 flex flex-col gap-6">
                     <div className="flex items-center gap-3 justify-center md:justify-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <span className="text-[10px] font-bold text-zinc-500 tracking-[0.3em] uppercase">Private Live Intelligence</span>
                     </div>
                     
                     <h2 className="text-exec-header text-4xl text-white">
                        VIBE REPORT: <br/>
                        <span className="text-orange-500 uppercase">{vibeStatus}</span>
                     </h2>

                     <p className="text-zinc-500 text-sm max-w-[40ch] leading-relaxed">
                        Sistema di monitoraggio in tempo reale basato sui residenti attivi in zona. Aggiornato ogni 5 minuti.
                     </p>
                  </div>

                  <div className="relative z-10 hidden md:block opacity-10">
                    <Wine size={160} weight="fill" className="text-white" />
                  </div>
               </div>
            </section>

            <footer className="py-20 text-center">
               <p className="text-zinc-300 text-xs font-bold uppercase tracking-[0.4em]">Fine della Curation DESIDERI</p>
            </footer>
          </div>
        )}

      </main>
    </div>
  );
};

export default PlanDetail;
