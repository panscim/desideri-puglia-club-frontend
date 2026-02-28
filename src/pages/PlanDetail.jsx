import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConciergeService } from '../services/concierge';
import { useAuth } from '../contexts/AuthContext';
import { 
  CaretLeft, 
  MapPin, 
  CloudRain, 
  Sun, 
  NavigationArrow, 
  LockKey, 
  CheckCircle, 
  Clock,
  ArrowRight,
  Trophy,
  CreditCard,
  Quotes
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

  useEffect(() => {
    loadPlan();
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

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Accedi per acquistare il piano');
      navigate('/login');
      return;
    }

    setIsBuying(true);
    // Simulating a purchase (calling our RPC)
    const result = await ConciergeService.purchasePlan(user.id, id);
    if (result.success) {
      toast.success('Acquisto completato! Benvenuto in Puglia.');
      setIsPurchased(true);
    } else {
      toast.error(result.error || 'Errore durante l\'acquisto');
    }
    setIsBuying(false);
  };

  const handleOpenMap = (slot) => {
    if (!slot.latitude || !slot.longitude) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`;
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin mb-4" />
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Preparando il tuo itinerario...</p>
    </div>
  );

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-[#F9F9F7] font-sans selection:bg-orange-500/30 pb-20 overflow-x-hidden">
      
      {/* Dynamic Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] p-6 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-xl border border-black/5 flex items-center justify-center text-slate-900 pointer-events-auto shadow-xl active:scale-95 transition-all"
        >
          <CaretLeft size={24} weight="bold" />
        </button>

        {isPurchased && (
          <button 
            onClick={() => setIsRainMode(!isRainMode)}
            className={`h-12 px-6 rounded-2xl backdrop-blur-xl flex items-center gap-3 pointer-events-auto shadow-xl active:scale-95 transition-all border ${
              isRainMode 
                ? 'bg-blue-600 text-white border-blue-400/30' 
                : 'bg-white/80 text-orange-500 border-orange-200'
            }`}
          >
            {isRainMode ? <CloudRain size={20} weight="fill" /> : <Sun size={20} weight="fill" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isRainMode ? 'Piano B: Pioggia' : 'Modalità Sole'}
            </span>
          </button>
        )}
      </header>

      {/* Hero Section */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F9F9F7] via-[#F9F9F7]/20 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center mt-10">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 bg-orange-500/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 border border-orange-500/20 mb-6"
          >
            Local Itinerary
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-serif font-black text-slate-900 leading-[0.9] max-w-[12ch] mb-6 drop-shadow-sm"
          >
            {plan.title_it}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest"
          >
            <div className="flex items-center gap-1.5"><MapPin size={18} className="text-orange-500" /> {plan.city}</div>
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
            <div className="flex items-center gap-1.5"><Trophy size={18} className="text-orange-500" /> {plan.rating_avg > 0 ? plan.rating_avg.toFixed(1) : 'Migliore'}</div>
          </motion.div>
        </div>
      </div>

      <main className="px-6 -mt-10 relative z-10 max-w-lg mx-auto">
        
        {/* Intro Card */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-2xl mb-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <Quotes size={48} weight="fill" className="text-slate-100 absolute bottom-8 right-8" />
          
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">L'Esperienza</h2>
          <p className="text-lg font-serif italic text-slate-700 leading-relaxed relative">
            "{plan.description_it}"
          </p>

          <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={plan.creator?.foto_profilo || '/logo.png'} className="w-10 h-10 rounded-full border border-black/5 p-0.5 object-cover" alt="" />
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Created by</p>
                <p className="text-sm font-bold text-slate-900 leading-none">{plan.creator?.nickname}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100">
               <CheckCircle size={14} weight="fill" /> Local Verified
            </div>
          </div>
        </section>

        {/* Timeline vs Purchase Overlay */}
        <div className="relative">
          
          {!isPurchased && (
            <div className="absolute inset-0 z-50 bg-gradient-to-t from-[#F9F9F7] via-[#F9F9F7] transform translate-y-20 flex flex-col items-center pt-20">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-8 border border-black/5">
                 <LockKey size={40} weight="fill" className="text-orange-500 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Itinerario Pro</h3>
              <p className="text-center text-slate-500 text-sm max-w-[28ch] mb-10 font-bold leading-relaxed">
                Sblocca i segreti della Puglia e attiva la "Modalità Pioggia" con un click.
              </p>
              
              <button 
                onClick={handlePurchase}
                disabled={isBuying}
                className="w-full bg-slate-900 text-white h-18 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.2)] active:scale-95 transition-all disabled:opacity-50"
              >
                {isBuying ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard size={24} weight="bold" />
                    Sblocca per €{plan.price.toFixed(2)}
                  </>
                )}
              </button>
              <p className="mt-6 text-[10px] text-slate-400 font-black uppercase tracking-widest">Accesso illimitato al piano</p>
            </div>
          )}

          {/* Actual Timeline (Blurred if not purchased) */}
          <section className={`transition-all duration-700 ${!isPurchased ? 'blur-md pointer-events-none opacity-40 select-none' : 'opacity-100'}`}>
            <div className="flex flex-col gap-16 relative pb-20">
              
              {/* Vertical Connector Line */}
              <div className="absolute left-[23px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-orange-500/20 via-orange-500/40 to-orange-500/10" />

              {plan.slots?.map((slot, index) => (
                <motion.div 
                  key={slot.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="flex gap-6 items-start group"
                >
                  {/* Timeline Dot / Time */}
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 border ${
                      isRainMode 
                        ? 'bg-blue-600 border-blue-400/30 text-white animate-pulse' 
                        : 'bg-white border-black/5 text-slate-900'
                    }`}>
                      <Clock size={20} weight="bold" />
                    </div>
                    <span className="absolute top-14 left-0 w-12 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {slot.time_label}
                    </span>
                  </div>

                  {/* Activity Card */}
                  <div className="flex-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isRainMode ? 'rain' : 'sun'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className={`rounded-[2.5rem] overflow-hidden border transition-all duration-500 ${
                          isRainMode 
                            ? 'bg-blue-50 border-blue-200 shadow-xl shadow-blue-900/5' 
                            : 'bg-white border-black/5 shadow-2xl shadow-slate-200'
                        }`}
                      >
                        <div className="relative aspect-video">
                          <img 
                            src={(isRainMode && slot.alt_activity_image_url) ? slot.alt_activity_image_url : (slot.activity_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366')} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            alt=""
                          />
                          <div className={`absolute inset-0 opacity-40 mix-blend-multiply ${isRainMode ? 'bg-blue-900' : 'bg-slate-900'}`} />
                          
                          <div className="absolute top-4 left-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md ${
                              isRainMode 
                                ? 'bg-blue-500/20 border-white/20 text-white' 
                                : 'bg-white/20 border-white/20 text-white'
                            }`}>
                              {slot.type}
                            </span>
                          </div>
                        </div>

                        <div className="p-8">
                          <h3 className={`text-xl font-bold mb-3 transition-colors duration-500 ${isRainMode ? 'text-blue-900' : 'text-slate-900'}`}>
                            {isRainMode ? (slot.alt_activity_title_it || slot.activity_title_it) : slot.activity_title_it}
                          </h3>
                          <p className={`text-xs leading-relaxed font-medium mb-8 transition-colors duration-500 ${isRainMode ? 'text-blue-700/80' : 'text-slate-500'}`}>
                            {isRainMode ? (slot.alt_activity_description_it || slot.activity_description_it) : slot.activity_description_it}
                          </p>

                          <button 
                            onClick={() => handleOpenMap(slot)}
                            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                              isRainMode 
                                ? 'bg-blue-600 text-white shadow-blue-500/20' 
                                : 'bg-slate-900 text-white shadow-slate-400/20'
                            }`}
                          >
                            <NavigationArrow size={18} weight="fill" />
                            Naviga verso la tappa
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                </motion.div>
              ))}

              {/* End of Journey */}
              <div className="flex flex-col items-center py-10 opacity-40">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mb-4" />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mb-4" />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mb-8" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fine della Regia</p>
              </div>

            </div>
          </section>

        </div>
      </main>

    </div>
  );
};

export default PlanDetail;
