import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateDistance, formatDistance } from '../utils/geolocation';
import { MapPin, Lock, X, Navigation, Compass, ShieldAlert } from 'lucide-react';

export function LockedCardDetail({ card, userLocation, onClose, onUnlock, unlocking }) {
    const { t, i18n } = useTranslation();
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

    // Progress logic
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
            const url = `https://www.google.com/maps/dir/?api=1&destination=${card.gps_lat},${card.gps_lng}`;
            window.open(url, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[var(--bg-base)] flex flex-col overflow-y-auto animate-pop-in selection:bg-gold/30">
            {/* 1. EDITORIAL HEADER */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-[var(--bg-base)]/80 backdrop-blur-md px-6">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gold mb-0.5">Tesoro Nascosto</span>
                    <h2 className="text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase italic">In Esplorazione</h2>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm hover:scale-110 transition-all text-zinc-900"
                >
                    <X size={20} />
                </button>
            </header>

            <main className="flex-1 pt-28 px-6 pb-24 max-w-lg mx-auto w-full">

                {/* 2. LOCKED ARCH HERO - Title Inside */}
                <div className="relative group mb-12">
                    {/* Shadow Ring */}
                    <div className="absolute -inset-2 rounded-[2.5rem] bg-gold/5 blur-2xl opacity-50 -z-10 group-hover:opacity-100 transition-opacity" />

                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl">
                        {/* Background Image (Silhouette) */}
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-[4s] group-hover:scale-105"
                            style={{
                                backgroundImage: `url('${card.image_url}')`,
                                filter: 'brightness(0.2) contrast(1.1) grayscale(1)'
                            }}
                        />

                        {/* Heavy Overlay for Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-transparent opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/20 to-transparent" />

                        {/* Padlock Badge */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
                            <div className="w-16 h-16 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-inner group-hover:rotate-[360deg] transition-transform duration-[1.5s]">
                                <Lock className="text-gold w-8 h-8" strokeWidth={1.5} />
                            </div>
                        </div>

                        {/* Info Overlay at Bottom */}
                        <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1 h-1 rounded-full bg-gold animate-ping" />
                                <span className="text-[9px] font-black text-gold uppercase tracking-[0.3em]">
                                    Coordinate Rilevate
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-serif italic text-[var(--text-primary)] mb-6 leading-tight drop-shadow-sm">
                                {displayTitle}
                            </h1>

                            <div className="inline-flex items-center px-4 py-2 bg-zinc-900 text-gold text-[9px] font-black tracking-[0.2em] uppercase rounded-full shadow-lg border border-gold/20 no-theme-flip">
                                Monumento Bloccato
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. DISTANCE FLOW - Modern Glass */}
                <div className="mb-12">
                    {isNearby ? (
                        <div className="text-center animate-bounce-slow mb-6">
                            <div className="inline-flex items-center gap-2 px-6 py-2 bg-green-500/10 border border-green-500/20 text-green-600 rounded-full">
                                <ShieldAlert size={14} className="animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest">Sei arrivato a destinazione</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-serif italic text-[var(--text-primary)] mb-2">Quasi un Desiderio...</h3>
                            <p className="text-[var(--text-muted)] text-[13px] leading-relaxed max-w-[28ch] mx-auto font-medium">
                                Sei a un passo dalla storia. Raggiungi il monumento per aggiungerlo alla tua collezione.
                            </p>
                        </div>
                    )}

                    <div className="p-6 rounded-[2rem] border border-[var(--border)] bg-[var(--bg-surface)] shadow-md relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
                                    <Compass className={`text-gold w-5 h-5 transition-transform duration-1000 ${!isNearby ? 'animate-spin-slow' : ''}`} />
                                </div>
                                <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                                    {distance !== null ? `Mancano ${formatDistance(distance)}` : 'Connessione GPS...'}
                                </span>
                            </div>
                            <span className="text-[9px] font-black text-gold uppercase tracking-widest italic">Target: {unlockRadius}m</span>
                        </div>

                        {/* Elegant Progress Bar */}
                        <div className="h-2.5 w-full bg-[var(--bg-base)] rounded-full overflow-hidden mb-3 border border-[var(--border)]">
                            <div
                                className="h-full bg-gold transition-all duration-[2s] relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            </div>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.1em] text-center italic">
                            {isNearby ? "Soglia Raggiunta: Sblocco Pronto" : "Prosegui l'esplorazione per attivare"}
                        </p>
                    </div>
                </div>

                {/* 4. ACTIONS */}
                <div className="space-y-4">
                    {isNearby ? (
                        <button
                            onClick={onUnlock}
                            disabled={unlocking}
                            className="w-full h-16 rounded-[1.5rem] bg-zinc-900 border border-gold/30 text-gold font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 no-theme-flip active:scale-95"
                        >
                            <ShieldAlert className="w-5 h-5" />
                            {unlocking ? 'Attivazione...' : 'RIVENDICA MEMORIA'}
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenMap}
                            className="w-full h-16 rounded-[1.5rem] bg-gold text-zinc-950 font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-[#e0b020] transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Navigation className="w-5 h-5 fill-current" />
                            Naviga verso il Monumento
                        </button>
                    )}
                </div>

                {/* 5. TEASER - Blurred History */}
                <div className="mt-12 relative">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center no-theme-flip">
                            <Compass size={14} className="text-gold" />
                        </div>
                        <h4 className="font-black text-[10px] tracking-widest uppercase text-zinc-400">Archivio Storico</h4>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-surface)] p-6 border border-[var(--border)]">
                        <div
                            className="text-[var(--text-muted)] text-[13px] leading-relaxed font-medium italic"
                            style={{
                                maskImage: 'linear-gradient(to bottom, black 10%, transparent 80%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 10%, transparent 80%)'
                            }}
                        >
                            {displayDescription}
                            <br /><br />
                            Questo luogo custodisce segreti millenari che solo i veri esploratori possono rivelare. Puglia è una regione di luce e pietra, dove ogni monumento narra una storia di passioni e conquiste.
                        </div>

                        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center">
                            <div className="bg-gold/10 backdrop-blur-md border border-gold/20 px-4 py-2 rounded-full flex items-center gap-2">
                                <Lock size={12} className="text-gold" />
                                <span className="text-[10px] text-gold font-black uppercase tracking-tighter">Sblocca per leggere l'archivio</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
