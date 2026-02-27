// src/pages/SagaDetail.jsx
import React, { useState, useEffect } from 'react';
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
      <div className="min-h-screen bg-[#0C0D10] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E4AE2F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!saga) {
    return (
      <div className="min-h-screen bg-[#0C0D10] text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold font-serif mb-2">Saga non trovata</h2>
        <button onClick={() => navigate('/missioni')} className="text-[#E4AE2F] underline">Torna indietro</button>
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
    <div className="min-h-[100dvh] bg-[#0C0D10] text-white flex flex-col font-sans relative overflow-x-hidden">

      {/* BACKGROUND SCENE */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {activeStep ? (
          <img
            src={activeStep.image_url}
            alt="Luogo Misterioso"
            className={`w-full h-[60vh] object-cover transition-all duration-[3000ms] ${canUnlockProximity ? 'blur-sm brightness-75 scale-100' : 'blur-xl brightness-50 grayscale scale-110'}`}
          />
        ) : isSagaComplete ? (
          <img src={saga.image_url} alt="Saga Completata" className="w-full h-full object-cover blur-sm brightness-50" />
        ) : (
          <div className="w-full h-[60vh] bg-gradient-to-b from-[#1C1C18] to-[#0C0D10]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0D10] via-[#0C0D10]/80 to-transparent h-full" />
      </div>

      {/* TOP BAR */}
      <header className="relative z-20 pt-[env(safe-area-inset-top)] flex flex-col px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => navigate('/missioni')} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-white/10 transition">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[#E4AE2F] text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">La Bussola</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-slate-300">{completedSteps.length}</span>
              <span className="text-[10px] text-slate-500">/</span>
              <span className="text-[13px] font-bold text-slate-500">{steps.length}</span>
            </div>
          </div>
          <button onClick={() => setShowHistory(true)} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-white/10 transition relative">
            <History size={18} />
            {completedSteps.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#E4AE2F] rounded-full border-2 border-[#0C0D10]"></span>}
          </button>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="relative z-20 h-0.5 w-full bg-white/10 mt-2">
        <div
          className="h-full bg-gradient-to-r from-[#E4AE2F] to-[#FFF1C0] transition-all duration-1000 shadow-[0_0_15px_rgba(228,174,47,0.8)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col px-6 py-10 mt-4">
        {!isSagaComplete && activeStep ? (
          <div className="flex flex-col items-center max-w-sm mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* ENIGMA */}
            <div className="mb-10 text-center">
              <h3 className="text-[#E4AE2F] text-[10px] font-bold uppercase tracking-[0.3em] mb-4 flex items-center justify-center gap-2">
                <Target className="w-3.5 h-3.5" /> {activeStep.title}
              </h3>
              <p className="text-[20px] sm:text-[24px] font-serif font-bold text-white leading-snug drop-shadow-lg italic px-2">
                "{activeStep.hint}"
              </p>
            </div>

            {/* RADAR */}
            <div className="relative w-48 h-48 mb-10 flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full border border-[#E4AE2F]/20 ${!canUnlockProximity ? 'animate-[ping_3s_ease-out_infinite]' : ''}`}></div>
              <div className={`absolute inset-4 rounded-full border border-[#E4AE2F]/30 ${!canUnlockProximity ? 'animate-[ping_3s_ease-out_infinite_500ms]' : ''}`}></div>
              <div className="absolute inset-8 rounded-full border border-[#E4AE2F]/50"></div>
              <div className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center p-2 shadow-[0_0_40px_rgba(228,174,47,0.15)] transition-all duration-1000 ${canUnlockProximity ? 'bg-gradient-to-br from-[#E4AE2F] to-[#B8860B] border-2 border-white' : 'bg-[#1C1C18]/80 backdrop-blur-md border border-[#E4AE2F]/50'}`}>
                {canUnlockProximity ? (
                  <>
                    <Unlock className="w-8 h-8 text-[#0C0D10] mb-1" />
                    <span className="text-[#0C0D10] text-[11px] font-black uppercase tracking-widest text-center mt-1 leading-tight">Obiettivo<br />Raggiunto</span>
                  </>
                ) : (
                  <>
                    <Navigation2 className="w-6 h-6 text-[#E4AE2F] mb-1" strokeWidth={2.5} />
                    {distanceMeters !== null ? (
                      <div className="flex flex-col items-center">
                        <span className="text-white text-[24px] font-bold font-serif leading-none tracking-tight">{distanceMeters > 999 ? (distanceMeters / 1000).toFixed(1) : distanceMeters}</span>
                        <span className="text-[#E4AE2F] text-[10px] uppercase font-bold tracking-widest">{distanceMeters > 999 ? 'km' : 'metri'}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs text-center px-2">Cercando GPS...</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* UNLOCK BUTTON */}
            <button
              onClick={attemptUnlock}
              className={`w-full py-5 rounded-[1.25rem] text-[14px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all duration-300 ${canUnlockProximity
                ? 'bg-[#E4AE2F] hover:bg-[#F2C24E] text-[#0C0D10] shadow-[0_0_25px_rgba(228,174,47,0.4)] hover:shadow-[0_0_35px_rgba(228,174,47,0.6)] active:scale-[0.98]'
                : 'bg-white/5 border border-white/10 text-white/50 backdrop-blur-md hover:bg-white/10'
                }`}
            >
              {canUnlockProximity ? (
                <>Rivela il Luogo <ArrowRight className="w-5 h-5" /></>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span className="opacity-90">{distanceMeters !== null ? `Avvicinati ancora di ${Math.max(0, distanceMeters - activeStep.radius)}m` : 'Attiva GPS per Sbloccare'}</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 mt-4 text-center max-w-[250px]">
              Devi trovarti entro il raggio di {activeStep.radius} metri dalla destinazione per validare la presenza.
            </p>

            {/* ===== STEP NAMES SECTION ===== */}
            <div className="mt-10 w-full">
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] text-[#E4AE2F] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5" /> Tappe del percorso
                </span>
                <span className="text-[10px] text-slate-500">{steps.length} luoghi</span>
              </div>

              {/* Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {steps.map((step, idx) => (
                  <span
                    key={step.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${step.status === 'completed'
                        ? 'bg-[#E4AE2F]/10 border-[#E4AE2F]/40 text-[#E4AE2F]'
                        : step.status === 'active'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-zinc-900 border-white/5 text-slate-600'
                      }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : step.status === 'active' ? (
                      <span className="w-2 h-2 rounded-full bg-[#E4AE2F] animate-pulse inline-block" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    {step.status === 'locked' ? `Mistero ${idx + 1}` : step.title}
                  </span>
                ))}
              </div>

              {/* "Vedi itinerario" toggle button */}
              <button
                onClick={() => setShowItinerary(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-[13px] font-bold text-[#E4AE2F] hover:bg-white/10 transition-all"
              >
                <span className="flex items-center gap-2"><Route size={14} /> Vedi itinerario</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showItinerary ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown itinerary list */}
              {showItinerary && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-[#1C1C18] divide-y divide-white/5">
                  {steps.map((step, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === steps.length - 1;
                    const isCurrent = step.status === 'active';
                    const isDone = step.status === 'completed';
                    return (
                      <div key={step.id} className={`flex items-start gap-4 px-4 py-3.5 ${isCurrent ? 'bg-[#E4AE2F]/5' : ''}`}>
                        <div className={`mt-0.5 w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 text-[10px] font-bold ${isDone ? 'bg-[#E4AE2F] border-[#E4AE2F] text-[#0C0D10]'
                            : isCurrent ? 'border-[#E4AE2F] text-[#E4AE2F] bg-[#1C1C18]'
                              : 'border-slate-700 text-slate-600 bg-[#0C0D10]'
                          }`}>
                          {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[#E4AE2F]/60">
                              {isFirst ? 'Partenza' : isLast ? 'Destinazione' : `Tappa ${idx + 1}`}
                            </span>
                            {isDone && <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">SVELATO</span>}
                          </div>
                          <p className={`text-[14px] font-bold leading-tight ${isDone || isCurrent ? 'text-white' : 'text-slate-600'}`}>
                            {isDone || isCurrent ? step.title : `Mistero n. ${idx + 1}`}
                          </p>
                          {isCurrent && (
                            <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2 pr-2">"{step.hint}"</p>
                          )}
                        </div>
                        {isCurrent && <ChevronRight className="w-4 h-4 text-[#E4AE2F]/40 shrink-0 mt-1" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* ===== END STEP NAMES SECTION ===== */}

          </div>
        ) : isSagaComplete ? (
          <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-1000 flex-1">
            <div className="w-24 h-24 bg-gradient-to-br from-[#E4AE2F] to-[#B8860B] rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(228,174,47,0.4)]">
              <CheckCircle2 className="w-12 h-12 text-[#0C0D10]" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-white mb-2">Saga Completata!</h2>
            <p className="text-slate-400 font-medium max-w-xs mb-8">Hai svelato tutti i segreti di {title}. Il mistero è stato risolto.</p>
            <button
              onClick={() => navigate('/missioni')}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full text-sm font-bold uppercase tracking-wider transition-all"
            >
              Torna alle Missioni
            </button>
          </div>
        ) : null}
      </main>

      {/* BOTTOM DRAWER TRIGGER */}
      {!isSagaComplete && completedSteps.length > 0 && (
        <div className="relative z-20 pb-[env(safe-area-inset-bottom)] pb-8 px-6 pt-6 flex justify-center">
          <button
            onClick={() => setShowHistory(true)}
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <span className="text-[10px] uppercase tracking-widest font-bold">Guarda Tappe Passate</span>
            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
            <div className="w-1 h-1 rounded-full bg-slate-800"></div>
          </button>
        </div>
      )}

      {/* HISTORY DRAWER */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0C0D10]/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex-1" onClick={() => setShowHistory(false)} />
          <div className="bg-[#1C1C18] border-t border-white/10 rounded-t-[2rem] p-6 max-h-[85vh] overflow-y-auto w-full max-w-lg mx-auto shadow-2xl animate-in slide-in-from-bottom-full duration-500 pb-[calc(24px+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#1C1C18] py-2 z-10 border-b border-white/5">
              <h3 className="text-lg font-bold font-serif text-white">Log delle Scoperte</h3>
              <button onClick={() => setShowHistory(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-slate-300 hover:bg-white/20">
                <ChevronLeft className="w-5 h-5 -rotate-90" />
              </button>
            </div>
            <div className="space-y-4">
              {completedSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 p-4 bg-[#0C0D10] border border-white/5 rounded-2xl cursor-pointer hover:border-[#E4AE2F]/30 transition-all group"
                  onClick={() => setSelectedStep({ ...step, status: 'completed' })}
                >
                  <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden relative border border-white/10 group-hover:border-[#E4AE2F]">
                    <img src={step.image_url} alt={step.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-[#E4AE2F] drop-shadow-md" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#E4AE2F] font-bold uppercase tracking-widest mb-0.5">Tappa {step.step_order}</p>
                    <h4 className="text-[15px] font-bold text-white leading-tight mb-1">{step.title}</h4>
                    <span className="text-[12px] text-slate-500 group-hover:text-slate-300 transition-colors">Tocca per rivedere ➔</span>
                  </div>
                </div>
              ))}
              {lockedSteps.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3 justify-center">
                  {lockedSteps.map((s, idx) => (
                    <div key={idx} className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" title={`Tappa ${s.step_order} bloccata`}></div>
                  ))}
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Ancora Nascoste</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UNLOCK MODALS */}
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
