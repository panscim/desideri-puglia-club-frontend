// src/pages/EventDetail.jsx
import React, { useEffect, useState } from 'react';
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
  Gift
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      const data = await EventsService.getEventById(id);
      setEvent(data);
      
      // Check if user already has the card
      if (user && data?.ricompensa_card_id) {
         // Note: We'd ideally have a checkCardOwnership in EventsService
         // but we can check it here or adjust EventsService later.
         // For now, let's assume we fetch it or the unlockEventCard handles the check.
      }
      
      setLoading(false);
    };
    fetchEvent();

    // Update current time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [id, user]);

  const handleOpenMaps = () => {
    if (!event.latitudine || !event.longitudine) {
      toast.error("Posizione non disponibile");
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${event.latitudine},${event.longitudine}`;
    window.open(url, '_blank');
  };

  const handleUnlockCard = async () => {
    if (!user) {
      toast.error("Devi accedere per sbloccare i premi");
      navigate('/login');
      return;
    }

    setIsUnlocking(true);
    const result = await EventsService.unlockEventCard(event.ricompensa_card_id);
    
    if (result.success) {
      toast.success("Card Sbloccata con Successo! 🏆");
      setIsUnlocked(true);
    } else {
      toast.error(result.error || "Errore nello sblocco");
      if (result.error?.includes("già sbloccato")) {
        setIsUnlocked(true);
      }
    }
    setIsUnlocking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">Caricamento evento...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-white/5">
          <Info size={40} className="text-zinc-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Evento non trovato</h2>
        <p className="text-zinc-400 mb-8 max-w-xs">L'evento che stai cercando potrebbe essere scaduto o rimosso.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
        >
          Torna alla Home
        </button>
      </div>
    );
  }

  const startDate = new Date(event.data_inizio);
  const endDate = new Date(event.data_fine);
  const isEventActive = currentTime >= startDate && currentTime <= endDate;
  const isEventFuture = currentTime < startDate;
  const isEventPast = currentTime > endDate;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-satoshi pb-20">
      {/* 1. Header & Hero */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-zinc-950 z-10" />
        <img 
          src={event.immagine_url || "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200"} 
          alt={event.titolo}
          className="w-full h-full object-cover scale-105"
        />

        {/* Top Navbar */}
        <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-20">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <CaretLeft size={24} weight="bold" />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
            <ShareNetwork size={22} weight="bold" />
          </button>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-6 z-20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
               <span className={`text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg ${isEventActive ? 'bg-green-600' : 'bg-orange-600'}`}>
                {isEventActive ? 'Evento In Corso' : isEventFuture ? 'Prossimamente' : 'Evento Terminato'}
              </span>
              {event.partners && (
                <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Organizzato da {event.partners.name}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black leading-tight drop-shadow-2xl">
              {event.titolo}
            </h1>
          </div>
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="px-6 -mt-4 relative z-30">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
            <div className="flex items-center gap-3 mb-1 text-orange-500">
              <Calendar size={20} weight="fill" />
              <span className="text-[11px] font-black uppercase tracking-tighter">Quando</span>
            </div>
            <p className="text-sm font-bold">
              {startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-4 rounded-3xl">
            <div className="flex items-center gap-3 mb-1 text-blue-500">
              <MapPin size={20} weight="fill" />
              <span className="text-[11px] font-black uppercase tracking-tighter">Luogo</span>
            </div>
            <p className="text-sm font-bold truncate">
              {event.luogo || 'Puglia'}
            </p>
          </div>
        </div>

        {/* 3. REWARD SECTION (IMPORTANT) */}
        {event.cards && (
          <section className="mb-10 animate-fade-in-up">
            <div className="bg-gradient-to-br from-orange-600/20 to-gold/10 border border-orange-500/30 rounded-[2.5rem] p-6 relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-600 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity" />
              
              <div className="flex items-start gap-4 mb-3 relative z-10">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-600/20">
                  <Trophy size={28} weight="fill" className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white leading-tight">Ottieni un premio esclusivo!</h3>
                  <p className="text-zinc-400 text-sm mt-1">
                    {isEventActive 
                      ? "Sei sul posto? Sblocca ora la tua ricompensa!" 
                      : "Partecipa all'evento nelle date indicate per sbloccare la card."}
                  </p>
                </div>
              </div>

              {/* Reward Card Preview */}
              <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-3xl p-4 mt-4 relative z-10 backdrop-blur-md">
                <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-xl group-hover:scale-110 transition-transform duration-500 origin-center">
                  <img src={event.cards.image_url} alt={event.cards.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none">
                      {event.cards.rarity || 'Edizione Limitata'}
                    </span>
                  </div>
                  <h4 className="text-md font-bold text-white mb-1">{event.cards.title}</h4>
                  <p className="text-[11px] text-white/50 leading-snug line-clamp-2 italic">
                    {event.cards.description || "Un cimelio unico che testimonia la tua partecipazione."}
                  </p>
                </div>
              </div>

              {/* Unlock Button */}
              {isEventActive ? (
                <button 
                  disabled={isUnlocking || isUnlocked}
                  onClick={handleUnlockCard}
                  className={`w-full mt-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all
                    ${isUnlocked 
                      ? 'bg-green-600/20 text-green-500 border border-green-500/30 cursor-default' 
                      : 'bg-white text-black hover:bg-zinc-100'}`}
                >
                  {isUnlocked ? (
                    <><Trophy size={20} weight="fill" /> Card Sbloccata</>
                  ) : isUnlocking ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <><Gift size={20} weight="bold" /> Sblocca Card Reward</>
                  )}
                </button>
              ) : isEventFuture ? (
                <div className="w-full mt-6 bg-zinc-950/50 border border-white/10 text-zinc-500 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                  <Clock size={20} /> Sblocco disponibile a breve
                </div>
              ) : (
                <div className="w-full mt-6 bg-zinc-950/50 border border-white/10 text-zinc-500 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                  Evento Terminato
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. DESCRIPTION */}
        <section className="mb-10">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-4 px-1">L'esperienza</h3>
          <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
            <p className="text-zinc-300 leading-relaxed text-md font-medium font-geist italic">
              "{event.descrizione || "Nessuna descrizione disponibile per questo evento."}"
            </p>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-zinc-800 p-1">
                <img src={event.partners?.logo_url || "/logo.png"} alt="DDP" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">Certificato da</p>
                <p className="text-sm font-bold text-white">{event.partners?.name || "Desideri di Puglia"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. LOGISTICS / INFO */}
        <section className="mb-12">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-4 px-1">Dettagli Utili</h3>
          <div className="space-y-4">
            {/* Map Navigation Button */}
            <button 
              onClick={handleOpenMaps}
              className="w-full flex items-center gap-4 bg-zinc-900 border border-white/10 p-5 rounded-3xl active:scale-[0.98] transition-all hover:bg-zinc-800/80 group"
            >
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <NavigationArrow size={24} weight="fill" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">Indicazioni</p>
                <p className="text-md font-bold text-white">Apri su Mappe</p>
              </div>
              <ArrowRight size={20} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-4 bg-zinc-900/30 p-4 rounded-2xl border border-white/5">
              <Clock size={24} className="text-orange-500" weight="fill" />
              <div>
                <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">Orario</p>
                <p className="text-sm font-bold">Inizia alle {startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            
            <div className="group cursor-pointer flex items-center gap-4 bg-zinc-900/30 p-4 rounded-2xl border border-white/5 active:bg-zinc-800 transition-colors">
              <ShareNetwork size={24} className="text-zinc-400 group-active:text-white" weight="bold" />
              <div>
                <p className="text-sm font-bold">Condividi con i tuoi amici</p>
                <p className="text-[11px] text-zinc-500 font-medium">Invita altri esploratori a partecipare</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default EventDetail;
