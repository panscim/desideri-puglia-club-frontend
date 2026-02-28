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
  const [vibeStatus, setVibeStatus] = useState('Analisi v1...');

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
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-[#F9F9F7] font-satoshi">
      
      {/* Premium Recovered Header */}
      <nav className="sticky top-0 z-[100] premium-nav-blur px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-900 font-bold hover:opacity-60 transition-opacity"
          >
            <CaretLeft size={24} weight="bold" />
            <span className="text-xs uppercase tracking-widest">Puglia</span>
          </button>
          
          <div className="flex items-center gap-6">
            <Share size={22} className="text-zinc-400 hover:text-zinc-900 cursor-pointer transition-colors" />
            <DotsThreeCircle size={26} className="text-zinc-400 hover:text-zinc-900 cursor-pointer transition-colors" />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 pb-32">
        
        {/* Modern Hero Section */}
        <header className="mb-20">
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl">
            <img 
              src={plan.cover_image_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366'} 
              className="w-full h-full object-cover"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 text-orange-400 mb-2">
                  <MapPin size={18} weight="fill" />
                  <span className="text-xs font-black uppercase tracking-widest">{plan.city}</span>
                </div>
                <h1 className="text-4xl md:text-6xl text-white font-black leading-tight drop-shadow-lg lowercase first-letter:uppercase">
                  {plan.title_it}
                </h1>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-8">
              <p className="text-lg md:text-xl text-zinc-600 font-medium leading-relaxed">
                {plan.description_it}
              </p>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end">
               <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full border border-zinc-100 shadow-sm">
                  <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-orange-500">
                    <CheckCircle size={24} weight="fill" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">Status</p>
                    <p className="text-xs font-bold text-zinc-900 leading-none">Local Verified</p>
                  </div>
               </div>
            </div>
          </div>
        </header>

        {/* Timeline & Verification Flow */}
        <div className="relative">
          
          {/* Purchase Wall (if not purchased) */}
          {!isPurchased && (
            <div className="absolute inset-x-0 -top-10 z-50 pt-20 flex flex-col items-center">
              <div className="premium-card-v1 p-12 text-center max-w-lg w-full bg-white shadow-[0_40px_80px_rgba(0,0,0,0.1)] border-orange-500/10">
                 <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-orange-100">
                    <LockKey size={32} weight="fill" className="text-orange-500" />
                 </div>
                 <h3 className="text-3xl font-black text-zinc-900 mb-4">Itinerario Pro</h3>
                 <p className="text-zinc-500 font-medium mb-10 leading-relaxed">
                   Sblocca i segreti della Puglia, i luoghi nascosti e la modalità "Piano B" per le giornate incerte.
                 </p>
                 <button 
                   onClick={handlePurchase}
                   disabled={isBuying}
                   className="w-full h-16 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                 >
                   {isBuying ? "Processing..." : `Sblocca Ora — €${plan.price.toFixed(2)}`}
                   <CreditCard size={20} weight="bold" />
                 </button>
              </div>
              
              {/* Blurred Preview */}
              <div className="mt-[-200px] w-full opacity-20 blur-md pointer-events-none select-none grayscale">
                 {[1,2,3].map(i => (
                   <div key={i} className="premium-card-v1 h-40 mb-10" />
                 ))}
              </div>
            </div>
          )}

          {/* Recovered v1 Timeline Card List */}
          {isPurchased && (
            <div className="space-y-12">
              <div className="flex items-center justify-between mb-16">
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                   <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">The Itinerary</h2>
                 </div>

                 <button 
                   onClick={() => setIsRainMode(!isRainMode)}
                   className={`h-12 px-6 rounded-full flex items-center gap-3 border transition-all ${isRainMode ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white border-zinc-100 text-zinc-600'}`}
                 >
                   {isRainMode ? <CloudRain size={20} weight="fill" /> : <Sun size={20} weight="bold" />}
                   <span className="text-[10px] font-black uppercase tracking-widest">
                     {isRainMode ? 'Piano B Attivo' : 'Cerca Piano B'}
                   </span>
                 </button>
              </div>

              <div className="space-y-12 relative">
                {/* Visual Line */}
                <div className="absolute left-[23px] top-10 bottom-10 w-0.5 bg-zinc-100" />

                {plan.slots?.map((slot, index) => (
                  <motion.div 
                    key={slot.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex gap-8 relative"
                  >
                     {/* Time Marker */}
                     <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border transition-all duration-500 ${isRainMode ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white border-zinc-100 text-zinc-900'}`}>
                           <Clock size={20} weight="bold" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{slot.time_label}</span>
                     </div>

                     {/* Content Card v1 */}
                     <div className={`flex-1 premium-card-v1 p-8 ${isRainMode && slot.alt_activity_title_it ? 'rain-mode-b-bg' : ''}`}>
                        <AnimatePresence mode="wait">
                          {isRainMode && slot.alt_activity_title_it ? (
                            <motion.div 
                              key="rain"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                               <div className="flex items-center gap-2 mb-4 text-blue-600">
                                  <CloudRain size={16} weight="fill" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Piano B Consigliato</span>
                               </div>
                               <h4 className="text-2xl font-black text-blue-900 mb-4 lowercase first-letter:uppercase">{slot.alt_activity_title_it}</h4>
                               <p className="text-blue-800/60 font-medium leading-relaxed mb-8">{slot.alt_activity_description_it}</p>
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="sun"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                               <h4 className="text-2xl font-black text-zinc-900 mb-4 lowercase first-letter:uppercase">{slot.activity_title_it}</h4>
                               <p className="text-zinc-500 font-medium leading-relaxed mb-8">{slot.activity_description_it}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button 
                          onClick={() => {
                            const url = `https://www.google.com/maps/search/?api=1&query=${slot.latitude},${slot.longitude}`;
                            window.open(url, '_blank');
                          }}
                          className={`w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isRainMode ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-white hover:bg-black'}`}
                        >
                          Apri in Mappa
                          <Compass size={18} weight="bold" />
                        </button>
                     </div>
                  </motion.div>
                ))}
              </div>

              {/* Radar Sentiment Dashboard (The "Beautiful" Part) */}
              <section className="mt-32">
                <div className="bg-zinc-900 rounded-[3rem] p-12 relative overflow-hidden shadow-3xl text-center md:text-left">
                  <div className="absolute top-8 right-8 flex items-center gap-3">
                    <div className="vibe-pulse" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Report</span>
                  </div>

                  <Wine size={160} weight="duotone" className="absolute -bottom-12 -right-12 text-white/5 rotate-12" />

                  <div className="relative z-10">
                     <div className="flex items-center gap-2 justify-center md:justify-start mb-6">
                        <Sparkle size={18} weight="fill" className="text-orange-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Radar della Movida</h4>
                     </div>

                     <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase">
                        Status: <span className="text-orange-500">{vibeStatus}</span>
                     </h2>

                     <p className="text-zinc-400 font-medium max-w-xl leading-relaxed mb-10">
                        Questo dato è basato sui report in tempo reale dei residenti Desideri in Puglia. Una rete di "insider" scommette sulla qualità della tua serata.
                     </p>

                     {/* Sentiment Level Meter */}
                     <div className="max-w-md">
                        <div className="flex justify-between text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">
                           <span>Chill</span>
                           <span>🔥 Peak</span>
                        </div>
                        <div className="sentiment-meter">
                           {[1,2,3,4,5].map(i => (
                             <div key={i} className={`sentiment-meter-step ${i <= 3 ? 'active' : ''}`} />
                           ))}
                        </div>
                     </div>
                  </div>
                </div>
              </section>

              <footer className="py-20 text-center">
                 <div className="w-12 h-1.5 bg-orange-500 rounded-full mx-auto mb-8" />
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300">Fine della Regia Desideri</p>
              </footer>
            </div>
          )}

        </div>

      </main>
    </div>
  );
};

export default PlanDetail;
