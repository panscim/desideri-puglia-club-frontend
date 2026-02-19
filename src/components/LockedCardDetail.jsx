import React, { useEffect, useState } from 'react';

import { calculateDistance, formatDistance } from '../utils/geolocation';
import { MapPin, Lock, X, Navigation } from 'lucide-react';

export function LockedCardDetail({ card, userLocation, onClose, onUnlock, unlocking }) {
    // const { t } = useTranslation(); // Unused
    const [distance, setDistance] = useState(null);

    useEffect(() => {
        if (userLocation && card.gps_lat && card.gps_lng) {
            const d = calculateDistance(userLocation.lat, userLocation.lng, card.gps_lat, card.gps_lng);
            setDistance(d);
        }
    }, [userLocation, card]);

    // Format distance: if < 1000m show m, else km
    // const distanceText = distance !== null ? formatDistance(distance) : '...'; // Unused, logic inline

    // Unlock threshold
    const unlockRadius = card.gps_radius || 50;
    const isNearby = distance !== null && distance <= unlockRadius;

    // Fake progress for distance (clamp between 5% and 100%)
    const maxRange = 2000; // 2km
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
        <div className="fixed inset-0 z-[100] bg-stone-950 flex flex-col overflow-y-auto animate-pop-in">
            {/* Header */}
            <header className="flex items-center justify-between px-6 pt-8 pb-4">
                <div className="flex-1">
                    <h2 className="text-sm font-semibold tracking-widest uppercase text-gold/80 font-sans">Monumenti Vicini</h2>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                    <X size={24} />
                </button>
            </header>

            <main className="flex-1 px-6 pb-24">
                {/* Main Title */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold leading-tight tracking-tight text-white font-serif">
                        {card.title}
                    </h1>
                    <p className="text-stone-400 text-sm mt-1">Collezione Storica</p>
                </div>

                {/* Locked Card Hero */}
                <div className="relative group mb-8">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gold/20 blur-[60px] rounded-full -z-10 mx-auto w-2/3 h-2/3 top-1/2 -translate-y-1/2"></div>

                    <div className="relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-xl border-2 border-gold/30 bg-black/40 shadow-2xl">
                        {/* Background Image (Silhouette) */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url('${card.image_url}')`,
                                filter: 'brightness(0.2) contrast(1.2) grayscale(1)' // Silhouette effect
                            }}
                        >
                        </div>

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>

                        {/* Padlock Centerpiece */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4 backdrop-blur-sm">
                                <Lock className="text-gold w-10 h-10" strokeWidth={1.5} />
                            </div>
                            <span className="px-3 py-1 bg-gold text-stone-900 text-[10px] font-bold tracking-widest uppercase rounded-full shadow-lg shadow-gold/20">
                                Bloccato
                            </span>
                        </div>
                    </div>
                </div>

                {/* Call to Action or Unlock Button */}
                <div className="mt-4 text-center">
                    {isNearby ? (
                        <>
                            <h3 className="text-xl font-bold text-gold mb-2 animate-pulse">Sei arrivato!</h3>
                            <button
                                onClick={onUnlock}
                                disabled={unlocking}
                                className="w-full py-4 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-600/30 hover:bg-green-500 transition-all flex items-center justify-center gap-2 animate-bounce"
                            >
                                <MapPin className="w-5 h-5" />
                                {unlocking ? 'Attivazione...' : 'SBLOCCA ORA'}
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold text-white mb-2 font-serif">Sblocca questo Monumento</h3>
                            <p className="text-stone-400 text-sm leading-relaxed px-4">
                                Sei troppo lontano per consultare questa card storica. Raggiungi il monumento per aggiungerlo alla tua collezione.
                            </p>
                        </>
                    )}
                </div>

                {/* Distance Tracking Module */}
                <div className="mt-8 p-5 rounded-xl border border-gold/10 bg-white/5 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Navigation className="text-gold w-5 h-5 transform rotate-45" />
                            <span className="font-bold text-white">
                                {distance !== null ? `Sei a ${formatDistance(distance)}` : 'Calcolo posizione...'}
                            </span>
                        </div>
                        <span className="text-xs text-stone-500 font-medium tracking-wide">Target: {unlockRadius}m</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-gold shadow-[0_0_10px_rgba(214,167,93,0.5)] transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-[11px] text-stone-500 italic text-center">
                        {isNearby ? "Soglia raggiunta! Puoi sbloccare." : "Cammina verso il monumento per attivare lo sblocco"}
                    </p>
                </div>

                {/* Teaser Content */}
                <div className="mt-8 relative">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-gold text-lg">history_edu</span>
                        <h4 className="font-bold text-sm tracking-wide uppercase text-stone-300">Curiosità Storica</h4>
                    </div>

                    {/* Blurred Text Effect */}
                    <div
                        className="text-stone-400 text-sm leading-relaxed relative"
                        style={{
                            maskImage: 'linear-gradient(to bottom, black 20%, transparent 90%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 90%)'
                        }}
                    >
                        {card.description}
                        <br /><br />
                        {/* Fake extra text to ensure fade looks good if description is short */}
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </div>

                    <div className="text-center py-2 absolute bottom-0 left-0 right-0">
                        <p className="text-xs text-gold font-semibold flex items-center justify-center gap-1">
                            <Lock size={12} />
                            Sblocca per leggere il resto
                        </p>
                    </div>
                </div>

                {/* Map Action */}
                <div className="mt-6">
                    <button
                        onClick={handleOpenMap}
                        className="w-full bg-gold hover:bg-[#c5964a] text-stone-900 h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-gold/20"
                    >
                        <MapPin className="w-5 h-5" />
                        Vedi sulla Mappa
                    </button>
                </div>
            </main>
        </div>
    );
}
