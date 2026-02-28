// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { QuestService } from '../services/quest';
import { EventsService } from '../services/events';
import {
  Bell,
  MagnifyingGlass,
  Heart,
  Bank,
  ForkKnife,
  Tree,
  Waves,
  Sparkle,
  ArrowRight,
  MapTrifold,
  NavigationArrow
} from '@phosphor-icons/react';


import { useTranslation } from 'react-i18next';
import SearchModal from '../components/SearchModal';

const EventTimer = ({ startDate, endDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      if (now < start) {
        const distance = start - now;
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`Inizia tra: ${days}g ${hours}h ${minutes} m`);
      } else if (now >= start && now <= end) {
        const distance = end - now;
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`Termina tra: ${days}g ${hours}h ${minutes} m`);
      } else {
        setTimeLeft('Concluso');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [startDate, endDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-500/10 px-2.5 py-1.5 rounded-md border border-red-500/20 whitespace-nowrap">
      <span className="text-[13px]">⏳</span>
      {timeLeft}
    </div>
  );
};

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [heroItems, setHeroItems] = useState([]);
  const [saghe, setSaghe] = useState([]);
  const [activeSagas, setActiveSagas] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    // Try to get user location for proximity sorting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('GPS denied for proximity', err)
      );
    }
    loadData();
  }, [profile?.id]); // Ricarica quando il profilo è pronto

  const handleScroll = (e) => {
    if (!carouselRef.current || heroItems.length === 0) return;
    const scrollLeft = e.target.scrollLeft;
    const itemWidth = carouselRef.current.scrollWidth / heroItems.length;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex !== activeHeroIndex) {
      setActiveHeroIndex(newIndex);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch Dashboard Hero Slides
      const { data: heroData } = await supabase
        .from('dashboard_hero')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      // Fetch Active Events
      const activeEvents = await EventsService.getActiveEvents();

      // Fetch Saghe Storiche for Missioni Vicine
      const activeSaghe = await QuestService.getActiveSets();

      // Fetch user's active (in-progress) sagas
      const userActiveSagas = profile?.id
        ? await QuestService.getUserActiveSagas(profile.id)
        : [];

      // Fetch user favorites
      const userFavorites = profile?.id
        ? await QuestService.getUserFavorites(profile.id)
        : [];

      setHeroItems(heroData || []);
      setEvents(activeEvents || []);
      setSaghe(activeSaghe || []);
      setActiveSagas(userActiveSagas || []);
      setFavorites(userFavorites || []);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e, setId) => {
    e.stopPropagation();
    if (!profile?.id) {
      // Potresti voler mostrare un toast o reindirizzare al login
      return;
    }

    const res = await QuestService.toggleFavorite(profile.id, setId);
    if (res.success) {
      if (res.isFavorite) {
        setFavorites(prev => [...prev, setId]);
      } else {
        setFavorites(prev => prev.filter(id => id !== setId));
      }
    }
  };

  const categories = [
    { id: 'concierge', icon: <Sparkle size={24} weight="fill" className="text-orange-500" />, label: 'Concierge', path: '/daily-plans' },
    { id: 'vibe', icon: <NavigationArrow size={24} weight="fill" className="text-blue-500" />, label: 'Radar Live', path: '/vibe-radar' },
    { id: 'cultura', icon: <Bank size={24} weight="regular" />, label: 'Cultura' },
    { id: 'gastronomia', icon: <ForkKnife size={24} weight="regular" />, label: 'Cibo' },
  ];


  if (loading) {
    return <div className="h-[100dvh] bg-zinc-950 flex items-center justify-center">
      <div className="animate-pulse bg-zinc-800 w-12 h-12 rounded-full border border-white/10"></div>
    </div>
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-zinc-950 flex flex-col font-satoshi text-white overflow-hidden relative">

      {/* 1. TOP HEADER (Statico) */}
      <header className="flex-none px-4 py-3 pb-4 flex items-center justify-between z-20 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-transparent">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shadow-lg bg-white p-0.5">
            <img src="/logo.png" alt="DDP" className="w-full h-full object-cover rounded-full" />
          </div>
        </div>

        <div className="flex-1 mx-3">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="w-full bg-zinc-900/90 backdrop-blur-md border border-white/10 hover:bg-zinc-800 transition-colors rounded-full py-2.5 px-4 flex items-center gap-2 text-zinc-400 text-sm shadow-xl active:scale-[0.98]"
          >
            <MagnifyingGlass size={18} weight="bold" />
            <span className="font-geist truncate font-medium">Trova luoghi e cose da fare</span>
          </button>
        </div>

        <button className="relative p-2 text-white shrink-0 hover:bg-white/10 rounded-full transition-colors drop-shadow-md">
          <Bell size={26} weight="fill" />
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-950"></span>
        </button>
      </header>

      {/* SCROLLABLE CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar -mt-[72px]">

        {/* 2. HERO CAROUSEL (Dinamico) */}
        <section className="relative w-full h-[65vh] md:h-[70vh]">
          {heroItems.length > 0 ? (
            <div className="relative w-full h-full">
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
              >
                {heroItems.map((hero, idx) => (
                  <div
                    key={hero.id}
                    onClick={() => hero.button_link ? navigate(hero.button_link) : null}
                    className="w-full h-full shrink-0 snap-center relative cursor-pointer group"
                  >
                    <img
                      src={hero.image_url}
                      alt={hero.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    {/* Overlay Leggero Solo in Basso */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-zinc-950/20 to-transparent pointer-events-none" />

                    {/* Testo In Basso a Sinistra - Stile GetYourGuide */}
                    <div className="absolute inset-0 p-5 pb-8 flex flex-col justify-end text-left">
                      <h1 className="text-[26px] md:text-[30px] leading-[1.1] font-black font-satoshi text-white mb-2.5 tracking-tight drop-shadow-md">
                        {hero.title}
                      </h1>

                      {/* Branding Badge */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0">D</div>
                        <span className="text-[13px] font-geist font-bold text-white drop-shadow-md">Originals by Desideri di Puglia</span>
                      </div>

                      {hero.subtitle && (
                        <p className="text-[15px] font-geist font-medium text-white mb-3 drop-shadow-md leading-snug">
                          {hero.subtitle}
                        </p>
                      )}

                      {hero.button_link && (
                        <button className="flex items-center gap-1 text-[15px] font-semibold text-white w-fit drop-shadow-md hover:underline active:opacity-70">
                          Scopri di più <span className="text-xl leading-none">›</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dots Indicator */}
              {heroItems.length > 1 && (
                <div className="absolute bottom-6 w-full flex justify-center gap-2 z-10">
                  {heroItems.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${activeHeroIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-500">
              Nessuna esperienza.
            </div>
          )}
        </section >

        {/* 2b. CONCIERGE BANNER */}
        <section className="mt-8 px-4 mb-2">
          <div 
            onClick={() => navigate('/daily-plans')}
            className="relative w-full h-40 rounded-[2rem] overflow-hidden group cursor-pointer shadow-2xl border border-white/5 active:scale-[0.98] transition-all"
          >
            <img 
              src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=1200" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent" />
            
            <div className="absolute inset-0 p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Sparkle size={20} weight="fill" className="text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Local Concierge</span>
              </div>
              <h3 className="text-2xl font-black text-white leading-tight mb-2 max-w-[15ch]">
                Cosa facciamo oggi in Puglia?
              </h3>
              <p className="text-xs text-zinc-400 font-medium">Itinerari curati dai residenti per te.</p>
            </div>
            <div className="absolute bottom-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white">
               <ArrowRight size={20} weight="bold" />
            </div>
          </div>
        </section>

        {/* 3. LE MIE SAGHE IN CORSO */}
        {activeSagas.length > 0 && (
          <section className="mt-8 px-4 mb-2">
            <div className="flex items-end justify-between mb-4">
              <h3 className="text-[22px] font-black font-satoshi text-white leading-tight tracking-tight">
                Le Mie Saghe 🗺️
              </h3>
              <button
                onClick={() => navigate('/missioni')}
                className="text-zinc-400 font-medium text-sm hover:text-white transition-colors flex items-center gap-1 group pb-1"
              >
                Vedi tutte <span className="group-hover:translate-x-1 transition-transform">›</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {activeSagas.map((saga) => (
                <div
                  key={saga.questSetId}
                  onClick={() => navigate(`/saga/${saga.questSetId}/intro`)}
                  className="flex items-center gap-4 bg-zinc-900 border border-white/10 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform group hover:border-[#E4AE2F]/30"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                    <img
                      src={saga.sagaImage || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=200'}
                      alt={saga.sagaTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Tiny Badge Indicator on thumbnail */}
                    {(saga.is_original === true || saga.isOriginal === true) && (
                      <div className="absolute top-1 left-1 w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center text-[7px] font-black text-white shadow-sm border border-white/10">D</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#E4AE2F] bg-[#E4AE2F]/10 px-2 py-0.5 rounded-full border border-[#E4AE2F]/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E4AE2F] animate-pulse inline-block" />
                        In Corso
                      </span>
                      {saga.sagaCity && (
                        <span className="text-[9px] text-zinc-500 font-medium">📍 {saga.sagaCity}</span>
                      )}
                    </div>
                    <h4 className="text-[15px] font-bold text-white leading-snug truncate mb-2">
                      {saga.sagaTitle}
                    </h4>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#E4AE2F] to-[#FFD700] rounded-full transition-all duration-700"
                        style={{ width: `${saga.percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {saga.doneSteps}/{saga.totalSteps} tappe · {saga.percent}%
                    </p>
                  </div>

                  {/* Arrow */}
                  <span className="text-zinc-600 group-hover:text-[#E4AE2F] transition-colors text-lg shrink-0">›</span>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* 5. MISSIONI VICINE SLIDER */}
        <section className="mt-8 px-4 mb-4">
          <div className="flex items-end justify-between mb-5">
            <h3 className="text-[28px] font-black font-satoshi text-white leading-tight tracking-tight">
              Missioni Vicine
            </h3>
            <button
              onClick={() => navigate('/missioni')}
              className="text-zinc-400 font-medium text-sm hover:text-white transition-colors flex items-center gap-1 group pb-1"
            >
              Scopri di più <span className="group-hover:translate-x-1 transition-transform">›</span>
            </button>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x -mx-4 px-4">
            {saghe.slice(0, 5).map((saga) => (
              <div
                key={`vicina-${saga.id}`}
                onClick={() => navigate(`/saga/${saga.id}/intro`)}
                className="snap-center w-[280px] md:w-[320px] shrink-0 bg-zinc-900 rounded-[1.5rem] overflow-hidden shadow-xl border border-white/10 group flex flex-col cursor-pointer"
              >
                {/* Image */}
                <div className="h-40 bg-zinc-950 relative overflow-hidden border-b border-white/5">
                  <img src={saga.image_url || saga.map_image_url || "https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format"} alt={saga.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />

                  {/* Distance Badge */}
                  <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold text-white flex items-center gap-1.5 shadow-md border border-white/10 z-10">
                    <span className="text-red-500 mb-[1px]">📍</span>
                    {saga.city || 'Puglia'}
                  </div>

                  {/* Badge: Originals vs Certificato - BOTTOM LEFT */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-start pointer-events-none z-10">
                    {(saga.is_original === true || saga.isOriginal === true) ? (
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/5">
                        <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0">D</div>
                        <span className="text-[11px] font-geist font-bold text-white drop-shadow-md">Originals by Desideri di Puglia</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/5">
                        <span className="text-[10px] font-bold text-zinc-300 drop-shadow-md">Certificato da Desideri di Puglia</span>
                      </div>
                    )}
                  </div>

                  {/* Favorite Heart Button */}
                  <button
                    onClick={(e) => handleToggleFavorite(e, saga.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-zinc-950/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-lg hover:scale-110 active:scale-95 transition-transform"
                  >
                    <Heart
                      size={18}
                      weight={favorites.includes(saga.id) ? "fill" : "bold"}
                      className={favorites.includes(saga.id) ? "text-red-500" : "text-white"}
                    />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h4 className="font-satoshi font-black text-white text-[18px] leading-snug mb-2 group-hover:text-zinc-200 transition-colors">
                    {saga.title || saga.titolo}
                  </h4>
                  <p className="text-sm font-geist text-zinc-400 line-clamp-2 leading-relaxed">
                    {saga.description || saga.descrizione || "Scopri questa incredibile avventura a passi lenti nel cuore della Puglia."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. NEWS AND EVENTS SLIDER */}
        <section className="mt-8 px-4 mb-4">
          <div className="flex items-end justify-between mb-5">
            <h3 className="text-[28px] font-black font-satoshi text-white leading-tight tracking-tight">
              Notizie ed Eventi
            </h3>
            <button
              onClick={() => navigate('/eventi')}
              className="text-zinc-400 font-medium text-sm hover:text-white transition-colors flex items-center gap-1 group pb-1"
            >
              Scopri di più <span className="group-hover:translate-x-1 transition-transform">›</span>
            </button>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x -mx-4 px-4">
            {events.length > 0 ? events.map((ev) => {
              const startDate = new Date(ev.data_inizio)
              const isPartner = !!ev.partners

              return (
                <div
                  key={ev.id}
                  onClick={() => navigate(`/eventi/${ev.id}`)}
                  className="snap-center w-[280px] md:w-[320px] shrink-0 bg-zinc-900 rounded-[1.5rem] overflow-hidden shadow-xl border border-white/10 group flex flex-col cursor-pointer active:scale-[0.98] transition-all"
                >
                  {/* Event Image */}
                  <div className="h-40 bg-zinc-950 relative overflow-hidden border-b border-white/5">
                    <img src={ev.immagine_url || "https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format"} alt={ev.titolo} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />

                    {/* Date Badge */}
                    <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-xl text-center shadow-lg">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-red-500 leading-none mb-1">
                        {startDate.toLocaleString('it-IT', { month: 'short' })}
                      </div>
                      <div className="text-lg font-black text-white leading-none">
                        {startDate.getDate()}
                      </div>
                    </div>

                    {isPartner && (
                      <div className="absolute top-3 right-3 bg-zinc-950/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 shadow-md border border-red-500/30">
                        <span className="text-red-500 mb-[1px]">📍</span>
                        {ev.partners.name}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                      📍 {ev.luogo}
                    </div>
                    <h4 className="text-[19px] font-bold font-satoshi text-white mb-2 leading-tight">
                      {ev.titolo}
                    </h4>
                    <p className="text-[13px] text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                      {ev.descrizione}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <EventTimer startDate={ev.data_inizio} endDate={ev.data_fine} />
                    </div>
                  </div>
                </div>
              )
            }) : (
              <div className="w-full py-8 text-center text-zinc-500 italic border border-white/10 rounded-2xl bg-zinc-900/50">
                Nessun evento attivo al momento.
              </div>
            )}
          </div>
        </section >

        {/* 7. RADAR DELLA MOVIDA */}
        <section className="mt-8 px-4 mb-20">
          <div className="bg-zinc-900 rounded-[2rem] p-8 border border-white/10 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-[80px] -mr-20 -mt-20" />
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Social Heatmap</h3>
                <h2 className="text-2xl font-black text-white leading-tight">Radar della Movida</h2>
              </div>
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-xl">
                 <NavigationArrow size={32} weight="fill" className="animate-pulse" />
              </div>
            </div>
            
            <p className="text-sm text-zinc-400 leading-relaxed mb-8 font-medium italic">
              "Dove c'è gente stasera?"<br/>
              Scoprilo in tempo reale con le segnalazioni del club.
            </p>

            <button 
              onClick={() => navigate('/vibe-radar')}
              className="w-full h-14 bg-white text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-zinc-100 transition-colors active:scale-95"
            >
              Apri Radar Live <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        </section>


      </main >

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        saghe={heroItems}
      />
    </div >
  );
};

export default Dashboard;