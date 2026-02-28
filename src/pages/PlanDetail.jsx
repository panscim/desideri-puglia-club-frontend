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
  Wine
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// --- Scratch Animation Component ---
const RainScratch = ({ isRain }) => (
  <motion.svg 
    className="scratch-overlay" 
    viewBox="0 0 100 100" 
    preserveAspectRatio="none"
    initial={false}
    animate={{ opacity: isRain ? 0.7 : 0 }}
  >
    <motion.path
      d="M0,10 L100,20 M100,40 L0,50 M0,70 L100,80 M100,95 L0,100"
      fill="transparent"
      stroke="#111"
      strokeWidth="12"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: isRain ? 1 : 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    />
    <motion.path
      d="M10,0 L20,100 M40,100 L50,0 M70,0 L80,100 M95,100 L100,0"
      fill="transparent"
      stroke="#111"
      strokeWidth="8"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: isRain ? 1 : 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
    />
  </motion.svg>
);

const PlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const scratchSound = useRef(new Audio('/pen-scratch.mp3')); // Placeholder path as requested
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isRainMode, setIsRainMode] = useState(false);
  const [vibeStatus, setVibeStatus] = useState('Analizzando vibrazioni...');

  useEffect(() => {
    loadPlan();
    fetchVibes();
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
      // Logic for "Radar Movida": find most recent report for this city
      const recentVibe = vibes[0];
      const levels = ['Tranquillo', 'Vivace', '🔥 Pieno Murato'];
      setVibeStatus(levels[recentVibe.vibe_level - 1] || 'Live');
    } else {
      setVibeStatus('Calmo');
    }
  };

  const toggleRainMode = () => {
    const nextMode = !isRainMode;
    setIsRainMode(nextMode);

    if (nextMode) {
      // Sound & Haptics
      scratchSound.current.volume = 0.3;
      scratchSound.current.play().catch(() => {}); // Browser might block if no interaction
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Accedi per sbloccare il taccuino');
      navigate('/login');
      return;
    }
    setIsBuying(true);
    const result = await ConciergeService.purchasePlan(user.id, id);
    if (result.success) {
      toast.success('Taccuino sbloccato! Inizia il viaggio.');
      setIsPurchased(true);
    }
    setIsBuying(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center">
      <motion.div 
        animate={{ rotate: [0, 5, -5, 0] }} 
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-16 h-16 text-biro mb-4"
      >
        <Pencil size={64} weight="fill" />
      </motion.div>
      <p className="font-sketch text-lg text-biro">Sfogliando gli appunti...</p>
    </div>
  );

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-paper pb-24 overflow-x-hidden selection:bg-yellow-200">
      
      {/* Notebook Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] p-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-full bg-white shadow-md border-2 border-biro/10 flex items-center justify-center text-biro active:scale-90 transition-all"
        >
          <CaretLeft size={24} weight="bold" />
        </button>

        {isPurchased && (
          <button 
            onClick={toggleRainMode}
            className={`h-12 px-6 rounded-full shadow-md flex items-center gap-3 transition-all border-2 ${
              isRainMode 
                ? 'bg-blue-600 text-white border-blue-400' 
                : 'bg-white text-orange-600 border-orange-200'
            }`}
          >
            {isRainMode ? <CloudRain size={20} weight="fill" /> : <Sun size={20} weight="fill" />}
            <span className="font-sketch text-sm uppercase">
              {isRainMode ? 'Piove!' : 'C\'è il sole'}
            </span>
          </button>
        )}
      </header>

      {/* Hero: Polaroids Style */}
      <div className="pt-24 px-6 mb-8 flex flex-col items-center">
        <div className="bg-white p-3 pt-3 pb-12 shadow-2xl rotate-[-2deg] max-w-[320px] border border-black/5 hover:rotate-0 transition-transform duration-500">
          <img 
            src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
            className="w-full aspect-square object-cover"
            alt=""
          />
        </div>
        
        <div className="text-center mt-8 space-y-2">
          <h1 className="font-sketch text-4xl text-biro leading-tight max-w-[15ch] rotate-[1deg]">
            {plan.title_it}
          </h1>
          <p className="font-hand text-xl text-biro/60 italic">
            Appunti da {plan.city}
          </p>
        </div>
      </div>

      <main className="px-6 max-w-lg mx-auto">
        
        {/* Intro Note */}
        <section className="relative mb-16 px-4">
          <Quotes size={40} className="text-yellow-400/30 absolute -top-4 -left-2 rotate-12" />
          <p className="font-hand text-2xl text-biro leading-tight text-center px-4">
            <span className="highlighter italic">"{plan.description_it}"</span>
          </p>
          <div className="mt-6 flex flex-col items-center gap-2">
             <div className="w-12 h-12 rounded-full border-2 border-biro/10 overflow-hidden shadow-sm">
                <img src={plan.creator?.foto_profilo || '/logo.png'} className="w-full h-full object-cover" alt="" />
             </div>
             <p className="font-sketch text-biro/70 text-sm">Consigli di {plan.creator?.nickname}</p>
          </div>
        </section>

        {/* Timeline Lock Overlay */}
        {!isPurchased && (
          <div className="py-12 flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-full shadow-lg border-2 border-dashed border-biro/30 flex items-center justify-center mb-6">
               <LockKey size={32} weight="bold" className="text-biro/30" />
            </div>
            <h3 className="font-sketch text-2xl text-biro mb-2">Taccuino Sigillato</h3>
            <p className="font-hand text-lg text-biro/50 text-center max-w-[24ch] mb-8 leading-snug">
              Sblocca l'itinerario completo e la modalità pioggia per non farti cogliere impreparato.
            </p>
            
            <button 
              onClick={handlePurchase}
              disabled={isBuying}
              className="w-full bg-biro text-white h-16 rounded-full font-sketch text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isBuying ? "Sbloccando..." : `Sblocca per €${plan.price.toFixed(2)}`}
            </button>
          </div>
        )}

        {/* The Timeline */}
        <section className={`transition-all duration-700 ${!isPurchased ? 'blur-sm grayscale opacity-30 select-none' : ''}`}>
          <div className="flex flex-col gap-12 relative pb-20">
            
            {/* Hand-drawn connector */}
            <div className="absolute left-[20px] top-6 bottom-10 w-1 bg-biro/10 rounded-full border-l-2 border-dashed border-biro/20" />

            {plan.slots?.map((slot, index) => (
              <div key={slot.id} className="flex gap-4 items-start relative">
                
                {/* Time Indicator */}
                <div className="w-10 flex flex-col items-center pt-2">
                  <div className={`w-10 h-10 rounded-full border-2 border-biro flex items-center justify-center bg-white shadow-sm z-10 transition-colors ${isRainMode ? 'bg-blue-100' : ''}`}>
                    <Clock size={18} className="text-biro" />
                  </div>
                  <span className="font-sketch text-[10px] text-biro mt-2 rotate-[-5deg]">
                    {slot.time_label}
                  </span>
                </div>

                {/* Notebook Card */}
                <div className="flex-1">
                  <div className="relative bg-white/50 border border-biro/10 p-4 rounded-2xl shadow-sm min-h-[140px] overflow-hidden">
                    
                    {/* Scratch animation triggered by isRain */}
                    <RainScratch isRain={isRainMode && !!slot.alt_activity_title_it} />
                    
                    {/* Activity A */}
                    <div className="transition-all duration-500">
                       <h4 className="font-sketch text-xl text-biro mb-1">{slot.activity_title_it}</h4>
                       <p className="font-hand text-lg text-biro/70 leading-tight">
                         {slot.activity_description_it}
                       </p>
                    </div>

                    {/* Activity B (Piano Pioggia) */}
                    <AnimatePresence>
                      {isRainMode && slot.alt_activity_title_it && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 pt-4 border-t border-dashed border-biro/20"
                        >
                           <header className="flex items-center gap-2 mb-1">
                             <CloudRain size={16} className="text-blue-600" />
                             <span className="font-sketch text-xs text-blue-600">Cambio piano (Piove!)</span>
                           </header>
                           <h4 className="font-sketch text-xl text-blue-800">{slot.alt_activity_title_it}</h4>
                           <p className="font-hand text-lg text-blue-800/70 leading-tight italic highlighter">
                             {slot.alt_activity_description_it}
                           </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Navigation Circle Button */}
                    <button 
                      onClick={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`;
                        window.open(url, '_blank');
                      }}
                       className="absolute bottom-3 right-3 w-12 h-12 rounded-full border-2 border-biro flex items-center justify-center text-biro bg-white/80 backdrop-blur-sm active:scale-90 transition-all hover:bg-biro hover:text-white"
                       title="Portami qui"
                    >
                      <Compass size={24} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* RADAR MOVIDA (Last Stage Sketch) */}
            {isPurchased && (
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="mt-12 p-8 border-2 border-dashed border-biro/20 rounded-3xl flex flex-col items-center bg-white/20"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="w-20 h-20 text-biro/40 mb-4"
                >
                  <Wine size={80} weight="light" />
                </motion.div>
                <h4 className="font-sketch text-2xl text-biro mb-1 highlighter">Vibe Check: {vibeStatus}</h4>
                <p className="font-hand text-lg text-biro/60 text-center italic">
                  Radar della Movida attivo. Status riportato dai residenti.
                </p>
              </motion.div>
            )}

            {/* Notebook Footer */}
            <div className="py-12 border-t-2 border-dashed border-biro/10 flex flex-col items-center opacity-30">
               <span className="font-sketch text-biro text-xl">- Fine Appunti -</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PlanDetail;
