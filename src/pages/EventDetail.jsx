import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventsService } from '../services/events';
import { 
  ArrowLeft, 
  Share2, 
  MapPin, 
  Calendar, 
  Clock, 
  Info,
  Trophy,
  Navigation,
  Gift,
  CheckCircle,
  Compass,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { calculateDistance, formatDistance, getCurrentPosition, requestGeolocationPermissions } from '../utils/geolocation';
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

    const handleRequestPermissions = async () => {
        const granted = await requestGeolocationPermissions();
        if (granted) {
            toast.success("Posizione consentita!");
            refreshLocation();
        } else {
            toast.error("Permesso negato. Controlla le impostazioni.");
        }
    };

    const refreshLocation = async () => {
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
            <div className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center p-6 space-y-6">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-[#f4c025] rounded-full animate-spin" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Caricamento Evento...</p>
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="min-h-screen bg-[#F9F9F7] font-sans selection:bg-[#f4c025]/30">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-[#F9F9F7]/80 backdrop-blur-sm">
                <button 
                  onClick={() => navigate(-1)} 
                  className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-900" />
                </button>
                <h2 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Event Detail</h2>
                <button className="p-2 -mr-2 hover:bg-black/5 rounded-full transition-colors">
                    <Share2 className="w-6 h-6 text-slate-900" />
                </button>
            </header>

            <main className="pt-24 px-6 pb-24 w-full max-w-lg mx-auto">
                {/* Hero Card */}
                <div className="relative aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 group">
                    <img 
                        src={event.immagine_url || "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200"} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={event.titolo}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-6 left-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border ${
                            status.isTimeOk ? 'bg-green-500/20 border-green-500/30 text-green-100' : 'bg-orange-500/20 border-orange-500/30 text-orange-100'
                        }`}>
                            {status.isTimeOk ? '● Live' : status.isEnded ? 'Finito' : 'Prossimamente'}
                        </span>
                    </div>

                    {/* Hero Content */}
                    <div className="absolute bottom-0 left-0 p-8 w-full">
                        <div className="text-[10px] font-bold text-[#f4c025] uppercase tracking-widest mb-3">
                            Event Experience
                        </div>
                        <h1 className="text-4xl font-serif font-bold text-white mb-2 leading-tight">
                            {event.titolo}
                        </h1>
                        <div className="flex items-center gap-4 text-white/70 text-sm font-medium">
                            <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-[#f4c025]" />
                                {event.luogo || 'Puglia'}
                            </div>
                            <div className="w-1 h-1 bg-white/20 rounded-full" />
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-[#f4c025]" />
                                {new Date(event.data_inizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Decoration */}
                <div className="w-1 h-8 bg-[#f4c025] mb-6 rounded-full mx-auto" />

                {/* Description Section */}
                <section className="mb-10 text-center">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display">The Experience</h3>
                    <p className="text-slate-600 leading-relaxed text-sm italic">
                        "{event.descrizione}"
                    </p>
                </section>

                {/* Verification Check Section (App-Style Card) */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                           <Trophy className="w-5 h-5 text-[#f4c025]" />
                           <h3 className="text-lg font-bold text-slate-900">Unlock Rewards</h3>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${status.canUnlock ? 'bg-green-500 animate-pulse' : 'bg-slate-200'}`} />
                    </div>

                    <div className="space-y-4">
                        {/* Time Row */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.isTimeOk ? 'bg-green-500/10 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time range</p>
                                    <p className="text-xs font-bold text-slate-900">{status.isTimeOk ? 'Available Now' : 'Not Active'}</p>
                                </div>
                            </div>
                            {!status.isTimeOk && (
                                <span className="text-[10px] font-bold text-slate-400">
                                    {new Date(event.data_inizio).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>

                        {/* Position Row */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.isLocationOk ? 'bg-green-500/10 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GPS Status</p>
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                        {status.isLocationOk ? 'Position Verified' : status.distanceLabel ? `${status.distanceLabel} away` : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!userCoords && (
                                    <button 
                                      onClick={handleRequestPermissions}
                                      className="px-3 py-1.5 bg-[#f4c025] text-slate-900 text-[9px] font-bold uppercase rounded-lg active:scale-95 transition-all"
                                    >
                                        Consenti
                                    </button>
                                )}
                                <button 
                                    onClick={refreshLocation}
                                    className={`p-2 rounded-lg bg-white border border-slate-100 text-slate-600 ${isRefreshingGps ? 'animate-spin' : ''}`}
                                >
                                    <Compass size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-blue-600 leading-snug">
                            To unlock the exclusive card, you must be within 500m of the location during event hours.
                        </p>
                    </div>
                </section>

                {/* Reward Card Section (Card Detail Style) */}
                <section className="bg-slate-900 rounded-3xl p-6 mb-10 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#f4c025]/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    
                    <h3 className="text-xs font-bold text-[#f4c025] uppercase tracking-widest mb-6 px-1">Limited Edition Reward</h3>
                    
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-32 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0">
                            <img src={event.cards?.image_url} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-white mb-2">{event.cards?.title}</h4>
                            <p className="text-[11px] text-white/50 italic leading-relaxed">
                                "{event.cards?.description}"
                            </p>
                        </div>
                    </div>

                    <motion.button 
                        whileTap={{ scale: 0.98 }}
                        disabled={isUnlocking || isUnlocked || (!status.canUnlock && !isUnlocked)}
                        onClick={handleUnlockCard}
                        className={`w-full h-14 mt-8 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                            isUnlocked 
                                ? 'bg-green-600/20 text-green-400 border border-green-500/20' 
                                : status.canUnlock 
                                    ? 'bg-[#f4c025] text-slate-900 shadow-lg shadow-[#f4c025]/20' 
                                    : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                        }`}
                    >
                        {isUnlocked ? (
                            <><Trophy size={18} /> Collected</>
                        ) : isUnlocking ? (
                            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <><Gift size={18} /> Unlock Reward</>
                        )}
                    </motion.button>
                </section>

                {/* Logistics Info Card */}
                <section className="bg-white rounded-3xl p-1 shadow-sm border border-slate-100">
                    <div className="p-5">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Logistics</h3>
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 p-1 shrink-0">
                                <img src={event.partners?.logo_url || "/logo.png"} className="w-full h-full object-cover rounded-xl" alt="" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">In Collaboration with</p>
                                <p className="text-sm font-bold text-slate-900">{event.partners?.name}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleOpenMaps}
                            className="w-full h-16 bg-slate-900 rounded-2xl flex items-center justify-center gap-3 font-bold text-white hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
                        >
                            <Navigation className="w-5 h-5 text-[#f4c025]" />
                            Open Navigation
                        </button>
                    </div>
                </section>

                {/* Bottom Padding */}
                <div className="h-20" />
            </main>
        </div>
    );
};

export default EventDetail;
