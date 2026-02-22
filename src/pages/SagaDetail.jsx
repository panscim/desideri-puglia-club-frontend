import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Check, Lock, Navigation, MapPin } from 'lucide-react';
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

export default function SagaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [saga, setSaga] = useState(null);
  const [completedStepsIds, setCompletedStepsIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // New states for Step Modals
  const { location, startWatching } = useGeolocation();
  const [selectedStep, setSelectedStep] = useState(null);
  const [unlockingStep, setUnlockingStep] = useState(false);

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
      <div className="min-h-screen bg-[#161512] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E4AE2F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!saga) {
    return (
      <div className="min-h-screen bg-[#161512] text-white flex flex-col items-center justify-center p-6">
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
      title: step.description_it || `Step ${step.step_order}`,
      image_url: step._image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format',
      status,
      date: isCompleted ? 'Completato' : '',
      distance: status === 'active' ? 'La tua prossima meta' : ''
    }
  });

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const activeStep = steps.find(s => s.status === 'active');

  const handleStepClick = (step) => {
    if (step.status === 'locked') {
      toast('Continua la storia per sbloccare questo passo', { icon: '🔒' });
      return;
    }
    setSelectedStep(step);
  };

  const handleUnlockStep = async (step) => {
    setUnlockingStep(true);
    try {
      if (step.reference_table === 'cards' && step.reference_id) {
        await AlbumService.unlockCard(step.reference_id);
      }

      const res = await QuestService.unlockQuestStep(user.id, step.id);
      if (res.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
        toast.success(`Hai completato lo step: ${step.title}!`, { duration: 5000, icon: '🎉' });

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
    <div className="min-h-screen bg-[#161512] text-white pb-72 font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#161512]/95 backdrop-blur-md pt-[env(safe-area-inset-top)] border-b border-[#E4AE2F]/10">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate('/missioni')} className="p-2 -ml-2 text-[#E4AE2F] rounded-full hover:bg-white/5 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-[17px] font-bold text-white font-serif tracking-wide">{title}</h1>
            <p className="text-[#E4AE2F] text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">STORY QUEST</p>
          </div>
          <button className="p-2 text-[#E4AE2F] rounded-full hover:bg-white/5 transition-colors">
            <div className="w-6 h-6 rounded-full border border-[#E4AE2F] flex items-center justify-center">
              <span className="text-sm font-serif font-bold italic">i</span>
            </div>
          </button>
        </div>

        {/* Progress Bar Area */}
        <div className="px-6 pb-4 pt-2">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] text-stone-400 font-bold tracking-widest uppercase">Path to Legend</span>
            <span className="text-[11px] font-bold text-[#E4AE2F]">{progressPercent}% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-[#2A2A26] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E4AE2F] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(228,174,47,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* TIMELINE */}
      <div className="px-6 py-12 space-y-20 max-w-2xl mx-auto overflow-hidden">
        {steps.map((step, index) => {
          const isEven = index % 2 === 0; // 0 = Left, 1 = Right
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isLocked = step.status === 'locked';

          return (
            <div
              key={step.id}
              className={`flex ${isEven ? 'flex-row' : 'flex-row-reverse'} items-center gap-8 relative ${isLocked ? 'opacity-70 grayscale-[0.5]' : 'cursor-pointer hover:scale-[1.02]'} transition-transform`}
              onClick={() => handleStepClick(step)}
            >

              {/* Circle Area (Left or Right) */}
              <div className="relative flex-shrink-0 z-10 w-28 h-28">
                {/* Dotted Line Tail */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 -translateX-1/2 top-full w-0.5 h-24 border-l-2 border-dotted border-[#E4AE2F]/30 -ml-[1px]" />
                )}

                {isCompleted && (
                  <div className="w-full h-full rounded-full border-4 border-[#166534] bg-stone-800 relative z-10 shadow-lg">
                    <img src={step.image_url} alt={step.title} className="w-full h-full object-cover rounded-full p-1" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#22C55E] rounded-full flex items-center justify-center border-2 border-[#161512] shadow-sm">
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}

                {isActive && (
                  <div className="w-full h-full rounded-full border-[3px] border-[#E4AE2F] bg-stone-800 relative z-10 shadow-[0_0_25px_rgba(228,174,47,0.25)] p-[2px]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E4AE2F] text-[#161512] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md z-20">
                      Active
                    </div>
                    <img src={step.image_url} alt={step.title} className="w-full h-full object-cover rounded-full" />
                  </div>
                )}

                {isLocked && (
                  <div className="w-full h-full rounded-full bg-[#211F1a] border border-[#3A3A36] flex items-center justify-center relative z-10">
                    <div className="w-12 h-12 rounded-full bg-[#161512] border border-[#3A3A36] flex items-center justify-center shadow-inner">
                      <Lock className="w-5 h-5 text-[#3A3A36]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Text Area */}
              <div className={`flex-1 ${isEven ? 'text-left' : 'text-right'}`}>
                <h4 className={`text-xs font-bold tracking-widest mb-1 ${isActive ? 'text-[#E4AE2F]' : 'text-[#8A8476]'}`}>
                  <span className="opacity-70">STEP</span> {step.step_order}
                </h4>
                <h3 className={`text-xl leading-snug font-bold mb-2 ${isLocked ? 'text-[#5A564C]' : 'text-white'}`}>
                  {step.title}
                </h3>

                {isCompleted && (
                  <p className="text-sm text-[#8A8476]">Completato</p>
                )}

                {isActive && (
                  <p className="text-sm text-[#E4AE2F] italic font-medium">{step.distance}</p>
                )}

                {isLocked && (
                  <p className="text-sm text-[#3A3A36]">Bloccato</p>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* FIXED BOTTOM ACTION CARD */}
      <div className="fixed bottom-[72px] md:bottom-6 left-0 right-0 z-40 pointer-events-none px-4 pb-[env(safe-area-inset-bottom)]">

        {/* Dark Box */}
        {activeStep && (
          <div className="bg-[#1C1C18] border border-[#3A3A36] rounded-2xl p-4 shadow-2xl relative z-10 pointer-events-auto max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-[12px] bg-[#2A2820] border border-[#3A3A36] flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 text-[#E4AE2F] rotate-45" fill="currentColor" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm">Prossima Tappa</h4>
                <p className="text-[#8A8476] text-xs mt-0.5 line-clamp-1">{activeStep.title}</p>
              </div>
            </div>

            <button
              onClick={() => handleStepClick(activeStep)}
              className="w-full bg-[#E4AE2F] hover:bg-[#F2C24E] text-black font-black uppercase tracking-widest py-3 rounded-[12px] text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_5px_15px_rgba(228,174,47,0.3)]">
              <Navigation className="w-4 h-4 -rotate-45" fill="black" />
              Apri Dettagli
            </button>
          </div>
        )}

      </div>

      {/* MODALS */}
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
              gps_radius: 50 // Default for partners if missing
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
                onUnlock={() => handleUnlockStep(selectedStep)}
                unlocking={unlockingStep}
              />
            );
          }
        })()
      )}

    </div>
  );
}
