// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';

import { QuestService } from '../services/quest';
import { EventsService } from '../services/events';
import { NotificationService } from '../services/notifications';
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
  NavigationArrow,
  X
} from '@phosphor-icons/react';

import { useTranslation } from 'react-i18next';
import SearchModal from '../components/SearchModal';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const { theme } = useTheme();
  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [heroItems, setHeroItems] = useState([]);
  const [saghe, setSaghe] = useState([]);
  const [activeSagas, setActiveSagas] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [userLoc, setUserLoc] = useState(null);

  // STATI NOTIFICHE
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const carouselRef = useRef(null);

  useEffect(() => {
    // Fetch iniziale notifiche
    const fetchNotificationsData = async () => {
      if (profile?.id) {
        const amount = await NotificationService.getUnreadCount(profile.id);
        const data = await NotificationService.getUserNotifications(profile.id, 15);
        setUnreadCount(amount);
        setNotifications(data);
      }
    };
    fetchNotificationsData();

    // Try to get user location for proximity sorting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('GPS denied for proximity', err)
      );
    }
    loadData();
  }, [profile?.id]); // Ricarica quando il profilo è pronto

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    // Le notifiche non vengono più segnate tutte come lette all'apertura.
    // L'utente deve cliccarci sopra.
  };

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

  // eslint-disable-next-line no-unused-vars
  const categories = [
    { id: 'concierge', icon: <Sparkle size={24} weight="fill" className="text-orange-500" />, label: 'Concierge', path: '/daily-plans' },
    { id: 'vibe', icon: <NavigationArrow size={24} weight="fill" className="text-blue-500" />, label: 'Radar Live', path: '/vibe-radar' },
    { id: 'cultura', icon: <Bank size={24} weight="regular" />, label: 'Cultura' },
    { id: 'gastronomia', icon: <ForkKnife size={24} weight="regular" />, label: 'Cibo' },
  ];


  if (loading) {
    return <div className="h-[100dvh] bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="animate-pulse bg-[var(--bg-secondary)] w-12 h-12 rounded-full border border-[var(--border)]"></div>
    </div>
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[var(--bg-primary)] flex flex-col font-satoshi text-[var(--text-primary)] overflow-hidden relative transition-colors duration-500">

      {/* 1. TOP HEADER (Statico) */}
      <header className="flex-none px-4 py-3 pb-4 flex items-center justify-between z-20 bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shadow-lg bg-white p-0.5">
            <img src="/logo.png" alt="DDP" className="w-full h-full object-cover rounded-full" />
          </div>
        </div>

        <div className="flex-1 mx-3">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="w-full bg-white backdrop-blur-md border border-zinc-200 transition-colors rounded-full py-2.5 px-4 flex items-center gap-2 text-sm shadow-xl active:scale-[0.98] text-zinc-950 hover:bg-white"
          >
            <MagnifyingGlass size={18} weight="bold" />
            <span className="font-geist truncate font-medium">Trova luoghi e cose da fare</span>
          </button>

        </div>

        {/* CAMPANELLA NOTIFICHE */}
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className="relative p-2 shrink-0 rounded-full transition-colors hover:bg-zinc-100 text-zinc-900"
          >
            <Bell size={26} weight="fill" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm" />
            )}
          </button>

          {/* DROPDOWN NOTIFICHE */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-12 right-0 w-80 max-h-[400px] overflow-y-auto bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-4 z-50 no-scrollbar"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-bold text-lg text-zinc-900 font-satoshi">Notifiche</h3>
                  <button onClick={() => setShowNotifications(false)} className="p-1 min-h-[30px] rounded-full hover:bg-zinc-100 transition-colors">
                    <X size={18} color="#71717A" weight="bold" />
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-6 font-medium">Nessuna notifica per ora.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-2xl transition-colors cursor-pointer ${notif.letta ? 'bg-zinc-50/50 hover:bg-zinc-50' : 'bg-blue-50/50 border border-blue-100 hover:bg-blue-50'} shadow-sm`}
                        onClick={async () => {
                          if (!notif.letta && profile?.id) {
                            await NotificationService.markAsRead(notif.id);
                            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, letta: true } : n));
                            setUnreadCount(prev => Math.max(0, prev - 1));
                          }
                          if (notif.link_azione) navigate(notif.link_azione);
                        }}
                      >
                        <div className="flex gap-2">
                          <div className={`w-2 h-2 mt-1.5 shrink-0 rounded-full ${notif.letta ? 'bg-transparent' : 'bg-blue-500'}`} />
                          <div>
                            <p className="text-[13px] font-bold text-zinc-900 leading-tight mb-0.5">{notif.titolo}</p>
                            <p className="text-[12px] text-zinc-600 leading-snug">{notif.messaggio}</p>
                            <span className="text-[10px] text-zinc-400 font-medium mt-1.5 block">
                              {new Date(notif.created_at).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* OVERLAY SFONDO (per chiudere le notifiche cliccando fuori) */}
      {showNotifications && (
        <div
          className="lg:hidden fixed inset-0 z-10"
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* SCROLLABLE CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar -mt-[72px]">

        {/* 2. HERO CAROUSEL (Dinamico) */}
        <section className="relative w-full h-[65vh] md:h-[70vh] bg-[var(--bg-primary)]">

          {heroItems.length > 0 ? (
            <div className="relative w-full h-full">
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
              >
                {heroItems.map((hero) => (
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
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-zinc-950/20 to-transparent pointer-events-none no-theme-flip" />

                    {/* Testo In Basso a Sinistra - Stile GetYourGuide */}
                    <div className="text-on-image absolute inset-0 p-5 pb-8 flex flex-col justify-end text-left">

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
                        <button
                          onClick={() => {
                            if (hero.button_link.startsWith('http')) {
                              window.open(hero.button_link, '_blank');
                            } else {
                              navigate(hero.button_link);
                            }
                          }}
                          className="flex items-center gap-1 text-[15px] font-semibold text-white w-fit drop-shadow-md hover:underline active:opacity-70"
                        >
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

        {/* 2b. CONCIERGE BANNER (Editorial Arch Style) */}
        <section className="mt-12 px-6 mb-8">
          <div
            onClick={() => navigate('/daily-plans')}
            className="relative bg-[var(--bg-surface)] rounded-[2.5rem] p-8 border border-[var(--border)] shadow-sm hover:shadow-md transition-all duration-500 cursor-pointer overflow-hidden flex items-center justify-between group"
          >
            {/* Elegant Left Column */}
            <div className="flex-1 z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-[1px] bg-gold/50" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">Concierge Esperienziale</span>
              </div>

              <h3 className="text-3xl font-serif italic text-[var(--text-primary)] leading-tight mb-4 max-w-[10ch]">
                Il battito <br />
                <span className="text-gold">autentico</span> della Puglia.
              </h3>

              <p className="text-sm text-[var(--text-muted)] font-medium mb-8 max-w-[24ch] leading-relaxed">
                Itinerari d'autore curati dai local per farti vivere l'eccellenza.
              </p>

              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)] group-hover:text-gold transition-colors">
                Esplora gli itinerari
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Architectural Arch Detail */}
            <div className="relative w-40 h-64 -mr-4 shrink-0 pointer-events-none hidden sm:block">
              <div className="absolute inset-0 rounded-t-full border-[12px] border-[var(--bg-base)] shadow-inner overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=600"
                  className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                  alt="Puglia"
                />
                <div className="absolute inset-0 bg-gold/5" />
              </div>
              {/* Decorative shadow for the arch */}
              <div className="absolute -inset-1 rounded-t-full border border-gold/10 -z-10" />
            </div>

            {/* Mobile Arch (Simplified) */}
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gold/5 to-transparent sm:hidden" />
          </div>
        </section>

        {/* 3. LE MIE SAGHE IN CORSO */}
        {activeSagas.length > 0 && (
          <section className="mt-8 px-4 mb-2">
            <div className="flex items-end justify-between mb-4">
              <h3 className="text-[22px] font-black font-satoshi text-[var(--text-primary)] leading-tight tracking-tight">
                Le Mie Saghe 🗺️
              </h3>
              <button
                onClick={() => navigate('/missioni')}
                className="text-[var(--text-muted)] font-medium text-sm hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 group pb-1"
              >
                Vedi tutte <span className="group-hover:translate-x-1 transition-transform">›</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {activeSagas.map((saga) => (
                <div
                  key={saga.questSetId}
                  onClick={() => navigate(`/saga/${saga.questSetId}/intro`)}
                  className="flex items-center gap-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform group hover:border-[#E4AE2F]/30 shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[var(--border)] relative bg-[var(--bg-secondary)]">

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
                        <span className="text-[9px] text-[var(--text-muted)] font-medium">📍 {saga.sagaCity}</span>
                      )}
                    </div>
                    <h4 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug truncate mb-2">
                      {saga.sagaTitle}
                    </h4>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#E4AE2F] to-[#FFD700] rounded-full transition-all duration-700"
                        style={{ width: `${saga.percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
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
            <h3 className="text-[28px] font-black font-satoshi text-[var(--text-primary)] leading-tight tracking-tight">
              Missioni Vicine
            </h3>
            <button
              onClick={() => navigate('/missioni')}
              className="text-[var(--text-muted)] font-medium text-sm hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 group pb-1"
            >
              Scopri di più <span className="group-hover:translate-x-1 transition-transform">›</span>
            </button>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x -mx-4 px-4">
            {saghe.slice(0, 5).map((saga) => (
              <div
                key={`vicina-${saga.id}`}
                onClick={() => navigate(`/saga/${saga.id}/intro`)}
                className="snap-center w-[280px] md:w-[320px] shrink-0 bg-[var(--bg-surface)] rounded-[1.5rem] overflow-hidden shadow-xl border border-[var(--border)] group flex flex-col cursor-pointer"
              >
                {/* Image */}
                <div className="h-40 bg-[var(--bg-secondary)] relative overflow-hidden border-b border-[var(--border)]">

                  <img src={saga.image_url || saga.map_image_url || "https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format"} alt={saga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />


                  {/* Distance Badge */}
                  <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold text-white no-theme-flip flex items-center gap-1.5 shadow-md border border-white/10 z-10">
                    <span className="text-red-500 mb-[1px]">📍</span>
                    {saga.city || 'Puglia'}
                  </div>

                  {/* Badge: Originals vs Certificato - BOTTOM LEFT */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-start pointer-events-none z-10 text-on-image">
                    {(saga.is_original === true || saga.isOriginal === true) ? (
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/5">
                        <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-black text-white shadow-sm shrink-0">D</div>
                        <span className="text-[11px] font-geist font-bold text-white drop-shadow-md">Originals by Desideri di Puglia</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/5">
                        <span className="text-[10px] font-bold text-white drop-shadow-md">Certificato da Desideri di Puglia</span>
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
                  <h4 className="font-satoshi font-black text-[var(--text-primary)] text-[18px] leading-snug mb-2 group-hover:text-[var(--text-secondary)] transition-colors">
                    {saga.title || saga.titolo}
                  </h4>
                  <p className="text-sm font-geist text-[var(--text-muted)] line-clamp-2 leading-relaxed">
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
            <h3 className="text-[28px] font-black font-satoshi text-[var(--text-primary)] leading-tight tracking-tight">
              Notizie ed Eventi
            </h3>
            <button
              onClick={() => navigate('/eventi')}
              className="text-[var(--text-muted)] font-medium text-sm hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 group pb-1"
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
                  className="snap-center w-[280px] md:w-[320px] shrink-0 bg-[var(--bg-surface)] rounded-[1.5rem] overflow-hidden shadow-xl border border-[var(--border)] group flex flex-col cursor-pointer active:scale-[0.98] transition-all"
                >
                  {/* Event Image */}
                  <div className="h-40 bg-[var(--bg-secondary)] relative overflow-hidden border-b border-[var(--border)]">

                    <img src={ev.immagine_url || "https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format"} alt={ev.titolo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />


                    {/* Date Badge */}
                    <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-xl text-center shadow-lg text-on-image">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-red-500 leading-none mb-1">
                        {startDate.toLocaleString('it-IT', { month: 'short' })}
                      </div>
                      <div className="text-lg font-black text-white leading-none">
                        {startDate.getDate()}
                      </div>
                    </div>

                    {isPartner && (
                      <div className="absolute top-3 right-3 bg-zinc-950/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white no-theme-flip flex items-center gap-1.5 shadow-md border border-red-500/30">
                        <span className="text-red-500 mb-[1px]">📍</span>
                        {ev.partners.name}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                      📍 {ev.luogo}
                    </div>
                    <h4 className="text-[19px] font-bold font-satoshi text-[var(--text-primary)] mb-2 leading-tight">
                      {ev.titolo}
                    </h4>
                    <p className="text-[13px] text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-4">
                      {ev.descrizione}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <EventTimer startDate={ev.data_inizio} endDate={ev.data_fine} />
                      {ev.posti_totali && (
                        <div className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded-md border border-[var(--border)]">
                          {Math.max(0, ev.posti_totali - (ev.iscritti_count || 0))} posti liberi
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            }) : (
              <div className="w-full py-8 text-center text-[var(--text-muted)] italic border border-[var(--border)] rounded-2xl bg-[var(--bg-secondary)]/50">
                Nessun evento attivo al momento.
              </div>
            )}
          </div>
        </section >

        {/* 7. RADAR DELLA MOVIDA */}
        <section className="mt-8 px-4 mb-20">
          <div className="bg-[var(--bg-surface)] rounded-[2rem] p-8 border border-[var(--border)] relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-[80px] -mr-20 -mt-20" />

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Social Heatmap</h3>
                <h2 className="text-2xl font-black text-[var(--text-primary)] leading-tight">Radar della Movida</h2>
              </div>
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-xl">
                <NavigationArrow size={32} weight="fill" className="animate-pulse" />
              </div>
            </div>

            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 font-medium italic">
              "Dove c'è gente stasera?"<br />
              Scoprilo in tempo reale con le segnalazioni del club.
            </p>

            <button
              onClick={() => navigate('/vibe-radar')}
              className="w-full h-14 bg-[var(--bg-inverse)] text-[var(--text-inverse)] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-all active:scale-95"
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
}