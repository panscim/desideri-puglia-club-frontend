import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Share2, Play, Pause, Headphones, MapPin, Star, Navigation, Clock, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function UnlockedCardDetail({ card, onClose }) {
    const { i18n } = useTranslation();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    if (!card) return null;

    const currentLang = i18n.language || 'it';
    const displayTitle = currentLang === 'en' && card.title_en ? card.title_en : card.title;
    const historyText = (currentLang === 'en' && card.history_en ? card.history_en : card.history) || '';
    const firstLetter = historyText.charAt(0);
    const restOfText = historyText.slice(1);

    const curiosity1 = currentLang === 'en' && card.curiosity1_en ? card.curiosity1_en : card.curiosity1_it;
    const curiosity2 = currentLang === 'en' && card.curiosity2_en ? card.curiosity2_en : card.curiosity2_it;
    const curiosity3 = currentLang === 'en' && card.curiosity3_en ? card.curiosity3_en : card.curiosity3_it;
    const curiosityItems = [curiosity1, curiosity2, curiosity3].filter(Boolean);

    const audioTrack = currentLang === 'en' ? (card.audio_track_en || null) : (card.audio_track || null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const { currentTime, duration } = audioRef.current;
            if (duration) {
                setAudioProgress((currentTime / duration) * 100);
                setAudioCurrentTime(currentTime);
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setAudioDuration(audioRef.current.duration);
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const handleOpenMap = () => {
        if (card.gps_lat && card.gps_lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${card.gps_lat},${card.gps_lng}`, '_blank');
        } else if (card.city) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.city + ', Puglia')}`, '_blank');
        }
    };

    const globalRarity = card.global_rarity || 'Top 5%';
    const unlockedDate = card.unlockedAt
        ? new Date(card.unlockedAt).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'it-IT', { month: 'long', day: 'numeric', year: 'numeric' })
        : (currentLang === 'en' ? 'Just Unlocked' : 'Appena Sbloccato');

    return (
        <div className="fixed inset-0 z-[9999] bg-[#FAF7F2] overflow-y-auto font-sans">

            {/* Floating header buttons */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 pt-5 pointer-events-none">
                <button
                    onClick={onClose}
                    className="pointer-events-auto w-11 h-11 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-black/8 shadow-md text-zinc-800 hover:scale-105 transition-all active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button className="pointer-events-auto w-11 h-11 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-black/8 shadow-md text-zinc-800 hover:scale-105 transition-all active:scale-95">
                    <Share2 className="w-4 h-4" />
                </button>
            </header>

            {/* Hero — full bleed image, tall */}
            <div className="relative w-full" style={{ height: '62vh', minHeight: 320, maxHeight: 500 }}>
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${card.image_url}')` }}
                />
                {/* Gradient: transparent top → cream bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/30 to-transparent" />

                {/* Rarity badge — top right */}
                <div className="absolute top-16 right-5">
                    <div className="px-3 py-1.5 bg-black/35 backdrop-blur-md rounded-full border border-white/15">
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#C4974A]">
                            {card.rarity || 'Comune'}
                        </span>
                    </div>
                </div>

                {/* Title overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
                    <div className="flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3 h-3 text-[#C4974A]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#C4974A]">
                            {card.city || 'Puglia'}
                        </span>
                    </div>
                    <h1 className="text-[40px] sm:text-[46px] font-serif font-black text-zinc-900 leading-[0.9] tracking-tighter">
                        {displayTitle}
                    </h1>
                </div>
            </div>

            {/* Body */}
            <main className="px-5 pb-28 max-w-xl mx-auto">

                {/* Meta row */}
                <div className="flex flex-wrap gap-2 mt-5 mb-10">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-black/5 shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.18em]">Sbloccata</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-black/5 shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-[9px] font-bold text-zinc-500">{unlockedDate}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-black/5 shadow-sm">
                        <Star className="w-3 h-3 text-[#C4974A]" fill="currentColor" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.18em]">{globalRarity}</span>
                    </div>
                </div>

                {/* La Storia */}
                {historyText && (
                    <section className="mb-12">
                        <p className="text-[9px] font-black uppercase tracking-[0.38em] text-[#C4974A] mb-5">La Storia</p>
                        <div className="text-zinc-700 leading-[1.85] text-[16px] font-serif text-justify">
                            <span className="float-left text-[64px] font-black text-[#C4974A] mr-3 leading-[0.72] font-serif">
                                {firstLetter}
                            </span>
                            {restOfText}
                        </div>
                    </section>
                )}

                {/* Divider */}
                {historyText && curiosityItems.length > 0 && (
                    <div className="flex items-center gap-4 mb-12">
                        <div className="flex-1 h-px bg-black/6" />
                        <Star className="w-3 h-3 text-[#C4974A]" fill="currentColor" />
                        <div className="flex-1 h-px bg-black/6" />
                    </div>
                )}

                {/* Curiosità */}
                {curiosityItems.length > 0 && (
                    <section className="mb-12">
                        <p className="text-[9px] font-black uppercase tracking-[0.38em] text-[#C4974A] mb-6">Curiosità & Segreti</p>
                        <div className="space-y-5">
                            {curiosityItems.map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#C4974A]/10 flex items-center justify-center text-[10px] font-black text-[#C4974A] mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <p className="text-[15px] leading-[1.7] text-zinc-600 font-serif italic flex-1">{item}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Audioguida */}
                <section className="mb-12">
                    <p className="text-[9px] font-black uppercase tracking-[0.38em] text-[#C4974A] mb-5">Audioguida</p>
                    <div className="bg-zinc-950 rounded-3xl p-5 border border-white/5 shadow-xl">
                        <div className="flex items-center gap-5">
                            <button
                                onClick={togglePlay}
                                className="shrink-0 w-14 h-14 rounded-full bg-[#C4974A] flex items-center justify-center shadow-lg hover:bg-[#b0863c] transition-all active:scale-95"
                            >
                                {isPlaying
                                    ? <Pause className="w-5 h-5 text-zinc-950" fill="currentColor" />
                                    : <Play className="w-5 h-5 ml-0.5 text-zinc-950" fill="currentColor" />
                                }
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2.5 truncate">
                                    {card.audio_title || 'Racconto del Luogo'}
                                </p>
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#C4974A] rounded-full transition-all duration-300"
                                        style={{ width: `${audioProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-[9px] text-white/25 font-mono">{formatTime(audioCurrentTime)}</span>
                                    {audioDuration > 0 && (
                                        <span className="text-[9px] text-white/25 font-mono">{formatTime(audioDuration)}</span>
                                    )}
                                </div>
                            </div>
                            <Headphones className="w-5 h-5 text-white/15 shrink-0" />
                        </div>

                        {audioTrack && (
                            <audio
                                ref={audioRef}
                                src={audioTrack}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => { setIsPlaying(false); setAudioProgress(0); setAudioCurrentTime(0); }}
                            />
                        )}
                    </div>
                </section>

                {/* Dove si trova */}
                <section className="mb-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.38em] text-[#C4974A] mb-5">Dove si trova</p>
                    <div className="rounded-3xl overflow-hidden border border-black/5 shadow-sm bg-white">
                        {card.gps_lat && card.gps_lng ? (
                            <iframe
                                width="100%"
                                height="180"
                                frameBorder="0"
                                scrolling="no"
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${card.gps_lng - 0.005}%2C${card.gps_lat - 0.005}%2C${card.gps_lng + 0.005}%2C${card.gps_lat + 0.005}&layer=mapnik&marker=${card.gps_lat}%2C${card.gps_lng}`}
                                style={{ border: 0, display: 'block' }}
                                title="Mappa"
                            />
                        ) : (
                            <div className="h-32 flex items-center justify-center bg-zinc-50">
                                <MapPin className="w-6 h-6 text-zinc-300" />
                            </div>
                        )}
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-3.5 h-3.5 text-[#C4974A] shrink-0" />
                                <span className="text-sm font-medium text-zinc-600 italic">
                                    {card.city ? `${card.city}, Puglia` : 'Puglia'}
                                </span>
                            </div>
                            <button
                                onClick={handleOpenMap}
                                className="w-full h-12 bg-zinc-900 rounded-2xl flex items-center justify-center gap-2.5 font-black text-[11px] uppercase tracking-[0.2em] text-[#C4974A] hover:bg-black transition-all active:scale-95"
                            >
                                <Navigation className="w-4 h-4" fill="currentColor" />
                                Visita di Nuovo
                            </button>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}
