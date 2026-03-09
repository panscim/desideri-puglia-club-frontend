// src/pages/SagaDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Navigation2, Lock, Unlock, CheckCircle2, History, Target, ArrowRight, Route } from 'lucide-react';
import { QuestService } from '../services/quest';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getLocalized } from '../utils/content';
import { useGeolocation } from '../hooks/useGeolocation';
import { LockedCardDetail } from '../components/LockedCardDetail';
import { UnlockedCardDetail } from '../components/UnlockedCardDetail';
import { AlbumService } from '../services/album';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

// --- HELPER: Calcolo Distanza (Formula di Haversine) ---
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function SagaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const [saga, setSaga] = useState(null);
  const [completedStepsIds, setCompletedStepsIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { location, startWatching } = useGeolocation();
  const [selectedStep, setSelectedStep] = useState(null);
  const [unlockingStep, setUnlockingStep] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);

  useEffect(() => {
    startWatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function fetchSaga() {
      if (!id) return;
      try {
        const detail = await QuestService.getSagaDetail(id);
        setSaga(detail || null);
        if (user?.id) {
          const progress = await QuestService.getUserProgress(user.id);
          setCompletedStepsIds(progress.completedSteps || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSaga();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!saga) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-serif font-black mb-2">Saga non trovata</h2>
        <button onClick={() => navigate('/missioni')} className="text-accent underline">Torna indietro</button>
      </div>
    );
  }

  const title = getLocalized(saga, 'title', i18n?.language);
  const stepsData = saga.steps || [];

  let firstUncompletedFound = false;
  const steps = stepsData.map(step => {
    const isCompleted = completedStepsIds.includes(step.id);
    let status = 'locked';
    if (isCompleted) {
      status = 'completed';
    } else if (!firstUncompletedFound) {
      status = 'active';
      firstUncompletedFound = true;
    }
    return {
      ...step,
      title: step.description_it || `Tappa ${step.step_order}`,
      hint: step.narrative_hint_it || step.description_it || "Un luogo misterioso attende di essere svelato...",
      radius: step.unlock_radius_m || 50,
      image_url: step._image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format',
      status,
    };
  });

  const activeStep = steps.find(s => s.status === 'active');
  const completedSteps = steps.filter(s => s.status === 'completed');
  const lockedSteps = steps.filter(s => s.status === 'locked');
  const isSagaComplete = steps.length > 0 && completedSteps.length === steps.length;
  const progressPercent = steps.length > 0 ? Math.round((completedSteps.length / steps.length) * 100) : 0;

  const targetLat = activeStep?._latitude;
  const targetLng = activeStep?._longitude;
  const currentLat = location?.lat || location?.latitude;
  const currentLng = location?.lng || location?.longitude;

  let distanceMeters = null;
  if (activeStep && targetLat && targetLng && currentLat && currentLng) {
    distanceMeters = Math.round(getDistance(currentLat, currentLng, targetLat, targetLng));
  }

  const canUnlockProximity = distanceMeters !== null && distanceMeters <= (activeStep?.radius || 50);

  const attemptUnlock = async () => {
    if (activeStep) setSelectedStep(activeStep);
  };

  const handleUnlockStepSuccess = async (step) => {
    setUnlockingStep(true);
    try {
      if (step.reference_table === 'cards' && step.reference_id) {
        await AlbumService.unlockCard(step.reference_id);
      }
      const res = await QuestService.unlockQuestStep(user.id, step.id);
      if (res.success) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 9999 });
        toast.success(`Mistero svelato: ${step.title}!`, { duration: 5000, icon: '🗝️' });
        setCompletedStepsIds(prev => [...prev, step.id]);
        setSelectedStep(prev => ({ ...prev, status: 'completed' }));
      } else {
        toast.error(res.error || 'Errore durante lo sblocco');
      }
    } catch (e) {
      toast.error('Errore imprevisto');
    } finally {
      setUnlockingStep(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FCFAF2] text-text-primary flex flex-col font-sans relative overflow-x-hidden selection:bg-accent/20 transition-all duration-500">

      {/* BACKGROUND SCENE - Softened for Scrapbook */}
      <div className="absolute inset-x-0 top-0 z-0 h-[50vh] overflow-hidden pointer-events-none opacity-80">
        {activeStep ? (
          <img
            src={activeStep.image_url}
            alt="Luogo Misterioso"
            className={`w-full h-full object-cover transition-all duration-[3000ms] ${canUnlockProximity ? 'blur-sm brightness-90' : 'blur-2xl brightness-75 grayscale'}`}
          />
        ) : isSagaComplete ? (
          <img src={saga.image_url} alt="Saga Completata" className="w-full h-full object-cover blur-sm brightness-75" />
        ) : (
          <div className="w-full h-full bg-accent-gold/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FCFAF2] via-[#FCFAF2]/40 to-transparent" />
      </div>

      {/* TOP BAR */}
      <header className="relative z-50 pt-[env(safe-area-inset-top)] flex flex-col px-6">
        <div className="flex items-center justify-between h-20">
          <button onClick={() => navigate('/missioni')} className="w-11 h-11 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-text-primary hover:border-accent/40 transition-all shadow-sm active:scale-90">
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          
          <motion.div 
            initial={{ rotate: -2 }}
            animate={{ rotate: 2 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="bg-accent-gold text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-md rounded-sm border-b-2 border-black/10 flex items-center gap-2"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-white">{completedSteps.length}</span>
              <span className="text-white/40 opacity-50">/</span>
              <span className="text-white">{steps.length}</span>
            </div>
            <Sparkle size={12} weight="fill" className="text-white animate-pulse" />
          </motion.div>

          <button onClick={() => setShowHistory(true)} className="w-11 h-11 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-text-primary hover:border-accent/40 transition-all relative shadow-sm active:scale-90">
            <History size={20} />
            {completedSteps.length > 0 && <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-white shadow-sm animate-pulse"></span>}
          </button>
        </div>
      </header>

      {/* PROGRESS BAR - Bubbly Style */}
      <div className="relative z-50 h-2 px-6 mt-2">
        <div className="h-full w-full bg-zinc-200/50 rounded-full overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-accent rounded-full shadow-[0_0_15px_rgba(212,121,58,0.3)]"
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col px-6 py-10 mt-2">
        {!isSagaComplete && activeStep ? (
          <div className="flex flex-col items-center max-w-sm mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* HEADER TITLE with HIGHLIGHTER */}
            <div className="mb-10 text-center relative group">
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-12 -right-8 text-4xl pointer-events-none select-none opacity-40"
              >
                🗝️
              </motion.div>
              
              <h1 className="text-[42px] font-serif font-black text-text-primary leading-[1] mb-4 tracking-tight relative inline-block">
                <span className="relative z-10">{title}</span>
                <motion.div 
                   initial={{ scaleX: 0 }}
                   animate={{ scaleX: 1 }}
                   transition={{ delay: 0.8, duration: 1 }}
                   className="absolute left-0 bottom-1 w-full h-4 bg-accent-gold/20 -z-0 origin-left -rotate-1 rounded-sm"
                />
              </h1>
              <p className="overline !text-accent-gold !mb-0 flex items-center justify-center gap-2 !tracking-[0.4em] font-black">
                Prossima Tappa: {activeStep.title}
              </p>
            </div>

            {/* ENIGMA POST-IT */}
            <motion.div 
              style={{ rotate: '1.5deg' }}
              className="relative bg-white p-8 pb-10 shadow-[0_15px_45px_rgba(0,0,0,0.08)] mb-12 w-full border border-black/5"
            >
              {/* Washi Tape */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-7 bg-accent/20 backdrop-blur-sm -translate-y-3 -rotate-2 rounded-sm border-x border-black/5 z-20" />
              
              <div className="text-center">
                <p className="text-[24px] sm:text-[28px] font-serif font-black text-text-primary leading-[1.3] tracking-tight italic">
                  "{activeStep.hint}"
                </p>
                <div className="mt-6 flex flex-col items-center">
                   <div className="w-10 h-[1px] bg-zinc-100 mb-2" />
                   <span className="text-[8px] font-black uppercase tracking-[0.3em] text-text-muted">Messaggio in Codice</span>
                </div>
              </div>
            </motion.div>

            {/* RADAR - Playful Design */}
            <div className="relative w-56 h-56 mb-12 flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full border border-accent/15 ${!canUnlockProximity ? 'animate-[ping_4s_ease-out_infinite]' : ''}`}></div>
              <div className={`absolute inset-6 rounded-full border border-accent/20 shadow-inner ${!canUnlockProximity ? 'animate-[ping_4s_ease-out_infinite_1000ms]' : ''}`}></div>
              
              <div className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center p-2 transition-all duration-1000 ${canUnlockProximity ? 'bg-accent text-white border-4 border-white shadow-2xl scale-110' : 'bg-white border-2 border-accent-gold/40 shadow-xl shadow-accent-gold/5'}`}>
                {canUnlockProximity ? (
                  <>
                    <Unlock size={36} weight="fill" className="mb-2" />
                    <span className="text-white text-[12px] font-black uppercase tracking-[0.2em] text-center mt-1 leading-tight">Sblocca<br />Il Mistero</span>
                  </>
                ) : (
                  <>
                    <Navigation2 size={28} weight="bold" className={`text-accent-gold mb-2 transition-transform duration-[2s] ${distanceMeters !== null ? 'animate-spin-slow' : ''}`} />
                    {distanceMeters !== null ? (
                      <div className="flex flex-col items-center">
                        <span className="text-text-primary text-[32px] font-black font-serif leading-none tracking-tighter">{distanceMeters > 999 ? (distanceMeters / 1000).toFixed(1) : distanceMeters}</span>
                        <span className="text-text-muted text-[11px] uppercase font-black tracking-widest mt-1">{distanceMeters > 999 ? 'km' : 'metri'}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-text-muted text-[10px] font-black uppercase tracking-widest text-center px-2 animate-pulse">Segnale...</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* UNLOCK BUTTON - Playful Bouncy */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={attemptUnlock}
              className={`w-full !py-5 flex items-center justify-center gap-3 rounded-[1.5rem] font-black uppercase tracking-widest text-[14px] transition-all duration-300 ${!canUnlockProximity ? 'bg-white border-2 border-zinc-200 text-text-muted' : 'bg-accent text-white shadow-xl shadow-accent/25 hover:bg-accent/90'}`}
            >
              {canUnlockProximity ? (
                <>Rivela il Luogo <ArrowRight size={20} weight="bold" /></>
              ) : (
                <>
                  <Lock size={18} weight="bold" />
                  <span>{distanceMeters !== null ? `${Math.max(0, distanceMeters - activeStep.radius)}m per l'arrivo` : 'GPS Necessario'}</span>
                </>
              )}
            </motion.button>
            <p className="overline !text-text-muted !mt-6 text-center max-w-[280px] !normal-case !font-bold opacity-60 italic text-[11px]">
              "Devi essere entro {activeStep.radius}m per catturare questa tappa."
            </p>

            {/* ITINERARIO LIST - Scrapbook Style */}
            <div className="mt-16 w-full">
              <div className="flex items-center justify-between mb-8">
                 <div className="relative inline-block">
                    <span className="text-[20px] font-serif font-black text-text-primary px-3 relative z-10">Cronologia Itinerario</span>
                    <div className="absolute left-0 bottom-0.5 w-full h-3 bg-accent-gold/15 -z-0 -rotate-1" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{steps.length} Tappe</span>
              </div>

              <div className="space-y-4">
                 {steps.map((step, idx) => {
                    const isDone = step.status === 'completed';
                    const isCurrent = step.status === 'active';
                    const rotation = (idx % 2 === 0 ? '-1deg' : '1deg');
                    
                    return (
                        <motion.div 
                          key={step.id}
                          style={{ rotate: rotation }}
                          className={`flex items-start gap-4 p-5 rounded-[1.5rem] transition-all duration-500 shadow-sm border border-black/5 ${isDone ? 'bg-white opacity-80' : isCurrent ? 'bg-white shadow-lg border-accent-gold/20 scale-[1.02]' : 'bg-white/40 opacity-40'}`}
                        >
                           <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border-2 text-[11px] font-black ${isDone ? 'bg-accent border-accent text-white' : isCurrent ? 'border-accent-gold text-accent-gold animate-pulse' : 'border-zinc-200 text-text-muted'}`}>
                              {isDone ? <CheckCircle2 size={16} weight="bold" /> : idx + 1}
                           </div>
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{idx === 0 ? 'Partenza' : idx === steps.length - 1 ? 'Gran Finale' : `Passaggio ${idx + 1}`}</span>
                                 {isDone && <span className="text-[7px] font-black bg-accent/10 text-accent px-1.5 py-0.5 rounded-full border border-accent/20">SVELATO</span>}
                              </div>
                              <h4 className={`text-[17px] font-serif font-black tracking-tight ${isDone || isCurrent ? 'text-text-primary' : 'text-text-muted'}`}>
                                 {isDone || isCurrent ? step.title : `Mistero n. ${idx + 1}`}
                              </h4>
                              {isCurrent && (
                                <p className="text-[13px] text-text-muted mt-2 font-medium italic border-l-2 border-accent-gold/30 pl-3 leading-relaxed">"{step.hint}"</p>
                              )}
                           </div>
                        </motion.div>
                    )
                 })}
              </div>
            </div>
          </div>
        ) : isSagaComplete ? (
          <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-1000 flex-1 py-10 relative">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} 
              transition={{ duration: 5, repeat: Infinity }}
              className="w-28 h-28 bg-[#FCFAF2] rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl border-2 border-accent-gold/40 relative"
            >
              {/* Sticker Style Check */}
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center shadow-lg border-4 border-white -rotate-12">
                   <CheckCircle2 size={44} weight="bold" className="text-white" />
              </div>
              {/* Floating Star */}
              <div className="absolute -top-4 -right-4 text-3xl">✨</div>
            </motion.div>
            
            <h2 className="text-[42px] font-serif font-black text-text-primary mb-4 tracking-tight leading-[1] relative inline-block">
               <span className="relative z-10">Mistero Risolto!</span>
               <div className="absolute left-0 bottom-2 w-full h-5 bg-accent-gold/20 -z-0 -rotate-1" />
            </h2>
            <p className="text-[17px] text-text-muted font-medium max-w-[280px] mb-12 italic leading-relaxed">Il diario di "{title}" è ora completo. La tua leggenda vive tra le pagine del Club.</p>
            
            <button
              onClick={() => navigate('/missioni')}
              className="w-full max-w-[260px] !py-4 btn-primary shadow-xl shadow-accent/20 group"
            >
              Nuove Avventure <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : null}
      </main>

      {/* FOOTER SIGNATURE */}
      <footer className="py-20 flex flex-col items-center gap-5 opacity-30 mt-10">
          <div className="w-10 h-[1px] bg-zinc-400/50" />
          <p className="text-[8px] font-black uppercase tracking-[0.6em] text-zinc-500 text-center leading-relaxed">
            Saga Dettagli <br /> Desideri Puglia Club © 2026
          </p>
      </footer>

      {/* HISTORY DRAWER - Redesigned */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black/40 backdrop-blur-md"
          >
            <div className="flex-1" onClick={() => setShowHistory(false)} />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-[#FCFAF2] border-t border-zinc-200 rounded-t-[3.5rem] p-10 max-h-[85vh] overflow-y-auto w-full max-w-lg mx-auto shadow-2xl pb-[calc(40px+env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="relative">
                  <h3 className="text-[32px] font-serif font-black text-text-primary tracking-tight relative z-10">Le tue Scoperte</h3>
                  <div className="absolute left-0 bottom-1 w-full h-3 bg-accent/20 -z-0 -rotate-1" />
                  <p className="overline !text-accent-gold !mb-0 !mt-2 !tracking-widest font-black">Registro Avventure</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition-all active:scale-90 border border-zinc-100 shadow-sm">
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>

              <div className="grid gap-6">
                {completedSteps.map((step, idx) => {
                  const rotation = (idx % 2 === 0 ? '-1.5deg' : '1.5deg');
                  return (
                    <motion.div
                      key={step.id}
                      style={{ rotate: rotation }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-start gap-5 p-5 bg-white border border-black/5 rounded-[2rem] cursor-pointer hover:shadow-xl transition-all group shadow-[0_10px_30px_rgba(0,0,0,0.05)] relative"
                      onClick={() => setSelectedStep({ ...step, status: 'completed' })}
                    >
                      {/* Decorative Tape small */}
                      <div className="absolute top-0 right-10 w-10 h-4 bg-accent-gold/15 -translate-y-2 rotate-6 z-20" />

                      <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden relative border-2 border-white shadow-md group-hover:border-accent transition-colors">
                        <img src={step.image_url} alt={step.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                        <div className="absolute inset-0 bg-accent/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <CheckCircle2 size={32} weight="fill" className="text-white drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-accent-gold mb-1.5 block">Tappa {step.step_order}</span>
                        <h4 className="text-[20px] font-serif font-black text-text-primary leading-[1.1] mb-2 tracking-tight">{step.title}</h4>
                        <div className="flex items-center gap-1.5 text-accent font-black text-[10px] uppercase tracking-widest transition-all group-hover:translate-x-1">
                          Esplora <ArrowRight size={14} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {lockedSteps.length > 0 && (
                  <div className="mt-12 py-12 border-t-2 border-dashed border-zinc-200 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-4">
                      {lockedSteps.map((s, idx) => (
                        <div key={idx} className="w-3 h-3 rounded-full bg-zinc-200 border border-zinc-300 transform rotate-12 shadow-sm"></div>
                      ))}
                    </div>
                    <span className="overline !text-text-muted !mb-0 opacity-40 !normal-case italic text-[13px] font-medium">Ancora misteri da incollare in questo diario...</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UNLOCK MODALS - Keep same logic but ensure backdrop aligns */}
      {selectedStep && (
        (() => {
          const cardObj = selectedStep.reference_table === 'cards'
            ? selectedStep.cardData
            : {
              ...selectedStep.partnerData,
              title: selectedStep.partnerData?.nome || selectedStep.title,
              image_url: selectedStep.partnerData?.logo_url || selectedStep.image_url,
              description: selectedStep.description_it,
              gps_lat: selectedStep.partnerData?.lat || selectedStep._latitude,
              gps_lng: selectedStep.partnerData?.lng || selectedStep._longitude,
              gps_radius: selectedStep.radius || 50,
            };
          if (!cardObj) return null;
          if (selectedStep.status === 'completed') {
            return (
              <UnlockedCardDetail
                card={{ ...cardObj, isUnlocked: true }}
                onClose={() => setSelectedStep(null)}
              />
            );
          } else {
            return (
              <LockedCardDetail
                card={cardObj}
                userLocation={location}
                onClose={() => setSelectedStep(null)}
                onUnlock={() => handleUnlockStepSuccess(selectedStep)}
                unlocking={unlockingStep}
              />
            );
          }
        })()
      )}

    </div>
  );
}
