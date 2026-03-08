import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventsService } from '../services/events';
import {
    ArrowLeft, Share2, MapPin, Clock, Trophy,
    Navigation, Gift, Info, Calendar, Compass, ChevronRight, User, X, QrCode, AlertCircle, CreditCard, Ticket
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { calculateDistance, formatDistance, getCurrentPosition, requestGeolocationPermissions } from '../utils/geolocation';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [userCoords, setUserCoords] = useState(null);

    const [isRefreshingGps, setIsRefreshingGps] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Real participants state
    const [participants, setParticipants] = useState([]);
    const totalParticipants = event?.iscritti_count || participants.length;
    const participantAvatars = participants.slice(0, 4).map(p => p.avatar);
    const extraCount = totalParticipants - participantAvatars.length;

    // Real persistent booking state via Supabase
    const [isPrenotato, setIsPrenotato] = useState(false);
    const [isBookingLoading, setIsBookingLoading] = useState(false);

    useEffect(() => {
        const fetchBookings = async () => {
            if (id && user) {
                const bookings = await EventsService.getUserBookings();
                setIsPrenotato(bookings.includes(id));
            }
        };
        fetchBookings();
    }, [id, user]);

    const handleConfirmBooking = async () => {
        const paymentMethods = event?.payment_methods || [];
        const shouldUseStripeCheckout =
            Boolean(event?.isGuestEvent) &&
            Number(event?.prezzo || 0) > 0 &&
            paymentMethods.includes('carta');

        if (shouldUseStripeCheckout) {
            setIsBookingLoading(true);
            try {
                const response = await fetch('/api/create-event-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user?.id,
                        eventId: id,
                        successUrl: `${window.location.origin}/booking-confirmation/${id}?checkout=success`,
                        cancelUrl: window.location.href,
                    }),
                });
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.error || 'Impossibile avviare checkout');
                window.location.href = payload.url;
                return;
            } catch (error) {
                toast.error(error.message || 'Errore durante il checkout');
            } finally {
                setIsBookingLoading(false);
            }
            return;
        }

        setIsBookingLoading(true);
        const result = await EventsService.createBooking(id, event.isGuestEvent);
        setIsBookingLoading(false);

        if (result.success) {
            setIsPrenotato(true);
            // Aggiorniamo il conteggio locale
            setEvent(prev => ({ ...prev, iscritti_count: (prev.iscritti_count || 0) + 1 }));
            navigate(`/booking-confirmation/${event.id}`);
        } else {
            toast.error(result.error || 'Errore durante la prenotazione');
        }
    };

    const handleActualCancelBooking = async () => {
        setIsBookingLoading(true);
        const result = await EventsService.cancelBooking(id);
        setIsBookingLoading(false);

        if (result.success) {
            setIsPrenotato(false);
            // Aggiorniamo il conteggio locale
            setEvent(prev => ({ ...prev, iscritti_count: Math.max(0, (prev.iscritti_count || 0) - 1) }));
            setShowCancelModal(false);
            toast.success('Prenotazione annullata.');
        } else {
            toast.error(result.error || 'Errore durante l\'annullamento');
        }
    };

    // Hide bottom nav on this page
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'hide-bottom-nav';
        style.innerHTML = `.md\\:hidden.fixed.bottom-0.left-0.right-0.z-50 { display: none !important; }`;
        document.head.appendChild(style);
        return () => { document.getElementById('hide-bottom-nav')?.remove(); };
    }, []);

    useEffect(() => {
        const fetchEventData = async () => {
            setLoading(true);
            const data = await EventsService.getEventById(id);
            setEvent(data);

            // Fetch real participants
            const pData = await EventsService.getEventParticipants(id);
            setParticipants(pData);

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
            const { coords } = await getCurrentPosition();
            setUserCoords({ lat: coords.latitude, lng: coords.longitude });
        } catch { /* Gps error fallback handled */ }
        finally { setIsRefreshingGps(false); }
    };

    const handleRequestPermissions = async () => {
        const granted = await requestGeolocationPermissions();
        if (granted) { toast.success('Posizione consentita!'); refreshLocation(); }
        else toast.error('Permesso negato. Controlla le impostazioni.');
    };

    const status = useMemo(() => {
        if (!event) return null;
        const start = new Date(event.data_inizio);
        const end = new Date(event.data_fine);
        const isStarted = currentTime >= start;
        const isEnded = currentTime > end;
        const isTimeOk = isStarted && !isEnded;
        let distance = null, isLocationOk = false, distanceLabel = '';
        if (userCoords && event.latitudine && event.longitudine) {
            distance = calculateDistance(userCoords.latitude, userCoords.longitude, event.latitudine, event.longitudine);
            isLocationOk = distance <= 500;
            distanceLabel = formatDistance(distance);
        }
        return { isTimeOk, isStarted, isEnded, isLocationOk, distance, distanceLabel, canUnlock: isTimeOk && isLocationOk };
    }, [event, currentTime, userCoords]);

    const handleUnlockCard = async () => {
        if (!user) { toast.error('Accedi per riscattare il premio'); navigate('/login'); return; }
        if (!status.isTimeOk) { toast.error(status.isEnded ? "L'evento è terminato" : "L'evento non è ancora iniziato"); return; }
        if (!status.isLocationOk) { toast.error("Devi essere sul luogo dell'evento per riscattare la Card!"); return; }
        setIsUnlocking(true);
        const result = await EventsService.unlockEventCard(event.ricompensa_card_id);
        if (result.success) { toast.success('Card Sbloccata! 🏆'); setIsUnlocked(true); }
        else { toast.error(result.error || 'Errore durante lo sblocco'); if (result.error?.includes('già sbloccato')) setIsUnlocked(true); }
        setIsUnlocking(false);
    };

    const handleOpenMaps = () => {
        if (!event?.latitudine || !event?.longitudine) return;
        window.open(`https://www.google.com/maps/search/?api=1&query=${event.latitudine},${event.longitudine}`, '_blank');
    };

    const formatDateLong = (d) => !d ? '' : new Date(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
    const formatTime = (d) => !d ? '' : new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const getTimezone = () => { const o = -new Date().getTimezoneOffset() / 60; return `GMT${o >= 0 ? '+' : ''}${o}`; };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#FAF9F6' }}>
            <div className="w-10 h-10 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mb-4" />
            <p className="text-stone-400 text-xs tracking-[0.2em] uppercase font-medium">Caricamento...</p>
        </div>
    );

    if (!event) return null;

    const handleBookingWhatsApp = () => {
        // Find partner phone number if any, or default
        const phone = event.partners?.telefono || '393331234567'; // Sostituire col field vero partner se esiste
        const message = `Ciao, vorrei prenotare per l'evento: *${event.titolo}* del ${formatDateLong(event.data_inizio)}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="min-h-screen" style={{ background: '#FAF9F6', fontFamily: "'Inter', sans-serif" }}>

            {/* ── HEADER ── */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4"
                style={{ background: 'rgba(250,249,246,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-stone-100 active:scale-95">
                    <ArrowLeft size={20} className="text-stone-700" />
                </button>
                <span className="text-[11px] font-semibold tracking-[0.2em] text-stone-400 uppercase">Evento</span>
                <button className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-stone-100 active:scale-95">
                    <Share2 size={18} className="text-stone-700" />
                </button>
            </header>

            <main className="pt-16 pb-40 max-w-lg mx-auto">

                {/* ── HERO IMAGE ── */}
                <div className="relative w-full" style={{ height: '65vw', maxHeight: 380 }}>
                    <img
                        src={event.immagine_url || 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?q=80&w=1200'}
                        className="w-full h-full object-cover"
                        alt={event.titolo}
                        style={{ filter: 'brightness(0.88)' }}
                    />
                    {/* Dark gradient for title readability */}
                    <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 45%, transparent 100%)' }} />

                    {/* Arch mask at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-12"
                        style={{ background: '#FAF9F6', borderRadius: '48px 48px 0 0', marginBottom: -1 }} />

                    {/* Status badge */}
                    <div className="absolute top-5 left-5">
                        <span style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: '#FFFFFF',
                            backdropFilter: 'blur(12px)',
                        }} className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            {status?.isTimeOk ? '● In corso' : status?.isEnded ? 'Concluso' : 'Prossimamente'}
                        </span>
                    </div>

                    {/* Title — positioned ABOVE the arch mask */}
                    <div className="absolute left-6 right-6" style={{ bottom: '3.5rem' }}>
                        <p className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                            Evento Esclusivo
                        </p>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", textShadow: '0 2px 12px rgba(0,0,0,0.4)', color: '#FFFFFF' }}
                            className="text-[28px] font-bold leading-tight">
                            {event.titolo}
                        </h1>
                    </div>
                </div>

                {/* ── INFO CARD ── */}
                <div className="mx-4 -mt-1 rounded-[28px] overflow-hidden"
                    style={{ background: '#FFFFFF', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>

                    {/* Data e Ora */}
                    <div className="flex items-start gap-4 px-6 py-5" style={{ borderBottom: '1px solid #F0EDE8' }}>
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ background: '#F5F2EC' }}>
                            <Calendar size={18} className="text-stone-600" />
                        </div>
                        <div>
                            <p className="text-[15px] font-semibold leading-snug" style={{ color: '#1A1A1A' }}>
                                {formatDateLong(event.data_inizio)}
                            </p>
                            <p className="text-sm mt-0.5" style={{ color: '#7A7060' }}>
                                {formatTime(event.data_inizio)} – {formatTime(event.data_fine)} {getTimezone()}
                            </p>
                        </div>
                    </div>

                    {/* Luogo */}
                    <button onClick={handleOpenMaps}
                        className="w-full flex items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-stone-50 active:scale-[0.99]"
                        style={{ borderBottom: '1px solid #F0EDE8' }}>
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ background: '#F5F2EC' }}>
                            <MapPin size={18} className="text-stone-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold leading-snug" style={{ color: '#1A1A1A' }}>
                                {event.nome_luogo || event.partners?.name || event.luogo}
                            </p>
                            {event.indirizzo && (
                                <p className="text-sm mt-0.5 truncate" style={{ color: '#7A7060' }}>{event.indirizzo}</p>
                            )}
                        </div>
                        <ChevronRight size={18} className="text-stone-300 shrink-0" />
                    </button>

                    {/* Organizzatore  +  Chi c'è */}
                    <div className="grid grid-cols-2">

                        <div className="px-5 py-5" style={{ borderRight: '1px solid #F0EDE8' }}>
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: '#9A8E7E' }}>
                                Organizzatore
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                                    style={{ border: '1.5px solid #E8E3DA', background: '#F5F2EC' }}>
                                    {event.partners?.logo_url
                                        ? <img src={event.partners.logo_url} alt="" className="w-full h-full object-cover" />
                                        : <img src="/logo.png" alt="DDP" className="w-8 h-8 object-contain" />
                                    }
                                </div>
                                <div>
                                    <p className="text-sm font-semibold leading-snug" style={{ color: '#1A1A1A' }}>
                                        {event.partners?.name || 'Desideri di Puglia'}
                                    </p>
                                    <button onClick={handleBookingWhatsApp} className="text-[11px] font-medium mt-0.5" style={{ color: '#C4974A' }}>
                                        Contatta
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Chi c'è — cliccabile, apre modale */}
                        <button
                            className="px-5 py-5 text-left w-full hover:bg-stone-50 transition-colors"
                            onClick={() => setShowParticipantsModal(true)}
                        >
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: '#9A8E7E' }}>
                                Chi c&#39;è? ({totalParticipants})
                            </p>
                            <div className="flex items-center">
                                {participantAvatars.map((src, i) => (
                                    <div key={i} className="rounded-full overflow-hidden shrink-0"
                                        style={{
                                            width: 40, height: 40,
                                            border: '2px solid #FFFFFF',
                                            marginLeft: i > 0 ? -12 : 0,
                                            zIndex: participantAvatars.length - i,
                                            position: 'relative',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
                                        }}>
                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                                {extraCount > 0 && (
                                    <div className="shrink-0 flex items-center justify-center font-bold text-[12px]"
                                        style={{
                                            width: 40, height: 40,
                                            borderRadius: '50%',
                                            border: '2px solid #FFFFFF',
                                            marginLeft: -12,
                                            zIndex: 0,
                                            background: '#E8DDD0',
                                            color: '#7A6040',
                                            position: 'relative',
                                        }}>
                                        +{extraCount}
                                    </div>
                                )}
                            </div>
                        </button>

                    </div>
                </div>

                {/* ── DESCRIZIONE ── */}
                {event.descrizione && (
                    <section className="mx-4 mt-6">
                        <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A' }}
                            className="text-xl font-bold mb-3">
                            L'Esperienza
                        </h3>
                        <p className="leading-relaxed text-[14.5px]" style={{ color: '#5A5040' }}>
                            {event.descrizione}
                        </p>
                    </section>
                )}

                {/* ── TERMINI E CONDIZIONI ── */}
                <section className="mx-4 mt-6">
                    <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A' }}
                        className="text-xl font-bold mb-4">
                        Termini e Rimborsi
                    </h3>

                    <div className="space-y-3">
                        {/* Cancellazione */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl"
                            style={{ background: '#FAF9F6', border: '1px solid #EDE9E0' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: '#F5F2EC', color: '#9A8E7E' }}>
                                <AlertCircle size={18} />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold uppercase tracking-widest mb-1" style={{ color: '#1A1A1A' }}>
                                    Cancellazione
                                </p>
                                <p className="text-[13.5px] leading-relaxed" style={{ color: '#5A5040' }}>
                                    Puoi annullare la tua prenotazione entro e non oltre le <strong>{formatTime(new Date(new Date(event.data_inizio).getTime() - 86400000))}</strong> del <strong>{formatDateLong(new Date(new Date(event.data_inizio).getTime() - 86400000))}</strong>.
                                </p>
                            </div>
                        </div>

                        {/* Pagamento */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl"
                            style={{ background: '#FAF9F6', border: '1px solid #EDE9E0' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: '#F5F2EC', color: '#9A8E7E' }}>
                                <CreditCard size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[13px] font-bold uppercase tracking-widest mb-1" style={{ color: '#1A1A1A' }}>
                                    Pagamento e Rimborso
                                </p>
                                <p className="text-[13.5px] leading-relaxed" style={{ color: '#5A5040' }}>
                                    Per poter bloccare il tuo posto occorre pagare l’intera quota almeno <strong>1 giorno prima</strong> della data dell’evento.
                                </p>
                                {/* Removed bonifico details */}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── VERIFICA & SBLOCCO (Solo se ci sono Card, e Non ospite) ── */}
                {!event.isGuestEvent && event.cards && (
                    <section className="mx-4 mt-6 rounded-[28px] overflow-hidden"
                        style={{ background: '#FFFFFF', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
                        <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F0EDE8' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trophy size={16} className="text-amber-600" />
                                    <h3 className="text-[14px] font-bold uppercase tracking-widest" style={{ color: '#1A1A1A', letterSpacing: '0.12em' }}>
                                        Sblocca il Premio
                                    </h3>
                                </div>
                                <span className={`w-2.5 h-2.5 rounded-full ${status?.canUnlock ? 'bg-green-500 animate-pulse' : 'bg-stone-200'}`} />
                            </div>
                        </div>

                        <div className="px-6 py-4 space-y-3">
                            {/* Orario */}
                            <div className="flex items-center justify-between p-4 rounded-2xl"
                                style={{ background: '#FAF9F6', border: '1px solid #EDE9E0' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: status?.isTimeOk ? 'rgba(21,128,61,0.08)' : '#EDE9E0',
                                            color: status?.isTimeOk ? '#15803d' : '#9A8E7E'
                                        }}>
                                        <Clock size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9A8E7E' }}>Orario</p>
                                        <p className="text-[13px] font-semibold" style={{ color: '#1A1A1A' }}>
                                            {status?.isTimeOk ? 'Attivo ora' : 'Non attivo'}
                                        </p>
                                    </div>
                                </div>
                                {!status?.isTimeOk && (
                                    <span className="text-[11px] font-semibold" style={{ color: '#9A8E7E' }}>
                                        {formatTime(event.data_inizio)}
                                    </span>
                                )}
                            </div>

                            {/* GPS O MAPPE */}
                            {event.isGuestEvent ? (
                                <div className="flex items-center justify-between p-4 rounded-2xl"
                                    style={{ background: '#FAF9F6', border: '1px solid #EDE9E0' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                            style={{ background: '#E0E7FF', color: '#4F46E5' }}>
                                            <MapPin size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9A8E7E' }}>Posizione</p>
                                            <p className="text-[13px] font-semibold" style={{ color: '#1A1A1A' }}>
                                                Visualizza su Mappa
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleOpenMaps}
                                            className="px-4 py-1.5 text-[10px] font-bold uppercase rounded-xl transition-all active:scale-95 text-white"
                                            style={{ background: '#4F46E5', boxShadow: '0 2px 8px rgba(79,70,229,0.25)' }}>
                                            Naviga
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between p-4 rounded-2xl"
                                        style={{ background: '#FAF9F6', border: '1px solid #EDE9E0' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                                style={{
                                                    background: status?.isLocationOk ? 'rgba(21,128,61,0.08)' : '#EDE9E0',
                                                    color: status?.isLocationOk ? '#15803d' : '#9A8E7E'
                                                }}>
                                                <MapPin size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9A8E7E' }}>Posizione GPS</p>
                                                <p className="text-[13px] font-semibold" style={{ color: '#1A1A1A' }}>
                                                    {status?.isLocationOk ? 'Verificata ✓' : status?.distanceLabel ? `a ${status.distanceLabel}` : 'Sconosciuta'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {!userCoords && (
                                                <button onClick={handleRequestPermissions}
                                                    className="px-3 py-1.5 text-[10px] font-bold uppercase rounded-xl transition-all active:scale-95"
                                                    style={{ background: '#F5F2EC', color: '#5A5040', border: '1px solid #E0D8CC' }}>
                                                    Consenti
                                                </button>
                                            )}
                                            <button onClick={refreshLocation}
                                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95"
                                                style={{ background: '#F5F2EC', border: '1px solid #E0D8CC', color: '#5A5040' }}>
                                                <Compass size={14} className={isRefreshingGps ? 'animate-spin' : ''} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 px-1 pb-2">
                                        <Info size={12} className="mt-0.5 shrink-0 text-stone-400" />
                                        <p className="text-[11px] leading-relaxed" style={{ color: '#9A8E7E' }}>
                                            Devi essere entro 500m dal luogo durante l'orario indicato per sbloccare la card esclusiva.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>
                )}

                {/* ── CARD PREMIO ── */}
                {!event.isGuestEvent && event.cards && (
                    <section className="mx-4 mt-5 rounded-[28px] overflow-hidden"
                        style={{ background: '#FFFFFF', boxShadow: '0 2px 24px rgba(0,0,0,0.07)', border: '1px solid #F0EDE8' }}>

                        <div className="px-6 pt-5 pb-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#C4974A' }}>
                                Ricompensa Esclusiva
                            </p>
                        </div>
                        <div className="flex items-center gap-5 px-6 py-4">
                            <div className="w-20 h-28 rounded-2xl overflow-hidden shrink-0"
                                style={{ border: '1px solid #EDE9E0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                                <img src={event.cards?.image_url} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold mb-1.5" style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A' }}>
                                    {event.cards?.title}
                                </h4>
                                <p className="text-[12px] italic leading-relaxed" style={{ color: '#7A7060' }}>
                                    "{event.cards?.description}"
                                </p>
                            </div>
                        </div>
                        <div className="px-6 pb-6">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                disabled={isUnlocking || isUnlocked || (!status?.canUnlock && !isUnlocked)}
                                onClick={handleUnlockCard}
                                className="w-full h-12 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300"
                                style={isUnlocked
                                    ? { background: '#F0FDF4', color: '#15803d', border: '1px solid #bbf7d0' }
                                    : status?.canUnlock
                                        ? { background: '#C4974A', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(196,151,74,0.3)' }
                                        : { background: '#F5F2EC', color: '#C4B89A', border: '1px solid #EDE9E0', cursor: 'not-allowed' }
                                }
                            >
                                {isUnlocked ? <><Trophy size={16} /> Raccolta</> : isUnlocking
                                    ? <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                                    : <><Gift size={16} /> Sblocca Premio</>}
                            </motion.button>
                        </div>
                    </section>
                )}
            </main>

            {/* ── STICKY BOTTOM BAR ── */}
            < div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50"
                style={{ background: 'rgba(250,249,246,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="px-5 py-3 pb-6">
                    {isPrenotato ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-lg font-bold leading-tight" style={{ color: '#1A1A1A', fontFamily: "'Playfair Display', serif" }}>Ci sarai!</p>
                                <button onClick={() => setShowCancelModal(true)}
                                    className="text-xs font-medium mt-0.5 transition-colors"
                                    style={{ color: '#7A9E8A' }}>
                                    Annulla prenotazione
                                </button>
                            </div>
                            <button
                                onClick={() => navigate(event.isGuestEvent ? `/booking-confirmation/${event.id}` : '#')}
                                className="h-11 px-5 rounded-xl font-bold text-sm tracking-wide active:scale-95 transition-all flex items-center gap-2.5"
                                style={{ background: '#1A1710', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v3h-3v-3zm-3 3h3v3h-3v-3zm3 3h3v3h-3v-3zm-3-6h3v3h-3v-3z" />
                                </svg>
                                Vedi biglietto
                            </button>
                        </div>
                    ) : event.isGuestEvent ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[16px] font-bold leading-tight" style={{ color: '#1A1A1A' }}>
                                    {event.prezzo > 0 ? `€ ${event.prezzo}` : 'Ingresso Libero'}
                                    {event.posti_totali && (
                                        <span className="text-sm font-normal ml-2" style={{ color: '#9A8E7E' }}>
                                            · {Math.max(0, event.posti_totali - (event.iscritti_count || 0))} posti disponibili
                                        </span>
                                    )}
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: '#9A8E7E' }}>
                                    Partner Event • Registrazione manuale
                                </p>
                            </div>
                            <button onClick={() => setShowBookingModal(true)} className="h-11 px-7 rounded-xl font-bold text-[14px] transition-all flex items-center justify-center shadow-lg active:scale-95"
                                style={{ background: '#1A1A1A', color: '#FFFFFF' }}>
                                Prenota
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[16px] font-bold leading-tight" style={{ color: '#1A1A1A' }}>
                                    {event.prezzo ? `${event.prezzo} €` : 'Gratuito'}
                                    {event.posti_totali && (
                                        <span className="text-sm font-normal ml-2" style={{ color: '#9A8E7E' }}>
                                            · {Math.max(0, event.posti_totali - (event.iscritti_count || 0))} posti disponibili
                                        </span>
                                    )}
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: '#9A8E7E' }}>
                                    Puoi iscriverti fino al {formatTime(event.data_inizio)}
                                </p>
                            </div>
                            <button className="h-11 px-7 rounded-xl font-bold text-[15px] active:scale-95 transition-all text-white"
                                style={{
                                    background: '#C4974A',
                                    boxShadow: '0 4px 20px rgba(196,151,74,0.35)',
                                }}>
                                Partecipa
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODALE PRENOTAZIONE ── */}
            <AnimatePresence>
                {showBookingModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end justify-center"
                        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                        onClick={() => setShowBookingModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-white rounded-t-[32px] w-full max-w-lg overflow-hidden flex flex-col"
                            style={{ maxHeight: '90vh' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex-1 overflow-y-auto px-6 pt-8 pb-32">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A' }}>
                                        Completa Prenotazione
                                    </h2>
                                    <button onClick={() => setShowBookingModal(false)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Event Info Summary */}
                                    <div className="p-4 rounded-2xl border border-stone-200" style={{ background: '#FAF9F6' }}>
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-[15px]">{event.titolo}</p>
                                            <p className="font-bold text-[15px]">{event.prezzo > 0 ? `€ ${event.prezzo}` : 'Gratis'}</p>
                                        </div>
                                        <p className="text-[13px] text-stone-500">{formatDateLong(event.data_inizio)} alle {formatTime(event.data_inizio)}</p>

                                        {/* Metodi e Istruzioni */}
                                        <div className="mt-4 pt-4 border-t border-stone-200">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Modalità di Pagamento</p>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {(Array.isArray(event.payment_methods) ? event.payment_methods : (typeof event.payment_methods === 'string' ? [event.payment_methods] : [])).map((m) => (
                                                    <span key={m} className="px-2.5 py-1 bg-white border border-stone-200 rounded-md text-[11px] font-medium text-stone-600 uppercase tracking-wide">
                                                        {typeof m === 'string' ? m.replace('_', ' ') : m}
                                                    </span>
                                                ))}
                                                {(!event.payment_methods || event.payment_methods.length === 0) && (
                                                    <span className="text-[13px] text-stone-500">Non specificata</span>
                                                )}
                                            </div>

                                            {/* Removed bonifico details */}
                                        </div>
                                    </div>

                                    {/* Contatti e Privacy */}
                                    <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/50">
                                        <div className="flex items-start gap-3">
                                            <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[13px] font-semibold text-blue-900 mb-1">
                                                    Comunicazioni Organizzatore
                                                </p>
                                                <p className="text-[12px] text-blue-800/80 leading-relaxed mb-3">
                                                    L'organizzatore utilizzerà il numero di telefono associato al tuo profilo per contattarti, fornire aggiornamenti ed eventualmente inserirti nella chat di gruppo dell'evento.
                                                </p>
                                                <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100">
                                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                                    <span className="font-mono text-[13px] font-medium text-stone-700">
                                                        {profile?.telefono || profile?.cellulare || user?.phone || 'Numero non inserito'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-stone-100">
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={isBookingLoading}
                                    className="w-full h-14 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-all mb-3 disabled:opacity-75"
                                    style={{ background: '#1A1A1A', color: '#FFFFFF' }}
                                >
                                    {isBookingLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Ticket size={20} color="#FFFFFF" />
                                            Ottieni il biglietto
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-center leading-tight px-4" style={{ color: '#9A8E7E' }}>
                                    Continuando, accetti i nostri <span className="underline">Termini e Condizioni</span> e l' <span className="underline">Informativa sulla Privacy</span>.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── MODALE PARTECIPANTI ── */}
            <AnimatePresence>
                {showParticipantsModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end justify-center"
                        style={{ background: 'rgba(26,23,16,0.5)', backdropFilter: 'blur(8px)' }}
                        onClick={() => setShowParticipantsModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="w-full max-w-lg rounded-t-[2rem] overflow-hidden"
                            style={{ background: '#FAF9F6', maxHeight: '80vh', overflowY: 'auto' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full" style={{ background: '#DDD8D0' }} />
                            </div>
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4"
                                style={{ borderBottom: '1px solid #EDE9E0' }}>
                                <div>
                                    <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A' }}
                                        className="text-xl font-bold">Chi c'è?</h3>
                                    <p className="text-[12px] mt-0.5" style={{ color: '#9A8E7E' }}>
                                        {totalParticipants} partecipanti confermati
                                    </p>
                                </div>
                                <button onClick={() => setShowParticipantsModal(false)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center"
                                    style={{ background: '#EDE9E0', color: '#5A5040' }}>
                                    <X size={16} />
                                </button>
                            </div>
                            {/* Lista */}
                            <div className="py-3 pb-10">
                                {participants.length === 0 ? (
                                    <div className="px-6 py-10 text-center">
                                        <p className="text-stone-400 text-sm">Ancora nessun partecipante confermato.</p>
                                    </div>
                                ) : (
                                    participants.map((p, i) => (
                                        <div key={i} className="flex items-center gap-4 px-6 py-3.5"
                                            style={{ borderBottom: i < participants.length - 1 ? '1px solid #F0EDE8' : 'none' }}>
                                            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0"
                                                style={{ border: '1.5px solid #E8E3DA', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[15px] font-semibold" style={{ color: '#1A1A1A' }}>{p.name}</p>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                                                style={{ background: '#F5F2EC', color: '#9A8E7E', border: '1px solid #EDE9E0' }}>
                                                Partecipa
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── MODALE ANNULLA ── */}
            < AnimatePresence >
                {showCancelModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
                        style={{ background: 'rgba(26,23,16,0.55)', backdropFilter: 'blur(8px)' }}
                        onClick={() => setShowCancelModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden"
                            style={{ background: '#FAF9F6' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 pt-6 pb-4"
                                style={{ borderBottom: '1px solid #EDE9E0' }}>
                                <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A' }}
                                    className="text-xl font-bold">
                                    Perché vuoi annullare?
                                </h3>
                                <button onClick={() => setShowCancelModal(false)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center"
                                    style={{ background: '#EDE9E0', color: '#5A5040' }}>
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="px-6 py-5">
                                <p className="text-sm mb-5" style={{ color: '#7A7060' }}>
                                    Aiutaci a capire come mai non potrai partecipare.
                                </p>
                                <div className="space-y-2.5">
                                    {['Imprevisto personale', 'L\'evento non fa per me', 'Problemi di salute', 'Cambiamento di orario', 'Altro'].map((motivo) => (
                                        <label key={motivo}
                                            className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-colors"
                                            style={{
                                                background: cancelReason === motivo ? '#F0EBE0' : '#FFFFFF',
                                                border: `1px solid ${cancelReason === motivo ? '#D4B882' : '#EDE9E0'}`,
                                            }}>
                                            <input type="radio" name="cancel_reason" value={motivo}
                                                checked={cancelReason === motivo}
                                                onChange={() => setCancelReason(motivo)}
                                                className="w-4 h-4 shrink-0"
                                                style={{ accentColor: '#C4974A' }} />
                                            <span className="text-[14px] font-medium" style={{ color: '#1A1A1A' }}>{motivo}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex gap-3 mt-6 pb-4">
                                    <button onClick={() => setShowCancelModal(false)}
                                        className="flex-1 h-14 rounded-2xl font-semibold text-sm transition-all active:scale-95"
                                        style={{ background: '#EDE9E0', color: '#5A5040' }}>
                                        Torna indietro
                                    </button>
                                    <button
                                        onClick={handleActualCancelBooking}
                                        disabled={isBookingLoading}
                                        className="flex-1 h-14 flex items-center justify-center rounded-2xl font-semibold text-sm text-white transition-all active:scale-95 disabled:opacity-75"
                                        style={{ background: '#C4593A', boxShadow: '0 4px 16px rgba(196,89,58,0.25)' }}>
                                        {isBookingLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Conferma'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default EventDetail;
