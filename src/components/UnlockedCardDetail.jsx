import React, { useEffect } from 'react';
import { ArrowLeft, Share2, Lock, Play, Headphones, MapPin, Star, Sparkles } from 'lucide-react';

export function UnlockedCardDetail({ card, onClose }) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!card) return null;

    // Mock data handling
    const historyText = card.history || "Costruito dai Normanni nell'XI secolo, questo monumento rappresenta un fulgido esempio di architettura storica. Le sue mura raccontano secoli di storia, difese e trasformazioni che hanno segnato il territorio.";

    // Split history text for Drop Cap effect (first letter vs rest)
    const firstLetter = historyText.charAt(0);
    const restOfText = historyText.slice(1);

    let curiosityItems = [];
    try {
        if (typeof card.curiosity === 'string') {
            curiosityItems = JSON.parse(card.curiosity);
        } else if (Array.isArray(card.curiosity)) {
            curiosityItems = card.curiosity;
        }
    } catch (e) {
        console.warn("Failed to parse curiosity", e);
    }

    if (curiosityItems.length === 0) {
        curiosityItems = [
            "L'unico busto conosciuto di Federico II è stato trovato tra queste mura.",
            "Passaggi sotterranei nascosti collegano il castello direttamente al porto antico.",
            "I bastioni furono rinforzati da Carlo V di Spagna, rendendolo una delle fortezze più forti d'Italia."
        ];
    }

    const startLocation = "Piazza Castello, 76121 Barletta BT, Italy"; // Default if missing
    const globalRarity = card.global_rarity || "Top 5%";
    const unlockedDate = card.unlockedAt
        ? new Date(card.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : "Oct 12, 2023";

    // Bright yellow/gold from design
    const accentColor = "#f4c025";

    return (
        <div className="fixed inset-0 z-[9999] bg-[#F9F9F7] overflow-y-auto animate-pop-in font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-[#F9F9F7]/80 backdrop-blur-sm">
                <button onClick={onClose} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-900" />
                </button>
                <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Monument Detail</h2>
                <button className="p-2 -mr-2 hover:bg-black/5 rounded-full transition-colors">
                    <Share2 className="w-6 h-6 text-slate-900" />
                </button>
            </header>

            <main className="pt-24 px-6 pb-12 w-full max-w-lg mx-auto">
                {/* Hero Card */}
                <div className="relative aspect-[4/5] w-full rounded-[2rem] overflow-hidden shadow-2xl mb-6 group">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url('${card.image_url}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Hero Content */}
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <div className="text-[10px] font-bold text-[#f4c025] uppercase tracking-widest mb-2">
                            Ancient Tier
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-1 leading-tight">
                            {card.title}
                        </h1>
                        <p className="text-white/80 text-sm font-light">
                            {card.city}, Italy
                        </p>
                    </div>
                </div>

                {/* Collection Unlocked Indicator */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    <Lock className="w-3 h-3 text-[#f4c025]" fill="#f4c025" />
                    <span className="text-[10px] font-bold text-[#f4c025] uppercase tracking-widest">
                        Collection Unlocked
                    </span>
                </div>

                {/* Vertical Line Decoration */}
                <div className="w-1 h-8 bg-[#f4c025] mb-4 rounded-full"></div>

                {/* History Section */}
                <section className="mb-10">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display">The History</h3>
                    <div className="text-slate-600 leading-relaxed text-sm">
                        <span className="float-left text-5xl font-bold text-[#f4c025] mr-3 mt-[-8px] font-serif">
                            {firstLetter}
                        </span>
                        {restOfText}
                        <br /><br />
                        La sua forma trapezoidale unica e i massicci bastioni rappresentano l'apice dell'ingegneria militare medievale, progettati per resistere all'evoluzione dell'artiglieria mantenendo un'eleganza regale.
                    </div>
                </section>

                {/* Curiosity Card */}
                <section className="bg-[#f0f0eb] rounded-2xl p-6 mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-[#f4c025]" fill="#f4c025" />
                        <h3 className="text-lg font-bold text-slate-900">Curiosity & Secrets</h3>
                    </div>
                    <ul className="space-y-4">
                        {curiosityItems.map((item, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-slate-700 leading-snug">
                                <div className="mt-0.5 shrink-0">
                                    <div className="w-5 h-5 rounded-full bg-[#f4c025] flex items-center justify-center">
                                        <Star className="w-3 h-3 text-white" fill="white" />
                                    </div>
                                </div>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Audio Guide */}
                <section className="mb-10">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Audio Guide</h3>
                    <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                        <button className="w-12 h-12 rounded-full bg-[#f4c025] flex items-center justify-center shadow-lg shadow-[#f4c025]/30 hover:scale-105 transition-transform shrink-0">
                            <Play className="w-5 h-5 text-slate-900 ml-1" fill="#1a1a1a" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">The Emperor's Legacy</div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full w-1/3 bg-[#f4c025] rounded-full"></div>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-slate-400 mb-1">4:22</div>
                            <Headphones className="w-5 h-5 text-slate-300 ml-auto" />
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="mb-10">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Your Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm">
                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">Unlocked On</div>
                            <div className="text-lg font-bold text-slate-900 font-serif">{unlockedDate}</div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm">
                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">Global Rarity</div>
                            <div className="text-lg font-bold text-[#f4c025] font-serif">{globalRarity}</div>
                        </div>
                    </div>
                </section>

                {/* Location Info Card */}
                <section className="bg-[#1a1f2e] rounded-2xl p-1 shadow-2xl">
                    <div className="p-5 pb-2">
                        <h3 className="text-lg font-bold text-white mb-4">Location Info</h3>
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-4 h-4 text-[#f4c025]" />
                            <p className="text-sm text-slate-300">{startLocation}</p>
                        </div>

                        {/* Map Placeholder */}
                        <div className="w-full h-32 bg-sky-200 rounded-xl overflow-hidden relative mb-6">
                            <div
                                className="absolute inset-0 opacity-80 bg-cover bg-center"
                                style={{
                                    backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=41.1171,16.8719&zoom=14&size=600x300&maptype=roadmap&style=feature:all|saturation:-100&key=YOUR_API_KEY_HERE')"
                                }}
                            ></div>
                            <div className="absolute inset-0 bg-blue-400/20"></div>
                        </div>

                        <button className="w-full h-14 bg-[#f4c025] rounded-xl flex items-center justify-center gap-2 font-bold text-[#1a1f2e] hover:bg-[#e0b020] transition-colors">
                            <span className="material-symbols-outlined text-xl">explore</span>
                            Visit Again
                        </button>
                    </div>
                </section>

                {/* Bottom padding for tab bar */}
                <div className="h-20"></div>
            </main>
        </div>
    );
}
