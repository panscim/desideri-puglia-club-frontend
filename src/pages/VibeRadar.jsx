import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ConciergeService } from '../services/concierge';
import { useAuth } from '../contexts/AuthContext';
import { 
  CaretLeft, 
  MapPin, 
  Users, 
  CheckCircle, 
  Plus, 
  X, 
  NavigationArrow,
  Clock,
  Circle
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Custom vibe markers based on level
const createVibeIcon = (level) => {
  const colors = {
    1: { bg: '#22c55e', border: '#16a34a', label: 'Calmo' },      // Green
    2: { bg: '#f59e0b', border: '#d97706', label: 'Vivace' },     // Amber
    3: { bg: '#ef4444', border: '#dc2626', label: 'Pieno Murato' } // Red
  };
  const c = colors[level] || colors[1];

  const html = `
    <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:100%;height:100%;border-radius:50%;background:${c.bg};opacity:0.2;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="
        width:24px;height:24px;
        border-radius:50%;
        background:${c.bg};
        border:3px solid white;
        box-shadow:0 4px 12px rgba(0,0,0,0.3);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const VibeRadar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vibes, setVibes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReporting, setIsReporting] = useState(false);
  const [userLocation, setUserLocation] = useState([41.3184, 16.2767]); // Default Barletta

  useEffect(() => {
    loadVibes();
    // Get user's current location for centering
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  const loadVibes = async () => {
    setLoading(true);
    const data = await ConciergeService.getLiveVibes();
    setVibes(data);
    setLoading(false);
  };

  const handleReportVibe = async (level) => {
    if (!user) {
      toast.error('Accedi per segnalare il vibe');
      return;
    }

    // Capture current location for report
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const report = {
        user_id: user.id,
        place_name: 'Posizione Corrente', // Simplification for MVP
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        vibe_level: level
      };

      const result = await ConciergeService.submitVibe(report);
      if (result.success) {
        toast.success('Grazie per la segnalazione! 🏆');
        setIsReporting(false);
        loadVibes();
      } else {
        toast.error('Errore durante l\'invio');
      }
    }, () => {
      toast.error('GPS necessario per segnalare il vibe');
    });
  };

  return (
    <div className="h-screen w-full bg-[#F9F9F7] relative overflow-hidden font-sans">
      
      {/* Overlay Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] p-6 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-xl border border-black/5 flex items-center justify-center text-slate-900 pointer-events-auto shadow-2xl active:scale-95 transition-all"
        >
          <CaretLeft size={24} weight="bold" />
        </button>

        <div className="px-4 py-2 bg-slate-900/90 backdrop-blur-xl rounded-full border border-white/10 text-white flex items-center gap-2 pointer-events-auto shadow-2xl">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest">Radar Live: Puglia</span>
        </div>
      </header>

      {/* Map Container */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={userLocation} 
          zoom={14} 
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
          
          {vibes.map((v) => (
            <Marker 
              key={v.id} 
              position={[v.latitude, v.longitude]} 
              icon={createVibeIcon(v.vibe_level)}
            >
              <Popup className="custom-popup">
                <div className="p-2 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Segnalato da {v.user?.nickname || 'Anonimo'}
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {v.vibe_level === 1 ? '🍃 Calmo' : v.vibe_level === 2 ? '🔥 Vivace' : '🚀 Pieno Murato'}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1">
                    {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Action FAB */}
      <button 
        onClick={() => setIsReporting(true)}
        className="absolute bottom-10 right-6 z-[1000] w-16 h-16 bg-orange-500 text-white rounded-full shadow-[0_15px_30px_rgba(249,115,22,0.4)] flex items-center justify-center active:scale-90 transition-all group"
      >
        <Plus size={32} weight="bold" className="group-hover:rotate-90 transition-transform" />
      </button>

      {/* Reporting Modal / Bottom Sheet */}
      <AnimatePresence>
        {isReporting && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[2000]"
              onClick={() => setIsReporting(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 z-[2001] shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
              
              <div className="mb-8 text-center">
                <h3 className="text-2xl font-black text-slate-900 mb-2">Com'è la situazione qui?</h3>
                <p className="text-sm text-slate-400 font-medium">La tua segnalazione aiuterà gli altri clubber.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-8">
                <button 
                  onClick={() => handleReportVibe(1)}
                  className="flex items-center justify-between p-6 bg-green-50 rounded-3xl border border-green-100 active:scale-95 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Circle size={28} weight="fill" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-900">Calmo</p>
                      <p className="text-xs text-green-700/60 font-medium">Poca gente, atmosfera rilassata.</p>
                    </div>
                  </div>
                  <NavigationArrow size={24} weight="fill" className="text-green-300" />
                </button>

                <button 
                  onClick={() => handleReportVibe(2)}
                  className="flex items-center justify-between p-6 bg-amber-50 rounded-3xl border border-amber-100 active:scale-95 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Circle size={28} weight="fill" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-900">Vivace</p>
                      <p className="text-xs text-amber-700/60 font-medium">C'è movimento, bella energia.</p>
                    </div>
                  </div>
                  <NavigationArrow size={24} weight="fill" className="text-amber-300" />
                </button>

                <button 
                  onClick={() => handleReportVibe(3)}
                  className="flex items-center justify-between p-6 bg-red-50 rounded-3xl border border-red-100 active:scale-95 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Circle size={28} weight="fill" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-900">Pieno Murato</p>
                      <p className="text-xs text-red-700/60 font-medium">Folla intensa, massima carica!</p>
                    </div>
                  </div>
                  <NavigationArrow size={24} weight="fill" className="text-red-300" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 mb-4">
                <Clock size={16} /> La segnalazione scadrà automaticamente dopo 2 ore
              </div>

              <button 
                onClick={() => setIsReporting(false)}
                className="w-full h-14 rounded-2xl bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center"
              >
                Annulla
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .leaflet-container {
          background: #F9F9F7;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 1.5rem;
          padding: 8px;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
};

export default VibeRadar;
