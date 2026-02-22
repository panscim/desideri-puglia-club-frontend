import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Check, Lock, Navigation, MapPin } from 'lucide-react';
import { QuestService } from '../services/quest';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getLocalized } from '../utils/content';

export default function SagaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [saga, setSaga] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSaga() {
      // For now, fetch active sets and find by id
      const sets = await QuestService.getActiveSets();
      const current = sets.find(s => s.id === id);
      setSaga(current || null);
      setLoading(false);
    }
    fetchSaga();
  }, [id]);

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

  // Mock Steps data to perfectly match the mockup
  const steps = [
    {
      id: 'mock1',
      step_order: 1,
      title: 'Castel del Monte',
      image_url: 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format',
      status: 'completed',
      date: 'May 12'
    },
    {
      id: 'mock2',
      step_order: 2,
      title: 'Cattedrale di Trani',
      image_url: 'https://images.unsplash.com/photo-1563503287600-84dc2fc2541d?q=80&w=600&auto=format',
      status: 'completed',
      date: 'May 15'
    },
    {
      id: 'mock3',
      step_order: 3,
      title: 'Castello di Barletta',
      image_url: 'https://plus.unsplash.com/premium_photo-1661962360677-2da2f14300bf?q=80&w=600&auto=format',
      status: 'active',
      distance: '3.2 km away from you'
    },
    {
      id: 'mock4',
      step_order: 4,
      title: 'Castello Svevo di Bari',
      status: 'locked'
    },
    {
      id: 'mock5',
      step_order: 5,
      title: 'Castel Lagopesole',
      status: 'locked'
    }
  ];

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="min-h-screen bg-[#161512] text-white pb-40 font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#161512]/95 backdrop-blur-md pt-[env(safe-area-inset-top)] border-b border-[#E4AE2F]/10">
        <div className="flex items-center justify-between px-4 h-16">
          <button onClick={() => navigate('/missioni')} className="p-2 text-[#E4AE2F] rounded-full hover:bg-white/5 transition-colors">
            <ChevronLeft size={28} />
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
      <div className="px-6 py-10 space-y-12 max-w-lg mx-auto overflow-hidden">
        {steps.map((step, index) => {
          const isEven = index % 2 === 0; // 0 = Left, 1 = Right
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isLocked = step.status === 'locked';

          return (
            <div key={step.id} className={`flex ${isEven ? 'flex-row' : 'flex-row-reverse'} items-center gap-6 relative`}>
              
              {/* Circle Area (Left or Right) */}
              <div className="relative flex-shrink-0 z-10 w-28 h-28">
                {/* Dotted Line Tail */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 -translateX-1/2 top-full w-0.5 h-16 border-l-2 border-dotted border-[#E4AE2F]/30 -ml-[1px]" />
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
                <h4 className={`text-[10px] font-bold tracking-widest mb-1 ${isActive ? 'text-[#E4AE2F]' : 'text-[#8A8476]'}`}>
                  STEP {step.step_order}
                </h4>
                <h3 className={`text-base font-bold mb-1 ${isLocked ? 'text-[#5A564C]' : 'text-white'}`}>
                  {step.title}
                </h3>
                
                {isCompleted && (
                  <p className="text-[12px] text-[#8A8476]">Completed {step.date}</p>
                )}
                
                {isActive && (
                  <p className="text-[12px] text-[#E4AE2F] italic">{step.distance}</p>
                )}
                
                {isLocked && (
                  <p className="text-[12px] text-[#3A3A36]">Locked</p>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* FIXED BOTTOM ACTION CARD */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-4 pb-[env(safe-area-inset-bottom)] mb-4">
        
        {/* Legendary Reward Tab sticking up */}
        <div className="flex justify-center -mb-4 relative z-0 pointer-events-auto">
          <div className="bg-[#E4AE2F] rounded-t-2xl px-6 pt-3 pb-6 flex flex-col items-center shadow-[0_-10px_20px_rgba(228,174,47,0.15)]">
            <span className="text-[9px] text-black font-black uppercase tracking-widest mb-1.5">Legendary<br/>Reward</span>
            <div className="w-10 h-10 border-2 border-black/10 rounded-lg flex items-center justify-center">
              {/* Fake reward card icon */}
              <div className="w-8 h-8 bg-black/80 rounded flex flex-col items-center justify-center gap-0.5">
                  <div className="w-5 h-3 bg-[#E4AE2F] rounded-sm"></div>
                  <div className="w-5 h-1 bg-[#E4AE2F] opacity-50 rounded-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Dark Box */}
        <div className="bg-[#1C1C18] border border-[#3A3A36] rounded-3xl p-5 shadow-2xl relative z-10 pointer-events-auto max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-[14px] bg-[#2A2820] border border-[#3A3A36] flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 text-[#E4AE2F] rotate-45" fill="currentColor" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Current Destination</h4>
              <p className="text-[#8A8476] text-xs mt-0.5">Reach the fortress to unlock history</p>
            </div>
          </div>
          
          <button className="w-full bg-[#E4AE2F] hover:bg-[#F2C24E] text-black font-black uppercase tracking-widest py-3.5 rounded-[14px] text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_5px_15px_rgba(228,174,47,0.3)]">
            <Navigation className="w-4 h-4 -rotate-45" fill="black" />
            Get Directions
          </button>
        </div>

      </div>

    </div>
  );
}
