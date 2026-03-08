// src/pages/SagaIntro.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, Footprints, Star, Play, Compass, Sparkles, Droplets, BatteryMedium, Sun, Camera, Unlock, PauseCircle, Gamepad2, Gift, Route, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { QuestService } from '../services/quest';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getLocalized } from '../utils/content';

const SagaIntro = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { t, i18n } = useTranslation();
    const lang = i18n?.language;

    const [saga, setSaga] = useState(null);
    const [loading, setLoading] = useState(true);
    const [questProgress, setQuestProgress] = useState(null);
    const [showItinerary, setShowItinerary] = useState(false);

    useEffect(() => {
        async function loadSaga() {
            setLoading(true);
            try {
                const detail = await QuestService.getSagaDetail(id);
                setSaga(detail);

                if (profile?.id) {
                    const progress = await QuestService.getUserProgress(profile.id);
                    setQuestProgress(progress);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (id) loadSaga();
    }, [id, profile]);

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-bg-primary flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!saga) {
        return (
            <div className="min-h-[100dvh] bg-bg-primary text-text-primary flex flex-col items-center justify-center p-6">
                <h2 className="text-xl font-serif font-black mb-2">Saga non trovata</h2>
                <button onClick={() => navigate('/missioni')} className="text-accent underline">Torna indietro</button>
            </div>
        );
    }

    const title = getLocalized(saga, 'title', lang);
    const description = getLocalized(saga, 'description', lang);
    const loreText = getLocalized(saga, 'lore_text', lang) || description;
    const stepsCount = saga.steps?.length || saga.estimated_steps || 5;
    const distanceKm = saga.distance_km || '5.2';
    const estimatedTime = saga.estimated_time_min || 90;
    const startingPoint = saga.starting_point || saga.city || 'Puglia';
    const completionsCount = saga.completions_count || 0;
    const difficulty = saga.difficulty || 'Medium';

    // Progress if user already started
    let completedStepsCount = 0;
    if (questProgress) {
        const stepIds = saga.steps?.map(s => s.id) || [];
        completedStepsCount = questProgress.completedSteps.filter(sid => stepIds.includes(sid)).length;
    }
    const hasStarted = completedStepsCount > 0;
    const progressPercent = Math.round((completedStepsCount / stepsCount) * 100);

    // Format estimated time
    const hours = Math.floor(estimatedTime / 60);
    const mins = estimatedTime % 60;
    const timeLabel = hours > 0 ? `${hours}h ${mins > 0 ? mins + ' min' : ''}` : `${mins} min`;

    return (
        <div className="min-h-[100dvh] bg-bg-primary text-text-primary font-sans pb-32">

            {/* ========== HERO IMAGE ========== */}
            <div className="relative h-[55vh] w-full overflow-hidden">
                <img
                    src={saga.image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=900&auto=format'}
                    alt={title}
                    className="w-full h-full object-cover"
                />

                {/* Gradient Overlay - Dark at bottom for white text legibility, regardless of theme */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Back Button */}
                <button
                    onClick={() => navigate('/missioni')}
                    className="absolute top-12 left-5 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 hover:bg-white/40 border border-white/30 transition-all active:scale-90"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Difficulty Badge */}
                <div className="absolute top-12 right-5 bg-accent/90 border border-white/20 backdrop-blur-md text-white no-theme-flip text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full z-20 shadow-lg">
                    {difficulty}
                </div>

                {/* Title Block at Bottom of Hero */}
                <div className="absolute bottom-12 left-0 right-0 px-8 pb-8 z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="overline !text-accent-gold !mb-0 !tracking-[0.3em]">
                            Story Quest
                        </span>
                        <div className="w-1 h-1 rounded-full bg-white/40" />
                        <span className="overline !text-white/80 !mb-0 !font-medium">{saga.city || 'Puglia'}</span>
                    </div>
                    <h1 className="text-[42px] md:text-[52px] font-serif font-black leading-[1] mb-0 text-white no-theme-flip drop-shadow-2xl tracking-tight">
                        {title}
                    </h1>
                </div>
            </div>

            {/* ========== CONTENT ========== */}
            <div className="px-6 py-12 relative z-10 bg-bg-primary rounded-t-[3rem] -mt-12 shadow-[0_-20px_60px_rgba(0,0,0,0.15)]">

                {/* Social Proof */}
                {completionsCount > 0 && (
                    <div className="flex items-center gap-4 mb-10 py-4 px-5 bg-surface rounded-[2rem] border border-border-default shadow-sm">
                        <div className="flex -space-x-2.5">
                            {[...Array(Math.min(4, completionsCount))].map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-accent border-2 border-surface flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={12} weight="fill" className="text-accent-gold" />
                                ))}
                            </div>
                            <p className="overline !text-text-muted !mb-0 !tracking-wider">
                                <span className="text-text-primary font-black">{completionsCount.toLocaleString()}</span> clubbers hanno completato quest'avventura
                            </p>
                        </div>
                    </div>
                )}

                {/* Lore / Description */}
                <div className="mb-10">
                    <p className="text-[17px] text-text-muted leading-[1.6] font-medium italic opacity-90 border-l-4 border-accent/20 pl-6 border-dashed">
                        {loreText}
                    </p>
                </div>

                {/* ========== STATS GRID ========== */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <StatCard
                        icon={<Compass className="w-5 h-5" />}
                        label="Luoghi da visitare"
                        value={stepsCount}
                    />
                    <StatCard
                        icon={<Clock className="w-5 h-5" />}
                        label="Tempo stimato"
                        value={timeLabel}
                    />
                    <StatCard
                        icon={<Footprints className="w-5 h-5" />}
                        label="Distanza totale"
                        value={`${distanceKm} km`}
                    />
                    <StatCard
                        icon={<MapPin className="w-5 h-5" />}
                        label="Punto di partenza"
                        value={startingPoint}
                    />
                </div>

                {/* ========== ITINERARY SUMMARY & TOGGLE ========== */}
                {saga.steps && saga.steps.length > 0 && (
                    <div className="mb-12 w-full p-8 rounded-[2.5rem] bg-surface border border-border-default shadow-sm group active:scale-[0.98] transition-all cursor-pointer" onClick={() => setShowItinerary(true)}>
                        <div className="flex flex-col gap-4">
                            <span className="overline !text-accent !mb-0">Tappe del viaggio</span>
                            <p className="text-[15px] text-text-muted font-medium line-clamp-2 leading-relaxed">
                                {saga.steps.map(s => s.description_it || s.title).join(' • ')}
                            </p>
                            <div className="flex items-center gap-2 text-accent text-[13px] font-black uppercase tracking-widest mt-2 group-hover:translate-x-1 transition-transform">
                                <Route size={18} weight="bold" /> Vedi itinerario completo <ChevronRight size={18} weight="bold" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== TIPS & RECOMMENDATIONS ========== */}
                <div className="mb-12 p-8 bg-surface rounded-[2.5rem] border border-border-default shadow-sm">
                    <h3 className="text-[20px] font-serif font-black text-text-primary mb-8 tracking-tight">Consigli per l'avventura</h3>

                    <div className="grid grid-cols-1 gap-5">
                        <TipRow
                            icon={<Footprints size={18} weight="bold" className="text-accent" />}
                            title="Scarpe Comode"
                            text="Camminerai per la città, indossa calzature adatte a lunghe esplorazioni."
                        />
                        <TipRow
                            icon={<BatteryMedium size={18} weight="bold" className="text-accent-gold" />}
                            title="Carica il Telefono"
                            text="Garantisci almeno il 60% di batteria per l'uso continuo del GPS."
                        />
                        <TipRow
                            icon={<Sun size={18} weight="bold" className="text-accent-gold" />}
                            title="Meteo e Sole"
                            text="Attività all'aperto: porta con te ombrello o protezione solare."
                        />
                    </div>
                </div>

                {/* ========== FEATURES ========== */}
                <div className="space-y-4 mb-12">
                    <FeatureRow icon={<Unlock size={20} weight="fill" className="text-accent" />} text="Accesso immediato. Nessuna guida fisica necessaria." />
                    <FeatureRow icon={<PauseCircle size={20} weight="fill" className="text-accent" />} text="Flessibilità totale. Inizia, pausa e riprendi quando vuoi." />
                    <FeatureRow icon={<Gamepad2 size={20} weight="fill" className="text-accent" />} text="Gamification. Sblocca storie nascoste e luoghi segreti." />
                    <FeatureRow icon={<Gift size={20} weight="fill" className="text-accent-gold" />} text="Premio Esclusivo al completamento della saga." />
                </div>

                {hasStarted && (
                    <div className="mb-10 p-6 bg-surface rounded-[2rem] border border-border-default shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="overline !text-accent !mb-0">
                                Il tuo progresso
                            </span>
                            <span className="text-text-primary font-black text-sm">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden border border-border-default">
                            <div
                                className="h-full bg-accent rounded-full transition-all duration-1000"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-text-muted mt-3 font-black uppercase tracking-widest">
                            {completedStepsCount}/{stepsCount} tappe sbloccate
                        </p>
                    </div>
                )}

                {/* ========== CTA BUTTON ========== */}
                <button
                    onClick={async () => {
                        if (profile?.id) {
                            await QuestService.startSaga(profile.id, id);
                        }
                        navigate(`/saga/${id}`);
                    }}
                    className="btn-primary w-full !py-4.5 group"
                >
                    <Play size={20} weight="fill" className="transition-transform group-hover:scale-110" />
                    {hasStarted ? 'Continua la Saga' : 'Inizia la Saga'}
                </button>

                {/* Disclaimer */}
                <p className="text-center overline !text-text-muted !mt-6 opacity-40">
                    Nessun acquisto richiesto • Gratuito per i membri
                </p>
            </div>

            {/* ITINERARY DRAWER OVERLAY */}
            {showItinerary && saga.steps && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-bg-dark/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="flex-1" onClick={() => setShowItinerary(false)} />
                    <div className="bg-bg-primary border-t border-border-default rounded-t-[3rem] flex flex-col max-h-[90vh] w-full max-w-2xl mx-auto shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between p-8 border-b border-border-default bg-surface/50 backdrop-blur-md sticky top-0 z-20">
                            <div>
                                <h3 className="text-2xl font-serif font-black text-text-primary tracking-tight">Itinerario</h3>
                                <p className="overline !text-accent !mb-0 !mt-1">Esplora il percorso a tappe</p>
                            </div>
                            <button
                                onClick={() => setShowItinerary(false)}
                                className="w-12 h-12 bg-bg-secondary rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition-all active:scale-90"
                            >
                                <ChevronLeft className="w-6 h-6 -rotate-90" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-[calc(40px+env(safe-area-inset-bottom))]">
                            {/* MINI MAP */}
                            <div className="w-full h-80 relative bg-bg-secondary">
                                <PropsSafeMap steps={saga.steps} />
                                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.05)] border-b border-border-default" />
                            </div>

                            {/* TIMELINE LIST */}
                            <div className="px-10 pt-12 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[47px] top-14 bottom-14 w-0.5 border-l-2 border-dashed border-border-default" />

                                <div className="space-y-14">
                                    {saga.steps.map((step, idx) => {
                                        const isFirst = idx === 0;
                                        const isLast = idx === saga.steps.length - 1;

                                        return (
                                            <div key={step.id} className="flex gap-8 relative group">
                                                {/* Milestone Circle */}
                                                <div className="relative z-10 w-4 h-4 rounded-full shrink-0 flex items-center justify-center border-2 border-accent bg-bg-primary transition-all duration-500 mt-2 shadow-[0_0_15px_rgba(212,121,58,0.2)]" />

                                                <div className="flex-1 pb-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="overline !text-accent !mb-0 !tracking-[0.2em] !text-[9px]">
                                                            {isFirst ? 'Partenza' : isLast ? 'Destinazione' : `Tappa ${idx + 1}`}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-[20px] font-serif font-black leading-tight text-text-primary mb-3 tracking-tight">
                                                        {step.description_it || step.title}
                                                    </h4>
                                                    <p className="text-[14px] text-text-muted leading-relaxed italic border-l-2 border-border-default pl-4">
                                                        "{step.narrative_hint_it || "Un luogo misterioso attende di essere svelato..."}"
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENTS ---
const PropsSafeMap = ({ steps }) => {
    // We isolate this to avoid re-rendering the whole page if map bounds change internally
    const center = [steps[0]?._latitude || 41.1171, steps[0]?._longitude || 16.8719];

    return (
        <MapContainer
            center={center}
            zoom={12}
            zoomControl={false}
            className="w-full h-full"
            style={{ minHeight: '100%' }}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {steps.map((s, idx) => (
                s._latitude && s._longitude && (
                    <Marker
                        key={s.id}
                        position={[s._latitude, s._longitude]}
                        icon={L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div style="background-color: var(--accent); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); font-family: sans-serif;">${idx + 1}</div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        })}
                    />
                )
            ))}
            {steps.length > 1 && (
                <Polyline
                    positions={steps.map(s => [s._latitude, s._longitude]).filter(p => p[0] && p[1])}
                    color="var(--accent)"
                    weight={2}
                    dashArray="5, 10"
                    opacity={0.6}
                />
            )}
        </MapContainer>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="bg-surface rounded-3xl p-6 border border-border-default flex flex-col gap-3 shadow-sm active:scale-95 transition-all">
        <div className="w-10 h-10 flex flex-col justify-center items-center bg-accent/10 rounded-full text-accent">
            {icon}
        </div>
        <div>
            <p className="overline !text-text-muted !mb-1 !text-[9px]">{label}</p>
            <p className="text-text-primary font-black text-[15px] tracking-tight">{value}</p>
        </div>
    </div>
);

const FeatureRow = ({ icon, text }) => (
    <div className="flex items-center gap-5 py-5 px-6 bg-surface rounded-[2rem] border border-border-default shadow-sm">
        <span className="shrink-0">{icon}</span>
        <p className="text-[14px] text-text-muted leading-snug font-medium">{text}</p>
    </div>
);

const TipRow = ({ icon, title, text }) => (
    <div className="flex items-start gap-5 py-2">
        <div className="mt-1 w-10 h-10 shrink-0 bg-bg-secondary rounded-full flex items-center justify-center border border-border-default shadow-sm">
            {icon}
        </div>
        <div>
            <h4 className="text-text-primary text-[15px] font-black mb-1 uppercase tracking-wider">{title}</h4>
            <p className="text-text-muted text-[13px] leading-relaxed pr-2 font-medium">{text}</p>
        </div>
    </div>
);

export default SagaIntro;
