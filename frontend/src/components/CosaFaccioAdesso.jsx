// src/components/CosaFaccioAdesso.jsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, RefreshCw, Bookmark, ChevronLeft, MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { rankPartnersNow, getMicroExplanation, getResultTitle, buildMiniPercorso } from '../utils/nowMatching';
import toast from 'react-hot-toast';

// ─── WIZARD CONFIG ───────────────────────────────────────────────

const STEPS = [
  {
    key: 'intent',
    question: 'Cosa vuoi vivere adesso?',
    sub: 'Scegli quello che senti più tuo in questo momento',
    options: [
      { id: 'mangiare',  emoji: '🍽️', label: 'Mangiare bene' },
      { id: 'vedere',    emoji: '👁️', label: 'Vedere qualcosa di bello' },
      { id: 'tappa',     emoji: '🤲', label: 'Tappa autentica' },
      { id: 'relax',     emoji: '😌', label: 'Rilassarmi' },
      { id: 'serata',    emoji: '🌙', label: 'Vivere la serata' },
    ],
  },
  {
    key: 'companions',
    question: 'Con chi sei?',
    sub: 'Così troviamo il posto giusto per voi',
    options: [
      { id: 'solo',      emoji: '🙋', label: 'Da solo' },
      { id: 'coppia',    emoji: '💑', label: 'In coppia' },
      { id: 'amici',     emoji: '👯', label: 'Con amici' },
      { id: 'famiglia',  emoji: '👨‍👩‍👧', label: 'In famiglia' },
    ],
  },
  {
    key: 'time',
    question: 'Quanto tempo hai?',
    sub: 'Adattiamo il consiglio al tuo ritmo',
    options: [
      { id: 'short',     emoji: '⚡', label: '30–45 min' },
      { id: 'medium',    emoji: '🕐', label: '1–2 ore' },
      { id: 'half_day',  emoji: '☀️', label: 'Mezza giornata' },
      { id: 'any',       emoji: '🌿', label: 'Qualcosa di semplice' },
    ],
  },
  {
    key: 'atmosphere',
    question: 'Che atmosfera cerchi?',
    sub: "L'ultima cosa e sei pronto",
    options: [
      { id: 'autentica', emoji: '🏺', label: 'Autentica' },
      { id: 'romantica', emoji: '🌹', label: 'Romantica' },
      { id: 'easy',      emoji: '😊', label: 'Easy' },
      { id: 'curata',    emoji: '✨', label: 'Curata' },
      { id: 'vivace',    emoji: '🎉', label: 'Vivace' },
      { id: 'slow',      emoji: '🌿', label: 'Slow' },
    ],
  },
];

// ─── HELPER: fetch partner pool ──────────────────────────────────

async function fetchCandidatePartners(cityHint) {
  let query = supabase
    .from('partners')
    .select(`
      id, name, category, subcategory, price_range,
      atmosphere, ideal_moment, ideal_target, experience_duration,
      profile_score, plan_tier, logo_url, cover_image_url,
      city, latitude, longitude, description, is_active
    `)
    .eq('is_active', true);

  if (cityHint) query = query.eq('city', cityHint);

  const { data } = await query.limit(150);
  return data || [];
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────

const WizardStep = ({ step, onSelect, stepIndex, totalSteps }) => (
  <div className="flex flex-col h-full">
    {/* Progress dots */}
    <div className="flex gap-1.5 justify-center mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < stepIndex ? 'bg-accent w-6' :
            i === stepIndex ? 'bg-accent w-10' :
            'bg-zinc-200 w-6'
          }`}
        />
      ))}
    </div>

    {/* Question */}
    <div className="text-center mb-8 px-4">
      <h2 className="text-[28px] font-serif font-black text-text-primary leading-tight">
        {step.question}
      </h2>
      <p className="text-[13px] text-text-muted font-medium mt-2">{step.sub}</p>
    </div>

    {/* Options */}
    <div className={`grid gap-3 px-2 ${step.options.length > 4 ? 'grid-cols-2' : 'grid-cols-2'}`}>
      {step.options.map(opt => (
        <motion.button
          key={opt.id}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(opt.id)}
          className="flex flex-col items-center gap-2 py-5 px-3 bg-white rounded-3xl border-2 border-zinc-100 shadow-sm hover:border-accent/30 hover:shadow-md transition-all active:scale-95"
        >
          <span className="text-3xl">{opt.emoji}</span>
          <span className="text-[13px] font-black text-text-primary text-center leading-tight">{opt.label}</span>
        </motion.button>
      ))}
    </div>
  </div>
);

const PartnerResultCard = ({ partner, explanation, rank, navigate }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: rank * 0.1 }}
    className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-sm"
  >
    {/* Cover / Logo row */}
    <div className="flex items-center gap-4 p-4 pb-3">
      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-100 shrink-0">
        {partner.logo_url ? (
          <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl bg-accent/5">
            {rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-black text-text-primary truncate">{partner.name}</p>
        {partner.category && (
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-accent bg-accent/8 px-2 py-0.5 rounded-full mt-0.5">
            {partner.category}
          </span>
        )}
        {partner.city && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={10} className="text-text-muted" />
            <span className="text-[11px] text-text-muted font-medium">{partner.city}</span>
          </div>
        )}
      </div>
    </div>

    {/* Microexplanation */}
    <div className="px-4 pb-4">
      <div className="bg-[#FCFAF2] rounded-2xl px-4 py-3 flex items-center gap-2">
        <Sparkles size={13} className="text-accent-gold shrink-0" />
        <p className="text-[12px] font-bold text-text-muted italic leading-snug">{explanation}</p>
      </div>
    </div>
  </motion.div>
);

const MiniPercorsoCard = ({ percorso }) => {
  if (!percorso) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-accent-gold mb-4">Mini Percorso</p>
      <div className="flex items-center gap-3">
        {/* Step 1 */}
        <div className="flex-1 text-center">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-1.5 overflow-hidden">
            {percorso.step1.logo
              ? <img src={percorso.step1.logo} alt="" className="w-full h-full object-cover" />
              : <span className="text-lg">📍</span>}
          </div>
          <p className="text-[11px] font-black text-text-primary leading-tight truncate">{percorso.step1.name}</p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <ArrowRight size={14} className="text-accent" />
        </div>

        {/* Step 2 */}
        <div className="flex-1 text-center">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-1.5 overflow-hidden">
            {percorso.step2.logo
              ? <img src={percorso.step2.logo} alt="" className="w-full h-full object-cover" />
              : <span className="text-lg">🏁</span>}
          </div>
          <p className="text-[11px] font-black text-text-primary leading-tight truncate">{percorso.step2.name}</p>
        </div>
      </div>
      <p className="text-[11px] text-text-muted font-medium italic text-center mt-3 opacity-60">
        {percorso.label1} → {percorso.label2}
      </p>
    </motion.div>
  );
};

const LoadingScreen = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-6 py-16">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="w-14 h-14 border-4 border-accent/20 border-t-accent rounded-full"
    />
    <div className="text-center">
      <p className="text-[18px] font-serif font-black text-text-primary">Trovando il meglio per te…</p>
      <p className="text-[13px] text-text-muted mt-1 font-medium italic">Un secondo solo</p>
    </div>
  </div>
);

const EmptyResults = ({ onRetry }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-6 py-16 px-6 text-center">
    <span className="text-5xl">🔭</span>
    <div>
      <h3 className="text-[22px] font-serif font-black text-text-primary mb-2">
        Pochi partner disponibili adesso
      </h3>
      <p className="text-[14px] text-text-muted font-medium leading-relaxed">
        Stiamo ancora crescendo in questa zona.<br />Prova con un'altra scelta o torna presto.
      </p>
    </div>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-lg shadow-accent/25"
    >
      <RefreshCw size={14} /> Riprova con scelte diverse
    </button>
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────

export default function CosaFaccioAdesso({ isOpen, onClose, userCity }) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState('wizard'); // 'wizard' | 'loading' | 'results' | 'empty'
  const [results, setResults] = useState({ partners: [], percorso: null });
  const [regenerating, setRegenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentStep = STEPS[step];

  const reset = () => {
    setStep(0);
    setAnswers({});
    setPhase('wizard');
    setResults({ partners: [], percorso: null });
    setSaved(false);
  };

  const handleSelect = useCallback(async (optionId) => {
    const newAnswers = { ...answers, [currentStep.key]: optionId };
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }

    // Last step → compute results
    setPhase('loading');
    try {
      const pool = await fetchCandidatePartners(userCity);
      await computeResults(pool, newAnswers, false);
    } catch (err) {
      console.error('[CosaFaccioAdesso] fetch error', err);
      setPhase('empty');
    }
  }, [answers, step, currentStep, userCity]);

  const computeResults = async (pool, finalAnswers, jitter = false) => {
    // Wait at least 1.2s for UX perception of "thinking"
    const [ranked] = await Promise.all([
      Promise.resolve(rankPartnersNow(pool, finalAnswers, jitter)),
      new Promise(r => setTimeout(r, 1200)),
    ]);

    const top3 = ranked.slice(0, 3);

    if (top3.length === 0) {
      setPhase('empty');
      return;
    }

    const percorso = buildMiniPercorso(top3, finalAnswers.intent);
    setResults({ partners: top3, pool, percorso });
    setPhase('results');
  };

  const handleRegenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      const pool = results.pool || await fetchCandidatePartners(userCity);
      await computeResults(pool, answers, true); // jitter = true → variazione
    } finally {
      setRegenerating(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id || saved) return;
    const { intent, companions, time: time_available, atmosphere } = answers;
    await supabase.from('user_now_sessions').insert({
      user_id: profile.id,
      intent,
      companions,
      time_available,
      atmosphere,
      result_partner_ids: results.partners.map(p => p.id),
      saved: true,
    });
    setSaved(true);
    toast.success('Momento salvato! 📌', { icon: '✨' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="cfa-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex flex-col justify-end"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="bg-[#FCFAF2] rounded-t-[3rem] w-full max-w-lg mx-auto flex flex-col"
          style={{ maxHeight: '92dvh' }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-4 pb-2 shrink-0">
            <div className="w-10 h-1 bg-zinc-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              {phase === 'wizard' && step > 0 ? (
                <button onClick={() => setStep(s => s - 1)} className="w-9 h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center active:scale-90 transition-all">
                  <ChevronLeft size={18} strokeWidth={2.5} />
                </button>
              ) : null}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold">
                  {phase === 'results' ? getResultTitle(answers.intent, answers.companions) : 'Cosa faccio adesso?'}
                </p>
                {phase === 'wizard' && (
                  <p className="text-[12px] text-text-muted font-medium">Domanda {step + 1} di {STEPS.length}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => { reset(); onClose(); }}
              className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center active:scale-90 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            <AnimatePresence mode="wait">
              {phase === 'wizard' && (
                <motion.div
                  key={`step-${step}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                >
                  <WizardStep
                    step={currentStep}
                    stepIndex={step}
                    totalSteps={STEPS.length}
                    onSelect={handleSelect}
                  />
                </motion.div>
              )}

              {phase === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <LoadingScreen />
                </motion.div>
              )}

              {phase === 'empty' && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <EmptyResults onRetry={reset} />
                </motion.div>
              )}

              {phase === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-4"
                >
                  {/* Answer summary pills */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Object.values(answers).map((val, i) => {
                      const opt = STEPS[i]?.options.find(o => o.id === val);
                      return opt ? (
                        <span key={i} className="text-[11px] font-bold text-text-muted bg-zinc-100 px-3 py-1 rounded-full">
                          {opt.emoji} {opt.label}
                        </span>
                      ) : null;
                    })}
                  </div>

                  {/* Partner cards */}
                  {results.partners.map((partner, i) => (
                    <PartnerResultCard
                      key={partner.id}
                      partner={partner}
                      explanation={getMicroExplanation(partner, answers)}
                      rank={i}
                      navigate={navigate}
                    />
                  ))}

                  {/* Mini percorso */}
                  {results.percorso && (
                    <MiniPercorsoCard percorso={results.percorso} />
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-2 pb-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-zinc-200 bg-white text-text-primary font-black text-[12px] uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
                      Rigenera
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSave}
                      disabled={!profile?.id || saved}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all ${
                        saved
                          ? 'bg-zinc-100 text-zinc-400'
                          : 'bg-accent text-white shadow-lg shadow-accent/25'
                      }`}
                    >
                      <Bookmark size={14} weight={saved ? 'fill' : 'regular'} />
                      {saved ? 'Salvato ✓' : 'Salva'}
                    </motion.button>
                  </div>

                  {/* Restart */}
                  <button
                    onClick={reset}
                    className="text-center text-[11px] font-bold text-text-muted underline decoration-dotted mt-1"
                  >
                    Ricomincia con scelte diverse
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
