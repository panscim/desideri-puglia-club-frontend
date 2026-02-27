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
            <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#E4AE2F] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!saga) {
        return (
            <div className="min-h-[100dvh] bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
                <h2 className="text-xl font-bold font-serif mb-2">Saga non trovata</h2>
                <button onClick={() => navigate('/missioni')} className="text-[#E4AE2F] underline">Torna indietro</button>
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
        <div className="min-h-[100dvh] bg-zinc-950 text-white font-sans pb-32">

            {/* ========== HERO IMAGE ========== */}
            <div className="relative h-[55vh] w-full overflow-hidden">
                <img
                    src={saga.image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=900&auto=format'}
                    alt={title}
                    className="w-full h-full object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

                {/* Back Button */}
                <button
                    onClick={() => navigate('/missioni')}
                    className="absolute top-12 left-5 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white z-20 hover:bg-black/60 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Difficulty Badge */}
                <div className="absolute top-12 right-5 bg-[#6A2B1C]/80 border border-[#B34524]/60 backdrop-blur-md text-orange-50 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-full z-20">
                    {difficulty}
                </div>

                {/* Title Block at Bottom of Hero */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[#E4AE2F] text-[10px] font-bold uppercase tracking-[0.2em]">
                            Story Quest
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[#E4AE2F]/50" />
                        <span className="text-slate-400 text-[10px] uppercase tracking-wider">{saga.city || 'Puglia'}</span>
                    </div>
                    <h1 className="text-[28px] md:text-[36px] font-bold font-serif leading-tight mb-0">
                        {title}
                    </h1>
                </div>
            </div>

            {/* ========== CONTENT ========== */}
            <div className="px-6 -mt-2 relative z-10">

                {/* Social Proof */}
                {completionsCount > 0 && (
                    <div className="flex items-center gap-3 mb-6 py-3 px-4 bg-zinc-900 rounded-2xl border border-white/10 shadow-inner">
                        <div className="flex -space-x-2">
                            {[...Array(Math.min(4, completionsCount))].map((_, i) => (
                                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E4AE2F] to-[#B8860B] border-2 border-zinc-900 flex items-center justify-center text-[9px] font-bold text-zinc-950">
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-[#E4AE2F] text-[#E4AE2F]" />
                                ))}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                <span className="text-white font-bold">{completionsCount.toLocaleString()}</span> esploratori hanno completato
                            </p>
                        </div>
                    </div>
                )}

                {/* Lore / Description */}
                <div className="mb-8">
                    <p className="text-[15px] text-slate-300 leading-relaxed">
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
                    <div className="mb-10 w-full p-6 rounded-[2rem] bg-zinc-900 border border-white/10 shadow-inner">
                        <div className="flex flex-col gap-3">
                            <span className="text-[10px] text-[#E4AE2F] font-bold uppercase tracking-widest">Tappe del viaggio</span>
                            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                                {saga.steps.map(s => s.description_it || s.title).join(' • ')}
                            </p>
                            <button
                                onClick={() => setShowItinerary(true)}
                                className="mt-4 flex items-center gap-2 text-[#E4AE2F] text-[14px] font-bold hover:underline group"
                            >
                                <Route size={16} /> Vedi itinerario completo <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ========== TIPS & RECOMMENDATIONS ========== */}
                <div className="mb-10 p-5 bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-[2rem] border border-white/10 shadow-inner">
                    <h3 className="text-[18px] font-bold font-serif text-white mb-5 text-center">Tips & Recommendations</h3>

                    <div className="space-y-4">
                        <TipRow
                            icon={<Footprints className="w-4 h-4 text-slate-300" />}
                            title="Scarpe Comode"
                            text="Camminerai per la città, quindi indossa calzature comode per goderti l'avventura al massimo."
                        />
                        <TipRow
                            icon={<BatteryMedium className="w-4 h-4 text-green-400" />}
                            title="Carica il Telefono"
                            text="Assicurati di avere almeno il 60% di batteria. L'app guida la tua esplorazione e il GPS consuma energia."
                        />
                        <TipRow
                            icon={<Sun className="w-4 h-4 text-yellow-400" />}
                            title="Controlla il Meteo"
                            text="Essendo un'attività all'aperto, porta un ombrello o crema solare a seconda delle previsioni."
                        />
                        <TipRow
                            icon={<Camera className="w-4 h-4 text-blue-300" />}
                            title="Porta una Macchina Fotografica"
                            text="Scoprirai gemme nascoste ed angoli della città perfetti per catturare ricordi."
                        />
                        <TipRow
                            icon={<Droplets className="w-4 h-4 text-cyan-400" />}
                            title="Rimani Idrato"
                            text="Porta dell'acqua con te, specialmente nei mesi caldi o nelle missioni più lunghe."
                        />
                    </div>
                </div>

                {/* ========== FEATURES ========== */}
                <div className="space-y-3 mb-10">
                    <FeatureRow icon={<Unlock className="w-5 h-5 text-emerald-400" />} text="Accesso immediato. Nessuna guida necessaria." />
                    <FeatureRow icon={<PauseCircle className="w-5 h-5 text-blue-400" />} text="Flessibilità totale. Inizia, pausa e riprendi quando vuoi." />
                    <FeatureRow icon={<Gamepad2 className="w-5 h-5 text-purple-400" />} text="Scoperta Gamificata. Sblocca storie nascoste e luoghi segreti." />
                    <FeatureRow icon={<Gift className="w-5 h-5 text-pink-400" />} text="Card Premio Esclusiva al completamento della saga." />
                </div>

                {/* ========== PROGRESS (se già iniziata) ========== */}
                {hasStarted && (
                    <div className="mb-8 p-4 bg-zinc-900 rounded-2xl border border-white/10 shadow-inner">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[#E4AE2F] uppercase tracking-wider">
                                Il tuo progresso
                            </span>
                            <span className="text-white font-bold text-sm">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#E4AE2F] to-[#FFD700] rounded-full transition-all duration-700"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            {completedStepsCount}/{stepsCount} tappe completate
                        </p>
                    </div>
                )}

                {/* ========== CTA BUTTON ========== */}
                <button
                    onClick={() => navigate(`/saga/${id}`)}
                    className="w-full py-4 bg-[#E4AE2F] hover:bg-[#cda429] text-[#0C0D10] font-bold text-[15px] uppercase tracking-wider rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#E4AE2F]/20 active:scale-[0.97]"
                >
                    <Play className="w-5 h-5 fill-current" />
                    {hasStarted ? 'Continua la Saga' : 'Inizia la Saga'}
                </button>

                {/* Disclaimer */}
                <p className="text-center text-[10px] text-slate-500 mt-4">
                    Nessun acquisto richiesto • Completamente gratuito
                </p>
            </div>

            {/* ITINERARY DRAWER OVERLAY */}
            {showItinerary && saga.steps && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="flex-1" onClick={() => setShowItinerary(false)} />
                    <div className="bg-zinc-900 border-t border-white/10 rounded-t-[2.5rem] flex flex-col max-h-[92vh] w-full max-w-2xl mx-auto shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-900">
                            <div>
                                <h3 className="text-xl font-bold font-serif text-white">Il tuo Itinerario</h3>
                                <p className="text-[11px] text-[#E4AE2F] font-bold uppercase tracking-widest mt-1">Esplora il percorso a tappe</p>
                            </div>
                            <button
                                onClick={() => setShowItinerary(false)}
                                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6 -rotate-90" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom))]">
                            {/* MINI MAP */}
                            <div className="w-full h-64 relative bg-zinc-950">
                                <PropsSafeMap steps={saga.steps} />
                                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]" />
                            </div>

                            {/* TIMELINE LIST */}
                            <div className="px-8 pt-10 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[39px] top-12 bottom-12 w-0.5 border-l-2 border-dashed border-white/10" />

                                <div className="space-y-12">
                                    {saga.steps.map((step, idx) => {
                                        const isFirst = idx === 0;
                                        const isLast = idx === saga.steps.length - 1;

                                        return (
                                            <div key={step.id} className="flex gap-6 relative group">
                                                {/* Milestone Circle */}
                                                <div className="relative z-10 w-6 h-6 rounded-full shrink-0 flex items-center justify-center border-2 border-[#E4AE2F] bg-zinc-950 transition-all duration-500 mt-1.5 shadow-[0_0_15px_rgba(228,174,47,0.2)]">
                                                    <span className="text-[10px] font-black text-[#E4AE2F]">{idx + 1}</span>
                                                </div>

                                                <div className="flex-1 pb-2">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#E4AE2F]/80">
                                                            {isFirst ? 'Partenza' : isLast ? 'Destinazione' : `Tappa ${idx + 1}`}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-[17px] font-bold leading-tight text-white mb-2">
                                                        {step.description_it || step.title}
                                                    </h4>
                                                    <p className="text-[13px] text-slate-400 leading-relaxed italic opacity-80">
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
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {steps.map((s, idx) => (
                s._latitude && s._longitude && (
                    <Marker
                        key={s.id}
                        position={[s._latitude, s._longitude]}
                        icon={L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div style="background-color: #E4AE2F; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; font-weight: 800; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.5);">${idx + 1}</div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        })}
                    />
                )
            ))}
            {steps.length > 1 && (
                <Polyline
                    positions={steps.map(s => [s._latitude, s._longitude]).filter(p => p[0] && p[1])}
                    color="#E4AE2F"
                    weight={2}
                    dashArray="5, 10"
                    opacity={0.6}
                />
            )}
        </MapContainer>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div className="bg-[#1A1B22] rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
        <div className="w-8 h-8 flex flex-col justify-center items-center bg-[#E4AE2F]/10 rounded-full text-[#E4AE2F]">
            {icon}
        </div>
        <div>
            <p className="text-[11px] text-slate-400 leading-tight mb-0.5">{label}</p>
            <p className="text-white font-bold text-[14px]">{value}</p>
        </div>
    </div>
);

const FeatureRow = ({ icon, text }) => (
    <div className="flex items-start gap-3 py-3.5 px-4 bg-[#1A1B22]/60 rounded-2xl border border-white/5">
        <span className="text-lg shrink-0 mt-0.5">{icon}</span>
        <p className="text-[13px] text-slate-300 leading-snug">{text}</p>
    </div>
);

const TipRow = ({ icon, title, text }) => (
    <div className="flex items-start gap-4">
        <div className="mt-1 w-8 h-8 shrink-0 bg-[#2A2B36] rounded-full flex items-center justify-center border border-white/10 shadow-inner">
            {icon}
        </div>
        <div>
            <h4 className="text-white text-[14px] font-bold mb-1">{title}</h4>
            <p className="text-[#8E93A6] text-[12px] leading-relaxed pr-2">{text}</p>
        </div>
    </div>
);

export default SagaIntro;
