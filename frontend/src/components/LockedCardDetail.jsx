import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateDistance, formatDistance } from '../utils/geolocation';
import { MapPin, Lock, X, Navigation, Compass, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export function LockedCardDetail({ card, userLocation, onClose, onUnlock, unlocking }) {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || 'it';
    const displayTitle = currentLang === 'en' && card.title_en ? card.title_en : card.title;
    const displayDescription = currentLang === 'en' && card.description_en ? card.description_en : card.description;

    const [distance, setDistance] = useState(null);

    useEffect(() => {
        if (userLocation && card.gps_lat && card.gps_lng) {
            const d = calculateDistance(userLocation.lat, userLocation.lng, card.gps_lat, card.gps_lng);
            setDistance(d);
        }
    }, [userLocation, card]);

    const unlockRadius = card.gps_radius || 50;
    const isNearby = distance !== null && distance <= unlockRadius;

    const maxRange = 2000;
    let progress = 5;
    if (distance !== null) {
        if (distance <= unlockRadius) {
            progress = 100;
        } else {
            const rawProgress = 100 - ((distance - unlockRadius) / (maxRange - unlockRadius)) * 100;
            progress = Math.max(5, Math.min(95, rawProgress));
        }
    }

    const handleOpenMap = () => {
        if (card.gps_lat && card.gps_lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${card.gps_lat},${card.gps_lng}`, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#FAF7F2] flex flex-col overflow-y-auto font-sans">

            {/* Floating close */}
            <button
                onClick={onClose}
                className="fixed top-5 right-5 z-50 w-11 h-11 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-black/8 shadow-md text-zinc-800 hover:scale-105 transition-all active:scale-95"
            >
                <X size={18} />
            </button>

            {/* Hero — dark atmospheric */}
            <div className="relative w-full shrink-0" style={{ height: '55vh', minHeight: 300, maxHeight: 460 }}>
                {/* Darkened image */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url('${card.image_url}')`,
                        filter: 'brightness(0.12) contrast(1.3) saturate(0.2)'
                    }}
                />
                {/* Gradient to cream at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-transparent to-transparent" />

                {/* Floating lock icon center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pb-16">
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl mb-4"
                    >
                        <Lock className="w-9 h-9 text-[#C4974A]" strokeWidth={1.5} />
                    </motion.div>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/35">Tesoro Nascosto</span>
                </div>

                {/* Title at bottom of hero */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <MapPin className="w-3 h-3 text-[#C4974A]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#C4974A]">
                            {card.city || 'Luogo Segreto'}
                        </span>
                    </div>
                    <h1 className="text-[38px] font-serif font-black text-zinc-900 leading-[0.92] tracking-tighter">
                        {displayTitle}
                    </h1>
                </div>
            </div>

            {/* Body */}
            <main className="flex-1 px-5 pb-24 max-w-lg mx-auto w-full pt-6">

                {/* Status */}
                {isNearby ? (
                    <div className="flex items-center gap-2.5 mb-6 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">
                            Sei arrivato — sblocca ora
                        </span>
                    </div>
                ) : (
                    <div className="mb-6">
                        <h3 className="text-[20px] font-serif font-black text-zinc-900 tracking-tight mb-1">
                            Raggiungi il luogo
                        </h3>
                        <p className="text-[13px] text-zinc-500 leading-relaxed">
                            Avvicinati al monumento per aggiungere questa card alla tua collezione.
                        </p>
                    </div>
                )}

                {/* Distance card */}
                <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm mb-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#C4974A]/10 rounded-xl flex items-center justify-center">
                                <Compass
                                    className="w-5 h-5 text-[#C4974A]"
                                    style={!isNearby ? { animation: 'spin 3s linear infinite' } : {}}
                                />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-0.5">Distanza</p>
                                <p className="text-[15px] font-black text-zinc-900 leading-none">
                                    {distance !== null ? formatDistance(distance) : 'Rilevamento GPS...'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-0.5">Raggio sblocco</p>
                            <p className="text-[15px] font-black text-[#C4974A] leading-none">{unlockRadius} m</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#C4974A] to-[#D4793A] rounded-full transition-all duration-[2s]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.12em] text-center mt-2">
                        {isNearby ? 'Soglia raggiunta' : 'Continua ad avvicinarti'}
                    </p>
                </div>

                {/* CTA */}
                {isNearby ? (
                    <button
                        onClick={onUnlock}
                        disabled={unlocking}
                        className="w-full h-14 rounded-2xl bg-zinc-900 text-[#C4974A] font-black text-[11px] uppercase tracking-[0.28em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 mb-8 disabled:opacity-60"
                    >
                        <ShieldAlert className="w-5 h-5" />
                        {unlocking ? 'Attivazione...' : 'Rivendica Memoria'}
                    </button>
                ) : (
                    <button
                        onClick={handleOpenMap}
                        className="w-full h-14 rounded-2xl bg-[#C4974A] text-zinc-950 font-black text-[11px] uppercase tracking-[0.28em] shadow-xl hover:bg-[#b0863c] transition-all flex items-center justify-center gap-3 active:scale-95 mb-8"
                    >
                        <Navigation className="w-5 h-5" fill="currentColor" />
                        Naviga verso il Monumento
                    </button>
                )}

                {/* Teaser blurred */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.38em] text-[#C4974A] mb-4">Anteprima Storica</p>
                    <div className="relative rounded-2xl bg-white border border-black/5 p-5 overflow-hidden shadow-sm">
                        <div
                            className="text-zinc-500 text-[14px] leading-relaxed font-serif italic"
                            style={{
                                maskImage: 'linear-gradient(to bottom, black 15%, transparent 70%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 15%, transparent 70%)'
                            }}
                        >
                            {displayDescription || 'Questo luogo custodisce segreti millenari che solo i veri esploratori possono rivelare. Raggiungi il monumento per scoprire la storia nascosta dietro queste mura antiche.'}
                        </div>
                        <div className="absolute bottom-0 inset-x-0 flex justify-center pb-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm border border-black/6 rounded-full shadow-sm">
                                <Lock size={10} className="text-[#C4974A]" />
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em]">Sblocca per leggere</span>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
