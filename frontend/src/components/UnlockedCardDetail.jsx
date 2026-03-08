import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Share2, Lock, Play, Headphones, MapPin, Star, Sparkles, Navigation, Clock, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
        <div className="fixed inset-0 z-[9999] bg-[var(--bg-base)] overflow-y-auto animate-pop-in font-sans selection:bg-gold/30">
            {/* 1. MINIMALIST HEADER */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-[var(--bg-base)]/80 backdrop-blur-md px-6">
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center hover:scale-105 transition-all text-[var(--text-primary)]"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-[12px] font-bold tracking-[0.25em] text-[#5c6e8c] uppercase">Monument Detail</h2>
                </div>
                <button className="w-10 h-10 flex items-center justify-center hover:scale-105 transition-all text-[var(--text-primary)]">
                    <Share2 className="w-5 h-5" />
                </button>
            </header>

            <main className="pt-24 px-6 pb-20 w-full max-w-xl mx-auto">
                {/* 2. PREMIUM HERO SECTION - CLEAN IMAGE */}
                <div className="relative mb-8 group">
                    <div className="relative aspect-[4/5] w-[90%] mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-[3s] group-hover:scale-110"
                            style={{ backgroundImage: `url('${card.image_url}')` }}
                        />
                        {/* Very subtle gradient just for depth */}
                        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                    </div>
                </div>

                {/* 3. STYLIZED HERO CONTENT - MISSIONI STYLE */}
                <div className="px-5 mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-[1px] w-8 bg-gold" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">
                            {card.rarity || 'Ancient Tier'}
                        </span>
                    </div>

                    <h1 className="text-[2.8rem] font-black text-[var(--text-primary)] leading-[0.9] mb-4 lowercase first-letter:uppercase tracking-tighter">
                        {displayTitle}
                    </h1>

                    <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium">
                        <MapPin className="w-4 h-4 text-gold shrink-0" weight="fill" />
                        <span className="text-sm tracking-tight">{card.city}, Italy</span>
                    </div>
                </div>

                {/* COLLECTION UNLOCKED Status */}
                <div className="flex items-center justify-center gap-2 mb-14 bg-gold/5 py-3 rounded-2xl border border-gold/10 w-[90%] mx-auto shadow-sm">
                    <Lock className="w-4 h-4 text-gold" fill="currentColor" />
                    <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] font-sans">Collection Unlocked</span>
                </div>

                {/* 4. STORY SECTION - Updated Typography */}
                {historyText && (
                    <section className="mb-14 relative px-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-6 bg-gold rounded-full" />
                            <h3 className="text-[1.8rem] font-black text-[var(--text-primary)] tracking-tighter lowercase first-letter:uppercase leading-none">The History</h3>
                        </div>

                        <div className="relative">
                            <div className="text-[var(--text-primary)] leading-[1.8] text-[16px] font-medium">
                                <span className="float-left text-5xl font-bold text-gold mr-3 mt-1 leading-[0.8] no-theme-flip">
                                    {firstLetter}
                                </span>
                                {restOfText}
                            </div>
                        </div>
                    </section>
                )}

                {/* 5. CURIOSITY SECTION - Bento Style with Beige Background */}
                {curiosityItems.length > 0 && (
                    <section className="mb-14">
                        <div className="bg-[#fdf9f0] rounded-[3rem] p-10 border border-gold/10 shadow-sm">
                            <div className="flex items-center gap-3 mb-10">
                                <Sparkles className="w-6 h-6 text-gold" />
                                <h3 className="text-[1.8rem] font-black text-[var(--text-primary)] tracking-tighter lowercase first-letter:uppercase leading-none">Curiosity & Secrets</h3>
                            </div>

                            <div className="space-y-6">
                                {curiosityItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="shrink-0 pt-1">
                                            <Star className="w-5 h-5 text-gold" fill="currentColor" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[14px] leading-relaxed text-[var(--text-primary)]/80 font-medium">
                                                {item}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 6. AUDIO GUIDE - Updated Style */}
                <section className="mb-14">
                    <h3 className="text-[1.8rem] font-black text-[var(--text-primary)] tracking-tighter lowercase first-letter:uppercase leading-none mb-8 ml-2">Audio Guide</h3>

                    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[2.5rem] p-8 flex items-center gap-8 shadow-sm relative overflow-hidden group">
                        <button
                            onClick={togglePlay}
                            className="w-14 h-14 rounded-full bg-gold text-white flex items-center justify-center shadow-lg shadow-gold/20 hover:scale-105 transition-transform z-10 no-theme-flip"
                        >
                            {isPlaying ? (
                                <div className="flex gap-1 items-center">
                                    <div className="w-1 h-4 bg-black rounded-full animate-pulse" />
                                    <div className="w-1 h-4 bg-black rounded-full" />
                                </div>
                            ) : (
                                <Play className="w-6 h-6 ml-1 text-black" fill="currentColor" />
                            )}
                        </button>

                        <div className="flex-1 z-10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black uppercase text-gold/60 tracking-widest">{card.audio_title || "The Emperor's Legacy"}</span>
                                <span className="text-[10px] font-bold text-[var(--text-muted)]">4:22</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gold rounded-full transition-all duration-300"
                                    style={{ width: `${audioProgress}%` }}
                                />
                            </div>
                        </div>
                        <Headphones className="w-6 h-6 text-gold/40 mr-2" />

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

                {/* 7. STATS - Pure White Style */}
                <section className="mb-14">
                    <h3 className="text-[1.8rem] font-black text-[var(--text-primary)] tracking-tighter lowercase first-letter:uppercase leading-none mb-8 ml-2">Your Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-center">
                            <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">Unlocked On</span>
                            <div className="text-[14px] font-black text-[var(--text-primary)] uppercase tracking-tight">{unlockedDate}</div>
                        </div>
                        <div className="bg-[var(--bg-surface)] border border-[var(--border)] p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-center text-on-image !bg-zinc-950 !border-white/5 no-theme-flip">
                            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Global Rarity</span>
                            <div className="text-[18px] font-black text-gold no-theme-flip tracking-tighter uppercase">{globalRarity}</div>
                        </div>
                    </div>
                </section>

                {/* 8. LOCATION INFO - Dark Bento Style */}
                <section className="mb-14">
                    <div className="bg-[#1a1c22] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border border-white/5">
                        <h3 className="text-[1.8rem] font-black text-white tracking-tighter lowercase first-letter:uppercase leading-none mb-8">Location Info</h3>

                        <div className="flex items-start gap-3 mb-6">
                            <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                            <p className="text-sm text-white/80 font-medium">Piazza Castello, 76121 Barletta BT, Italy</p>
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
                            className="w-full h-14 bg-gold rounded-2xl flex items-center justify-center gap-3 font-bold text-[14px] text-black shadow-xl shadow-gold/20 hover:bg-[#e0b020] transition-all active:scale-95"
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
