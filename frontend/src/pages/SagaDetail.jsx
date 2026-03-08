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
    <div className="min-h-[100dvh] bg-bg-primary text-text-primary flex flex-col font-sans relative overflow-x-hidden transition-colors duration-500">

      {/* BACKGROUND SCENE */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {activeStep ? (
          <img
            src={activeStep.image_url}
            alt="Luogo Misterioso"
            className={`w-full h-[65vh] object-cover transition-all duration-[3000ms] ${canUnlockProximity ? 'blur-sm brightness-75 scale-100' : 'blur-xl brightness-50 grayscale scale-110'}`}
          />
        ) : isSagaComplete ? (
          <img src={saga.image_url} alt="Saga Completata" className="w-full h-full object-cover blur-sm brightness-50" />
        ) : (
          <div className="w-full h-[65vh] bg-gradient-to-b from-bg-secondary to-bg-primary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent h-full" />
      </div>

      {/* TOP BAR */}
      <header className="relative z-20 pt-[env(safe-area-inset-top)] flex flex-col px-6">
        <div className="flex items-center justify-between h-20">
          <button onClick={() => navigate('/missioni')} className="w-11 h-11 rounded-full bg-surface border border-border-default flex items-center justify-center text-text-primary hover:border-accent/40 transition-all shadow-sm active:scale-90">
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col items-center">
            <span className="overline !text-accent !mb-1 !tracking-[0.3em] !text-[10px]">La Bussola</span>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-black text-text-primary">{completedSteps.length}</span>
              <span className="text-[12px] text-text-muted opacity-50">/</span>
              <span className="text-[15px] font-black text-text-muted">{steps.length}</span>
            </div>
          </div>
          <button onClick={() => setShowHistory(true)} className="w-11 h-11 rounded-full bg-surface border border-border-default flex items-center justify-center text-text-primary hover:border-accent/40 transition-all relative shadow-sm active:scale-90">
            <History size={20} />
            {completedSteps.length > 0 && <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-surface shadow-sm animate-pulse"></span>}
          </button>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="relative z-20 h-1 w-full bg-border-default mt-2">
        <div
          className="h-full bg-accent transition-all duration-[1500ms] shadow-[0_0_20px_rgba(212,121,58,0.4)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col px-6 py-10 mt-4">
        {!isSagaComplete && activeStep ? (
          <div className="flex flex-col items-center max-w-sm mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* ENIGMA */}
            <div className="mb-14 text-center">
              <h3 className="overline !text-accent !mb-5 flex items-center justify-center gap-2.5 !tracking-[0.4em]">
                <Target size={16} weight="bold" /> {activeStep.title}
              </h3>
              <p className="text-[26px] sm:text-[32px] font-serif font-black text-text-primary leading-[1.2] tracking-tight drop-shadow-xl italic px-4">
                "{activeStep.hint}"
              </p>
            </div>

            {/* RADAR */}
            <div className="relative w-56 h-56 mb-12 flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full border border-accent/20 ${!canUnlockProximity ? 'animate-[ping_4s_ease-out_infinite]' : ''}`}></div>
              <div className={`absolute inset-6 rounded-full border border-accent/25 ${!canUnlockProximity ? 'animate-[ping_4s_ease-out_infinite_1000ms]' : ''}`}></div>
              <div className="absolute inset-12 rounded-full border border-accent/30"></div>
              
              <div className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center p-2 shadow-[0_0_60px_rgba(212,121,58,0.2)] transition-all duration-1000 ${canUnlockProximity ? 'bg-accent text-white border-2 border-white shadow-xl scale-110' : 'bg-surface/80 backdrop-blur-xl border border-accent/40 shadow-inner'}`}>
                {canUnlockProximity ? (
                  <>
                    <Unlock size={32} weight="fill" className="mb-2" />
                    <span className="text-white text-[11px] font-black uppercase tracking-widest text-center mt-1 leading-tight">Sblocca<br />Ora</span>
                  </>
                ) : (
                  <>
                    <Navigation2 size={24} weight="bold" className="text-accent mb-2 transition-transform duration-500 hover:rotate-45" />
                    {distanceMeters !== null ? (
                      <div className="flex flex-col items-center">
                        <span className="text-text-primary text-[28px] font-black font-serif leading-none tracking-tight">{distanceMeters > 999 ? (distanceMeters / 1000).toFixed(1) : distanceMeters}</span>
                        <span className="text-accent text-[11px] uppercase font-black tracking-widest mt-1">{distanceMeters > 999 ? 'km' : 'metri'}</span>
                      </div>
                    ) : (
                      <span className="text-text-muted text-[11px] font-black uppercase tracking-widest text-center px-4 leading-relaxed mt-1 animate-pulse">Cercando Segnale...</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* UNLOCK BUTTON */}
            <button
              onClick={attemptUnlock}
              className={`w-full !py-5 btn-primary group ${!canUnlockProximity ? '!bg-surface !border-border-default !text-text-muted hover:!border-accent/30' : 'shadow-xl shadow-accent/20'}`}
            >
              {canUnlockProximity ? (
                <>Rivela il Luogo <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" /></>
              ) : (
                <>
                  <Lock size={18} weight="bold" />
                  <span className="font-black tracking-[0.1em]">{distanceMeters !== null ? `Avvicinati ancora di ${Math.max(0, distanceMeters - activeStep.radius)}m` : 'Attiva GPS per Sbloccare'}</span>
                </>
              )}
            </button>
            <p className="overline !text-text-muted !mt-6 text-center max-w-[280px] !normal-case !font-medium opacity-60">
              Devi trovarti entro il raggio di {activeStep.radius} metri dalla destinazione per validare la presenza.
            </p>

            {/* ===== STEP NAMES SECTION ===== */}
            <div className="mt-14 w-full">
              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <span className="overline !text-accent !mb-0 !flex items-center gap-2.5">
                  <Route size={16} weight="bold" /> Tappe del percorso
                </span>
                <span className="overline !text-text-muted !mb-0 tracking-wider">{steps.length} luoghi</span>
              </div>

              {/* Pills */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                {steps.map((step, idx) => (
                  <span
                    key={step.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${step.status === 'completed'
                      ? 'bg-accent/5 border-accent/30 text-accent'
                      : step.status === 'active'
                        ? 'bg-surface border-border-default text-text-primary shadow-sm'
                        : 'bg-surface/40 opacity-30 border-border-default text-text-muted'
                      }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 size={12} weight="fill" />
                    ) : step.status === 'active' ? (
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(212,121,58,0.5)]" />
                    ) : (
                      <Lock size={12} weight="bold" />
                    )}
                    {step.status === 'locked' ? `Mistero ${idx + 1}` : step.title}
                  </span>
                ))}
              </div>

              {/* "Vedi itinerario" toggle button */}
              <button
                onClick={() => setShowItinerary(v => !v)}
                className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-surface border border-border-default text-[13px] font-black uppercase tracking-widest text-accent hover:border-accent/30 transition-all shadow-sm active:scale-[0.98]"
              >
                <span className="flex items-center gap-3"><Route size={18} weight="bold" /> Esplora Itinerario</span>
                <ChevronDown size={18} weight="bold" className={`transition-transform duration-500 ${showItinerary ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown itinerary list */}
              {showItinerary && (
                <div className="mt-4 rounded-3xl overflow-hidden border border-border-default bg-surface divide-y divide-border-default shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                  {steps.map((step, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === steps.length - 1;
                    const isCurrent = step.status === 'active';
                    const isDone = step.status === 'completed';
                    return (
                      <div key={step.id} className={`flex items-start gap-5 px-6 py-4.5 ${isCurrent ? 'bg-accent/5' : ''}`}>
                        <div className={`mt-1 w-7 h-7 rounded-full shrink-0 flex items-center justify-center border-2 text-[10px] font-black ${isDone ? 'bg-accent border-accent text-white shadow-sm'
                          : isCurrent ? 'border-accent text-accent bg-surface animate-pulse shadow-[0_0_10px_rgba(212,121,58,0.2)]'
                            : 'border-border-default text-text-muted bg-bg-secondary opacity-50'
                          }`}>
                          {isDone ? <CheckCircle2 size={16} weight="bold" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent opacity-70">
                              {isFirst ? 'Partenza' : isLast ? 'Destinazione' : `Tappa ${idx + 1}`}
                            </span>
                            {isDone && <span className="text-[8px] font-black bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">SVELATO</span>}
                          </div>
                          <p className={`text-[17px] font-serif font-black leading-tight tracking-tight ${isDone || isCurrent ? 'text-text-primary' : 'text-text-muted'}`}>
                            {isDone || isCurrent ? step.title : `Mistero n. ${idx + 1}`}
                          </p>
                          {isCurrent && (
                            <p className="text-[14px] text-text-muted mt-2 font-medium italic border-l-2 border-accent/20 pl-4">"{step.hint}"</p>
                          )}
                        </div>
                        {isCurrent && <ArrowRight size={18} weight="bold" className="text-accent opacity-30 shrink-0 mt-2 animate-bounce-horizontal" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* ===== END STEP NAMES SECTION ===== */}

          </div>
        ) : isSagaComplete ? (
          <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-1000 flex-1 py-10">
            <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mb-10 shadow-[0_0_60px_rgba(212,121,58,0.4)] border-4 border-white">
              <CheckCircle2 size={40} weight="bold" className="text-white" />
            </div>
            <h2 className="text-[36px] font-serif font-black text-text-primary mb-4 tracking-tight leading-tight">Saga Completata!</h2>
            <p className="text-[17px] text-text-muted font-medium max-w-[280px] mb-12">Hai svelato tutti i segreti di {title}. Il mistero è finalmente risolto.</p>
            <button
              onClick={() => navigate('/missioni')}
              className="btn-primary !px-10 group"
            >
              Torna alle Missioni <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : null}
      </main>

      {/* BOTTOM DRAWER TRIGGER */}
      {!isSagaComplete && completedSteps.length > 0 && (
        <div className="relative z-20 pb-[env(safe-area-inset-bottom)] pb-10 px-6 pt-6 flex justify-center">
          <button
            onClick={() => setShowHistory(true)}
            className="flex flex-col items-center gap-2 text-text-muted hover:text-accent transition-all group"
          >
            <span className="overline !text-current !mb-1 !tracking-[0.4em]">Log Scoperte</span>
            <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
              <div className="w-1 h-1 rounded-full bg-current"></div>
              <div className="w-1 h-1 rounded-full bg-current"></div>
              <div className="w-1 h-1 rounded-full bg-current"></div>
            </div>
          </button>
        </div>
      )}

      {/* HISTORY DRAWER */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg-dark/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex-1" onClick={() => setShowHistory(false)} />
          <div className="bg-bg-primary border-t border-border-default rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto w-full max-w-lg mx-auto shadow-2xl animate-in slide-in-from-bottom-full duration-500 pb-[calc(40px+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-10 sticky top-0 bg-bg-primary/95 backdrop-blur-sm py-4 z-10 border-b border-border-default -mt-2">
              <div>
                <h3 className="text-2xl font-serif font-black text-text-primary tracking-tight">Le tue Scoperte</h3>
                <p className="overline !text-accent !mb-0 !mt-1">Log dell'avventura</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="w-11 h-11 bg-bg-secondary rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition-all active:scale-90">
                <ChevronLeft className="w-6 h-6 -rotate-90" />
              </button>
            </div>
            <div className="space-y-5">
              {completedSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-start gap-5 p-5 bg-surface border border-border-default rounded-[1.5rem] cursor-pointer hover:border-accent/40 transition-all group shadow-sm active:scale-[0.98]"
                  onClick={() => setSelectedStep({ ...step, status: 'completed' })}
                >
                  <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden relative border border-border-default group-hover:border-accent transition-colors shadow-sm">
                    <img src={step.image_url} alt={step.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    <div className="absolute inset-0 bg-accent/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 size={24} weight="fill" className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="overline !text-accent !mb-1.5 !text-[9px]">Tappa {step.step_order}</p>
                    <h4 className="text-[18px] font-serif font-black text-text-primary leading-tight mb-2 tracking-tight truncate">{step.title}</h4>
                    <span className="text-[12px] text-text-muted font-black uppercase tracking-wider group-hover:text-accent transition-colors">Dettagli ➔</span>
                  </div>
                </div>
              ))}
              {lockedSteps.length > 0 && (
                <div className="mt-10 pt-10 border-t border-border-default flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    {lockedSteps.map((s, idx) => (
                      <div key={idx} className="w-2.5 h-2.5 rounded-full bg-border-default border border-border-default/50" title={`Tappa ${s.step_order} bloccata`}></div>
                    ))}
                  </div>
                  <span className="overline !text-text-muted !mb-0 opacity-40">Misteri ancora nascosti</span>
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
