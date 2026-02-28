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
  Check,
  Share,
  DotsThreeCircle,
  PencilCircle,
  Wine,
  Sparkle
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
  const [vibeStatus, setVibeStatus] = useState('Analizzando...');

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
      const levels = ['Tranquillo', 'Vivace', '🔥 Pieno Murato'];
      setVibeStatus(levels[recentVibe.vibe_level - 1] || 'Live');
    } else {
      setVibeStatus('Calmo');
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Accedi per sbloccare la nota');
      navigate('/login');
      return;
    }
    setIsBuying(true);
    const result = await ConciergeService.purchasePlan(user.id, id);
    if (result.success) {
      toast.success('Nota sbloccata correttamente.');
      setIsPurchased(true);
    }
    setIsBuying(false);
  };

  if (loading) return (
    <div className="min-h-screen apple-note-bg flex flex-col items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-10 h-10 border-2 border-stone-200 rounded-full flex items-center justify-center"
      >
        <div className="w-6 h-6 border-2 border-stone-300 rounded-full border-t-stone-800 animate-spin" />
      </motion.div>
    </div>
  );

  if (!plan) return null;

  return (
    <div className="min-h-screen apple-note-bg pb-32 selection:bg-[#ffcc00]/30 selection:text-black">
      
      {/* Top Navbar Style (Apple Notes) */}
      <header className="sticky top-0 z-[100] apple-note-bg/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-stone-200/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="text-[#ffcc00] flex items-center gap-1 font-medium active:opacity-50 transition-opacity"
          >
            <CaretLeft size={24} weight="bold" />
            <span className="text-lg">Note</span>
          </button>
        </div>
        
        <div className="flex items-center gap-6 text-[#ffcc00]">
          <Share size={24} />
          {isPurchased && (
            <button onClick={() => setIsRainMode(!isRainMode)}>
              {isRainMode ? <CloudRain size={24} weight="fill" /> : <Sun size={24} weight="bold" />}
            </button>
          )}
          <DotsThreeCircle size={28} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-10">
        
        {/* Date / Metadata Info */}
        <div className="text-center mb-8">
           <p className="text-stone-400 text-sm font-medium uppercase tracking-widest mb-2">
             {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })} alle {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
           </p>
           <h1 className="font-pencil text-5xl text-stone-800 leading-tight mb-4">
             {plan.title_it}
           </h1>
           <div className="flex items-center justify-center gap-2 text-stone-500 font-medium">
             <MapPin size={18} weight="fill" className="text-stone-300" />
             <span>Puglia, {plan.city}</span>
           </div>
        </div>

        {/* Note Content Section */}
        <div className="space-y-8">
          
          {/* Cover Image as "Note Attachment" */}
          <div className="note-attachment group">
            <img 
              src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
              className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-700"
              alt=""
            />
          </div>

          {/* Description Section */}
          <section className="relative px-2">
            <p className="text-xl text-stone-700 leading-relaxed font-normal">
              {plan.description_it}
            </p>
            <div className="mt-4 flex items-center gap-3">
               <img src={plan.creator?.avatar_url || '/logo.png'} className="w-8 h-8 rounded-full border border-stone-200" alt="" />
               <span className="text-sm text-stone-400 font-medium italic">Nota di {plan.creator?.nickname}</span>
            </div>
          </section>

          <div className="note-hr" />

          {/* Locked State CTA */}
          {!isPurchased && (
            <div className="bg-stone-100/50 rounded-2xl p-10 text-center border border-dashed border-stone-300">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-stone-200 flex items-center justify-center mx-auto mb-6">
                <LockKey size={32} className="text-[#ffcc00]" />
              </div>
              <h3 className="text-2xl font-bold text-stone-800 mb-2 font-pencil">Questa nota è protetta</h3>
              <p className="text-stone-500 mb-8 max-w-[30ch] mx-auto leading-relaxed">
                Sblocca l'itinerario completo dei locali e delle esperienze segrete suggerite dai residenti.
              </p>
              
              <button 
                onClick={handlePurchase}
                disabled={isBuying}
                className="w-full max-w-sm bg-[#ffcc00] text-white h-16 rounded-full font-bold text-lg shadow-xl shadow-[#ffcc00]/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {isBuying ? "Sbloccando..." : `Sblocca Nota per €${plan.price.toFixed(2)}`}
              </button>
            </div>
          )}

          {/* Checklist / Itinerary Section */}
          {isPurchased && (
            <div className="space-y-12">
               <h2 className="text-2xl font-pencil text-stone-800 mb-6 flex items-center gap-3">
                 <PencilCircle size={28} weight="fill" className="text-[#ffcc00]" />
                 Piano d'Azione
               </h2>

               <div className="space-y-10">
                 {plan.slots?.map((slot, index) => (
                   <motion.div 
                     key={slot.id}
                     initial={{ opacity: 0, x: -10 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     className="flex gap-6"
                   >
                     {/* Apple Checklist Circle */}
                     <div className="flex-shrink-0 pt-1">
                        <div className={`checklist-circle ${index === 0 ? 'checked' : ''}`}>
                          {index === 0 && <Check size={14} weight="bold" className="text-white" />}
                        </div>
                     </div>

                     {/* Slot Detail */}
                     <div className="flex-grow space-y-4">
                        <header className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#ffcc00] uppercase tracking-widest">{slot.time_label}</span>
                          <button 
                            onClick={() => {
                              const url = `https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`;
                              window.open(url, '_blank');
                            }}
                            className="bg-stone-50 p-2 rounded-full text-stone-400 hover:text-[#ffcc00] transition-colors"
                          >
                            <Compass size={20} weight="fill" />
                          </button>
                        </header>

                        {/* Note Attachment Card for Slot */}
                        <div className="note-attachment bg-white p-6 relative">
                           <AnimatePresence mode="wait">
                             {isRainMode && slot.alt_activity_title_it ? (
                               <motion.div 
                                 key="alt"
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 exit={{ opacity: 0 }}
                                 className="text-stone-800"
                               >
                                  <div className="flex items-center gap-2 mb-3">
                                    <CloudRain size={16} weight="fill" className="text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Nota Pioggia (Piano B)</span>
                                  </div>
                                  <h4 className="text-xl font-bold mb-2 text-blue-900">{slot.alt_activity_title_it}</h4>
                                  <p className="text-stone-600 leading-relaxed font-normal">{slot.alt_activity_description_it}</p>
                               </motion.div>
                             ) : (
                               <motion.div 
                                 key="main"
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 exit={{ opacity: 0 }}
                               >
                                  <h4 className="text-xl font-bold mb-2 text-stone-800">{slot.activity_title_it}</h4>
                                  <p className="text-stone-600 leading-relaxed font-normal">{slot.activity_description_it}</p>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </div>
                     </div>
                   </motion.div>
                 ))}
               </div>

               <div className="note-hr" />

               {/* Radar Movida - Monolithic Box Style */}
               <section className="note-attachment bg-stone-900 text-white p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_green]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live</span>
                  </div>
                  
                  <Wine size={120} weight="fill" className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
                  
                  <div className="relative z-10">
                    <h4 className="text-[#ffcc00] font-bold text-sm uppercase tracking-widest mb-2">Radar Movida</h4>
                    <h3 className="text-3xl font-pencil mb-4">Itinerario: <span className="underline decoration-stone-600 underline-offset-8">{vibeStatus}</span></h3>
                    <p className="text-stone-400 text-sm leading-relaxed max-w-[40ch]">
                      Analisi automatica basata sui residenti attivi in Puglia. 
                      Questa nota si aggiorna ogni 5 minuti.
                    </p>
                  </div>
               </section>

               <footer className="py-20 text-center">
                 <div className="w-2 h-2 bg-stone-200 rounded-full mx-auto mb-4" />
                 <p className="text-stone-300 font-medium text-sm">Fine della nota</p>
               </footer>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default PlanDetail;
