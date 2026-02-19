import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Search, Grid, Filter, Lock, Unlock, Zap } from 'lucide-react';
import { AlbumService } from '../services/album';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistance, formatDistance } from '../utils/geolocation';
import { AlbumCardWrapper as AlbumCard } from '../components/AlbumCard'; // Import wrapper as AlbumCard for easier replacement

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

    // 2. GPS Location Tracking (No auto-unlock)
    // We just track location to update the UI in LockedCardContent

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

    // 5. Manual GPS Unlock
    const handleGpsUnlock = async (card) => {
        setUnlocking(true);
        const res = await AlbumService.unlockCard(card.id);
        setUnlocking(false);

        if (res.success) {
            toast.success(`Hai sbloccato: ${card.title}!`, { duration: 5000, icon: '🎉' });
            setSelectedCard(null); // Close modal to show update
            loadCards(); // Refresh list
        } else {
            toast.error(res.error || 'Errore durante lo sblocco');
        }
    }

    return (
        <div className="pb-24 bg-[#F9F9F7] min-h-screen font-sans">
            {/* Unlock Animation Overlay */}
            {selectedCard && selectedCard.justUnlocked && (
                <UnlockOverlay card={selectedCard} onClose={() => setSelectedCard(null)} />
            )}

            {/* HEADER & PROGRESS SECTION */}
            <div className="px-6 pt-8 pb-6">
                {/* Top Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-1">Collezione</h4>
                        <h1 className="text-2xl font-serif font-bold text-olive-dark tracking-wide">ALBUM STORICO</h1>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white px-3 py-1.5 rounded-full shadow-sm border border-sand/30 flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-gold/20 flex items-center justify-center">
                                <span className="text-[10px] text-olive-dark">★</span>
                            </div>
                            <span className="text-xs font-bold text-olive-dark">1,240</span>
                        </div>
                        <button className="w-9 h-9 bg-white rounded-full shadow-sm border border-sand/30 flex items-center justify-center text-olive-dark">
                            <Search size={18} />
                        </button>
                    </div>
                </div>

                {/* Progress Card */}
                <div className="relative w-full rounded-3xl overflow-hidden shadow-xl shadow-stone-900/20">
                    {/* Background with Gradient & Noise */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5A554E] to-[#3E3B36] z-0" />
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0 mix-blend-overlay" />

                    <div className="relative z-10 p-6 text-white">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-[10px] font-bold tracking-[0.2em] text-white/60 mb-1 uppercase">Progresso Album</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-serif font-medium text-white shadow-black/50 drop-shadow-sm">{stats.unlocked}</span>
                                    <span className="text-lg font-serif text-white/50">/ {stats.total}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-gold uppercase tracking-widest mb-0.5">Maggio 2024</div>
                                <div className="text-xs text-white/70">8 Missioni Attive</div>
                            </div>
                        </div>

                        {/* Gold Progress Bar */}
                        <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-1000"
                                style={{ width: `${(stats.unlocked / stats.total) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTERS */}
            <div className="px-6 mb-8 overflow-x-auto no-scrollbar">
                <div className="flex gap-3">
                    {['Tutti', 'Leggendari', 'Comuni', 'Missioni'].map((f) => {
                        const isActive = (filter === 'all' && f === 'Tutti') ||
                            (filter === 'unlocked' && f === 'Leggendari') || // mapping for demo
                            (filter === 'locked' && f === 'Missioni');

                        return (
                            <button
                                key={f}
                                onClick={() => {
                                    if (f === 'Tutti') setFilter('all');
                                    if (f === 'Leggendari') setFilter('unlocked'); // Temporary mapping
                                    if (f === 'Missioni') setFilter('locked');
                                }}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                                    ${isActive
                                        ? 'bg-[#D4AF37] text-white shadow-lg shadow-gold/30'
                                        : 'bg-white text-olive-light border border-black/5 shadow-sm hover:bg-stone-50'
                                    }`}
                            >
                                {f}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* GRID */}
            <div className="px-6 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 pb-20">
                {/* 1. Unlocked & Locked Cards */}
                {loading ? (
                    <p className="col-span-full text-center py-10 text-olive-light">Caricamento...</p>
                ) : (
                    <>
                        {filteredCards.map(card => (
                            <AlbumCard
                                key={card.id}
                                card={card}
                                userLocation={location}
                                onClick={(c) => setSelectedCard(c)}
                            />
                        ))}

                        {/* 2. Artificial "Unknown" / "Mission" Cards for visual match */}
                        {filter === 'all' && (
                            <>
                                {/* Sconosciuto */}
                                <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-stone-300 bg-stone-100/50 flex flex-col items-center justify-center gap-3 p-4">
                                    <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-400">
                                        <Lock size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold text-stone-400 tracking-widest uppercase text-center leading-relaxed">
                                        Sconosciuto
                                    </span>
                                    <span className="text-[10px] text-stone-400">Missione: Roma</span>
                                </div>

                                {/* In Arrivo */}
                                <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-stone-300 bg-stone-100/50 flex flex-col items-center justify-center gap-3 p-4">
                                    <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-400">
                                        <div className="opacity-50">⏳</div> {/* Emoji or icon */}
                                    </div>
                                    <span className="text-[10px] font-bold text-stone-400 tracking-widest uppercase text-center leading-relaxed">
                                        In Arrivo
                                    </span>
                                    <span className="text-[10px] text-stone-400">Evento Giugno</span>
                                </div>
                            </>
                        )}

                        {/* 3. "Next Mission" Card (Gold) */}
                        <div className="aspect-[3/4] rounded-2xl bg-[#F8F5E6] border border-[#D4AF37]/30 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-lg shadow-[#D4AF37]/10">
                            <div className="w-12 h-12 mb-4 bg-[#D4AF37] rounded-xl flex items-center justify-center text-white shadow-md">
                                <span className="text-xl">📋</span>
                            </div>
                            <h3 className="font-serif font-bold text-olive-dark text-lg leading-tight mb-2">PROSSIMA MISSIONE</h3>
                            <p className="text-[10px] text-olive-light leading-relaxed mb-4">Trova 3 reperti per sbloccare il prossimo Card Pack</p>
                            <button className="bg-[#D4AF37] text-white text-[10px] font-bold px-6 py-2 rounded-full shadow-md hover:bg-[#B5952F] transition-colors uppercase tracking-wider">
                                Inizia
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Modals remain the same ... */}
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

            {/* Card Detail Modal */}
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
            )}
        </div>
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
