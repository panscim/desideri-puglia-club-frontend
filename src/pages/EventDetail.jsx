import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventsService } from '../services/events';
import { 
  CaretLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  ShareNetwork,
  Info,
  Trophy,
  ArrowRight,
  NavigationArrow,
  Gift,
  CheckCircle,
  XCircle,
  WarningCircle,
  Compass
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { calculateDistance, formatDistance, getCurrentPosition } from '../utils/geolocation';
import { motion, AnimatePresence } from 'framer-motion';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // GPS State
  const [userCoords, setUserCoords] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      const data = await EventsService.getEventById(id);
      setEvent(data);
      setLoading(false);
    };
    fetchEventData();
    refreshLocation();

    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, [id, user]);

  const refreshLocation = async () => {
    setIsRefreshingGps(true);
    try {
      const pos = await getCurrentPosition();
      setUserCoords(pos);
      setGpsError(null);
    } catch (err) {
      setGpsError("Attiva il GPS per verificare la tua posizione.");
    } finally {
      setIsRefreshingGps(false);
    }
  };

  const status = useMemo(() => {
    if (!event) return null;
    
    const start = new Date(event.data_inizio);
    const end = new Date(event.data_fine);
    
    const isStarted = currentTime >= start;
    const isEnded = currentTime > end;
    const isTimeOk = isStarted && !isEnded;

    let distance = null;
    let isLocationOk = false;
    let distanceLabel = "";

    if (userCoords && event.latitudine && event.longitudine) {
      distance = calculateDistance(
        userCoords.latitude, userCoords.longitude,
        event.latitudine, event.longitudine
      );
      isLocationOk = distance <= 500; // 500 meters radius
      distanceLabel = formatDistance(distance);
    }

    return {
      isTimeOk,
      isStarted,
      isEnded,
      isLocationOk,
      distance,
      distanceLabel,
      canUnlock: isTimeOk && isLocationOk
    };
  }, [event, currentTime, userCoords]);

  const handleUnlockCard = async () => {
    if (!user) {
      toast.error("Accedi per riscattare il premio");
      navigate('/login');
      return;
    }

    if (!status.isTimeOk) {
      toast.error(status.isEnded ? "L'evento è terminato" : "L'evento non è ancora iniziato");
      return;
    }

    if (!status.isLocationOk) {
      toast.error("Devi essere sul luogo dell'evento per riscattare la Card!");
      return;
    }

    setIsUnlocking(true);
    const result = await EventsService.unlockEventCard(event.ricompensa_card_id);
    
    if (result.success) {
      toast.success("Card Sbloccata! Aggiunta alla tua collezione. 🏆");
      setIsUnlocked(true);
    } else {
      toast.error(result.error || "Errore durante lo sblocco");
      if (result.error?.includes("già sbloccato")) setIsUnlocked(true);
    }
    setIsUnlocking(false);
  };

  const handleOpenMaps = () => {
    if (!event.latitudine || !event.longitudine) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${event.latitudine},${event.longitudine}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-2 border-orange-500/10 rounded-full" />
          <div className="absolute top-0 w-20 h-20 border-t-2 border-orange-500 rounded-full animate-spin" />
          <Trophy size={32} weight="fill" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500 animate-pulse" />
        </div>
        <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Inizializzazione Esperienza...</p>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-satoshi selection:bg-orange-500/30">
      
      {/* 1. STICKY TOP ACTIONS */}
      <div className="fixed top-0 left-0 w-full p-4 flex items-center justify-between z-[100] pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 flex items-center justify-center text-white pointer-events-auto active:scale-90 transition-all shadow-2xl"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <div className="flex gap-2">
          <button className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 flex items-center justify-center text-white pointer-events-auto active:scale-90 transition-all shadow-2xl">
            <ShareNetwork size={22} weight="bold" />
          </button>
        </div>
      </div>

      {/* 2. HERO SECTION - NEW DESIGN */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src={event.immagine_url || "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200"} 
            className="w-full h-full object-cover blur-[2px] opacity-60 scale-105"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-transparent to-transparent" />
        </motion.div>

        {/* Content Centered on Hero */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-2xl border ${
                status.isTimeOk ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
              }`}>
                {status.isTimeOk ? '● Live Now' : status.isEnded ? 'Evento Concluso' : 'Prossimamente'}
              </span>
            </div>
            
            <h1 className="text-5xl font-black tracking-tight leading-[0.9] max-w-[12ch] mb-6 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              {event.titolo}
            </h1>

            <div className="flex items-center gap-6 text-zinc-400 text-sm font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-orange-500" />
                <span>{new Date(event.data_inizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
              </div>
              <div className="w-1 h-1 bg-zinc-700 rounded-full" />
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-orange-500" />
                <span>{event.luogo || 'Puglia'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. VERIFICATION TILE - THE "GUTTER" */}
      <div className="px-6 -mt-20 relative z-[20]">
        
        {/* Verification Status Card */}
        <section className="bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-10 overflow-hidden relative group">
          
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-600/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-orange-600/20 transition-colors" />

          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-white">Verifica Stato</h3>
              <p className="text-xs text-zinc-500 font-medium">Requisiti necessari per lo sblocco</p>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-2xl border border-white/5">
              <Gift size={24} weight="fill" className={status.canUnlock ? 'text-green-500' : 'text-zinc-600'} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            
            {/* Requirement 1: Time */}
            <div className={`flex items-center gap-4 p-4 rounded-3xl border transition-all duration-500 ${
              status.isTimeOk 
                ? 'bg-green-500/5 border-green-500/20' 
                : 'bg-zinc-800/30 border-white/5'
            }`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${status.isTimeOk ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                {status.isTimeOk ? <CheckCircle size={24} weight="bold" /> : <Clock size={24} weight="bold" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Finestra Temporale</p>
                <p className="text-sm font-bold">
                  {status.isStarted && !status.isEnded ? "Ora Disponibile" : status.isEnded ? "Evento Terminato" : "Inizio a breve"}
                </p>
              </div>
              {!status.isTimeOk && (
                <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded-lg">
                  {new Date(event.data_inizio).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Requirement 2: Position */}
            <div className={`flex items-center gap-4 p-4 rounded-3xl border transition-all duration-500 ${
              status.isLocationOk 
                ? 'bg-green-500/5 border-green-500/20' 
                : 'bg-zinc-800/30 border-white/5'
            }`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${status.isLocationOk ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                {status.isLocationOk ? <CheckCircle size={24} weight="bold" /> : <MapPin size={24} weight="bold" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Posizione GPS</p>
                <p className="text-sm font-bold truncate">
                  {status.isLocationOk ? "Presenza Verificata" : gpsError ? "Attiva il GPS" : status.distanceLabel ? `Distanza: ${status.distanceLabel}` : "Ricerca posizione..."}
                </p>
              </div>
              <button 
                onClick={refreshLocation}
                className={`p-2 rounded-2xl border border-white/10 active:scale-90 transition-all ${isRefreshingGps ? 'animate-spin opacity-50' : 'bg-white/5 hover:bg-white/10'}`}
              >
                <Compass size={18} />
              </button>
            </div>
          </div>

          <p className="mt-6 text-[11px] text-zinc-500 flex items-center gap-2 leading-relaxed italic">
            <Info size={14} className="shrink-0" />
            Per sbloccare la Card esclusiva devi trovarti entro 500m dal luogo dell'evento durante l'orario stabilito.
          </p>
        </section>

        {/* 4. REWARD PREVIEW - ULTRA LUXURY */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-6 px-1">
             <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Cimelio Esclusivo</h3>
                <h2 className="text-3xl font-black text-white">Reward Card</h2>
             </div>
             <Trophy size={32} weight="fill" className="text-white/10" />
          </div>

          <div className="relative group cursor-pointer">
            {/* Card Aura */}
            <div className="absolute -inset-4 bg-gradient-to-br from-orange-600/20 to-gold/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 flex gap-6 items-center">
              <motion.div 
                whileHover={{ rotateY: 15, rotateX: -5 }}
                className="w-32 h-44 rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/20 shrink-0"
              >
                <img src={event.cards?.image_url} className="w-full h-full object-cover" alt="" />
              </motion.div>
              
              <div className="flex-1 py-4">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 block">{event.cards?.rarity}</span>
                <h4 className="text-xl font-bold text-white mb-2">{event.cards?.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-geist italic">
                  "{event.cards?.description}"
                </p>
              </div>
            </div>
          </div>

          {/* MAIN ACTION BUTTON */}
          <motion.button 
            whileTap={{ scale: 0.98 }}
            disabled={isUnlocking || isUnlocked || (!status.canUnlock && !isUnlocked)}
            onClick={handleUnlockCard}
            className={`w-full mt-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.1em] flex items-center justify-center gap-3 transition-all duration-500 shadow-2xl ${
              isUnlocked 
                ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                : status.canUnlock 
                  ? 'bg-white text-black hover:bg-zinc-100 shadow-[0_15px_30px_rgba(255,255,255,0.1)]' 
                  : 'bg-zinc-800 text-zinc-500 border border-white/5 opacity-80 cursor-not-allowed'
            }`}
          >
            {isUnlocked ? (
              <><Trophy size={20} weight="fill" /> Cimelio Ottenuto</>
            ) : isUnlocking ? (
              <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin" />
            ) : status.canUnlock ? (
              <><Gift size={20} weight="fill" /> Sblocca Ora</>
            ) : !status.isTimeOk ? (
              <><Clock size={20} weight="bold" /> Fuori Orario</>
            ) : (
              <><MapPin size={20} weight="bold" /> Posizione Non Valida</>
            )}
          </motion.button>
        </section>

        {/* 5. LOGISTICS & DESCRIPTION */}
        <section className="space-y-10 mb-20">
          
          <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={handleOpenMaps}
                className="w-full group flex items-center justify-between bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 active:bg-zinc-800 transition-colors shadow-xl"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <NavigationArrow size={28} weight="fill" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Come Arrivare</p>
                    <p className="text-md font-bold text-white">Naviga verso l'evento</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                 <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-4">L'Esperienza</p>
                 <p className="text-zinc-300 font-medium font-geist italic leading-relaxed text-lg">
                    "{event.descrizione}"
                 </p>
                 
                 <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-800 border border-white/5 p-1 shadow-inner">
                      <img src={event.partners?.logo_url || "/logo.png"} className="w-full h-full object-cover rounded-xl" alt="" />
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">In Partnership con</p>
                      <p className="text-sm font-bold text-white leading-none">{event.partners?.name}</p>
                    </div>
                 </div>
              </div>
          </div>

        </section>

      </div>

      {/* FOOTER PADDING */}
      <div className="h-20" />
    </div>
  );
};

export default EventDetail;
