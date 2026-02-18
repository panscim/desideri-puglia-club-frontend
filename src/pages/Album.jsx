import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Search, Grid, Filter, Lock, Unlock, Zap } from 'lucide-react';
import { AlbumService } from '../services/album';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistance, formatDistance } from '../utils/geolocation';
import { AlbumCard } from '../components/AlbumCard';
import { UnlockOverlay } from '../components/UnlockOverlay';
// We might need a generic Modal component or build one inline for PIN
import { toast } from 'react-hot-toast'; // Assuming we have toast

export default function Album() {
    const { t } = useTranslation();
    const { location, startWatching } = useGeolocation();

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unlocked, locked

    // Selected card for details
    const [selectedCard, setSelectedCard] = useState(null);

    // PIN Modal
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinCode, setPinCode] = useState('');
    const [unlocking, setUnlocking] = useState(false);

    // 1. Initial Load
    useEffect(() => {
        loadCards();
        startWatching(); // Start GPS immediately
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadCards = async () => {
        try {
            const data = await AlbumService.getAllCards();
            setCards(data);
        } catch (err) {
            console.error(err);
            toast.error('Errore caricamento album');
        } finally {
            setLoading(false);
        }
    };

    // 2. GPS Auto-Unlock Effect
    useEffect(() => {
        if (!location || loading) return;

        const checkUnlock = async () => {
            const userLat = location.lat;
            const userLng = location.lng;

            const newUnlocked = await AlbumService.checkProximityUnlock(userLat, userLng, cards);

            if (newUnlocked.length > 0) {
                // Success!
                const newest = newUnlocked[0];
                // Add visual flag
                newest.justUnlocked = true;
                setSelectedCard(newest); // Show overlay

                newUnlocked.forEach(card => {
                    toast.success(`Hai trovato: ${card.title}!`, { duration: 5000, icon: '🎉' });
                });
                // Refresh list to update UI
                loadCards();
            }
        };

        // Debounce checking? For now runs on every location update which is fine for "watchPosition" 
        // but maybe limit frequency if too many updates.
        checkUnlock();

    }, [location, loading]);
    // Note: we depend on 'cards' but we don't want to re-run if cards change only due to unlocking. 
    // Actually we DO want to re-run if cards list is updated? No, only on location change.
    // The 'cards' dependency might cause loops if loadCards updates state.
    // Better implementation: pass current cards to service, or let service fetch? 
    // Here we pass local state 'cards'. If 'loadCards' runs, 'cards' changes, effect runs again.
    // It's acceptable for now.

    // 3. Filtering
    const filteredCards = cards.filter(c => {
        if (filter === 'unlocked') return c.isUnlocked;
        if (filter === 'locked') return !c.isUnlocked;
        return true;
    });

    const stats = {
        total: cards.length,
        unlocked: cards.filter(c => c.isUnlocked).length
    };

    // 4. Manual PIN Unlock
    const handlePinSubmit = async (e) => {
        e.preventDefault();
        if (pinCode.length !== 4) return;

        setUnlocking(true);
        const res = await AlbumService.unlockWithPin(pinCode);
        setUnlocking(false);

        if (res.success) {
            toast.success(`Sbloccato: ${res.card.title}!`, { icon: '🔓' });
            setPinCode('');
            setShowPinModal(false);
            loadCards();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="pb-24 space-y-6">
            {/* Unlock Animation Overlay */}
            {selectedCard && selectedCard.justUnlocked && (
                <UnlockOverlay card={selectedCard} onClose={() => setSelectedCard(null)} />
            )}


            {/* Header Stats */}
            <header className="bg-white border-b border-sand p-6 sticky top-0 z-40 shadow-sm/50 backdrop-blur-md bg-white/90">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-olive-dark">Il mio Album</h1>
                        <p className="text-sm text-olive-light">Colleziona i Desideri della Puglia.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-gold">{stats.unlocked}</span>
                        <span className="text-olive-light text-sm">/{stats.total}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-sand/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gold transition-all duration-1000"
                        style={{ width: `${(stats.unlocked / stats.total) * 100}%` }}
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors whitespace-nowrap
              ${filter === 'all' ? 'bg-olive-dark text-white border-olive-dark' : 'bg-white text-olive-dark border-sand hover:bg-sand/20'}`}
                    >
                        Tutte
                    </button>
                    <button
                        onClick={() => setFilter('unlocked')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors whitespace-nowrap flex items-center gap-1
              ${filter === 'unlocked' ? 'bg-gold text-white border-gold' : 'bg-white text-olive-dark border-sand hover:bg-sand/20'}`}
                    >
                        <Unlock className="w-3 h-3" /> Sbloccate
                    </button>
                    <button
                        onClick={() => setFilter('locked')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors whitespace-nowrap flex items-center gap-1
              ${filter === 'locked' ? 'bg-slate-500 text-white border-slate-500' : 'bg-white text-olive-dark border-sand hover:bg-sand/20'}`}
                    >
                        <Lock className="w-3 h-3" /> Mancanti
                    </button>
                </div>
            </header>

            {/* Grid */}
            <div className="px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {loading ? (
                    <p className="col-span-full text-center py-10 text-olive-light">Caricamento collezione...</p>
                ) : filteredCards.length > 0 ? (
                    filteredCards.map(card => (
                        <AlbumCard
                            key={card.id}
                            card={card}
                            userLocation={location}
                            onClick={(c) => setSelectedCard(c)}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 text-olive-light italic">
                        Nessun Desiderio trovato con questo filtro.
                    </div>
                )}
            </div>

            {/* PIN Modal */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-xl font-bold font-serif text-olive-dark mb-2 text-center">Codice Partner</h3>
                        <p className="text-sm text-olive-light text-center mb-6">Inserisci il codice di 4 cifre che ti ha dato il gestore per sbloccare la figurina.</p>

                        <form onSubmit={handlePinSubmit}>
                            <input
                                type="text"
                                maxLength={4}
                                placeholder="0000"
                                value={pinCode}
                                onChange={(e) => setPinCode(e.target.value)}
                                className="w-full text-center text-4xl font-mono tracking-[0.5em] py-4 border-b-2 border-sand focus:border-gold outline-none bg-transparent mb-8 text-olive-dark placeholder:text-sand/50"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPinModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-sand/30 text-olive-dark font-bold hover:bg-sand/50 transition-colors"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    disabled={pinCode.length !== 4 || unlocking}
                                    className="flex-1 py-3 rounded-xl bg-gold text-white font-bold shadow-lg shadow-gold/30 hover:bg-gold/90 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    {unlocking ? '...' : 'Sblocca'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Card Detail Modal (Simple implementation) */}
            {selectedCard && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4" onClick={() => setSelectedCard(null)}>
                    <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                        <div className="relative aspect-square">
                            <img src={selectedCard.image_url} className="w-full h-full object-cover" />
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur text-olive-dark shadow-lg`}>
                                {selectedCard.rarity}
                            </div>
                        </div>
                        <div className="p-6 md:p-8">
                            <h2 className="text-2xl font-serif font-bold text-olive-dark mb-1">{selectedCard.title}</h2>
                            <p className="text-sm font-bold text-gold uppercase tracking-widest mb-4">{selectedCard.city}</p>

                            <div className="prose prose-sm text-olive-light leading-relaxed mb-6">
                                {selectedCard.description}
                            </div>

                            {selectedCard.isUnlocked ? (
                                <div className="bg-green-50 text-green-800 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium border border-green-100">
                                    <Unlock className="w-5 h-5 shrink-0" />
                                    Hai collezionato questo Desiderio il {new Date(selectedCard.unlockedAt).toLocaleDateString()}
                                </div>
                            ) : (
                                <div className="bg-slate-50 text-slate-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium border border-slate-100">
                                    <Lock className="w-5 h-5 shrink-0" />
                                    <LockedCardContent
                                        card={selectedCard}
                                        location={location}
                                        onEnterPin={() => {
                                            setSelectedCard(null);
                                            setShowPinModal(true);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
function LockedCardContent({ card, location, onEnterPin }) {
    if (card.type === 'monument') {
        const dist = location ? calculateDistance(location.lat, location.lng, card.gps_lat, card.gps_lng) : null;
        return `Raggiungi ${card.city} per sbloccarlo (${formatDistance(dist || 999999)}).`;
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
