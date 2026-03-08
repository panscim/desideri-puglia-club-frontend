// src/pages/BecomeCreator.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Clock, CheckCircle, XCircle } from 'lucide-react';

// ── VibeTags disponibili ────────────────────────────────────
const VIBE_OPTIONS = [
    { id: 'enogastronomia', label: 'Enogastronomia', emoji: '🍷' },
    { id: 'storia_cultura', label: 'Storia e Cultura', emoji: '🏛️' },
    { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
    { id: 'puglia_nascosta', label: 'Puglia Nascosta', emoji: '🗺️' },
];

// ── Regole d'Oro ────────────────────────────────────────────
const REGOLE = [
    {
        id: 'accetta_piano_b',
        testo: 'Accetto di inserire sempre un\'alternativa indoor/pioggia per ogni tappa.',
    },
    {
        id: 'accetta_qualita',
        testo: 'Mi impegno a usare solo foto originali in linea con l\'estetica dell\'app.',
    },
    {
        id: 'accetta_aggiornamento',
        testo: 'Mi impegno a segnalare chiusure o cambi di gestione dei locali inseriti.',
    },
    {
        id: 'accetta_commissione',
        testo: 'Accetto la trattenuta del 30% sulla vendita di ogni piano.',
    },
];

// ── Section wrapper ─────────────────────────────────────────
function Section({ step, title, children }) {
    return (
        <div className="rounded-[24px] overflow-hidden mb-5"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #F0EDE8' }}>
            <div className="px-6 pt-5 pb-3" style={{ borderBottom: '1px solid #F0EDE8' }}>
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black"
                        style={{ background: '#F5F2EC', color: '#1A1A1A', border: '1px solid #E0D8CC' }}>
                        {step}
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: '#9A8E7E' }}>
                        {title}
                    </p>
                </div>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

// ── Input styled ────────────────────────────────────────────
function StyledInput({ value, onChange, placeholder, type = 'text' }) {
    return (
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3.5 rounded-2xl text-[14px] outline-none transition-all"
            style={{
                background: '#FAF9F6',
                border: '1.5px solid #EDE9E0',
                color: '#1A1A1A',
                fontFamily: "'Inter', sans-serif",
            }}
        />
    );
}

function StyledTextarea({ value, onChange, placeholder }) {
    return (
        <textarea
            rows={5}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3.5 rounded-2xl text-[14px] outline-none transition-all resize-none"
            style={{
                background: '#FAF9F6',
                border: '1.5px solid #EDE9E0',
                color: '#1A1A1A',
                fontFamily: "'Inter', sans-serif",
                lineHeight: '1.6',
            }}
        />
    );
}

// ══════════════════════════════════════════════════════════════
export default function BecomeCreator() {
    const navigate = useNavigate();
    const { profile, refreshProfile } = useAuth();

    // ── State candidatura ─────────────────────────────────────
    const [applicationState, setApplicationState] = useState('loading'); // loading | none | pending | approved | rejected
    const [existingApp, setExistingApp] = useState(null);

    // ── Form state ────────────────────────────────────────────
    const [instagramUrl, setInstagramUrl] = useState('');
    const [instagramConfirmed, setInstagramConfirmed] = useState(false);
    const [perlaSegreta, setPerlaSegreta] = useState('');
    const [vibeTags, setVibeTags] = useState([]);
    const [regole, setRegole] = useState({
        accetta_piano_b: false,
        accetta_qualita: false,
        accetta_aggiornamento: false,
        accetta_commissione: false,
    });
    const [submitting, setSubmitting] = useState(false);

    // ── Carica candidatura esistente ──────────────────────────
    useEffect(() => {
        if (!profile?.id) return;

        // Se già creator
        if (profile.ruolo === 'creator') {
            setApplicationState('approved');
            return;
        }

        const fetchApp = async () => {
            const { data } = await supabase
                .from('creator_applications')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) {
                setExistingApp(data);
                setApplicationState(data.stato); // pending | approved | rejected
            } else {
                setApplicationState('none');
            }
        };

        fetchApp();

        // Pre-popola instagram se già nel profilo
        if (profile.instagram_url) {
            setInstagramUrl(profile.instagram_url);
        }
    }, [profile?.id]);

    // ── Toggle vibe tag ───────────────────────────────────────
    const toggleVibe = (id) => {
        setVibeTags(prev =>
            prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
        );
    };

    // ── Submit ────────────────────────────────────────────────
    const handleSubmit = async () => {
        // Validazioni
        if (!instagramUrl.trim()) {
            return toast.error('Inserisci il link Instagram o portfolio');
        }
        if (perlaSegreta.trim().length < 50) {
            return toast.error('Racconta meglio la tua perla segreta (min. 50 caratteri)');
        }
        if (vibeTags.length === 0) {
            return toast.error('Seleziona almeno una specialità');
        }
        const tutteAccettate = REGOLE.every(r => regole[r.id]);
        if (!tutteAccettate) {
            return toast.error('Devi accettare tutte le Regole d\'Oro per procedere');
        }

        setSubmitting(true);
        try {
            const payload = {
                user_id: profile.id,
                instagram_url: instagramUrl.trim(),
                perla_segreta: perlaSegreta.trim(),
                vibe_tags: vibeTags,
                ...regole,
                stato: 'pending',
            };

            const { error } = await supabase
                .from('creator_applications')
                .insert(payload);

            if (error) throw error;

            // Se instagram non era nel profilo, salvalo
            if (!profile.instagram_url && instagramUrl.trim()) {
                await supabase
                    .from('utenti')
                    .update({ instagram_url: instagramUrl.trim() })
                    .eq('id', profile.id);
                refreshProfile();
            }

            toast.success('Candidatura inviata con successo!');
            setApplicationState('pending');
        } catch (err) {
            console.error(err);
            toast.error('Errore durante l\'invio. Riprova.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────
    if (applicationState === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF9F6' }}>
                <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20" style={{ background: '#FAF9F6', fontFamily: "'Inter', sans-serif" }}>

            {/* ── HEADER ── */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center px-5 py-4"
                style={{ background: 'rgba(250,249,246,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-stone-100 active:scale-95">
                    <ArrowLeft size={20} className="text-stone-700" />
                </button>
            </header>

            <main className="pt-20 pb-16 max-w-lg mx-auto px-4">

                {/* ── HERO TITLE ── */}
                <div className="pt-6 pb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: '#1A1A1A' }}>
                        ✦ Programma Esclusivo
                    </p>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A', lineHeight: 1.1 }}
                        className="text-[2.2rem] font-bold mb-3">
                        Unisciti ai<br />Curatori
                    </h1>
                    <p className="text-[14px] leading-relaxed" style={{ color: '#7A7060' }}>
                        Non cerchiamo guide turistiche,<br />
                        <em>cerchiamo sguardi d'autore sulla Puglia.</em>
                    </p>
                    <div className="mt-5 h-px w-16" style={{ background: '#E0D8CC' }} />
                </div>

                {/* ══ STATO: APPROVED ════════════════════════════════ */}
                {applicationState === 'approved' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-[24px] p-8 text-center"
                        style={{ background: '#FFFFFF', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #D4E8D8' }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                            <CheckCircle size={32} className="text-green-600" />
                        </div>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A' }}
                            className="text-2xl font-bold mb-2">Sei un Creator!</h2>
                        <p className="text-[14px] mb-6" style={{ color: '#7A7060' }}>
                            Il tuo profilo è verificato. Puoi creare e pubblicare Daily Plan.
                        </p>
                        <motion.button whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/daily-plans')}
                            className="w-full h-14 rounded-2xl font-bold text-[16px] text-white"
                            style={{ background: '#1A1A1A', boxShadow: '0 4px 20px rgba(196,151,74,0.3)' }}>
                            Crea il tuo Daily Plan →
                        </motion.button>
                    </motion.div>
                )}

                {/* ══ STATO: PENDING ═════════════════════════════════ */}
                {applicationState === 'pending' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-[24px] p-8 text-center"
                        style={{ background: '#FFFFFF', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #F0EDE8' }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                            style={{ background: '#FFF8EC', border: '1px solid #F5E5B8' }}>
                            <Clock size={32} className="text-amber-600" />
                        </div>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A' }}
                            className="text-2xl font-bold mb-2">In fase di revisione</h2>
                        <p className="text-[14px] leading-relaxed" style={{ color: '#7A7060' }}>
                            La tua candidatura è stata ricevuta e verrà valutata dal team.
                            Ti contatteremo entro <strong style={{ color: '#1A1A1A' }}>48 ore</strong>.
                        </p>
                        {existingApp?.instagram_url && (
                            <div className="mt-5 p-3 rounded-xl text-left" style={{ background: '#FAF9F6', border: '1px solid #EDE9E0' }}>
                                <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#9A8E7E' }}>Portfolio inviato</p>
                                <p className="text-[13px] font-medium truncate" style={{ color: '#1A1A1A' }}>{existingApp.instagram_url}</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ══ STATO: REJECTED ════════════════════════════════ */}
                {applicationState === 'rejected' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-[24px] p-8 text-center mb-6"
                        style={{ background: '#FFFFFF', boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #FDE8E8' }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                            style={{ background: '#FFF5F5', border: '1px solid #FECACA' }}>
                            <XCircle size={32} className="text-red-500" />
                        </div>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#1A1A1A' }}
                            className="text-2xl font-bold mb-2">Candidatura non accettata</h2>
                        <p className="text-[14px] leading-relaxed" style={{ color: '#7A7060' }}>
                            {existingApp?.note_admin || 'Per questa volta il tuo profilo non soddisfa i requisiti. Puoi riprovare tra 3 mesi.'}
                        </p>
                    </motion.div>
                )}

                {/* ══ STATO: FORM ════════════════════════════════════ */}
                {applicationState === 'none' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                        {/* 1. Social / Portfolio */}
                        <Section step="1" title="Il tuo Portfolio Visivo">
                            {profile?.instagram_url ? (
                                <div>
                                    <p className="text-[13px] mb-3" style={{ color: '#7A7060' }}>
                                        Abbiamo trovato il tuo link nel profilo. È ancora valido?
                                    </p>
                                    <div className="p-4 rounded-2xl mb-3" style={{ background: '#FAF9F6', border: '1px solid #EDE9E0' }}>
                                        <p className="text-[14px] font-semibold truncate" style={{ color: '#1A1A1A' }}>
                                            {profile.instagram_url}
                                        </p>
                                    </div>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div onClick={() => setInstagramConfirmed(!instagramConfirmed)}
                                            className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0"
                                            style={{
                                                background: instagramConfirmed ? '#1A1A1A' : 'transparent',
                                                borderColor: instagramConfirmed ? '#1A1A1A' : '#BDBDBD',
                                            }}>
                                            {instagramConfirmed && <Check size={14} color="white" strokeWidth={3} />}
                                        </div>
                                        <span className="text-[13px] font-medium" style={{ color: '#5A5040' }}>
                                            Sì, confermo che questo link è corretto
                                        </span>
                                    </label>
                                    {!instagramConfirmed && (
                                        <div className="mt-3">
                                            <p className="text-[12px] mb-2" style={{ color: '#9A8E7E' }}>Oppure inserisci un link aggiornato:</p>
                                            <StyledInput
                                                value={instagramUrl}
                                                onChange={setInstagramUrl}
                                                placeholder="https://instagram.com/tuoprofilo"
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="text-[13px] mb-3" style={{ color: '#7A7060' }}>
                                        Instagram, Behance, portfolio sito web — qualcosa che mostri il tuo sguardo fotografico.
                                    </p>
                                    <StyledInput
                                        value={instagramUrl}
                                        onChange={setInstagramUrl}
                                        placeholder="https://instagram.com/tuoprofilo"
                                    />
                                </div>
                            )}
                        </Section>

                        {/* 2. La Perla Segreta */}
                        <Section step="2" title="La Perla Segreta">
                            <p className="text-[13px] mb-3 leading-relaxed" style={{ color: '#7A7060' }}>
                                Descrivi un posto o un'esperienza che solo un vero local della Puglia conosce.
                                Raccontaci come se lo presentassi a un amico fidato.
                            </p>
                            <StyledTextarea
                                value={perlaSegreta}
                                onChange={setPerlaSegreta}
                                placeholder="C'è una masseria a pochi km da Alberobello dove il contadino serve ancora il vino di cantina in brocche di terracotta..."
                            />
                            <p className="text-right text-[11px] mt-2" style={{ color: perlaSegreta.length < 50 ? '#C4593A' : '#9A8E7E' }}>
                                {perlaSegreta.length}/50 min
                            </p>
                        </Section>

                        {/* 3. Vibe */}
                        <Section step="3" title="La tua Specialità">
                            <p className="text-[13px] mb-4" style={{ color: '#7A7060' }}>
                                In quale territorio ti muovi con più naturalezza? (selezione multipla)
                            </p>
                            <div className="grid grid-cols-2 gap-2.5">
                                {VIBE_OPTIONS.map((v) => {
                                    const selected = vibeTags.includes(v.id);
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => toggleVibe(v.id)}
                                            className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl transition-all active:scale-95 text-left"
                                            style={{
                                                background: selected ? '#F5EDD8' : '#FAF9F6',
                                                border: `1.5px solid ${selected ? '#EDE9E0' : '#EDE9E0'}`,
                                                color: selected ? '#1A1A1A' : '#5A5040',
                                            }}>
                                            <span className="text-lg">{v.emoji}</span>
                                            <span className="text-[13px] font-semibold leading-tight">{v.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Section>

                        {/* 4. Regole d'Oro */}
                        <Section step="4" title="Codice del Creator">
                            <p className="text-[13px] mb-4 leading-relaxed" style={{ color: '#7A7060' }}>
                                Queste sono le fondamenta della nostra community. Ogni punto è vincolante.
                            </p>
                            <div className="space-y-3">
                                {REGOLE.map((r) => (
                                    <label key={r.id} className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl transition-all"
                                        style={{
                                            background: regole[r.id] ? '#F5EDD8' : '#FAF9F6',
                                            border: `1.5px solid ${regole[r.id] ? '#D4B882' : '#EDE9E0'}`,
                                        }}>
                                        <div
                                            onClick={() => setRegole(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                                            className="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 mt-0.5"
                                            style={{
                                                background: regole[r.id] ? '#1A1A1A' : 'transparent',
                                                borderColor: regole[r.id] ? '#1A1A1A' : '#BDBDBD',
                                            }}>
                                            {regole[r.id] && <Check size={13} color="white" strokeWidth={3} />}
                                        </div>
                                        <span className="text-[13px] leading-relaxed" style={{ color: '#1A1A1A' }}>
                                            {r.testo}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </Section>

                        {/* Submit */}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            disabled={submitting}
                            onClick={handleSubmit}
                            className="w-full h-14 rounded-2xl font-bold text-[16px] text-white transition-all disabled:opacity-60"
                            style={{
                                background: '#1A1A1A',
                                boxShadow: '0 4px 24px rgba(196,151,74,0.35)',
                                fontFamily: "'Inter', sans-serif",
                            }}>
                            {submitting
                                ? <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Invio in corso...
                                </div>
                                : 'Invia Candidatura'}
                        </motion.button>

                        <p className="text-center text-[11px] mt-4" style={{ color: '#9A8E7E' }}>
                            La tua candidatura sarà revisionata manualmente. Nessun bot.
                        </p>
                    </motion.div>
                )}

            </main>
        </div>
    );
}
