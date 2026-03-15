// src/components/SagaWizard.jsx
// Bottom-sheet wizard to capture user saga preferences (4 steps + skip)
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

const STEPS = [
  {
    key: "intent",
    title: "Cosa cerchi?",
    subtitle: "Puoi selezionare più opzioni",
    multi: true,
    options: [
      { id: "mangiare",    label: "🍽 Mangiare bene" },
      { id: "esperienza",  label: "✨ Un'esperienza" },
      { id: "relax",       label: "🌿 Relax & benessere" },
      { id: "serata",      label: "🌙 Serata speciale" },
      { id: "shopping",    label: "🛍 Shopping locale" },
      { id: "cultura",     label: "🏛 Cultura & arte" },
      { id: "cibo_locale", label: "🫙 Sapori pugliesi" },
      { id: "dormire",     label: "🏡 Dove dormire" },
    ],
  },
  {
    key: "companions",
    title: "Con chi sei?",
    subtitle: "Seleziona uno",
    multi: false,
    options: [
      { id: "coppia",       label: "💑 In coppia" },
      { id: "famiglia",     label: "👨‍👩‍👧 Con la famiglia" },
      { id: "amici",        label: "👫 Con amici" },
      { id: "solo_traveler",label: "🧳 Da solo" },
      { id: "business",     label: "💼 Per lavoro" },
    ],
  },
  {
    key: "budget_pref",
    title: "Qual è il tuo budget?",
    subtitle: "Per persona, indicativamente",
    multi: false,
    options: [
      { id: "low",     label: "€  Economico" },
      { id: "medium",  label: "€€  Medio" },
      { id: "premium", label: "€€€  Premium" },
      { id: "luxury",  label: "€€€€  Luxury" },
    ],
  },
  {
    key: "moment",
    title: "Che momento è?",
    subtitle: "Seleziona uno",
    multi: false,
    options: [
      { id: "colazione",      label: "☀️ Colazione / Brunch" },
      { id: "pranzo",         label: "🕐 Pranzo" },
      { id: "aperitivo",      label: "🍹 Aperitivo" },
      { id: "cena",           label: "🌆 Cena" },
      { id: "dopocena",       label: "🌃 Dopocena" },
      { id: "giornata_intera",label: "📅 Giornata intera" },
      { id: "weekend",        label: "🗓 Weekend" },
    ],
  },
];

export default function SagaWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({
    intent: [],
    companions: null,
    budget_pref: null,
    moment: null,
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const toggleMulti = (id) => {
    setPrefs((p) => {
      const arr = p[current.key] || [];
      return { ...p, [current.key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
    });
  };

  const selectSingle = (id) => {
    const newPrefs = { ...prefs, [current.key]: id };
    setPrefs(newPrefs);
    if (!isLast) {
      setStep((s) => s + 1);
    } else {
      onComplete(newPrefs);
    }
  };

  const isSelected = (id) => {
    const val = prefs[current.key];
    return Array.isArray(val) ? val.includes(id) : val === id;
  };

  const canNext = current.multi ? (prefs[current.key] || []).length > 0 : false;

  const handleNext = () => {
    if (!isLast) setStep((s) => s + 1);
    else onComplete(prefs);
  };

  const handleSkip = () => onComplete(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        style={{
          background: "#fff",
          borderRadius: "2rem 2rem 0 0",
          maxHeight: "85vh",
          overflowY: "auto",
          paddingBottom: "env(safe-area-inset-bottom, 24px)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E5E7EB" }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 mb-1">
              Step {step + 1} di {STEPS.length}
            </p>
            <h2 className="text-[22px] font-black text-gray-900 leading-tight">
              {current.title}
            </h2>
            <p className="text-[12px] text-gray-400 mt-0.5">{current.subtitle}</p>
          </div>
          <button
            onClick={handleSkip}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#F3F4F6" }}
          >
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 mb-5">
          <div style={{ height: 3, background: "#F3F4F6", borderRadius: 99 }}>
            <div
              style={{
                height: 3,
                borderRadius: 99,
                background: "#f97316",
                width: `${((step + 1) / STEPS.length) * 100}%`,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Options */}
        <div className="px-6 grid grid-cols-2 gap-3 mb-6">
          {current.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => current.multi ? toggleMulti(opt.id) : selectSingle(opt.id)}
              className="text-left px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97]"
              style={{
                borderColor: isSelected(opt.id) ? "#f97316" : "#E5E7EB",
                background: isSelected(opt.id) ? "#fff7ed" : "#fff",
                fontWeight: 700,
                fontSize: 13,
                color: isSelected(opt.id) ? "#ea580c" : "#374151",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 flex gap-3 mb-4">
          <button
            onClick={handleSkip}
            className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold text-gray-500"
            style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
          >
            Salta tutto →
          </button>
          {current.multi && (
            <button
              onClick={handleNext}
              disabled={!canNext}
              className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: canNext ? "#f97316" : "#FED7AA",
                cursor: canNext ? "pointer" : "default",
              }}
            >
              {step < STEPS.length - 1 ? "Avanti" : "Mostra risultati"}
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
