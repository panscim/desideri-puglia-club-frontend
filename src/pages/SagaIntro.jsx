// src/pages/SagaIntro.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, Footprints, Route, Star, Play, Compass, Sparkles } from 'lucide-react';
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
            <div className="min-h-screen bg-[#0C0D10] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#E4AE2F] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!saga) {
        return (
            <div className="min-h-screen bg-[#0C0D10] text-white flex flex-col items-center justify-center p-6">
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
    let completedSteps = 0;
    if (questProgress) {
        const stepIds = saga.steps?.map(s => s.id) || [];
        completedSteps = questProgress.completedSteps.filter(sid => stepIds.includes(sid)).length;
    }
    const hasStarted = completedSteps > 0;
    const progressPercent = Math.round((completedSteps / stepsCount) * 100);

    // Format estimated time
    const hours = Math.floor(estimatedTime / 60);
    const mins = estimatedTime % 60;
    const timeLabel = hours > 0 ? `${hours}h ${mins > 0 ? mins + ' min' : ''}` : `${mins} min`;

    return (
        <div className="min-h-screen bg-[#0C0D10] text-white font-sans pb-6">

            {/* ========== HERO IMAGE ========== */}
            <div className="relative h-[55vh] w-full overflow-hidden">
                <img
                    src={saga.image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=900&auto=format'}
                    alt={title}
                    className="w-full h-full object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C0D10] via-[#0C0D10]/60 to-transparent" />

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
                    <div className="flex items-center gap-3 mb-6 py-3 px-4 bg-[#1A1B22] rounded-2xl border border-white/5">
                        <div className="flex -space-x-2">
                            {[...Array(Math.min(4, completionsCount))].map((_, i) => (
                                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E4AE2F] to-[#B8860B] border-2 border-[#1A1B22] flex items-center justify-center text-[9px] font-bold text-[#0C0D10]">
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

                {/* ========== FEATURES ========== */}
                <div className="space-y-3 mb-8">
                    <FeatureRow icon="🔓" text="Accesso immediato. Nessuna guida necessaria." />
                    <FeatureRow icon="⏸️" text="Flessibilità totale. Inizia, pausa e riprendi quando vuoi." />
                    <FeatureRow icon="🌟" text="Scoperta Gamificata. Sblocca storie nascoste e luoghi segreti." />
                    <FeatureRow icon="🎁" text="Card Premio Esclusiva al completamento della saga." />
                </div>

                {/* ========== PROGRESS (se già iniziata) ========== */}
                {hasStarted && (
                    <div className="mb-8 p-4 bg-[#1A1B22] rounded-2xl border border-white/5">
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
                            {completedSteps}/{stepsCount} tappe completate
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
        </div>
    );
};

// --- SUB-COMPONENTS ---
const StatCard = ({ icon, label, value }) => (
    <div className="bg-[#1A1B22] rounded-2xl p-4 border border-white/5 flex items-start gap-3">
        <div className="p-2 bg-[#E4AE2F]/10 rounded-xl text-[#E4AE2F] shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-[11px] text-slate-400 leading-tight">{label}</p>
            <p className="text-white font-bold text-[15px] mt-0.5">{value}</p>
        </div>
    </div>
);

const FeatureRow = ({ icon, text }) => (
    <div className="flex items-center gap-3 py-3 px-4 bg-[#1A1B22]/60 rounded-xl border border-white/5">
        <span className="text-lg shrink-0">{icon}</span>
        <p className="text-[13px] text-slate-300">{text}</p>
    </div>
);

export default SagaIntro;
