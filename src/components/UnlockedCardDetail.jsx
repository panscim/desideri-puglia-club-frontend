import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Share2, Lock, Play, Headphones, MapPin, Star, Sparkles, Navigation } from 'lucide-react';
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

    // Split history text for Drop Cap effect (first letter vs rest)
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



    const startLocation = `${card.city || 'Sconosciuta'}`; // Use real city vs hardcoded "Barletta"
    const globalRarity = card.global_rarity || "Top 5%";

    // Format the date based on language
    const unlockedDate = card.unlockedAt
        ? new Date(card.unlockedAt).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'it-IT', { month: 'short', day: 'numeric', year: 'numeric' })
        : (currentLang === 'en' ? "Just Unlocked" : "Appena Sbloccato");

    // Bright yellow/gold from design
    const accentColor = "#f4c025";

    return (
        <div className="fixed inset-0 z-[9999] bg-[#F9F9F7] overflow-y-auto animate-pop-in font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-[#F9F9F7]/80 backdrop-blur-sm">
                <button onClick={onClose} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-900" />
                </button>
                <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Monument Detail</h2>
                <button className="p-2 -mr-2 hover:bg-black/5 rounded-full transition-colors">
                    <Share2 className="w-6 h-6 text-slate-900" />
                </button>
            </header>

            <main className="pt-24 px-6 pb-12 w-full max-w-lg mx-auto">
                {/* Hero Card */}
                <div className="relative aspect-[4/5] w-full rounded-[2rem] overflow-hidden shadow-2xl mb-6 group">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url('${card.image_url}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Hero Content */}
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <div className="text-[10px] font-bold text-[#f4c025] uppercase tracking-widest mb-2">
                            Ancient Tier
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-1 leading-tight">
                            {displayTitle}
                        </h1>
                        <p className="text-white/80 text-sm font-light">
                            {card.city}, Italy
                        </p>
                    </div>
                </div>

                {/* Collection Unlocked Indicator */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    <Lock className="w-3 h-3 text-[#f4c025]" fill="#f4c025" />
                    <span className="text-[10px] font-bold text-[#f4c025] uppercase tracking-widest">
                        Collection Unlocked
                    </span>
                </div>

                {/* Vertical Line Decoration */}
                <div className="w-1 h-8 bg-[#f4c025] mb-4 rounded-full"></div>

                {/* History Section */}
                {historyText && (
                    <section className="mb-10">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display">The History</h3>
                        <div className="text-slate-600 leading-relaxed text-sm">
                            <span className="float-left text-5xl font-bold text-[#f4c025] mr-3 mt-[-8px] font-serif">
                                {firstLetter}
                            </span>
                            {restOfText}
                        </div>
                    </section>
                )}

                {/* Curiosity Card */}
                {curiosityItems.length > 0 && (
                    <section className="bg-[#f0f0eb] rounded-2xl p-6 mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-[#f4c025]" fill="#f4c025" />
                            <h3 className="text-lg font-bold text-slate-900">Curiosity & Secrets</h3>
                        </div>
                        <ul className="space-y-4">
                            {curiosityItems.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-slate-700 leading-snug">
                                    <div className="mt-0.5 shrink-0">
                                        <div className="w-5 h-5 rounded-full bg-[#f4c025] flex items-center justify-center">
                                            <Star className="w-3 h-3 text-white" fill="white" />
                                        </div>
                                    </div>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Audio Guide */}
                {audioTrack && (
                    <section className="mb-10">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Audio Guide</h3>
                        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                            <button
                                onClick={togglePlay}
                                className="w-12 h-12 rounded-full bg-[#f4c025] flex items-center justify-center shadow-lg shadow-[#f4c025]/30 hover:scale-105 transition-transform shrink-0"
                            >
                                <Play className="w-5 h-5 text-slate-900 ml-1" fill="#1a1a1a" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">{displayTitle}</div>
                                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden relative">
                                    <div className="absolute top-0 left-0 h-full bg-[#f4c025] rounded-full transition-all duration-300" style={{ width: `${audioProgress}%` }}></div>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <Headphones className="w-5 h-5 text-slate-300 ml-auto" />
                            </div>
                            <audio
                                ref={audioRef}
                                src={audioTrack}
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={() => setIsPlaying(false)}
                            />
                        </div>
                    </section>
                )}

                {/* Stats Grid */}
                <section className="mb-10">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Your Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm">
                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">Unlocked On</div>
                            <div className="text-lg font-bold text-slate-900 font-serif">{unlockedDate}</div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm">
                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">Global Rarity</div>
                            <div className="text-lg font-bold text-[#f4c025] font-serif">{globalRarity}</div>
                        </div>
                    </div>
                </section>

                {/* Location Info Card */}
                <section className="bg-[#1a1f2e] rounded-2xl p-1 shadow-2xl">
                    <div className="p-5 pb-2">
                        <h3 className="text-lg font-bold text-white mb-4">Location Info</h3>
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-4 h-4 text-[#f4c025]" />
                            <p className="text-sm text-slate-300">{startLocation}</p>
                        </div>

                        {/* Map Embed or Placeholder */}
                        {card.gps_lat && card.gps_lng ? (
                            <div className="w-full h-32 rounded-xl overflow-hidden relative mb-6 border border-slate-800 pointer-events-none">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight="0"
                                    marginWidth="0"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${card.gps_lng - 0.005}%2C${card.gps_lat - 0.005}%2C${card.gps_lng + 0.005}%2C${card.gps_lat + 0.005}&layer=mapnik&marker=${card.gps_lat}%2C${card.gps_lng}`}
                                    style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(85%)' }}
                                    title="Mappa"
                                ></iframe>
                            </div>
                        ) : (
                            <div className="w-full h-32 bg-slate-800 rounded-xl overflow-hidden relative mb-6 flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-slate-600" />
                            </div>
                        )}

                        <button
                            onClick={handleOpenMap}
                            className="w-full h-14 bg-[#f4c025] rounded-xl flex items-center justify-center gap-2 font-bold text-[#1a1f2e] hover:bg-[#e0b020] transition-colors"
                        >
                            <Navigation className="w-5 h-5" />
                            {currentLang === 'en' ? 'Open Map' : 'Apri Mappa'}
                        </button>
                    </div>
                </section>

                {/* Bottom padding for tab bar */}
                <div className="h-20"></div>
            </main>
        </div>
    );
}
