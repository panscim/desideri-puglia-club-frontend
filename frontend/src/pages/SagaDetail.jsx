// src/pages/SagaDetail.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Navigation2, Lock, Unlock, CheckCircle2, History, ArrowRight, ChevronRight, Store } from 'lucide-react';
import { Sparkle } from '@phosphor-icons/react';
import { QuestService } from '../services/quest';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getLocalized } from '../utils/content';
import { useGeolocation } from '../hooks/useGeolocation';
import { LockedCardDetail } from '../components/LockedCardDetail';
import { UnlockedCardDetail } from '../components/UnlockedCardDetail';
import { AlbumService } from '../services/album';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

// --- HELPERS ---
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getPartnersBetween = (stepA, stepB, partners) => {
  const midLat = ((stepA._latitude || 0) + (stepB._latitude || 0)) / 2;
  const midLng = ((stepA._longitude || 0) + (stepB._longitude || 0)) / 2;
  if (!midLat || !midLng) return partners.slice(0, 3);
  return [...partners]
    .filter(p => p.latitude && p.longitude)
    .sort((a, b) => {
      const dA = Math.hypot(a.latitude - midLat, a.longitude - midLng);
      const dB = Math.hypot(b.latitude - midLat, b.longitude - midLng);
      return dA - dB;
    })
    .slice(0, 3);
};

// --- SUB-COMPONENTS ---

const PartnerMiniCard = ({ partner }) => (
  <div className="shrink-0 w-40 bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm">
    {partner.logo_url ? (
      <img src={partner.logo_url} alt={partner.name} className="w-full h-24 object-cover" />
    ) : (
      <div className="w-full h-24 bg-accent/5 flex items-center justify-center">
        <Store size={28} className="text-accent/30" />
      </div>
    )}
    <div className="p-3">
      <p className="text-[13px] font-black text-text-primary leading-tight truncate">{partner.name}</p>
      {partner.category && (
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wide mt-0.5 truncate">{partner.category}</p>
      )}
    </div>
  </div>
);

const PartnerDiscoveryNode = ({ idx, partners, expanded, onToggle }) => {
  if (!partners || partners.length === 0) return (
    <div className="flex items-center pl-[27px] my-1">
      <div className="w-px h-8 bg-accent/10 ml-px" />
    </div>
  );

  return (
    <div className="pl-[52px] my-2 relative">
      {/* Dot on the line */}
      <div className="absolute left-[25px] top-3 w-3 h-3 rounded-full bg-accent-gold/20 border-2 border-accent-gold/40 z-10" />

      <button
        onClick={onToggle}
        className="flex items-center gap-2 py-1.5 group"
      >
        <div className="w-7 h-7 rounded-full bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center shrink-0 group-hover:bg-accent-gold/20 transition-colors">
          <Store size={13} className="text-accent-gold" />
        </div>
        <span className="text-[11px] font-black text-text-muted group-hover:text-accent-gold transition-colors uppercase tracking-widest">
          {partners.length} partner vicini
        </span>
        <ChevronRight
          size={13}
          strokeWidth={3}
          className={`text-text-muted transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 pt-2 pr-4">
              {partners.map(p => (
                <PartnerMiniCard key={p.id} partner={p} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- MAIN PAGE ---

export default function SagaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const [saga, setSaga] = useState(null);
  const [completedStepsIds, setCompletedStepsIds] = useState([]);
  const [nearbyPartners, setNearbyPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { location, startWatching } = useGeolocation();
  const [selectedStep, setSelectedStep] = useState(null);
  const [unlockingStep, setUnlockingStep] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedPartnerNode, setExpandedPartnerNode] = useState(null);

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

        // Fetch nearby partners for this saga's city
        if (detail?.city) {
          const { data: partners } = await supabase
            .from('partners')
            .select('id, name, category, logo_url, city, latitude, longitude')
            .eq('city', detail.city)
            .eq('is_active', true)
            .limit(30);
          setNearbyPartners(partners || []);
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
      <div className="min-h-screen bg-[#FCFAF2] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!saga) {
    return (
      <div className="min-h-screen bg-[#FCFAF2] text-text-primary flex flex-col items-center justify-center p-6">
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

  const attemptUnlock = () => {
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
    <div className="min-h-[100dvh] bg-[#FCFAF2] text-text-primary font-sans relative overflow-x-hidden selection:bg-accent/20">

      {/* TOP BAR */}
      <header className="relative z-50 pt-[env(safe-area-inset-top)] px-5">
        <div className="flex items-center justify-between h-20">
          <button
            onClick={() => navigate('/missioni')}
            className="w-11 h-11 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm active:scale-90 transition-all"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <motion.div
            initial={{ rotate: -2 }}
            animate={{ rotate: 2 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="bg-accent-gold text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-md rounded-sm border-b-2 border-black/10 flex items-center gap-2"
          >
            <span>{completedSteps.length}/{steps.length}</span>
            <Sparkle size={12} weight="fill" className="animate-pulse" />
          </motion.div>

          <button
            onClick={() => setShowHistory(true)}
            className="w-11 h-11 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm relative active:scale-90 transition-all"
          >
            <History size={20} />
            {completedSteps.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-white animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="relative z-50 h-1.5 px-5 mt-1 mb-2">
        <div className="h-full w-full bg-zinc-200/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(212,121,58,0.4)]"
          />
        </div>
      </div>

      {/* MAIN CONTENT – ROAD MAP */}
      <main className="relative z-10 px-5 pb-32 pt-4">
        <div className="max-w-lg mx-auto">

          {/* Saga title */}
          <div className="mb-8 text-center">
            <h1 className="text-[34px] font-serif font-black text-text-primary leading-[1.1] tracking-tight">{title}</h1>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-accent mt-2">
              {isSagaComplete ? 'Saga completata ✓' : activeStep ? `Prossima tappa: ${activeStep.title}` : 'In corso...'}
            </p>
          </div>

          {/* Road Map */}
          <div className="relative">
            {/* Vertical connecting line */}
            <div
              className="absolute top-7 bottom-7 w-px bg-gradient-to-b from-accent/30 via-accent/20 to-transparent"
              style={{ left: '27px' }}
            />

            {steps.map((step, idx) => {
              const isDone = step.status === 'completed';
              const isCurrent = step.status === 'active';
              const isLocked = step.status === 'locked';
              const partnersForNode = idx < steps.length - 1
                ? getPartnersBetween(step, steps[idx + 1], nearbyPartners)
                : [];

              return (
                <React.Fragment key={step.id}>
                  {/* ── Step Node ── */}
                  <div className={`flex gap-4 py-2 ${isLocked ? 'opacity-40' : ''}`}>
                    {/* Circle indicator */}
                    <div className={`relative z-10 w-14 h-14 rounded-full shrink-0 flex items-center justify-center border-4 transition-all duration-500 ${
                      isDone ? 'bg-accent border-white shadow-lg shadow-accent/25' :
                      isCurrent ? 'bg-white border-accent shadow-2xl shadow-black/10 scale-110' :
                      'bg-zinc-50 border-zinc-200'
                    }`}>
                      {isDone ? (
                        <CheckCircle2 size={22} className="text-white" />
                      ) : isCurrent ? (
                        <span className="text-accent font-black text-[18px]">{idx + 1}</span>
                      ) : (
                        <Lock size={16} className="text-zinc-300" />
                      )}
                    </div>

                    {/* Content card */}
                    <div className={`flex-1 rounded-3xl p-5 border transition-all ${
                      isDone ? 'bg-white border-black/5 shadow-sm' :
                      isCurrent ? 'bg-white border-accent/20 shadow-xl shadow-black/5' :
                      'bg-white/60 border-black/5'
                    }`}>
                      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-accent-gold">
                        {idx === 0 ? 'Partenza' : idx === steps.length - 1 ? 'Gran Finale' : `Tappa ${idx + 1}`}
                      </span>
                      <h4 className={`text-[16px] font-serif font-black mt-0.5 leading-snug ${
                        isDone || isCurrent ? 'text-text-primary' : 'text-text-muted'
                      }`}>
                        {isDone || isCurrent ? step.title : `Mistero n.${idx + 1}`}
                      </h4>

                      {isCurrent && (
                        <>
                          <p className="text-[13px] text-text-muted mt-3 italic leading-relaxed border-l-2 border-accent-gold/30 pl-3">
                            "{step.hint}"
                          </p>

                          {/* Distance */}
                          {distanceMeters !== null && (
                            <div className="mt-3 flex items-center gap-2">
                              <Navigation2 size={13} className="text-accent-gold" />
                              <span className="text-[12px] font-black text-text-primary">
                                {distanceMeters > 999
                                  ? `${(distanceMeters / 1000).toFixed(1)} km`
                                  : `${distanceMeters} m`}
                                <span className="text-text-muted font-medium ml-1">da questo luogo</span>
                              </span>
                            </div>
                          )}

                          {/* Unlock CTA */}
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={attemptUnlock}
                            className={`mt-4 w-full py-3.5 rounded-2xl font-black uppercase tracking-wider text-[12px] flex items-center justify-center gap-2 transition-all ${
                              canUnlockProximity
                                ? 'bg-accent text-white shadow-lg shadow-accent/30'
                                : 'bg-zinc-100 text-zinc-400'
                            }`}
                          >
                            {canUnlockProximity ? (
                              <><Unlock size={16} weight="bold" /> Sblocca il Mistero</>
                            ) : (
                              <><Lock size={15} /> {distanceMeters !== null ? `Ancora ${Math.max(0, distanceMeters - step.radius)}m` : 'GPS Necessario'}</>
                            )}
                          </motion.button>
                        </>
                      )}

                      {isDone && (
                        <button
                          onClick={() => setSelectedStep({ ...step, status: 'completed' })}
                          className="mt-3 text-[11px] font-black text-accent flex items-center gap-1 uppercase tracking-widest"
                        >
                          Rivedi <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Partner Discovery Node (between steps) ── */}
                  {idx < steps.length - 1 && (
                    <PartnerDiscoveryNode
                      idx={idx}
                      partners={partnersForNode}
                      expanded={expandedPartnerNode === idx}
                      onToggle={() => setExpandedPartnerNode(expandedPartnerNode === idx ? null : idx)}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Saga Complete */}
          {isSagaComplete && (
            <motion.div
              className="text-center py-12 mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-3xl font-serif font-black text-text-primary mb-3 relative inline-block">
                <span className="relative z-10">Saga Completata!</span>
                <div className="absolute left-0 bottom-1 w-full h-4 bg-accent-gold/20 -z-0 -rotate-1 rounded-sm" />
              </h2>
              <p className="text-text-muted mb-8 italic font-medium">"{title}" è ora nel tuo diario.</p>
              <button
                onClick={() => navigate('/missioni')}
                className="btn-primary inline-flex items-center gap-2"
              >
                Nuove Avventure <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* HISTORY DRAWER */}
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
              <div className="flex items-center justify-between mb-10">
                <div className="relative">
                  <h3 className="text-[30px] font-serif font-black text-text-primary tracking-tight relative z-10">Le tue Scoperte</h3>
                  <div className="absolute left-0 bottom-1 w-full h-3 bg-accent/20 -z-0 -rotate-1" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent-gold mt-2">Registro Avventure</p>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition-all active:scale-90 border border-zinc-100 shadow-sm"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>

              <div className="grid gap-5">
                {completedSteps.map((step, idx) => (
                  <motion.div
                    key={step.id}
                    style={{ rotate: idx % 2 === 0 ? '-1deg' : '1deg' }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-start gap-5 p-5 bg-white border border-black/5 rounded-[2rem] cursor-pointer hover:shadow-xl transition-all group shadow-sm relative"
                    onClick={() => setSelectedStep({ ...step, status: 'completed' })}
                  >
                    <div className="absolute top-0 right-10 w-10 h-4 bg-accent-gold/15 -translate-y-2 rotate-6 z-20" />
                    <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                      <img src={step.image_url} alt={step.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 pt-1">
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-accent-gold mb-1 block">Tappa {step.step_order}</span>
                      <h4 className="text-[18px] font-serif font-black text-text-primary leading-tight mb-2">{step.title}</h4>
                      <div className="flex items-center gap-1.5 text-accent font-black text-[10px] uppercase tracking-widest">
                        Esplora <ArrowRight size={13} />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {completedSteps.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-[14px] text-text-muted italic font-medium">Nessuna tappa completata ancora.<br />Inizia la saga per sbloccare i misteri!</p>
                  </div>
                )}

                {lockedSteps.length > 0 && completedSteps.length > 0 && (
                  <div className="pt-8 border-t border-dashed border-zinc-200 text-center">
                    <p className="text-[11px] text-text-muted italic font-medium opacity-50">Ancora {lockedSteps.length} misteri da incollare in questo diario...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UNLOCK MODALS */}
      {selectedStep && (() => {
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
          return <UnlockedCardDetail card={{ ...cardObj, isUnlocked: true }} onClose={() => setSelectedStep(null)} />;
        }
        return (
          <LockedCardDetail
            card={cardObj}
            userLocation={location}
            onClose={() => setSelectedStep(null)}
            onUnlock={() => handleUnlockStepSuccess(selectedStep)}
            unlocking={unlockingStep}
          />
        );
      })()}

    </div>
  );
}
