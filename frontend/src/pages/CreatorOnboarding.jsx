import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    ArrowRight, Check, TrendingUp, Shield, Cpu,
    Headphones, Star, Award, Zap, ChevronDown,
    Camera, PenTool, CloudRain, MapPin
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   BRAND PALETTE — dall'index.css del progetto
   ────────────────────────────────────────────────────────────── */
const BRAND = {
    sabbia: '#FAF7F2',
    terracotta: '#D4793A',
    blu: '#2F4858',
    sole: '#F2C87B',
    text: '#1F2933',
    muted: '#6B7280',
    divider: '#E5E7EB',
    white: '#FFFFFF',
    inkDark: '#1C2833',   // blu profondissimo per hero
};

/* ─── Animazione staggered lista ─────────────────────────── */
const FadeUp = ({ children, delay = 0, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
        className={className}
    >{children}</motion.div>
);

/* ─── Earnings Calculator ─────────────────────────────────── */
const PRICES = [
    { label: '€2,50', value: 2.5 },
    { label: '€5', value: 5 },
    { label: '€10', value: 10 },
    { label: '€15', value: 15 },
];

function EarningsCalculator() {
    const [priceIdx, setPriceIdx] = useState(2);
    const [volume, setVolume] = useState(100);
    const net = PRICES[priceIdx].value * volume * 0.7;
    const pct = ((volume - 5) / 495) * 100;

    return (
        <div className="rounded-[2rem] overflow-hidden no-theme-flip"
            style={{ background: BRAND.inkDark, boxShadow: '0 32px 80px rgba(28,40,51,0.4)' }}>

            {/* Header sezione calcolatrice */}
            <div className="px-7 pt-8 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: `${BRAND.terracotta}20`, border: `1px solid ${BRAND.terracotta}40` }}>
                        <TrendingUp size={13} style={{ color: BRAND.terracotta }} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-image" style={{ color: `${BRAND.sole}99` }}>
                        Simulatore di Guadagno
                    </p>
                </div>
                <h3 className="text-[22px] font-bold leading-snug tracking-tight text-on-image"
                    style={{ fontFamily: "'Libre Baskerville', serif", color: BRAND.white }}>
                    Calcola il tuo<br />potenziale mensile
                </h3>
            </div>

            <div className="px-7 py-7 space-y-7">
                {/* Selezione prezzo */}
                <div>
                    <p className="text-[11px] font-semibold mb-3 text-on-image" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Valore del piano venduto
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {PRICES.map((p, i) => (
                            <motion.button key={i} onClick={() => setPriceIdx(i)}
                                whileTap={{ scale: 0.93 }}
                                className="py-3 rounded-xl text-[13px] font-bold transition-colors"
                                style={{
                                    background: priceIdx === i ? BRAND.terracotta : 'rgba(255,255,255,0.06)',
                                    color: priceIdx === i ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                                    boxShadow: priceIdx === i ? `0 6px 20px ${BRAND.terracotta}50` : 'none',
                                }}>
                                {p.label}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Slider volume */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <p className="text-[11px] font-semibold text-on-image" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Piani venduti al mese
                        </p>
                        <span className="text-[28px] font-bold text-on-image leading-none tracking-tight"
                            style={{ fontFamily: "'Libre Baskerville', serif", color: BRAND.white }}>
                            {volume}
                        </span>
                    </div>
                    <input type="range" min={5} max={500} step={5} value={volume}
                        onChange={e => setVolume(+e.target.value)}
                        style={{
                            width: '100%', height: '3px', borderRadius: '999px',
                            appearance: 'none', cursor: 'pointer', outline: 'none',
                            background: `linear-gradient(to right, ${BRAND.terracotta} ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
                            accentColor: BRAND.terracotta,
                        }}
                    />
                    <div className="flex justify-between mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        <span className="text-[10px] font-bold">5</span>
                        <span className="text-[10px] font-bold">250</span>
                        <span className="text-[10px] font-bold">500</span>
                    </div>
                </div>

                {/* Risultato */}
                <div className="rounded-[1.25rem] p-6 text-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] mb-3 text-on-image"
                        style={{ color: `${BRAND.sole}70` }}>
                        Il tuo guadagno netto (70%)
                    </p>
                    <motion.div
                        key={net}
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="text-[4rem] font-bold leading-none tracking-tight text-on-image"
                        style={{ fontFamily: "'Libre Baskerville', serif", color: BRAND.white }}>
                        €{net.toFixed(0)}
                    </motion.div>
                    <p className="text-[11px] mt-3 text-on-image" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Zero costi fissi. Nessun abbonamento. Solo commissione sul venduto.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════ */
export default function CreatorOnboarding() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    return (
        <div style={{ background: BRAND.sabbia, minHeight: '100vh' }}>

            {/* ── PILL FISSO — scompare con l'hero ── */}
            <motion.div
                className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-12 pb-3 pointer-events-none no-theme-flip"
                style={{ opacity: heroOpacity, background: 'transparent' }}>
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-on-image pointer-events-auto"
                    style={{
                        background: `rgba(28,40,51,0.65)`,
                        border: `1px solid ${BRAND.terracotta}45`,
                        color: BRAND.terracotta,
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                    }}>
                    <Star size={11} fill="currentColor" />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em]">Programma Advisor Elite</span>
                </motion.div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════
          HERO — sfondo blu profondo con pattern e testo chiaro
         ═══════════════════════════════════════════════════════ */}
            <section ref={heroRef} className="relative overflow-hidden no-theme-flip"
                style={{ background: BRAND.inkDark, minHeight: '100dvh' }}>

                {/* Decorazione: cerchi sfumati */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
                        style={{ background: `radial-gradient(circle, ${BRAND.terracotta}18 0%, transparent 65%)` }} />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
                        style={{ background: `radial-gradient(circle, ${BRAND.blu}60 0%, transparent 70%)` }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
                        style={{ background: `radial-gradient(circle, ${BRAND.sole}06 0%, transparent 60%)` }} />
                </div>

                {/* Texture griglia */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }} />

                <motion.div
                    style={{ y: heroY, opacity: heroOpacity, minHeight: '100dvh' }}
                    className="relative z-10 flex flex-col justify-between px-6 pt-28 pb-20">

                    <div />

                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                            className="text-[3.8rem] font-bold leading-[0.92] tracking-[-0.03em] mb-6 text-on-image"
                            style={{ fontFamily: "'Libre Baskerville', serif", color: BRAND.white }}>
                            La tua&nbsp;<br />
                            <span style={{ color: BRAND.sole }}>conoscenza</span><br />
                            vale&nbsp;oro.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.7 }}
                            className="text-[15px] leading-relaxed font-medium mb-10 text-on-image max-w-[85%]"
                            style={{ color: 'rgba(255,255,255,0.55)' }}>
                            Unisciti all'élite dei Local Advisor di Puglia.<br />
                            Crea itinerari esclusivi e incassa il 70% di ogni vendita.
                        </motion.p>

                        {/* Mini metric strip */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex gap-6 mb-12">
                            {[
                                { val: '70%', label: 'guadagni tu' },
                                { val: '0€', label: 'costi fissi' },
                                { val: '24h', label: 'per esito' },
                            ].map((m, i) => (
                                <div key={i}>
                                    <p className="text-[22px] font-bold text-on-image leading-none tracking-tight"
                                        style={{ fontFamily: "'Libre Baskerville', serif", color: BRAND.white }}>{m.val}</p>
                                    <p className="text-[10px] font-semibold mt-1 text-on-image" style={{ color: 'rgba(255,255,255,0.35)' }}>{m.label}</p>
                                </div>
                            ))}
                        </motion.div>

                        {/* Scroll indicator */}
                        <motion.div
                            animate={{ y: [0, 6, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-on-image"
                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                                <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                            </div>
                            <p className="text-[11px] font-semibold text-on-image" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                Scopri il programma
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════════════════
          BODY — sfondo sabbia, sezioni con card elevate
         ═══════════════════════════════════════════════════════ */}
            <div className="max-w-xl mx-auto px-5 pt-10 pb-36 space-y-8">

                {/* ── SIMULATORE ── */}
                <FadeUp><EarningsCalculator /></FadeUp>

                {/* ── BUSINESS MODEL 70/30 ── */}
                <FadeUp>
                    <div className="rounded-[2rem] overflow-hidden bg-white"
                        style={{ border: `1px solid ${BRAND.divider}`, boxShadow: '0 8px 40px rgba(0,0,0,0.05)' }}>

                        {/* Barra topica colorata */}
                        <div className="h-1.5 w-full flex no-theme-flip">
                            <div className="flex-[7]" style={{ background: BRAND.terracotta }} />
                            <div className="flex-[3]" style={{ background: BRAND.divider }} />
                        </div>

                        <div className="p-7">
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: BRAND.terracotta }}>
                                        Il modello economico
                                    </p>
                                    <h2 className="text-[24px] font-bold leading-tight tracking-tighter" style={{ fontFamily: "'Libre Baskerville', serif", color: BRAND.text }}>
                                        Partnership<br />Trasparente.
                                    </h2>
                                </div>
                                <div className="shrink-0 rounded-2xl px-4 py-3 text-center no-theme-flip"
                                    style={{ background: BRAND.terracotta }}>
                                    <p className="text-[26px] font-black text-white leading-none">70%</p>
                                    <p className="text-[9px] text-white/70 font-bold mt-0.5">TIENI TU</p>
                                </div>
                            </div>

                            <p className="text-[13px] mb-7 leading-relaxed" style={{ color: BRAND.muted }}>
                                Guadagni solo quando vendi. Noi prendiamo il 30% per coprire l'intera infrastruttura.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { icon: <TrendingUp size={15} />, label: 'Distribuzione & Marketing', desc: 'Promozione algoritmica del tuo profilo nel club e su Instagram.' },
                                    { icon: <Shield size={15} />, label: 'Sicurezza Transazioni', desc: 'Payment gateway, anti-frode, gestione rimborsi e chargeback.' },
                                    { icon: <Cpu size={15} />, label: 'Tecnologia (Piano B)', desc: 'App iOS/Android, GPS, notifiche e sistema di ridondanza pioggia.' },
                                    { icon: <Headphones size={15} />, label: 'Concierge 7/7', desc: 'Supporto diretto ai tuoi turisti senza che tu debba intervenire.' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 py-3"
                                        style={{ borderBottom: i < 3 ? `1px solid ${BRAND.divider}` : 'none' }}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                            style={{ background: `${BRAND.terracotta}10`, color: BRAND.terracotta }}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold mb-0.5" style={{ color: BRAND.text }}>{item.label}</p>
                                            <p className="text-[11px] leading-snug" style={{ color: BRAND.muted }}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </FadeUp>

                {/* ── BENTO: VANTAGGI ── */}
                <FadeUp>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-[1.5rem] p-5 bg-white"
                            style={{ border: `1px solid ${BRAND.divider}`, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 no-theme-flip"
                                style={{ background: `${BRAND.blu}12` }}>
                                <Award size={20} style={{ color: BRAND.blu }} />
                            </div>
                            <p className="text-[14px] font-bold mb-1" style={{ color: BRAND.text }}>Badge Verified</p>
                            <p className="text-[11px] leading-relaxed" style={{ color: BRAND.muted }}>Boost nella ricerca e profilo in evidenza sul feed</p>
                        </div>
                        <div className="rounded-[1.5rem] p-5 bg-white"
                            style={{ border: `1px solid ${BRAND.divider}`, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 no-theme-flip"
                                style={{ background: `${BRAND.sole}25` }}>
                                <Zap size={20} style={{ color: '#B07D20' }} />
                            </div>
                            <p className="text-[14px] font-bold mb-1" style={{ color: BRAND.text }}>Network Esclusivo</p>
                            <p className="text-[11px] leading-relaxed" style={{ color: BRAND.muted }}>Accesso diretto a ristoranti, masserie e hotel partner</p>
                        </div>
                        <div className="col-span-2 rounded-[1.5rem] p-5 bg-white"
                            style={{ border: `1px solid ${BRAND.divider}`, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center no-theme-flip"
                                    style={{ background: `${BRAND.terracotta}12` }}>
                                    <MapPin size={20} style={{ color: BRAND.terracotta }} />
                                </div>
                                <p className="text-[14px] font-bold" style={{ color: BRAND.text }}>Rendita Passiva Reale</p>
                            </div>
                            <p className="text-[12px] leading-relaxed" style={{ color: BRAND.muted }}>
                                Crei un piano una volta, lo vendi infinite volte. Mentre esplori la Puglia, il tuo lavoro genera entrate in autonomia.
                            </p>
                        </div>
                    </div>
                </FadeUp>

                {/* ── STANDARD DI QUALITÀ — box scuro blu profondo ── */}
                <FadeUp>
                    <div className="rounded-[2rem] p-7 relative overflow-hidden no-theme-flip"
                        style={{ background: BRAND.blu, boxShadow: '0 20px 60px rgba(47,72,88,0.35)' }}>
                        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                            style={{ background: `radial-gradient(circle, ${BRAND.sole}15, transparent 70%)` }} />

                        <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-3 text-on-image" style={{ color: BRAND.sole }}>
                            Il filtro
                        </p>
                        <h2 className="text-[26px] font-bold leading-tight mb-7 text-on-image tracking-tight"
                            style={{ fontFamily: "'Libre Baskerville', serif", color: BRAND.white }}>
                            Standard Senza<br />Compromessi.
                        </h2>

                        <div className="space-y-5">
                            {[
                                { icon: <Camera size={16} />, title: "Fotografia d'autore", desc: "Solo scatti originali. Niente stock, niente filtri fake. Il tuo occhio è il tuo marchio." },
                                { icon: <PenTool size={16} />, title: "Storytelling viscerale", desc: "Il turista vuole la tua voce, non una guida. Racconti veri, odori, nomi, storia." },
                                { icon: <CloudRain size={16} />, title: "Piano B obbligatorio", desc: "Ogni tappa deve avere un'alternativa indoor. Il viaggio perfetto non dipende dal meteo." },
                            ].map((r, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-on-image"
                                        style={{ background: 'rgba(255,255,255,0.08)', color: BRAND.sole }}>
                                        {r.icon}
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold mb-1 text-on-image" style={{ color: BRAND.white }}>{r.title}</p>
                                        <p className="text-[12px] leading-relaxed text-on-image" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeUp>

                {/* ── FAQ ── */}
                <FadeUp>
                    <div className="rounded-[2rem] overflow-hidden bg-white"
                        style={{ border: `1px solid ${BRAND.divider}`, boxShadow: '0 6px 30px rgba(0,0,0,0.04)' }}>
                        <div className="px-7 py-6" style={{ borderBottom: `1px solid ${BRAND.divider}` }}>
                            <h2 className="text-[20px] font-bold tracking-tight" style={{ fontFamily: "'Libre Baskerville', serif", color: BRAND.text }}>
                                Domande Frequenti
                            </h2>
                        </div>
                        <div>
                            {[
                                { q: 'Quando ricevo i miei soldi?', r: 'Il 15 di ogni mese liquidiamo sul tuo IBAN le vendite nette del mese solare precedente.' },
                                { q: 'Serve la Partita IVA?', r: 'No, non subito. Per cifre sotto i 5000€ annui puoi operare con prestazione occasionale.' },
                                { q: 'Chi fissa il prezzo?', r: 'Tu. Hai controllo totale. Ti forniremo dati di conversione per ottimizzarlo nel tempo.' },
                                { q: "C'è esclusiva?", r: 'No. Ti chiediamo esclusiva solo sui piani che decidi di pubblicare sulla piattaforma.' },
                            ].map((f, i, arr) => (
                                <div key={i} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${BRAND.divider}` : 'none' }}>
                                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full text-left px-7 py-5 flex items-center justify-between gap-4 transition-colors"
                                        style={{ background: openFaq === i ? `${BRAND.terracotta}05` : 'transparent' }}>
                                        <span className="text-[13px] font-semibold" style={{ color: BRAND.text }}>{f.q}</span>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                                            style={{ background: openFaq === i ? `${BRAND.terracotta}15` : BRAND.sabbia }}>
                                            <ChevronDown size={13} style={{ color: openFaq === i ? BRAND.terracotta : BRAND.muted }} />
                                        </div>
                                    </button>
                                    <motion.div
                                        initial={false}
                                        animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                                        transition={{ duration: 0.28, ease: 'easeOut' }}
                                        style={{ overflow: 'hidden' }}>
                                        <p className="px-7 pb-5 text-[13px] leading-relaxed" style={{ color: BRAND.muted }}>{f.r}</p>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeUp>

                {/* ── CTA FINALE ── */}
                <FadeUp>
                    <div className="pt-4 text-center">
                        <p className="text-[12px] mb-6 leading-relaxed" style={{ color: BRAND.muted }}>
                            La selezione è manuale. Meno del 15% delle candidature<br />viene accettata per tutelare i creator esistenti.
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/diventa-creator/candidatura')}
                            className="w-full h-[68px] rounded-[1.25rem] font-bold text-[15px] flex items-center justify-center gap-3 no-theme-flip text-on-image"
                            style={{
                                background: BRAND.terracotta,
                                color: BRAND.white,
                                boxShadow: `0 16px 48px ${BRAND.terracotta}45`,
                            }}>
                            Candidati come Local Advisor
                            <ArrowRight size={18} />
                        </motion.button>
                    </div>
                </FadeUp>

            </div>
        </div>
    );
}
