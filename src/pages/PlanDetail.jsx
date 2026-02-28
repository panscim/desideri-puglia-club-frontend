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
  Clock,
  Quotes,
  Pencil,
  Wine,
  Sparkle,
  ArrowRight
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
  const [vibeStatus, setVibeStatus] = useState('Analizzando vibrazioni...');

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
      toast.error('Accedi per sbloccare l\'itinerario');
      navigate('/login');
      return;
    }
    setIsBuying(true);
    const result = await ConciergeService.purchasePlan(user.id, id);
    if (result.success) {
      toast.success('Pianificatore sbloccato!');
      setIsPurchased(true);
    }
    setIsBuying(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20"
      >
        <Sparkle size={24} weight="fill" className="text-white" />
      </motion.div>
    </div>
  );

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-zinc-50 pb-32 font-sans selection:bg-orange-500/20">
      
      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-[100] p-6 pointer-events-none">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="pointer-events-auto w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-xl shadow-sm border border-black/5 flex items-center justify-center text-slate-900 active:scale-95 transition-all"
          >
            <CaretLeft size={24} weight="bold" />
          </button>

          {isPurchased && (
            <button 
              onClick={() => setIsRainMode(!isRainMode)}
              className={`pointer-events-auto h-12 px-5 rounded-2xl shadow-sm backdrop-blur-xl flex items-center gap-3 transition-all border ${
                isRainMode 
                  ? 'bg-blue-600 text-white border-blue-400' 
                  : 'bg-white/80 text-orange-600 border-black/5'
              }`}
            >
              {isRainMode ? <CloudRain size={20} weight="fill" /> : <Sun size={20} weight="fill" />}
              <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                {isRainMode ? 'Outdoor Off' : 'Outdoor On'}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[65vh] w-full overflow-hidden">
        <img 
          src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
          className="w-full h-full object-cover"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-lg mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white/50"
          >
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} weight="fill" className="text-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{plan.city}</span>
            </div>
            <h1 className="text-4xl font-black font-satoshi text-slate-900 leading-[0.9] tracking-tight mb-4">
              {plan.title_it}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-black/10">
                  <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover" alt="" />
                </div>
                <span className="text-xs font-bold text-slate-500">{plan.creator?.nickname}</span>
              </div>
              <div className="w-1 h-1 bg-zinc-300 rounded-full" />
              <span className="text-xs font-bold text-slate-400 capitalize">{plan.season.replace('_', ' ')}</span>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="px-6 max-w-lg mx-auto mt-8">
        
        {/* Description Card */}
        <section className="mb-12">
          <div className="relative p-6 bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
            <Quotes size={64} weight="fill" className="absolute -top-6 -right-6 text-zinc-100 rotate-12" />
            <p className="font-lora text-lg leading-relaxed text-slate-700 italic relative z-10">
              {plan.description_it}
            </p>
          </div>
        </section>

        {/* Purchase CTA Overlay */}
        {!isPurchased && (
          <div className="relative mb-12">
            <div className="absolute -inset-4 bg-zinc-50/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-black/5 shadow-xl">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center mb-6">
                <LockKey size={32} weight="duotone" className="text-orange-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Pianificatore Digitale</h3>
              <p className="text-sm text-slate-500 mb-8 max-w-[28ch] leading-relaxed font-medium">
                Sblocca l'itinerario completo ottimizzato per ogni condizione meteo.
              </p>
              
              <button 
                onClick={handlePurchase}
                disabled={isBuying}
                className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isBuying ? "Elaborazione..." : `Acquista ora — €${plan.price.toFixed(2)}`}
              </button>
            </div>
            
            {/* Blurred background content */}
            <div className="opacity-40 grayscale pointer-events-none blur-[2px]">
              {[1, 2].map(i => (
                <div key={i} className="mb-8 p-6 bg-white rounded-3xl border border-black/5">
                  <div className="w-24 h-4 bg-zinc-200 rounded-full mb-4" />
                  <div className="w-full h-20 bg-zinc-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* The Timeline */}
        {isPurchased && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
              <h2 className="text-xl font-black font-satoshi text-slate-900 uppercase tracking-tight">Timeline</h2>
            </div>

            <div className="relative border-l-2 border-zinc-100 ml-4 pl-8 space-y-12">
              {plan.slots?.map((slot, index) => (
                <motion.div 
                  key={slot.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative group"
                >
                  {/* Timeline Dot */}
                  <div className="absolute -left-[41px] top-4">
                    <div className={`w-5 h-5 rounded-full border-4 border-zinc-50 transition-colors duration-500 shadow-sm ${isRainMode ? 'bg-blue-500' : 'bg-orange-500'}`} />
                  </div>

                  {/* Slot Card */}
                  <div className="relative bg-white rounded-[2rem] p-6 shadow-sm border border-black/5 overflow-hidden">
                    
                    {/* Activity Container */}
                    <div className="relative min-h-[120px]">
                      <AnimatePresence mode="wait">
                        {!isRainMode || !slot.alt_activity_title_it ? (
                          <motion.div
                            key="activity-a"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="transition-all"
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-3 block">
                              {slot.time_label}
                            </span>
                            <h4 className="text-2xl font-black font-satoshi text-slate-900 leading-tight mb-2">
                              {slot.activity_title_it}
                            </h4>
                            <p className="text-[15px] font-medium leading-relaxed text-zinc-500">
                              {slot.activity_description_it}
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="activity-b"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-blue-50 -mx-6 -mt-6 p-6 transition-all"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <CloudRain size={16} weight="fill" className="text-blue-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                                Piano B • {slot.time_label}
                              </span>
                            </div>
                            <h4 className="text-2xl font-black font-satoshi text-blue-900 leading-tight mb-2">
                              {slot.alt_activity_title_it}
                            </h4>
                            <p className="text-[15px] font-medium leading-relaxed text-blue-700/70">
                              {slot.alt_activity_description_it}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button 
                        onClick={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`;
                          window.open(url, '_blank');
                        }}
                        className="mt-6 w-full h-14 rounded-2xl bg-zinc-50 border border-black/5 flex items-center justify-between px-6 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300"
                      >
                         <span className="text-[10px] font-black uppercase tracking-widest">Vai alla posizione</span>
                         <Compass size={20} weight="bold" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Radar Movida Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="mt-16 p-8 bg-zinc-900 rounded-[2.5rem] relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-8 flex flex-col gap-2 items-end">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Live Pulse</span>
              </div>

              <Wine size={120} weight="duotone" className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkle size={18} weight="fill" className="text-orange-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Radar della Movida</h4>
                </div>
                
                <h3 className="text-3xl font-black text-white mb-2 font-satoshi">
                  Status: <span className="text-orange-500">{vibeStatus}</span>
                </h3>
                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                  Basato sui report in tempo reale dei residenti del Desideri Puglia Club.
                </p>

                <div className="mt-8 flex gap-2">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-orange-500' : 'bg-zinc-800'}`} />
                   ))}
                </div>
              </div>
            </motion.div>

            <div className="py-20 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">Buon Viaggio</span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default PlanDetail;
