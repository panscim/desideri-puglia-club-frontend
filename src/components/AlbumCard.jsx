import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistance } from '../utils/geolocation';

export function AlbumCard({ card, onClick, userLocation }) {
    const { t } = useTranslation();

    // Calculate distance if locked and location available
    let distanceLabel = null;
    if (!card.isUnlocked && card.type === 'monument' && userLocation && card.gps_lat && card.gps_lng) {
        // We calculate distance in the parent or here. Let's assume parent passes it or we calculate it.
        // For simplicity, let's assume the parent might pass a 'distance' prop if already calculated, 
        // or we rely on the formatting utility if we had the raw number.
        // But wait, we don't have the raw number here easily without importing logic.
        // Let's just show "Locked" for now or use a simple prop if passed.
    }

    // Simplified: No borders for unlocked cards, just full image.
    // Locked cards still get the "Locked" look.

    return (
        <div
            onClick={() => onClick(card)}
            className={`
        relative aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer group bg-stone-900 shadow-lg
        ${card.isUnlocked ? 'hover:-translate-y-2 hover:shadow-2xl' : 'opacity-90 border-2 border-stone-800'}
      `}
        >
            {/* Image Layer - Full bleed for unlocked */}
            <div className={`w-full h-full transition-transform duration-700 ${card.isUnlocked ? 'group-hover:scale-105' : 'grayscale brightness-50 contrast-125'}`}>
                <img
                    src={card.image_url}
                    alt={card.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>

            {/* Locked Overlay ONLY */}
            {!card.isUnlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20">
                    <Lock className="w-8 h-8 text-white/50 mb-2" />
                </div>
            )}

            {/* Visual shine effect for unlocked cards (optional, subtle) */}
            {card.isUnlocked && (
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            )}
        </div>
    );
}

// Wrapper to include the bottom label "LVL 24" - Kept as requested by design 
export function AlbumCardWrapper(props) {
    if (!props.card.isUnlocked) {
        return <AlbumCard {...props} />;
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <AlbumCard {...props} />
            <div className="text-center">
                <h4 className="font-serif font-bold text-olive-dark text-xs leading-tight mb-1">{props.card.title.toUpperCase()}</h4>
                <span className="text-[10px] font-medium text-gold tracking-widest uppercase">
                    LVL {Math.floor(Math.random() * 30) + 1}
                </span>
            </div>
        </div>
    )
}
