import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Compass,
  Fingerprint,
  Crown
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { calculateDistance, formatDistance, getCurrentPosition, requestGeolocationPermissions } from '../utils/geolocation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

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
  const [permissionPrompted, setPermissionPrompted] = useState(false);

  // Parallax
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const yImage = useTransform(scrollY, [0, 500], [0, 150]);
  const opacityImage = useTransform(scrollY, [0, 400], [0.8, 0]);

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      const data = await EventsService.getEventById(id);
      setEvent(data);
      setLoading(false);
    };
    fetchEventData();
    
    // Attempt automatic location on mount
    handleRefreshLocation();

    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, [id, user]);

  const handleRequestPermissions = async () => {
    setPermissionPrompted(true);
    const granted = await requestGeolocationPermissions();
    if (granted) {
      toast.success("Posizione consentita!");
      handleRefreshLocation();
    } else {
      toast.error("Permessi non concessi. Controlla le impostazioni.");
    }
  };

  const handleRefreshLocation = async () => {
    setIsRefreshingGps(true);
    try {
      const pos = await getCurrentPosition();
      setUserCoords(pos);
      setGpsError(null);
    } catch (err) {
      setGpsError(true);
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
      isLocationOk = distance <= 500; 
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
      toast.error("Devi essere loggato per sbloccare i premi");
      return;
    }
    if (!status.canUnlock) return;

    setIsUnlocking(true);
    const result = await EventsService.unlockEventCard(event.ricompensa_card_id);
    
    if (result.success) {
      toast.success("Congratulazioni! Card sbloccata.");
      setIsUnlocked(true);
    } else {
      toast.error(result.error);
      if (result.error?.includes("già sbloccato")) setIsUnlocked(true);
    }
    setIsUnlocking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500"
        >
          Esplorando...
        </motion.div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-[#080808] text-white font-satoshi selection:bg-coral/30 overflow-x-hidden" ref={containerRef}>
      
      {/* 1. HERO & PARALLAX IMAGE */}
      <div className="relative h-[100vh] w-full border-b border-white/5">
        <motion.div style={{ y: yImage, opacity: opacityImage }} className="absolute inset-0 z-0">
          <img 
            src={event.immagine_url || "/bg-event.jpg"} 
            className="w-full h-full object-cover grayscale-[0.2]" 
            alt={event.titolo} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent" />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>

        {/* Top Bar Navigation */}
        <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-50">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
          >
            <CaretLeft size={24} weight="bold" />
          </button>
          <div className="flex gap-3">
             <button className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center active:scale-95 transition-transform">
               <ShareNetwork size={22} weight="bold" />
             </button>
          </div>
        </div>

        {/* Central Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="text-center"
          >
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-500 mb-6 block drop-shadow-lg">
              {status.isTimeOk ? "☆ LIVE ORA ☆" : status.isEnded ? "Evento Finito" : "In Arrivo"}
            </span>
            <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter leading-[0.85] mb-8 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              {event.titolo}
            </h1>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 mt-12 bg-white/5 backdrop-blur-3xl px-12 py-6 rounded-[2.5rem] border border-white/10">
               <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase mb-1">Data Evento</span>
                  <span className="text-sm font-bold uppercase tracking-tight">{new Date(event.data_inizio).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
               </div>
               <div className="hidden sm:block w-[1px] h-8 bg-white/10" />
               <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase mb-1">Location</span>
                  <span className="text-sm font-bold uppercase tracking-tight">{event.luogo || 'Puglia'}</span>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-30">
           <span className="text-[9px] font-black uppercase tracking-[0.3em]">Scopri</span>
           <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="max-w-[1200px] mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Left Col: Description & Logistics */}
        <div className="lg:col-span-12">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-24">
                <Crown size={40} weight="fill" className="text-orange-500 mb-8 opacity-50" />
                <p className="text-3xl sm:text-4xl font-medium leading-[1.4] text-zinc-200 indent-12 italic">
                   "{event.descrizione || "Unisciti a noi per un'esperienza indimenticabile nel cuore della Puglia, dove storia e bellezza si incontrano per creare ricordi eterni."}"
                </p>
                <div className="mt-12 flex items-center gap-6">
                   <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 p-1">
                      <img src={event.partners?.logo_url || "/logo.png"} className="w-full h-full object-cover rounded-full" alt="" />
                   </div>
                   <div className="text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Certificato da</p>
                     <p className="text-md font-bold text-zinc-200">{event.partners?.name || "Desideri di Puglia"}</p>
                   </div>
                </div>
            </div>
        </div>

        {/* Middle Section: Reward Card - ULTRA LUXURY BENTO */}
        <div className="lg:col-span-7">
           <div className="sticky top-24">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8 px-2">Reward Esclusiva</h2>
              <div className="relative group overflow-hidden rounded-[3rem] bg-zinc-900/50 border border-white/5 p-8 lg:p-12 shadow-2xl">
                 <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-transparent opacity-50" />
                 
                 <div className="relative z-10 flex flex-col sm:flex-row items-center gap-12">
                    <motion.div 
                      whileHover={{ scale: 1.05, rotateY: 10 }}
                      className="w-48 sm:w-64 h-72 sm:h-[400px] rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/20 shrink-0 transform-gpu perspective-1000"
                    >
                       <img src={event.cards?.image_url} className="w-full h-full object-cover" alt="" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </motion.div>

                    <div className="flex-1 text-center sm:text-left">
                       <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-orange-400">{event.cards?.rarity || 'LIMITED EDITION'}</span>
                       </div>
                       <h3 className="text-4xl font-black mb-6 leading-none">{event.cards?.title}</h3>
                       <p className="text-sm text-zinc-500 mb-8 leading-relaxed font-geist italic">
                         "{event.cards?.description || "Questo cimelio attesta la tua partecipazione a uno degli eventi più esclusivi del Club."}"
                       </p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center sm:text-left">
                             <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Rarità</p>
                             <p className="text-xs font-bold text-white uppercase">{event.cards?.rarity || 'Ultra Rara'}</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center sm:text-left">
                             <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Stato</p>
                             <p className="text-xs font-bold text-white uppercase">{isUnlocked ? 'Posseduta' : 'Disponibile'}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Col: Verification & Action - THE LOCK BOX */}
        <div className="lg:col-span-5">
           <div className="sticky top-24 flex flex-col gap-6">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 px-2">Accesso Reward</h2>
              
              <div className="bg-zinc-900 border border-white/10 rounded-[3rem] p-8 lg:p-10 shadow-3xl overflow-hidden relative">
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-600/5 rounded-full blur-[80px]" />
                 
                 <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center border border-white/10">
                          <Fingerprint size={28} weight="fill" className={status?.canUnlock ? 'text-orange-500' : 'text-zinc-600'} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Security Check</p>
                          <h4 className="text-xl font-black">Verifica Requisiti</h4>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    {/* Time Verify */}
                    <div className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-700 ${status?.isTimeOk ? 'bg-orange-500/10 border-orange-500/30' : 'bg-black/20 border-white/5'}`}>
                       <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status?.isTimeOk ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-600'}`}>
                           {status?.isTimeOk ? <CheckCircle size={24} weight="bold" /> : <Clock size={24} weight="bold" />}
                         </div>
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Orario Evento</p>
                            <p className="text-xs font-bold uppercase">{status?.isTimeOk ? 'Finestra Attiva' : status?.isEnded ? 'Evento Terminato' : 'Non ancora attivo'}</p>
                         </div>
                       </div>
                       {status?.isStarted && !status?.isEnded ? <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" /> : null}
                    </div>

                    {/* GPS Verify */}
                    <div className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-700 ${status?.isLocationOk ? 'bg-orange-500/10 border-orange-500/30' : 'bg-black/20 border-white/5'}`}>
                       <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status?.isLocationOk ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-600'}`}>
                           {status?.isLocationOk ? <CheckCircle size={24} weight="bold" /> : <MapPin size={24} weight="bold" />}
                         </div>
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Posizione GPS</p>
                            <p className="text-xs font-bold uppercase">{status?.isLocationOk ? 'Presente' : gpsError ? 'Autorizzazione' : status?.distanceLabel || 'Verifica in corso'}</p>
                         </div>
                       </div>
                       <div className="flex gap-2">
                          <button 
                            onClick={handleRefreshLocation}
                            className={`w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center transition-all ${isRefreshingGps ? 'animate-spin opacity-40' : 'bg-white/5 hover:bg-white/10 active:scale-90'}`}
                          >
                             <Compass size={20} />
                          </button>
                       </div>
                    </div>

                    {/* GPS PROMPT ACTION */}
                    {!userCoords && (
                       <button 
                         onClick={handleRequestPermissions}
                         className="w-full mt-2 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-950/20 active:scale-95 transition-all"
                       >
                         Consenti Posizione nel Pop-up
                       </button>
                    )}
                 </div>

                 <motion.button 
                   whileTap={{ scale: 0.98 }}
                   disabled={isUnlocked || isUnlocking || (!status?.canUnlock && !isUnlocked)}
                   onClick={handleUnlockCard}
                   className={`w-full mt-10 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl transition-all duration-500 ${
                     isUnlocked 
                       ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                       : status?.canUnlock 
                         ? 'bg-white text-black hover:bg-zinc-100 shadow-[0_20px_40px_rgba(255,255,255,0.1)]' 
                         : 'bg-zinc-800 text-zinc-500 border border-white/5 opacity-50 cursor-not-allowed'
                   }`}
                 >
                   {isUnlocked ? (
                     <><Trophy size={20} weight="fill" /> Card Posseduta</>
                   ) : isUnlocking ? (
                     <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin" />
                   ) : status?.canUnlock ? (
                     <><Fingerprint size={20} weight="bold" /> Sblocca Reward</>
                   ) : !status?.isTimeOk ? (
                     <><WarningCircle size={20} weight="bold" /> Fuori Orario</>
                   ) : (
                     <><WarningCircle size={20} weight="bold" /> Vai sul Posto</>
                   )}
                 </motion.button>

                 <p className="mt-8 text-[10px] text-zinc-600 text-center leading-relaxed font-medium">
                    Lo sblocco richiede la presenza fisica entro 500m <br/> durante la finestra autorizzata dall'organizzatore.
                 </p>
              </div>

              {/* External Maps Button */}
              <button 
                onClick={() => {
                   const url = `https://www.google.com/maps/search/?api=1&query=${event.latitudine},${event.longitudine}`;
                   window.open(url, '_blank');
                }}
                className="group flex items-center justify-between p-8 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] active:bg-zinc-800 transition-all shadow-xl"
              >
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <NavigationArrow size={24} weight="fill" />
                    </div>
                    <div className="text-left">
                       <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Navigatore</p>
                       <p className="text-sm font-bold text-zinc-200">Guida verso l'evento</p>
                    </div>
                 </div>
                 <ArrowRight size={20} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>

      </div>

      {/* Footer Padding */}
      <div className="h-40" />

      {/* Luxury Background Accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 blur-[150px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

    </div>
  );
};

export default EventDetail;
