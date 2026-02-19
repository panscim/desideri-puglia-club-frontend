import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Search, Grid, Filter, Lock, Unlock, Zap, X } from 'lucide-react';

// ... (keep previous imports)

// ... inside Album component ...

{/* Card Detail Modal */ }
{
    selectedCard && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4" onClick={() => setSelectedCard(null)}>
            <div
                className="relative max-w-sm w-full bg-[#F9F9F7] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={() => setSelectedCard(null)}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-colors"
                >
                    <X size={18} strokeWidth={2.5} />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">

                    {/* Full Card Image */}
                    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg mb-6 group">
                        <img
                            src={selectedCard.image_url}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            alt={selectedCard.title}
                        />
                        {/* Rarity Badge */}
                        <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-black/80 backdrop-blur text-white border border-white/10 shadow-lg`}>
                            {selectedCard.rarity === 'legendary' ? 'Leggendaria' : selectedCard.rarity === 'rare' ? 'Epica' : 'Comune'}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-serif font-bold text-olive-dark mb-1 leading-tight">{selectedCard.title}</h2>
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-gold uppercase tracking-widest">
                            <MapPin size={12} />
                            {selectedCard.city}
                        </div>
                    </div>

                    <div className="prose prose-sm text-olive-light leading-relaxed mb-8 text-center px-2">
                        {selectedCard.description}
                    </div>

                    <LockedCardContent
                        card={selectedCard}
                        location={location}
                        onUnlock={() => handleGpsUnlock(selectedCard)}
                        unlocking={unlocking}
                        onEnterPin={() => {
                            setSelectedCard(null);
                            setShowPinModal(true);
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
        </div >
    );
}


function LockedCardContent({ card, location, onEnterPin, onUnlock, unlocking }) {
    if (card.type === 'monument') {
        const dist = location ? calculateDistance(location.lat, location.lng, card.gps_lat, card.gps_lng) : null;

        // Manual Unlock Logic: If within 50m (or card radius), show button
        const radius = card.gps_radius || 50;
        const isNearby = dist !== null && dist <= radius;

        if (isNearby) {
            return (
                <button
                    onClick={onUnlock}
                    disabled={unlocking}
                    className="w-full py-4 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-600/30 hover:bg-green-500 transition-all flex items-center justify-center gap-2 animate-bounce"
                >
                    <MapPin className="w-5 h-5" />
                    {unlocking ? 'Sblocco in corso...' : 'SEI QUI! SBLOCCA ORA'}
                </button>
            )
        }

        return (
            <div className="p-4 bg-stone-100 rounded-xl border border-stone-200 text-center">
                <p className="text-stone-500 text-sm mb-1">Raggiungi questo luogo per sbloccare</p>
                <p className="text-lg font-bold text-olive-dark">{formatDistance(dist || 999999)}</p>
                <p className="text-xs text-stone-400 mt-1">Avvicinati a meno di 50m</p>

                {/* DEBUG INFO - DA RIMUOVERE DOPO */}
                <div className="mt-4 p-2 bg-black/5 rounded text-[10px] font-mono text-left opacity-70">
                    <p><strong>DEBUG GPS:</strong></p>
                    <p>Tu: {location?.lat?.toFixed(5)}, {location?.lng?.toFixed(5)} (±{location?.accuracy?.toFixed(0)}m)</p>
                    <p>Card: {card.gps_lat?.toFixed(5)}, {card.gps_lng?.toFixed(5)}</p>
                    <p>Dist: {dist?.toFixed(0)} m</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="bg-slate-50 text-slate-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium border border-slate-100">
                <Lock className="w-5 h-5 shrink-0" />
                Richiedi il codice al partner.
            </div>
            <button
                onClick={onEnterPin}
                className="w-full py-3 rounded-xl bg-gold text-white font-bold shadow-lg hover:bg-gold/90 transition-all flex items-center justify-center gap-2"
            >
                <Zap className="w-4 h-4" />
                Inserisci PIN ora
            </button>
        </div>
    );
}
