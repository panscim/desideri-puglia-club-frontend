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

    return (
        <div
            onClick={() => onClick(card)}
            className={`
        relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm transition-all duration-300 cursor-pointer group
        ${card.isUnlocked ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-80 grayscale hover:grayscale-0'}
      `}
        >
            {/* Image Layer */}
            <img
                src={card.image_url}
                alt={card.title}
                className="w-full h-full object-cover"
                loading="lazy"
            />

            {/* Rarity Border */}
            <div className={`absolute inset-0 border-4 rounded-xl z-10 pointer-events-none 
        ${card.rarity === 'legendary' ? 'border-amber-400' : card.rarity === 'rare' ? 'border-blue-400' : 'border-slate-300'}
      `} />

            {/* Locked Overlay */}
            {!card.isUnlocked && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 text-center z-20 backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 backdrop-blur-sm">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-xs font-bold uppercase tracking-widest">
                        {card.type === 'monument' ? 'Cerca' : 'Visita'}
                    </span>
                </div>
            )}

            {/* Info Label (Visible on hover or always if unlocked) */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10 text-white z-30">
                <h4 className="font-bold text-sm leading-tight line-clamp-2">{card.title}</h4>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] uppercase tracking-wide opacity-80">{card.city}</span>
                    {card.isUnlocked && (
                        <span className="text-[10px] font-mono bg-white/20 px-1.5 rounded text-white/90">
                            #{card.id.slice(0, 4)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
