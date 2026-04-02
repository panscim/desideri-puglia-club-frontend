// src/pages/SagaIntro.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="min-h-[100dvh] bg-[#FCFAF2] text-text-primary font-sans pb-32 relative overflow-x-hidden">

      {/* ========== HERO IMAGE ========== */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <img
          src={saga.image_url || 'https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=900&auto=format'}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* Gradient Overlay - Soft Scrapped Paper Feel */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FCFAF2] via-[#FCFAF2]/20 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => navigate('/missioni')}
          className="absolute top-12 left-5 w-11 h-11 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-text-primary z-20 hover:border-accent/40 transition-all shadow-sm active:scale-90"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Difficulty Badge - Sticker Style */}
        <motion.div 
          initial={{ rotate: 5 }}
          className="absolute top-12 right-5 bg-accent-gold text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-sm z-20 shadow-lg border-b-2 border-black/10 flex items-center gap-2"
        >
          <Sparkles size={14} />
          {difficulty}
        </motion.div>

        {/* Title Block at Bottom of Hero */}
        <div className="absolute bottom-8 left-0 right-0 px-8 pb-4 z-10 flex flex-col items-center text-center">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 mb-4 -rotate-1 shadow-sm border border-black/5">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold">
                    Story Quest • {saga.city || 'Puglia'}
                </span>
            </div>
            
            <h1 className="text-[44px] md:text-[54px] font-serif font-black leading-[1] mb-0 text-text-primary tracking-tight relative inline-block">
                <span className="relative z-10">{title}</span>
                <motion.div 
                   initial={{ scaleX: 0 }}
                   animate={{ scaleX: 1 }}
                   transition={{ delay: 0.5, duration: 1 }}
                   className="absolute left-0 bottom-1.5 w-full h-5 bg-accent-gold/20 -z-0 origin-left -rotate-1 rounded-sm"
                />
            </h1>
        </div>
      </div>

      {/* ========== CONTENT ========== */}
      <div className="px-6 py-10 relative z-10 max-w-lg mx-auto">

        {completionsCount > 0 && (
          <div className="mb-8 rounded-[1.8rem] border border-black/5 bg-white px-5 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[...Array(Math.min(4, completionsCount))].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-zinc-100 border-2 border-white shadow-sm overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent-gold mb-1">Già amata</p>
                <p className="text-[14px] font-bold leading-tight text-text-primary">
                  {completionsCount.toLocaleString()} clubber hanno già completato questa saga.
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="mb-8 rounded-[2rem] border border-black/5 bg-white px-5 py-5 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-accent rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">La Storia</span>
          </div>
          <p className="text-[16px] text-text-primary leading-[1.75] font-medium">
            {loreText}
          </p>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-3">
          <StatCard icon={<Compass className="w-5 h-5" />} label="Tappe" value={stepsCount} />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Durata" value={timeLabel} />
          <StatCard icon={<Footprints className="w-5 h-5" />} label="Distanza" value={`${distanceKm} km`} />
          <StatCard icon={<MapPin className="w-5 h-5" />} label="Partenza" value={startingPoint} />
        </section>

        {hasStarted && (
          <section className="mb-8 rounded-[2rem] border border-black/5 bg-white px-5 py-5 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent-gold mb-1">Il tuo Diario</p>
                <h3 className="text-[22px] font-serif font-black text-text-primary">Hai gia iniziato il viaggio.</h3>
              </div>
              <span className="text-[18px] font-serif font-black text-text-primary">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-accent rounded-full shadow-[0_0_10px_rgba(212,121,58,0.3)] transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-text-muted mt-4 font-black uppercase tracking-[0.18em]">
              {completedStepsCount}/{stepsCount} tappe scoperte
            </p>
          </section>
        )}

        {saga.steps && saga.steps.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent-gold mb-1">Il Percorso</p>
                <h3 className="text-[24px] font-serif font-black text-text-primary">Quello che vivrai.</h3>
              </div>
              <button
                onClick={() => setShowItinerary(true)}
                className="w-11 h-11 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-sm text-accent active:scale-95 transition-transform"
              >
                <Route size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {saga.steps.slice(0, 4).map((s, idx) => {
                const stepTitle = getLocalized(s, 'title', lang) || s.description_it || s.title || `Tappa ${idx + 1}`;
                const stepHint = getLocalized(s, 'narrative_hint', lang) || s.narrative_hint_it || 'Una tappa da scoprire lungo il percorso.';
                return (
                  <div key={s.id || idx} className="rounded-[1.7rem] border border-black/5 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 text-[13px] font-black">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-gold mb-1">
                          {idx === 0 ? 'Partenza' : idx === stepsCount - 1 ? 'Finale' : `Tappa ${idx + 1}`}
                        </p>
                        <h4 className="text-[18px] font-serif font-black text-text-primary leading-tight mb-2">
                          {stepTitle}
                        </h4>
                        <p className="text-[13px] leading-relaxed text-text-muted italic">
                          {stepHint}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {saga.steps.length > 4 && (
                <button
                  onClick={() => setShowItinerary(true)}
                  className="w-full rounded-[1.5rem] border border-dashed border-black/10 bg-white/70 px-4 py-4 text-[12px] font-black uppercase tracking-[0.18em] text-accent text-left active:scale-[0.99] transition-transform"
                >
                  Apri il percorso completo e vedi tutte le tappe
                </button>
              )}
            </div>
          </section>
        )}

        <section className="mb-8 rounded-[2rem] border border-black/5 bg-white px-5 py-5 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent-gold mb-1">Consigli di Viaggio</p>
            <h3 className="text-[24px] font-serif font-black text-text-primary">Arrivaci nel modo giusto.</h3>
          </div>
          <div className="space-y-3">
            <TipRow icon={<Footprints size={18} className="text-accent" />} title="Scarpe Comode" text="Passeggerai tra strade, pietra e piccoli spostamenti: meglio essere leggeri." />
            <TipRow icon={<BatteryMedium size={18} className="text-accent-gold" />} title="Telefono Carico" text="Ti serve per orientarti, aprire la mappa e tenere il ritmo della storia." />
            <TipRow icon={<Sun size={18} className="text-accent-gold" />} title="Occhi Aperti" text="Questa saga funziona meglio se non la corri: guardati intorno e prenditi il tempo." />
          </div>
        </section>

        <section className="mb-10 grid grid-cols-2 gap-3">
          <FeatureStamp icon={<Unlock size={18} className="text-accent" />} text="Liberta Totale" />
          <FeatureStamp icon={<PauseCircle size={18} className="text-accent" />} text="Pausa e Riprendi" />
          <FeatureStamp icon={<Gamepad2 size={18} className="text-accent" />} text="Sfide e Misteri" />
          <FeatureStamp icon={<Gift size={18} className="text-accent-gold" />} text="Premio Finale" />
        </section>

        <div className="sticky bottom-10 z-50 px-4 w-full">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              if (profile?.id) {
                await QuestService.startSaga(profile.id, id);
              }
              navigate(`/saga/${id}`);
            }}
            className="w-full !py-5 bg-accent text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[14px] shadow-[0_20px_40px_rgba(212,121,58,0.3)] flex items-center justify-center gap-4 group border-4 border-white"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Play size={16} />
            </div>
            {hasStarted ? 'Riprendi Avventura' : 'Inizia la Storia'}
          </motion.button>
          <p className="text-center text-[9px] font-black uppercase tracking-[0.4em] text-text-muted mt-5 opacity-40">
            Puglia Club Pass Required
          </p>
        </div>
      </div>

      {/* ITINERARY DRAWER OVERLAY - Redesigned */}
      <AnimatePresence>
          {showItinerary && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex flex-col bg-black/40 backdrop-blur-md"
            >
                <div className="flex-1" onClick={() => setShowItinerary(false)} />
                <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="bg-[#FCFAF2] border-t border-zinc-200 rounded-t-[3.5rem] flex flex-col max-h-[90vh] w-full max-w-lg mx-auto shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-10 pb-6">
                        <div className="relative">
                            <h3 className="text-[32px] font-serif font-black text-text-primary tracking-tight relative z-10">Mappa Percorso</h3>
                            <div className="absolute left-0 bottom-1 w-full h-3 bg-accent/20 -z-0 -rotate-1" />
                        </div>
                        <button
                            onClick={() => setShowItinerary(false)}
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition-all active:scale-90 shadow-sm border border-zinc-100"
                        >
                            <ChevronLeft className="w-6 h-6 -rotate-90" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* MINI MAP */}
                        <div className="px-10 mb-10">
                            <div className="w-full h-72 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl relative bg-zinc-100">
                                <PropsSafeMap steps={saga.steps} />
                                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                                    Coordinate Segrete
                                </div>
                            </div>
                        </div>

                        {/* TIMELINE LIST */}
                        <div className="px-10 pb-20 relative">
                            <div className="space-y-8">
                                {saga.steps.map((step, idx) => {
                                    const isFirst = idx === 0;
                                    const isLast = idx === saga.steps.length - 1;
                                    const rotation = (idx % 2 === 0 ? '-1deg' : '1deg');

                                    return (
                                        <div key={step.id} className="relative pl-12 group">
                                            {/* Milestone Icon */}
                                            <div className="absolute left-0 top-0.5 w-9 h-9 rounded-full bg-white border-2 border-accent text-accent flex items-center justify-center text-[12px] font-black z-10 shadow-sm">
                                                {idx + 1}
                                            </div>
                                            
                                            {/* Connecting Line */}
                                            {!isLast && (
                                                <div className="absolute left-[17px] top-9 bottom-[-32px] w-[2px] bg-accent/10 border-l border-dashed border-accent/30" />
                                            )}

                                            <motion.div 
                                                style={{ rotate: rotation }}
                                                className="bg-white p-5 rounded-[1.5rem] border border-black/5 shadow-sm"
                                            >
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-accent-gold mb-1.5 block">
                                                    {isFirst ? 'Partenza' : isLast ? 'Destinazione' : `Tappa ${idx + 1}`}
                                                </span>
                                                <h4 className="text-[17px] font-serif font-black text-text-primary mb-2 tracking-tight">
                                                    {getLocalized(step, 'title', lang) || step.description_it || step.title || `Tappa ${idx + 1}`}
                                                </h4>
                                                <p className="text-[13px] text-text-muted leading-relaxed font-medium italic opacity-70">
                                                    "{getLocalized(step, 'narrative_hint', lang) || step.narrative_hint_it || "Un mistero attende di essere svelato..."}"
                                                </p>
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const PropsSafeMap = ({ steps }) => {
    const center = [steps[0]?._latitude || 41.1171, steps[0]?._longitude || 16.8719];

    return (
        <MapContainer
            center={center}
            zoom={12}
            zoomControl={false}
            className="w-full h-full"
            style={{ minHeight: '100%' }}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png" />
            {steps.map((s, idx) => (
                s._latitude && s._longitude && (
                    <Marker
                        key={s.id}
                        position={[s._latitude, s._longitude]}
                        icon={L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div style="background-color: var(--accent); width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 10px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-family: 'Playfair Display', serif;">${idx + 1}</div>`,
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })}
                    />
                )
            ))}
            {steps.length > 1 && (
                <Polyline
                    positions={steps.map(s => [s._latitude, s._longitude]).filter(p => p[0] && p[1])}
                    color="var(--accent)"
                    weight={3}
                    dashArray="6, 12"
                    opacity={0.4}
                />
            )}
        </MapContainer>
    );
};

const StatCard = ({ icon, label, value }) => (
    <motion.div
        className="bg-white rounded-[1.6rem] p-5 border border-black/5 flex flex-col shadow-[0_10px_24px_rgba(0,0,0,0.04)]"
    >
        <div className="w-10 h-10 flex justify-center items-center bg-accent/5 rounded-full text-accent mb-4">
            {icon}
        </div>
        <div>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted mb-1.5">{label}</p>
            <p className="text-text-primary font-black font-serif text-[16px] tracking-tight leading-tight">{value}</p>
        </div>
    </motion.div>
);

const FeatureStamp = ({ icon, text }) => (
    <div className="flex items-center gap-3 py-4 px-5 bg-white rounded-[1.4rem] border border-black/5 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
        <div className="w-8 h-8 rounded-lg bg-accent-gold/10 flex items-center justify-center text-accent">
            {React.cloneElement(icon, { size: 16 })}
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider text-text-muted">{text}</p>
    </div>
);

const TipRow = ({ icon, title, text }) => (
    <motion.div
        className="flex items-start gap-4 p-4 bg-[#FCFAF2] rounded-[1.3rem] border border-black/5 relative"
    >
        <div className="mt-0.5 w-10 h-10 shrink-0 bg-accent-gold/5 rounded-full flex items-center justify-center text-accent-gold">
            {icon}
        </div>
        <div>
            <h4 className="text-text-primary text-[13px] font-black mb-1 uppercase tracking-[0.16em]">{title}</h4>
            <p className="text-text-muted text-[13px] leading-relaxed font-medium">{text}</p>
        </div>
    </motion.div>
);

export default SagaIntro;
