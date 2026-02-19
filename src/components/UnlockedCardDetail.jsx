import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// We still import some Lucide icons for fallback or consistency if needed, but primarily using Material Symbols as requested
// Actually, to use Material Symbols we just need the className "material-symbols-outlined".

export function UnlockedCardDetail({ card, onClose }) {
    const { t } = useTranslation();

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!card) return null;

    // Mock data if columns are missing (since we just added them to DB and old seeds might be empty)
    const historyText = card.history || "Costruito dai Normanni nell'XI secolo, questo monumento rappresenta un fulgido esempio di architettura storica. Le sue mura raccontano secoli di storia, difese e trasformazioni che hanno segnato il territorio.";

    // Parse curiosity if it's a string (JSON) or use default
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
            "Sotto il basamento principale è sepolta una capsula del tempo.",
            "I passaggi sotterranei collegano la struttura direttamente al porto antico.",
            "Le decorazioni furono realizzate da maestri artigiani locali nel 1700."
        ];
    }

    const audioTrack = card.audio_track || null; // URL to audio
    const globalRarity = card.global_rarity || "Top 5%";
    const unlockedDate = card.unlockedAt ? new Date(card.unlockedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : "Recente";

    return (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-[#101622] overflow-y-auto animate-pop-in">
            {/* Sticky Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 transition-all duration-300">
                <button
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-slate-900 shadow-sm border border-white/30 hover:bg-white/40 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex gap-2">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-slate-900 shadow-sm border border-white/30 hover:bg-white/40 transition-colors">
                        <span className="material-symbols-outlined">share</span>
                    </button>
                </div>
            </nav>

            <main className="relative w-full max-w-md mx-auto bg-[#fdfcf9] dark:bg-[#101622] min-h-screen shadow-2xl overflow-x-hidden pb-32">
                {/* Hero Image Section */}
                <div className="relative h-[45vh] w-full overflow-hidden">
                    <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${card.image_url}')` }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#fdfcf9] dark:from-[#101622] to-transparent"></div>
                </div>

                {/* Content Container */}
                <div className="relative -mt-12 px-5 space-y-6">
                    {/* Header Info */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#b08d57]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#b08d57] border border-[#b08d57]/20">
                                <span className="material-symbols-outlined text-sm">verified</span>
                                Sbloccato
                            </span>
                            <span className="text-xs text-slate-500 font-medium">{unlockedDate}</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display leading-tight">
                            {card.title}
                        </h1>
                        <p className="text-sm text-slate-500 italic flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {card.city}, Italia
                        </p>
                    </div>

                    {/* Quick Action Bar */}
                    <div className="flex items-center gap-3">
                        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1152d4] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#1152d4]/20 hover:scale-[0.98] transition-transform">
                            <span className="material-symbols-outlined">view_in_ar</span>
                            Guarda in AR
                        </button>
                        <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1152d4]/10 text-[#1152d4] border border-[#1152d4]/20 hover:bg-[#1152d4]/20 transition-colors">
                            <span className="material-symbols-outlined fill-1">graphic_eq</span>
                        </button>
                    </div>

                    {/* Curiosità Section */}
                    {curiosityItems.length > 0 && (
                        <section className="rounded-2xl border border-[#b08d57]/20 bg-[#b08d57]/5 p-5 space-y-4">
                            <div className="flex items-center gap-2 text-[#b08d57]">
                                <span className="material-symbols-outlined">lightbulb</span>
                                <h2 className="text-lg font-bold font-display">Curiosità</h2>
                            </div>
                            <ul className="space-y-3">
                                {curiosityItems.map((item, idx) => (
                                    <li key={idx} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        <span className="text-[#b08d57] text-xs mt-1">★</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Storia e Architettura */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <span className="material-symbols-outlined text-[#1152d4]">history_edu</span>
                            <h2 className="text-xl font-bold tracking-tight font-display text-slate-900 dark:text-slate-100">Storia e Architettura</h2>
                        </div>
                        <div className="font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-200 space-y-4">
                            <p dangerouslySetInnerHTML={{ __html: historyText.replace(/\n/g, '<br/>') }} />

                            {/* Static Image Interlude - Could be dynamic if we had multiple images */}
                            <div
                                className="rounded-xl overflow-hidden aspect-video my-6 shadow-md bg-cover bg-center"
                                style={{ backgroundImage: `url('${card.image_url}')`, filter: 'sepia(30%) contrast(110%)' }}
                            >
                            </div>

                            <p className="text-base text-slate-600 italic">
                                "{card.description}"
                            </p>
                        </div>
                    </section>

                    {/* Map Context */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-display">Posizione Geografica</h3>
                        <div className="w-full h-40 rounded-xl bg-slate-200 dark:bg-slate-800 relative overflow-hidden group">
                            {/* Using a static map placeholder or generic map background */}
                            <div
                                className="absolute inset-0 grayscale contrast-125 opacity-70 group-hover:grayscale-0 transition-all duration-700 bg-cover bg-center"
                                style={{ backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=41.1171,16.8719&zoom=14&size=600x300&maptype=roadmap&style=feature:all|saturation:-100&key=YOUR_API_KEY_HERE')" }} // Placeholder URL, ideally use Leaflet or static image
                            >
                                {/* Fallback background color/pattern if image fails */}
                                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/city-map.png')] bg-repeat opacity-50"></div>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-8 w-8 rounded-full bg-[#1152d4]/30 animate-ping absolute"></div>
                                <div className="h-4 w-4 rounded-full bg-[#1152d4] border-2 border-white relative shadow-lg"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                            <span>LAT: {card.gps_lat?.toFixed(4)}</span>
                            <span>LNG: {card.gps_lng?.toFixed(4)}</span>
                        </div>
                    </section>

                    {/* Your Stats */}
                    <section className="grid grid-cols-2 gap-4 pt-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">DATA SBLOCCO</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white font-display">{unlockedDate}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">RARITÀ GLOBALE</div>
                            <div className="text-lg font-bold text-[#b08d57] font-display">{globalRarity}</div>
                        </div>
                    </section>

                    {/* Share CTA */}
                    <div className="pt-8 pb-10">
                        <button className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-800 py-4 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined">ios_share</span>
                            Condividi la tua scoperta
                        </button>
                    </div>
                </div>
            </main>

            {/* Floating Audio Control */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[10000]">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-slate-700 rounded-2xl p-3 shadow-2xl flex items-center gap-4 ring-1 ring-black/5">
                    <button className="h-10 w-10 flex items-center justify-center rounded-full bg-[#1152d4] text-white shadow-lg shadow-[#1152d4]/30 hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined">play_arrow</span>
                    </button>
                    <div className="flex-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Audio Guida</div>
                        {/* Fake Waveform */}
                        <div className="flex gap-[2px] items-center h-4 opacity-80">
                            {[0.5, 0.8, 0.6, 0.4, 0.9, 0.5, 0.3, 0.7, 0.6, 0.4, 0.8, 0.5, 0.3, 0.6, 0.4].map((h, i) => (
                                <div
                                    key={i}
                                    className={`w-1 rounded-full ${i < 5 ? 'bg-[#1152d4]' : 'bg-[#1152d4]/30'}`}
                                    style={{ height: `${h * 100}%` }}
                                ></div>
                            ))}
                        </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 pr-2 font-mono">03:45</span>
                </div>
            </div>
        </div>
    );
}
