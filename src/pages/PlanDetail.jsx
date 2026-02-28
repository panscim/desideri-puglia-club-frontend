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
  Wine,
  Sparkle,
  ArrowDown,
  Circle,
  Star,
  Cloud,
  Fish,
  Ghost // Using as octopus/squid placeholder
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// --- SVG Filter for Wobbly/Hand-drawn lines ---
const WobblyFilter = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }}>
    <filter id="wobble">
      <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="4" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
    </filter>
  </svg>
);

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
      toast.error('Accedi per sbloccare il diario');
      navigate('/login');
      return;
    }
    setIsBuying(true);
    const result = await ConciergeService.purchasePlan(user.id, id);
    if (result.success) {
      toast.success('Diario sbloccato! Buon viaggio.');
      setIsPurchased(true);
    }
    setIsBuying(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center">
      <motion.div 
        animate={{ rotate: [0, 5, -5, 0] }} 
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-16 h-16 text-biro mb-4 opacity-30"
      >
        <Sparkle size={64} weight="fill" />
      </motion.div>
      <p className="font-sketch text-lg text-biro">Sfogliando il diario...</p>
    </div>
  );

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-paper pb-32 overflow-x-hidden selection:bg-yellow-200">
      <WobblyFilter />
      
      {/* Hand-drawn Page Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] p-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-full bg-white shadow-lg border-2 border-biro/10 flex items-center justify-center text-biro active:scale-90 transition-all"
        >
          <CaretLeft size={24} weight="bold" />
        </button>

        {isPurchased && (
          <button 
            onClick={() => setIsRainMode(!isRainMode)}
            className={`h-12 px-6 rounded-lg shadow-lg flex items-center gap-3 transition-all border-2 rotate-1 ${
              isRainMode 
                ? 'bg-blue-600 text-white border-blue-400' 
                : 'bg-white text-orange-600 border-orange-200'
            }`}
          >
            {isRainMode ? <CloudRain size={20} weight="fill" /> : <Sun size={20} weight="fill" />}
            <span className="font-sketch text-sm uppercase">
              {isRainMode ? 'Outdoor Off' : 'Outdoor On'}
            </span>
          </button>
        )}
      </header>

      {/* Hero Section: Polaroid Taped */}
      <div className="pt-28 px-6 mb-16 flex flex-col items-center relative">
        {/* Decor Doodles */}
        <div className="absolute top-20 left-4 rotate-12 opacity-20"><Cloud size={40} className="text-biro" /></div>
        <div className="absolute top-32 right-8 -rotate-12 opacity-20"><Star size={24} className="text-biro" /></div>

        <motion.div 
          initial={{ rotate: -5, y: 20 }}
          animate={{ rotate: -2, y: 0 }}
          className="polaroid relative z-10 max-w-[340px]"
        >
          {/* Tape Pieces */}
          <div className="tape top-[-10px] left-[-20px] rotate-[-45deg] bg-white/40" />
          <div className="tape top-[-5px] right-[-15px] rotate-[30deg] bg-white/40 opacity-70" />
          
          <img 
            src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
            className="w-full aspect-square object-cover"
            alt=""
          />
          <div className="mt-8 text-center">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 block mb-1">Puglia, Italy</span>
             <h1 className="font-sketch text-4xl text-biro leading-none tracking-tight">
               {plan.title_it}
             </h1>
          </div>
        </motion.div>

        {/* Location Tag */}
        <div className="mt-8 bg-yellow-100/50 px-6 py-2 border-2 border-dashed border-biro/20 rounded-full rotate-2">
           <p className="font-hand text-xl text-biro/60 italic flex items-center gap-2">
             <MapPin size={18} weight="fill" /> Appunti da {plan.city}
           </p>
        </div>
      </div>

      <main className="px-6 max-w-lg mx-auto">
        
        {/* Intro Note - Taped Paper */}
        <section className="relative mb-20 px-4">
          <div className="bg-white/40 border border-biro/10 p-8 rounded-3xl rotate-[-1deg] shadow-sm relative overflow-hidden">
             <div className="tape-vertical tape top-[-30px] left-[50%] -translate-x-1/2 opacity-50 bg-white/60" />
             <Quotes size={48} className="text-biro/10 absolute -top-4 -left-4" />
             <p className="font-hand text-2xl text-biro leading-tight text-center relative z-10 italic">
               "{plan.description_it}"
             </p>
             <div className="mt-8 flex flex-col items-center gap-2">
               <div className="w-14 h-14 rounded-full border-2 border-biro/20 overflow-hidden shadow-md">
                  <img src={plan.creator?.avatar_url || '/logo.png'} className="w-full h-full object-cover" alt="" />
               </div>
               <p className="font-sketch text-biro underline decoration-wavy decoration-biro/20">Creato da {plan.creator?.nickname}</p>
            </div>
          </div>
        </section>

        {/* Purchase CTA - Torn Paper Look */}
        {!isPurchased && (
          <div className="pb-24 flex flex-col items-center">
            <div className="w-24 h-24 bg-biro/5 rounded-full border-2 border-dashed border-biro/20 flex items-center justify-center mb-8">
               <LockKey size={40} className="text-biro/20" />
            </div>
            <h3 className="font-sketch text-3xl text-biro mb-2">Diario Sigillato</h3>
            <p className="font-hand text-xl text-biro/50 text-center max-w-[24ch] mb-10 leading-snug">
              Sblocca l'intero taccuino e scopri i posti preferiti dai residenti.
            </p>
            
            <button 
              onClick={handlePurchase}
              disabled={isBuying}
              className="w-full bg-biro text-white h-18 py-6 rounded-xl font-sketch text-2xl flex items-center justify-center gap-4 shadow-2xl shadow-biro/30 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isBuying ? "Sbloccando..." : `Sblocca per €${plan.price.toFixed(2)}`}
            </button>
          </div>
        )}

        {/* The Scrapbook Timeline */}
        {isPurchased && (
          <section className="relative pb-24">
            
            {/* Wobbly Pen Track */}
            <svg 
              className="absolute left-[30px] top-4 w-4 h-full pointer-events-none opacity-20"
              viewBox="0 0 10 1000"
              preserveAspectRatio="none"
            >
              <path 
                d="M5,0 Q8,25 2,50 Q10,75 5,100 Q0,125 7,150 Q2,175 5,200 L5,1000" 
                fill="none" 
                stroke="#1a4d8a" 
                strokeWidth="2"
                className="wobbly-path"
              />
            </svg>

            <div className="space-y-16">
              {plan.slots?.map((slot, index) => {
                const isFood = slot.type?.toLowerCase().includes('food');
                const isCulture = slot.type?.toLowerCase().includes('culture') || slot.type?.toLowerCase().includes('nature');
                
                return (
                  <motion.div 
                    key={slot.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="relative pl-12"
                  >
                    {/* Time Pin */}
                    <div className="absolute left-[8px] top-6 z-20">
                       <div className={`w-12 h-12 rounded-full border-2 border-biro flex items-center justify-center shadow-lg transition-colors ${isRainMode ? 'bg-blue-600 text-white' : 'bg-white text-biro'}`}>
                          <span className="font-sketch text-sm">{slot.time_label}</span>
                       </div>
                    </div>

                    {/* Decor Doodle Based on Index */}
                    {index === 0 && <div className="absolute -right-8 top-0 opacity-10 rotate-12"><Fish size={60} /></div>}
                    {index === 1 && <div className="absolute -left-16 bottom-0 opacity-10 -rotate-12"><Ghost size={50} /></div>}

                    {/* Activity Component */}
                    <div className={`relative ${isFood ? 'receipt-card' : isCulture ? 'ticket-card p-6' : 'bg-white/80 p-6 rounded-2xl border border-biro/10 shadow-sm'}`}>
                      {/* Interactive Tape for Rain Mode */}
                      <AnimatePresence>
                        {isRainMode && slot.alt_activity_title_it && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 2 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-30 bg-blue-50/90 backdrop-blur-sm border-2 border-blue-400 p-6 flex flex-col justify-center shadow-2xl"
                            style={{ borderRadius: 'inherit' }}
                          >
                             <div className="tape top-[-10px] left-[50%] -translate-x-1/2 bg-blue-300 opacity-60" />
                             <div className="flex items-center gap-2 mb-2">
                               <CloudRain size={20} className="text-blue-600" />
                               <span className="font-sketch text-sm text-blue-600 uppercase tracking-widest">Piano B (Rain Only)</span>
                             </div>
                             <h4 className="font-sketch text-2xl text-blue-800 leading-tight mb-2 underline decoration-blue-200">
                               {slot.alt_activity_title_it}
                             </h4>
                             <p className="font-hand text-lg text-blue-700 leading-tight">
                               {slot.alt_activity_description_it}
                             </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Main Activity */}
                      <div className={isFood ? 'receipt-content' : ''}>
                        {isFood && (
                           <div className="border-b border-dashed border-zinc-300 pb-4 mb-4 flex justify-between items-end">
                             <div className="text-[10px] font-bold uppercase tracking-widest">Digital Merchant Receipt</div>
                             <div className="text-[8px] font-bold text-zinc-400">#{index}SLOT</div>
                           </div>
                        )}
                        <h4 className={`${isFood ? 'text-xl font-bold uppercase tracking-tight' : 'font-sketch text-2xl'} text-biro mb-2`}>
                          {slot.activity_title_it}
                        </h4>
                        <p className={`${isFood ? 'text-sm' : 'font-hand text-xl'} text-biro/70 leading-snug mb-6`}>
                          {slot.activity_description_it}
                        </p>
                        
                        <div className="flex justify-between items-center border-t border-dashed border-biro/10 pt-4">
                           <span className="font-sketch text-xs opacity-40 italic">Tocca per navigare →</span>
                           <button 
                             onClick={() => {
                               const url = `https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`;
                               window.open(url, '_blank');
                             }}
                             className="w-12 h-12 rounded-full border-2 border-biro flex items-center justify-center text-biro hover:bg-biro hover:text-white transition-all active:scale-90"
                           >
                             <Compass size={24} weight="bold" />
                           </button>
                        </div>
                        {isFood && (
                          <div className="mt-4 pt-4 border-t-4 border-double border-zinc-200 text-center">
                            <span className="text-[10px] font-black italic">DESIDERI PUGLIA • APPROVED</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Radar Movida - Hand Drawn Box */}
            <motion.div 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               className="mt-20 p-8 border-4 border-double border-biro/20 rounded-[40px] bg-white/20 relative rotate-1"
            >
              <div className="absolute -top-6 -right-4 rotate-12 opacity-30"><Wine size={80} className="text-biro" /></div>
              <div className="absolute -left-4 -bottom-4 -rotate-12 opacity-30"><Sparkle size={40} className="text-biro" /></div>
              
              <div className="relative z-10 text-center space-y-2">
                <header className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_green]" />
                  <h4 className="font-sketch text-biro text-xl uppercase tracking-widest">Radar Movida Live</h4>
                </header>
                <h3 className="font-sketch text-4xl text-biro underline decoration-wavy decoration-yellow-400">
                  {vibeStatus}
                </h3>
                <p className="font-hand text-xl text-biro/50 leading-tight">
                  Status segnalato dai nostri residenti. Aggiornato adesso.
                </p>
              </div>
            </motion.div>

            <footer className="mt-24 py-12 text-center opacity-20 relative">
               <div className="w-full h-px bg-biro/20 mb-4" />
               <p className="font-sketch text-biro text-2xl rotate-[-2deg]">- Fine Itinerario -</p>
            </footer>
          </section>
        )}
      </main>
    </div>
  );
};

export default PlanDetail;
