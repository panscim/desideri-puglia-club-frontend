import { Lock, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistance } from '../utils/geolocation';

export function AlbumCard({ card, onClick, userLocation }) {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'it';
    const displayTitle = currentLang === 'en' && card.title_en ? card.title_en : card.title;

    // Calculate distance if locked and location available
    let distanceLabel = null;
    if (!card.isUnlocked && card.type === 'monument' && userLocation && card.gps_lat && card.gps_lng) {
        // Distance info
    }

    return (
        <div
            onClick={() => onClick(card)}
            className={`
        relative aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer group bg-[var(--bg-surface)] shadow-md
        ${card.isUnlocked ? 'hover:-translate-y-2 hover:shadow-xl' : 'border border-[var(--border)]'}
      `}
        >
            {/* Image Layer - Full bleed for unlocked */}
            <div className={`w-full h-full transition-transform duration-700 ${card.isUnlocked ? 'group-hover:scale-105' : 'grayscale opacity-40 contrast-75'}`}>

                {card.image_url ? (
                    <img
                        src={card.image_url}
                        alt={displayTitle}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-[var(--bg-secondary)] flex flex-col items-center justify-center p-4 border border-[var(--border)] rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none" />
                        <div className="w-12 h-12 rounded-full border border-orange-500/20 bg-[var(--bg-surface)] flex items-center justify-center mb-3 shadow-sm">
                            <Clock className="w-5 h-5 text-orange-500 opacity-90" />
                        </div>
                        <span className="text-orange-500 font-serif font-bold tracking-widest text-center text-[10px] uppercase z-10">
                            Prossimamente
                        </span>
                    </div>
                )}
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
    const { i18n } = useTranslation();
    const currentLang = i18n?.language || 'it';
    const displayTitle = currentLang === 'en' && props.card.title_en ? props.card.title_en : props.card.title;

    if (!props.card.isUnlocked) {
        return <AlbumCard {...props} />;
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <AlbumCard {...props} />
            <div className="text-center px-2">
                <h4 className="font-bold text-[var(--text-primary)] text-[10px] tracking-widest leading-tight mb-1">{displayTitle ? displayTitle.toUpperCase() : ''}</h4>
            </div>
        </div>
    )
}
