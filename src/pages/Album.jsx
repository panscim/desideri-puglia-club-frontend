import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Compass, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AlbumService } from '../services/album';
import { useGeolocation } from '../hooks/useGeolocation';
import { AlbumCardWrapper as AlbumCard } from '../components/AlbumCard';
import { UnlockOverlay } from '../components/UnlockOverlay';
import { UnlockedCardDetail } from '../components/UnlockedCardDetail';
import { LockedCardDetail } from '../components/LockedCardDetail';
import { toast } from 'react-hot-toast';

export default function Album() {
    const { t } = useTranslation();
    const { location, startWatching } = useGeolocation();

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    // Selected card for details
    const [selectedCard, setSelectedCard] = useState(null);

    // PIN Modal
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinCode, setPinCode] = useState('');
    const [unlocking, setUnlocking] = useState(false);

    // 1. Initial Load
    useEffect(() => {
        loadCards();
        startWatching();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadCards = async () => {
        try {
            const data = await AlbumService.getAllCards();
            setCards(data);
        } catch (err) {
            console.error(err);
            toast.error('Errore caricamento passaporto');
        } finally {
            setLoading(false);
        }
    };

    // 2. Main Unlock Logic (Confetti)
    const triggerUnlockCelebration = (isLegendary) => {
        if (isLegendary) {
            var duration = 3 * 1000;
            var animationEnd = Date.now() + duration;
            var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

            var randomInRange = (min, max) => Math.random() * (max - min) + min;

            var interval = setInterval(function () {
                var timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);

                var particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        } else {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
        }
    };

    // 3. Filtering and Sorting
    // Categorie Hardcoded per ora, potremmo estrarle dinamicamente dai metadati se presenti
    const categories = [
        { id: 'all', label: 'Tutto' },
        { id: 'castello', label: 'Castelli' },
        { id: 'chiesa', label: 'Chiese' },
        { id: 'statua', label: 'Statue' },
        { id: 'palazzo', label: 'Palazzi' },
        { id: 'altro', label: 'Altro' }
    ];

    const filteredCards = useMemo(() => {
        return cards.filter(c => {
            if (activeCategory === 'all') return true;

            // Logica semplificata: Cerchiamo la parola chiave nel titolo o descrizione.
            // In un'app reale si userebbe un campo 'category' dedicato nel DB.
            const query = activeCategory.toLowerCase();
            const textToSearch = `${c.title} ${c.description} ${c.categoria || ''}`.toLowerCase();

            if (activeCategory === 'altro') {
                // Escludiamo se contiene le altre parole chiave
                const keywords = ['castell', 'chiesa', 'cattedrale', 'basilica', 'statu', 'monument', 'palazz', 'vill'];
                return !keywords.some(k => textToSearch.includes(k));
            }

            if (query === 'chiesa') return textToSearch.includes('chies') || textToSearch.includes('cattedral') || textToSearch.includes('basilic');
            if (query === 'statua') return textToSearch.includes('statu') || textToSearch.includes('monument');

            return textToSearch.includes(query.replace('o', '').replace('a', '')); // basic stemming
        }).sort((a, b) => {
            const aComingSoon = !a.image_url;
            const bComingSoon = !b.image_url;
            if (aComingSoon && !bComingSoon) return -1;
            if (!aComingSoon && bComingSoon) return 1;

            if (a.isUnlocked && !b.isUnlocked) return -1;
            if (!a.isUnlocked && b.isUnlocked) return 1;

            return a.title?.localeCompare(b.title || '');
        });
    }, [cards, activeCategory]);

    const stats = {
        total: cards.length,
        unlocked: cards.filter(c => c.isUnlocked).length
    };
    const collectionPercentage = stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0;


    // 4. Manual PIN Unlock
    const handlePinSubmit = async (e) => {
        e.preventDefault();
        if (pinCode.length !== 4) return;

        setUnlocking(true);
        const res = await AlbumService.unlockWithPin(pinCode);
        setUnlocking(false);

        if (res.success) {
            triggerUnlockCelebration(res.card.rarity === 'legendary');
            toast.success(`Sbloccato: ${res.card.title}!`, { icon: '🔓' });
            setPinCode('');
            setShowPinModal(false);
            loadCards();
        } else {
            toast.error(res.error);
        }
    };

    // 5. Manual GPS Unlock
    const handleGpsUnlock = async (card) => {
        setUnlocking(true);
        const res = await AlbumService.unlockCard(card.id);
        setUnlocking(false);

        if (res.success) {
            triggerUnlockCelebration(card.rarity === 'legendary');
            toast.success(`Hai sbloccato: ${card.title}!`, { duration: 5000, icon: '🎉' });

            setSelectedCard({
                ...card,
                isUnlocked: true,
                unlockedAt: new Date().toISOString(),
                justUnlocked: true
            });

            loadCards();
        } else {
            toast.error(res.error || 'Errore durante lo sblocco');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0C0D10] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#E4AE2F] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="pb-24 bg-[#0C0D10] min-h-screen font-sans flex flex-col items-center overflow-x-hidden relative">

            {/* Global Ambient Glow */}
            <div className="fixed top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-[#1C1C18] to-transparent pointer-events-none z-0" />

            {/* Unlock Animation Overlay */}
            {selectedCard && selectedCard.justUnlocked && (
                <UnlockOverlay card={selectedCard} onClose={() => setSelectedCard(null)} />
            )}

            <div className="w-full max-w-7xl relative z-10 flex flex-col">

                {/* HEADER & PROGRESS SECTION */}
                <div className="px-6 pt-10 pb-6 shrink-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-[10px] font-bold text-[#E4AE2F] uppercase tracking-[0.3em] mb-1">Passaporto</h4>
                            <h1 className="text-2xl font-serif font-bold text-white tracking-wide">LE TUE SCOPERTE</h1>
                        </div>
                    </div>

                    {/* Progress Card (Premium Dark) */}
                    <div className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 bg-[#1C1C18]">
                        {/* Background Decoration */}
                        <div className="absolute right-0 top-0 bottom-0 w-2/3 opacity-5 pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(circle at center, #E4AE2F 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

                        <div className="relative z-10 p-6 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 mb-1 uppercase">Stato Collezione</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-serif font-bold text-white drop-shadow-md">{stats.unlocked}</span>
                                    <span className="text-lg font-serif text-[#E4AE2F]">/ {stats.total}</span>
                                </div>
                            </div>

                            {/* Circular Progress */}
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
                                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="#0C0D10" strokeWidth="6" />
                                    <circle
                                        cx="32" cy="32" r="28"
                                        fill="transparent"
                                        stroke="#E4AE2F"
                                        strokeWidth="6"
                                        strokeDasharray="175.9"
                                        strokeDashoffset={175.9 - (175.9 * collectionPercentage) / 100}
                                        className="transition-all duration-1000 ease-out"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute font-black text-[11px] text-white">{collectionPercentage}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTERS (Pill format) */}
                <div className="px-6 mb-8 shrink-0">
                    <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar px-1 -mx-1">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[12px] font-bold tracking-widest uppercase transition-all duration-300 border ${activeCategory === cat.id
                                        ? 'bg-[#E4AE2F] text-[#0C0D10] border-[#E4AE2F] shadow-[0_0_15px_rgba(228,174,47,0.3)]'
                                        : 'bg-[#1C1C18] text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* GRID */}
                <div className="px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 pb-10 flex-grow content-start">
                    {filteredCards.length > 0 ? (
                        filteredCards.map(card => (
                            <AlbumCard
                                key={card.id}
                                card={card}
                                userLocation={location}
                                onClick={(c) => setSelectedCard(c)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center opacity-50">
                            <Compass className="w-12 h-12 text-slate-500 mb-4" />
                            <p className="text-slate-400 font-medium">Nessun segreto in questa categoria.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* PIN Modal */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 bg-[#0C0D10]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#1C1C18] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-xl font-bold font-serif text-white mb-2 text-center drop-shadow-md">Codice Segreto</h3>
                        <p className="text-xs text-slate-400 text-center mb-6 px-4">Inserisci il cifrario a 4 cifre fornito dal custode del luogo.</p>

                        <form onSubmit={handlePinSubmit}>
                            <input
                                type="text"
                                maxLength={4}
                                placeholder="0000"
                                value={pinCode}
                                onChange={(e) => setPinCode(e.target.value)}
                                className="w-full text-center text-5xl font-mono tracking-[0.5em] py-4 border-b border-white/10 focus:border-[#E4AE2F] outline-none bg-transparent mb-8 text-white placeholder:text-white/10 transition-colors"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPinModal(false)}
                                    className="flex-1 py-3.5 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition-colors border border-white/5 text-sm uppercase tracking-widest"
                                >
                                    Fuggi
                                </button>
                                <button
                                    type="submit"
                                    disabled={pinCode.length !== 4 || unlocking}
                                    className="flex-1 py-3.5 rounded-xl bg-[#E4AE2F] text-[#0C0D10] font-bold shadow-[0_0_15px_rgba(228,174,47,0.3)] hover:bg-[#F2C24E] hover:shadow-[0_0_25px_rgba(228,174,47,0.5)] transition-all disabled:opacity-50 disabled:shadow-none text-sm uppercase tracking-widest active:scale-[0.98]"
                                >
                                    {unlocking ? '...' : 'Sblocca'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Card Detail Modal - UPDATED PRO */}
            {selectedCard && (
                selectedCard.isUnlocked ? (
                    <UnlockedCardDetail
                        card={selectedCard}
                        onClose={() => setSelectedCard(null)}
                    />
                ) : (
                    <LockedCardDetail
                        card={selectedCard}
                        userLocation={location}
                        onClose={() => setSelectedCard(null)}
                        onUnlock={() => handleGpsUnlock(selectedCard)}
                        unlocking={unlocking}
                    />
                )
            )}
        </div>
    );
}

