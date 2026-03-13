// src/pages/SagaRadar.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Navigation2, 
  MapPin, 
  MoreVertical, 
  Navigation,
  Compass,
  LayoutGrid,
  Lock,
  Check
} from 'lucide-react';
import { QuestService } from '../services/quest';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getLocalized } from '../utils/content';
import { useGeolocation } from '../hooks/useGeolocation';

// --- HELPER: Haversine distance ---
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDist = (m) => {
  if (m === null) return '...';
  return m > 999 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m.`;
};

// --- RADAR LAYOUT HELPER ---
// Distributes points on circles: 
// Even steps (0, 2, 4...) on inner/outer circles with specific angles
const getRadarPosition = (idx, total, baseRadius) => {
  // We want a slightly "organic" but balanced distribution like in the image
  const angles = [30, 150, 240, 310, 80, 200]; // Predefined organic angles
  const angle = angles[idx % angles.length] * (Math.PI / 180);
  const ringFactor = (idx % 2 === 0) ? 0.6 : 0.9; // Alternating rings
  return {
    x: Math.cos(angle) * baseRadius * ringFactor,
    y: Math.sin(angle) * baseRadius * ringFactor
  };
};

export default function SagaRadar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { i18n } = useTranslation();
  const lang = i18n?.language;
  const { location, startWatching } = useGeolocation();

  const [saga, setSaga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState([]);
  const [activeTab, setActiveTab] = useState('radar');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);

  // Responsive radius for the radar base
  const radarBaseRadius = useMemo(() => {
    return Math.min(window.innerWidth * 0.45, 180);
  }, []);

  useEffect(() => {
    startWatching();
  }, []);

  useEffect(() => {
    async function fetchSaga() {
      if (!id) return;
      try {
        const detail = await QuestService.getSagaDetail(id);
        setSaga(detail || null);
        if (user?.id) {
          const progress = await QuestService.getUserProgress(user.id);
          setCompletedIds(progress.completedSteps || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSaga();
  }, [id, user]);

  const userLat = location?.lat || location?.latitude;
  const userLng = location?.lng || location?.longitude;

  const steps = useMemo(() => {
    if (!saga?.steps) return [];
    let firstUncompleted = false;
    return saga.steps.map((step, idx) => {
      const isDone = completedIds.includes(step.id);
      let status = 'locked';
      if (isDone) {
        status = 'completed';
      } else if (!firstUncompleted) {
        status = 'active';
        firstUncompleted = true;
      }
      
      const dist = getDistance(userLat, userLng, step._latitude, step._longitude);
      const pos = getRadarPosition(idx, saga.steps.length, radarBaseRadius);

      return {
        ...step,
        title: getLocalized(step, 'title', lang) || step.description_it || `Checkpoint ${idx + 1}`,
        status,
        dist,
        pos,
        order: idx + 1
      };
    });
  }, [saga, completedIds, userLat, userLng, lang, radarBaseRadius]);

  const activeCheckpoint = useMemo(() => {
    return selectedCheckpoint || steps.find(s => s.status === 'active') || steps[0];
  }, [selectedCheckpoint, steps]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#F2F4F7] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center"
        >
          <Compass className="text-accent animate-spin-slow" size={24} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#F2F4F7] overflow-hidden flex flex-col font-sans">
      {/* --- BACKGROUND DECORATION --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[35%] bg-accent/5 blur-[80px] rounded-full" />
      </div>

      {/* --- TOP HEADER --- */}
      <header className="relative z-20 px-6 pt-[env(safe-area-inset-top,20px)] flex items-center justify-between h-20">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-black tracking-tight text-[#1A1C1E]">
            Scopri le tappe <br /> 
            <span className="text-accent-gold">in Puglia</span>
          </h1>
        </div>
      </header>

      {/* --- RADAR VIEW --- */}
      <div className="relative flex-1 flex items-center justify-center overflow-visible">
        
        {/* RADAR GRIDS */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3, 4].map((ring) => (
            <motion.div
              key={ring}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: ring * 0.1, duration: 1 }}
              className="absolute border border-blue-200/40 rounded-full"
              style={{
                width: `${ring * 25}%`,
                paddingBottom: `${ring * 25}%`,
              }}
            />
          ))}
          {/* Subtle connecting lines */}
          <div className="absolute w-[80%] h-[1px] bg-blue-200/20 rotate-45" />
          <div className="absolute w-[80%] h-[1px] bg-blue-200/20 -rotate-45" />
        </div>

        {/* USER CENTER */}
        <div className="relative z-30">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ duration: 4, repeat: Infinity }}
            className="w-16 h-16 bg-white rounded-full p-1.5 shadow-2xl shadow-blue-400/20 relative"
          >
            <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping opacity-30" />
            <div className="w-full h-full rounded-full overflow-hidden border border-zinc-100">
               <img 
                 src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.nome || 'User'}&background=random`} 
                 className="w-full h-full object-cover" 
                 alt="User"
               />
            </div>
          </motion.div>
        </div>

        {/* CHECKPOINTS */}
        <AnimatePresence>
          {steps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                x: step.pos.x, 
                y: step.pos.y 
              }}
              transition={{ 
                delay: 0.4 + idx * 0.1, 
                type: 'spring', 
                stiffness: 100, 
                damping: 20 
              }}
              className={`absolute z-20 cursor-pointer group ${step.status === 'locked' ? 'cursor-not-allowed' : ''}`}
              onClick={() => {
                if (step.status !== 'locked') {
                  setSelectedCheckpoint(step);
                }
              }}
            >
              <div className="flex flex-col items-center">
                <motion.div 
                  whileHover={step.status !== 'locked' ? { scale: 1.1 } : {}}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-xl border-2 transition-all duration-500 relative
                    ${step.status === 'completed' ? 'bg-accent/10 border-accent/40 shadow-accent/10' : 
                      step.status === 'active' ? 'bg-white/80 border-accent shadow-xl shadow-accent/20' : 
                      'bg-white/30 border-white/40 opacity-40 grayscale'}
                    ${selectedCheckpoint?.id === step.id ? 'ring-4 ring-accent/20 border-accent scale-110' : ''}`}
                >
                  {step.status === 'completed' && <Check size={20} className="text-accent" strokeWidth={3} />}
                  {step.status === 'locked' && <Lock size={18} className="text-[#1A1C1E]/60" />}
                  {step.status === 'active' && (
                    <>
                      <span className="text-accent font-black text-lg">{step.order}</span>
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-accent/20 rounded-2xl"
                      />
                    </>
                  )}
                </motion.div>
                
                <div className={`mt-2 flex items-center gap-1 bg-white/70 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm transition-opacity ${step.status === 'locked' ? 'opacity-0' : 'opacity-100'}`}>
                  <MapPin size={10} className="text-accent" />
                  <span className="text-[9px] font-bold text-[#4B4E52]">{formatDist(step.dist)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ACTIVE / SELECTED PREVIEW CARD (Japan Trend Style) */}
        <AnimatePresence>
          {selectedCheckpoint && (
            <motion.div
              key={`preview-${selectedCheckpoint.id}`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-28 left-6 right-6 z-40 bg-white/60 backdrop-blur-3xl rounded-3xl p-5 border border-white/40 shadow-2xl flex items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent opacity-80">Checkpoint {selectedCheckpoint.order}</span>
                  {selectedCheckpoint.status === 'completed' && (
                    <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Completato</span>
                  )}
                </div>
                <h3 className="text-lg font-black leading-tight text-[#1A1C1E]">{selectedCheckpoint.title}</h3>
                <div className="flex items-center gap-1.5 mt-1 opacity-60">
                   <MapPin size={12} className="text-[#1A1C1E]" />
                   <span className="text-[12px] font-bold">{formatDist(selectedCheckpoint.dist)}</span>
                </div>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const lat = selectedCheckpoint._latitude;
                  const lng = selectedCheckpoint._longitude;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                }}
                className="px-6 py-4 bg-accent text-white rounded-2xl font-black text-[12px] flex items-center gap-2 shadow-xl shadow-accent/20"
              >
                <Navigation2 size={16} fill="white" />
                VAI
              </motion.button>

              <button 
                onClick={() => setSelectedCheckpoint(null)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/60 flex items-center justify-center text-zinc-400 active:scale-90"
              >
                <MoreVertical size={16} className="rotate-90" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- BOTTOM SECTION --- */}
      <footer className="relative z-30 px-6 pb-32">
        <div className="bg-white/40 backdrop-blur-xl rounded-[32px] p-4 flex items-center gap-4 border border-white/50">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
                <img src={`https://i.pravatar.cc/80?u=user${i}`} className="w-full h-full object-cover" alt="friend" />
              </div>
            ))}
          </div>
          <div className="flex-1">
            <p className="text-[12px] font-black text-[#1A1C1E] leading-tight">
              Joel, Kim, Anna e <span className="text-accent">5 amici</span>
            </p>
            <p className="text-[11px] font-bold text-[#4B4E52] mt-0.5">sono stati in questa zona.</p>
          </div>
        </div>
      </footer>

      {/* --- NAVIGATION BAR SIMULATION --- */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-2xl border-t border-zinc-100 flex items-center justify-around px-8 z-50">
           <button onClick={() => navigate('/missioni')} className="p-2 opacity-40"><LayoutGrid size={24} /></button>
           <button className="p-2 text-accent"><Compass size={24} /></button>
           <button onClick={() => navigate('/profilo')} className="p-2 opacity-40"><ChevronLeft size={24} /></button>
      </div>

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
