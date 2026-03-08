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
            <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#E4AE2F] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="pb-24 bg-bg-primary min-h-screen font-sans flex flex-col items-center overflow-x-hidden relative">

            {/* Global Ambient Glow - Subtler for Light Mode */}
            <div className="fixed top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-zinc-100/50 to-transparent pointer-events-none z-0" />

            {/* Unlock Animation Overlay */}
            {selectedCard && selectedCard.justUnlocked && (
                <UnlockOverlay card={selectedCard} onClose={() => setSelectedCard(null)} />
            )}

            <div className="w-full max-w-7xl relative z-10 flex flex-col">

                {/* HEADER & PROGRESS SECTION */}
                <div className="px-6 pt-12 pb-8 shrink-0">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <p className="overline !text-accent !mb-2 !tracking-[0.4em]">Passaporto</p>
                            <h1 className="text-[32px] font-serif font-black text-text-primary tracking-tight leading-tight">LE TUE SCOPERTE</h1>
                        </div>
                    </div>

                    {/* Progress Card (Premium Light) */}
                    <div className="card !p-0 relative w-full overflow-hidden">
                        <div className="relative z-10 p-8 flex items-center justify-between">
                            <div>
                                <p className="overline !text-text-muted !mb-2">Stato Collezione</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[42px] font-serif font-black text-text-primary leading-none">{stats.unlocked}</span>
                                    <span className="text-xl font-serif text-accent font-black opacity-60">/ {stats.total}</span>
                                </div>
                            </div>

                            {/* Circular Progress */}
                            <div className="relative w-20 h-20 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="40" cy="40" r="35" fill="transparent" stroke="var(--bg-secondary)" strokeWidth="6" />
                                    <circle
                                        cx="40" cy="40" r="35"
                                        fill="transparent"
                                        stroke="var(--accent)"
                                        strokeWidth="6"
                                        strokeDasharray="219.9"
                                        strokeDashoffset={219.9 - (219.9 * collectionPercentage) / 100}
                                        className="transition-all duration-1000 ease-out"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute font-black text-[14px] text-text-primary">{collectionPercentage}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTERS (Pill format) */}
                <div className="px-6 mb-10 shrink-0">
                    <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-2 px-2">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`whitespace-nowrap px-6 py-3 rounded-full text-[11px] font-black tracking-[0.15em] uppercase transition-all duration-300 border ${activeCategory === cat.id
                                    ? 'bg-accent text-white border-accent shadow-sm'
                                    : 'bg-surface text-text-muted border-border-default hover:border-accent/50 hover:text-text-primary'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* GRID */}
                <div className="px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 pb-12 flex-grow content-start">
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
                        <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-40">
                            <Compass className="w-16 h-16 text-text-muted mb-6" />
                            <p className="text-text-muted font-black uppercase tracking-widest text-[11px]">Nessun segreto in questa categoria.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* PIN Modal */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 bg-bg-dark/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-surface border border-border-default rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-2xl font-serif font-black text-text-primary mb-3 text-center">Codice Segreto</h3>
                        <p className="text-xs text-text-muted text-center mb-8 px-4 font-medium leading-relaxed">Inserisci il cifrario a 4 cifre fornito dal custode del luogo.</p>

                        <form onSubmit={handlePinSubmit}>
                            <input
                                type="text"
                                maxLength={4}
                                placeholder="0000"
                                value={pinCode}
                                onChange={(e) => setPinCode(e.target.value)}
                                className="w-full text-center text-5xl font-mono tracking-[0.5em] py-6 border-b-2 border-border-default focus:border-accent outline-none bg-transparent mb-10 text-text-primary placeholder:text-bg-secondary transition-all"
                                autoFocus
                            />
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPinModal(false)}
                                    className="btn-ghost flex-1 !py-4 !text-[11px]"
                                >
                                    Chiudi
                                </button>
                                <button
                                    type="submit"
                                    disabled={pinCode.length !== 4 || unlocking}
                                    className="btn-primary flex-1 !py-4 !text-[11px]"
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

