import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Share2, Lock, Play, Headphones, MapPin, Star, Sparkles, Navigation, Clock, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function UnlockedCardDetail({ card, onClose }) {
    const { i18n } = useTranslation();

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!card) return null;

    const currentLang = i18n.language || 'it';
    const displayTitle = currentLang === 'en' && card.title_en ? card.title_en : card.title;

    // Real data handling
    const historyText = (currentLang === 'en' && card.history_en ? card.history_en : card.history) || '';

    // Split history text for Drop Cap effect
    const firstLetter = historyText ? historyText.charAt(0) : '';
    const restOfText = historyText ? historyText.slice(1) : '';

    const curiosity1 = currentLang === 'en' && card.curiosity1_en ? card.curiosity1_en : card.curiosity1_it;
    const curiosity2 = currentLang === 'en' && card.curiosity2_en ? card.curiosity2_en : card.curiosity2_it;
    const curiosity3 = currentLang === 'en' && card.curiosity3_en ? card.curiosity3_en : card.curiosity3_it;

    let curiosityItems = [curiosity1, curiosity2, curiosity3].filter(Boolean);

    const audioTrack = currentLang === 'en' ? (card.audio_track_en || null) : (card.audio_track || null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const [audioProgress, setAudioProgress] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const { currentTime, duration } = audioRef.current;
            if (duration) {
                setAudioProgress((currentTime / duration) * 100);
            }
        }
    };

    const handleOpenMap = () => {
        if (card.gps_lat && card.gps_lng) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${card.gps_lat},${card.gps_lng}`;
            window.open(url, '_blank');
        } else if (card.city) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.city)}`, '_blank');
        }
    };

    const startLocation = `${card.city || 'Sconosciuta'}`;
    const globalRarity = card.global_rarity || "Top 5%";

    const unlockedDate = card.unlockedAt
        ? new Date(card.unlockedAt).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'it-IT', { month: 'long', day: 'numeric', year: 'numeric' })
        : (currentLang === 'en' ? "Just Unlocked" : "Appena Sbloccato");

    return (
        <div className="fixed inset-0 z-[9999] bg-[#FAF7F2] overflow-y-auto animate-pop-in font-sans selection:bg-gold/30">
            {/* 1. MINIMALIST HEADER */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-[#FAF7F2]/80 backdrop-blur-md px-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center hover:scale-105 transition-all text-zinc-900 border border-black/5 rounded-full bg-white shadow-sm z-50"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-[14px] font-serif font-black italic text-zinc-400 leading-none">Archivio Personale</h2>
                </div>
                <button className="w-10 h-10 flex items-center justify-center hover:scale-105 transition-all text-zinc-900 border border-black/5 rounded-full bg-white shadow-sm z-50">
                    <Share2 className="w-5 h-5" />
                </button>
            </header>

            <main className="pt-24 px-6 pb-20 w-full max-w-xl mx-auto">
                {/* 2. PREMIUM HERO SECTION - EDITORIAL ARCH */}
                <div className="relative mb-12">
                    <div className="relative aspect-[4/5] w-full rounded-t-[12rem] rounded-b-[2rem] overflow-hidden shadow-2xl border-4 border-white transition-transform duration-700">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-[3s] group-hover:scale-110"
                            style={{ backgroundImage: `url('${card.image_url}')` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    </div>
                </div>

                {/* 3. STYLIZED HERO CONTENT */}
                <div className="px-5 mb-12 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="h-[1px] w-8 bg-[#D4793A] opacity-30" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4793A]">
                            {card.rarity || 'Ancient Tier'}
                        </span>
                        <div className="h-[1px] w-8 bg-[#D4793A] opacity-30" />
                    </div>

                    <h1 className="text-[42px] sm:text-[48px] font-serif font-black text-zinc-900 leading-[0.9] mb-4 tracking-tighter">
                        {displayTitle}
                    </h1>

                    <div className="flex items-center justify-center gap-2 text-zinc-500 font-bold italic">
                        <MapPin className="w-4 h-4 text-[#D4793A] shrink-0" />
                        <span className="text-sm tracking-tight">{card.city}, Puglia</span>
                    </div>
                </div>

                {/* COLLECTION UNLOCKED Status */}
                <div className="flex items-center justify-center gap-2 mb-14 bg-emerald-50 py-3 rounded-full border border-emerald-100 w-full max-w-[280px] mx-auto shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] font-sans">Proprietà Verificata</span>
                </div>

                {/* 4. STORY SECTION */}
                {historyText && (
                    <section className="mb-14 relative px-2">
                        <div className="flex items-center gap-3 mb-8">
                           <div className="relative">
                                <h3 className="text-[28px] font-serif font-black text-zinc-900 tracking-tighter relative z-10 first-letter:uppercase pr-4">La Storia</h3>
                                <div className="absolute left-0 bottom-1 w-full h-3 bg-[#D4793A]/10 -z-0 -rotate-1" />
                           </div>
                        </div>

                        <div className="relative">
                            <div className="text-zinc-800 leading-[1.8] text-[17px] font-medium font-serif italic text-justify">
                                <span className="float-left text-6xl font-black text-[#C4974A] mr-4 mt-1 leading-[0.7] drop-shadow-sm">
                                    {firstLetter}
                                </span>
                                {restOfText}
                            </div>
                        </div>
                    </section>
                )}

                {/* 5. CURIOSITY SECTION - Editorial Style */}
                {curiosityItems.length > 0 && (
                    <section className="mb-14">
                        <div className="bg-white rounded-[3rem] p-10 border border-black/5 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-10">
                                <Sparkles className="w-8 h-8 text-[#D4793A]" />
                                <h3 className="text-[28px] font-serif font-black text-zinc-900 tracking-tighter lowercase first-letter:uppercase leading-none">Curiosità e Segreti</h3>
                            </div>

                            <div className="space-y-8">
                                {curiosityItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-5 group">
                                        <div className="shrink-0 pt-1">
                                            <div className="w-6 h-6 rounded-full bg-[#D4793A]/5 flex items-center justify-center text-[#D4793A] group-hover:scale-110 transition-transform">
                                                <Star className="w-3.5 h-3.5" fill="currentColor" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[15px] leading-relaxed text-zinc-600 font-medium font-serif italic">
                                                {item}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 6. AUDIO GUIDE - Leather/Premium Style */}
                <section className="mb-14">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="relative">
                            <h3 className="text-[28px] font-serif font-black text-zinc-900 tracking-tighter relative z-10 first-letter:uppercase pr-4">Audioguida</h3>
                            <div className="absolute left-0 bottom-1 w-full h-3 bg-accent/15 -z-0 -rotate-1" />
                        </div>
                    </div>

                    <div className="bg-zinc-900 rounded-[2.5rem] p-8 flex items-center gap-8 shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-5 pointer-events-none" />
                        
                        <button
                            onClick={togglePlay}
                            className="w-16 h-16 rounded-full bg-[#C4974A] text-zinc-950 flex items-center justify-center shadow-lg shadow-[#C4974A]/20 hover:scale-105 transition-transform z-10 no-theme-flip active:scale-95"
                        >
                            {isPlaying ? (
                                <div className="flex gap-1.5 items-center">
                                    <motion.div animate={{ height: [12, 20, 12] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 bg-zinc-950 rounded-full" />
                                    <motion.div animate={{ height: [20, 12, 20] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 bg-zinc-950 rounded-full" />
                                    <motion.div animate={{ height: [12, 18, 12] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 bg-zinc-950 rounded-full" />
                                </div>
                            ) : (
                                <Play className="w-7 h-7 ml-1" fill="currentColor" />
                            )}
                        </button>

                        <div className="flex-1 z-10">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase text-[#C4974A]/80 tracking-[0.2em]">{card.audio_title || "L'Eredità dell'Imperatore"}</span>
                                <span className="text-[10px] font-bold text-white/40 font-mono tracking-tighter">4:22</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#C4974A] rounded-full"
                                    style={{ width: `${audioProgress}%` }}
                                    transition={{ type: "spring", stiffness: 50 }}
                                />
                            </div>
                        </div>
                        <Headphones className="w-6 h-6 text-white/20 mr-2 hidden sm:block" />

                        {audioTrack && (
                            <audio
                                ref={audioRef}
                                src={audioTrack}
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={() => setIsPlaying(false)}
                            />
                        )}
                    </div>
                </section>

                {/* 7. STATS - Editorial Box */}
                <section className="mb-14">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="bg-white border border-black/5 p-8 rounded-[3rem] shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                            <Clock className="w-6 h-6 text-zinc-300 mb-4" />
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 leading-none">Data Scatola</span>
                            <div className="text-[15px] font-serif font-black text-zinc-900 tracking-tight lowercase first-letter:uppercase">{unlockedDate}</div>
                        </div>
                        <div className="bg-zinc-900 p-8 rounded-[3rem] shadow-2xl flex flex-col items-center text-center relative overflow-hidden border border-white/5 no-theme-flip">
                            <Star className="w-6 h-6 text-[#C4974A] mb-4" fill="currentColor" />
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 leading-none">Rarità Globale</span>
                            <div className="text-[20px] font-serif font-black text-[#C4974A] tracking-tight lowercase first-letter:uppercase no-theme-flip">{globalRarity}</div>
                        </div>
                    </div>
                </section>

                {/* 8. LOCATION INFO - Dark Bento Style */}
                <section className="mb-14">
                    <div className="bg-[#1a1c22] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border border-white/5">
                        <h3 className="text-[1.8rem] font-black text-white tracking-tighter lowercase first-letter:uppercase leading-none mb-8">Location Info</h3>

                        <div className="flex items-start gap-3 mb-6">
                            <MapPin className="w-4 h-4 text-[#C4974A] shrink-0 mt-0.5" />
                            <p className="text-sm text-white/80 font-medium italic">Piazza Castello, 76121 Barletta BT, Italy</p>
                        </div>

                        {/* Map Container */}
                        <div className="w-full h-40 rounded-2xl overflow-hidden relative mb-6 border border-white/5 bg-sky-200">
                            {card.gps_lat && card.gps_lng ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${card.gps_lng - 0.005}%2C${card.gps_lat - 0.005}%2C${card.gps_lng + 0.005}%2C${card.gps_lat + 0.005}&layer=mapnik&marker=${card.gps_lat}%2C${card.gps_lng}`}
                                    style={{ border: 0 }}
                                    title="Mappa"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <MapPin className="w-8 h-8 text-sky-400" />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleOpenMap}
                            className="w-full h-14 bg-[#C4974A] rounded-2xl flex items-center justify-center gap-3 font-bold text-[14px] text-zinc-950 shadow-xl shadow-[#C4974A]/20 hover:bg-[#b0863c] transition-all active:scale-95"
                        >
                            <Navigation className="w-5 h-5" fill="currentColor" /> Visit Again
                        </button>
                    </div>
                </section>


                <div className="h-10"></div>
            </main>
        </div>
    );
}
