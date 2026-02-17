import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { X } from 'lucide-react';

export function UnlockOverlay({ card, onClose }) {
    useEffect(() => {
        // Auto close after 5 seconds
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!card) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.5, y: 100 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="relative max-w-sm w-full bg-white rounded-3xl p-1 shadow-2xl overflow-visible"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Confetti / Rayburst Effect (CSS) */}
                    <div className="absolute inset-0 -z-10 bg-gold blur-3xl opacity-50 animate-pulse rounded-full" />

                    <button
                        onClick={onClose}
                        className="absolute -top-4 -right-4 bg-white text-olive-dark p-2 rounded-full shadow-lg z-20 hover:scale-110 transition-transform"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="bg-white rounded-[20px] overflow-hidden">
                        <div className="bg-gold text-white text-center py-2 font-bold uppercase tracking-widest text-sm animate-pulse">
                            Nuova Figurina!
                        </div>
                        <motion.img
                            src={card.image_url}
                            alt={card.title}
                            className="w-full aspect-square object-cover"
                            initial={{ filter: "brightness(1.5)" }}
                            animate={{ filter: "brightness(1)" }}
                            transition={{ duration: 1 }}
                        />
                        <div className="p-6 text-center">
                            <h2 className="text-2xl font-serif font-bold text-olive-dark mb-1">{card.title}</h2>
                            <p className="text-gold font-bold uppercase text-xs tracking-wider mb-4">{card.city}</p>
                            <div className="inline-block px-3 py-1 bg-sand/30 rounded-full text-olive-dark text-xs font-semibold">
                                +{card.points_value || 100} Punti
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
