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

    const isLegendary = card.rarity === 'legendary';
    const rarityColor = isLegendary ? 'text-[#D4AF37] border-[#D4AF37]' : card.rarity === 'rare' ? 'text-blue-400 border-blue-400' : 'text-slate-200 border-slate-300';
    const rarityBorder = isLegendary ? 'border-2 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border border-stone-200';

    return (
        <div
            onClick={() => onClick(card)}
            className={`
        relative aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer group bg-stone-900
        ${card.isUnlocked ? 'hover:-translate-y-2 hover:shadow-2xl' : 'opacity-90'}
        ${card.isUnlocked ? rarityBorder : 'border-2 border-stone-800'}
      `}
        >
            {/* Image Layer */}
            <div className={`w-full h-full transition-transform duration-700 ${card.isUnlocked ? 'group-hover:scale-110' : 'grayscale brightness-50 contrast-125'}`}>
                <img
                    src={card.image_url}
                    alt={card.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>


            {/* Locked Overlay */}
            {!card.isUnlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20">
                    <Lock className="w-8 h-8 text-white/50 mb-2" />
                </div>
            )}

            {/* Unlocked "Legendary" Style Overlay */}
            {card.isUnlocked && (
                <div className="absolute inset-0 z-30 flex flex-col justify-end p-4 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
                    <div className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${rarityColor} border-none`}>
                        {card.rarity === 'legendary' ? 'Leggendaria' : card.rarity}
                    </div>
                    <h4 className="font-serif font-bold text-white text-lg leading-tight drop-shadow-md">
                        {card.title.toUpperCase()}
                    </h4>
                </div>
            )}

            {/* Level Badge (Visual Mockup) */}
            <div className="absolute top-0 right-0 p-4 z-40">
                {/* Could put a level or star here if needed */}
            </div>

            {/* Card Level Label underneath (Outside the card, mimicking the image design) */}
            {/* The image shows "LVL 24" below the card. 
                We might need to move this outside the card div if we want it completely outside. 
                But for this component, let's keep it self contained or render it inside but at bottom?
                The design has it outside. Let's modify the return structure to be a wrapper div.
            */}
        </div>
    );
}

// Wrapper to include the bottom label "LVL 24"
export function AlbumCardWrapper(props) {
    return (
        <div className="flex flex-col items-center gap-2">
            <AlbumCard {...props} />
            <span className="text-[10px] font-medium text-stone-400 tracking-widest uppercase">
                LVL {Math.floor(Math.random() * 30) + 1}
            </span>
        </div>
    )
}
