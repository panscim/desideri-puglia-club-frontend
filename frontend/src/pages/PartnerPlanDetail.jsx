// src/pages/PartnerPlanDetail.jsx
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Globe,
  Star
} from "lucide-react";

const BRAND = {
  sabbia: '#FAF7F2',
  terracotta: '#D4793A',
  blu: '#2F4858',
  sole: '#F2C87B',
  text: '#1F2933',
  white: '#FFFFFF',
  inkDark: '#1C2833',
};

const PARTNER_PLANS = {
  discovery: {
    name: 'Puglia Discovery',
    price: 9,
    commission: '25%',
    accent: 'from-amber-200 to-orange-100',
    description: "La porta d'ingresso ideale per farsi conoscere dai soci del Club.",
    features: [
      "Presenza sulla mappa interattiva Partner",
      "Inclusione nel motore di ricerca Concierge",
      "Dashboard base per monitoraggio visite",
      "Supporto via email standard",
      "1 Evento sponsorizzabile al mese"
    ]
  },
  pro: {
    name: 'Puglia Pro',
    price: 29,
    commission: '15%',
    accent: 'from-sky-200 to-blue-100',
    description: "Il piano più amato, pensato per chi vuole scalare la propria visibilità.",
    features: [
      "Tutti i vantaggi di Discovery",
      "Commissione ridotta sulle prenotazioni",
      "Priorità negli algoritmi di raccomandazione",
      "Analytics avanzate del comportamento soci",
      "3 Eventi sponsorizzabili al mese",
      "Badge 'Partner Certificato' sul profilo"
    ]
  },
  grande: {
    name: 'Grande Puglia',
    price: 59,
    commission: '10%',
    accent: 'from-emerald-200 to-teal-100',
    description: "L'eccellenza assoluta per i partner che definiscono il lusso in Puglia.",
    features: [
      "Tutti i vantaggi di Puglia Pro",
      "Commissione minima per massimo profitto",
      "Massima visibilità in Home Dashboard",
      "Account Manager dedicato e Concierge 7/7",
      "Eventi illimitati sponsorizzabili",
      "Accesso prioritario ai dati di trend del Club"
    ]
  }
};

const FAQ_ITEMS = [
  {
    q: "Come funzionano le commissioni?",
    a: "Le commissioni vengono trattenute solo sulle prenotazioni andate a buon fine tramite la piattaforma. Non ci sono costi nascosti."
  },
  {
    q: "Posso cambiare piano in seguito?",
    a: "Certamente. Puoi effettuare l'upgrade o il downgrade del tuo piano in qualsiasi momento direttamente dalla tua Dashboard Partner."
  },
  {
    q: "Quali sono i requisiti per essere accettati?",
    a: "Valutiamo ogni attività per assicurarci che rispetti gli standard di eccellenza e autenticità del Club Desideri di Puglia."
  },
  {
    q: "Come ricevo i pagamenti?",
    a: "Utilizziamo Stripe Connect per garantire accrediti sicuri e immediati direttamente sul tuo conto corrente bancario."
  }
];

const AccordionItem = ({ q, a, isOpen, onClick }) => (
  <div className="border-b border-zinc-200/60 overflow-hidden">
    <button
      onClick={onClick}
      className="w-full py-6 flex items-center justify-between text-left focus:outline-none"
    >
      <span className="text-[15px] font-bold text-zinc-950 pr-4">{q}</span>
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center">
        {isOpen ? <Minus size={14} className="text-zinc-600" /> : <Plus size={14} className="text-zinc-600" />}
      </div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="pb-6 text-[14px] leading-relaxed text-zinc-600 font-medium">
            {a}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function PartnerPlanDetail() {
  const { tier } = useParams();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const plan = PARTNER_PLANS[tier] || PARTNER_PLANS.pro;

  const handleJoin = () => {
    navigate(`/partner/join?plan=${tier}`);
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: BRAND.sabbia }}>
      {/* Header Fisso */}
      <header className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center border border-zinc-200 shadow-sm pointer-events-auto active:scale-90 transition"
        >
          <ArrowLeft size={18} className="text-zinc-900" />
        </button>
      </header>

      {/* Hero Visual */}
      <div className={`h-[40vh] w-full bg-gradient-to-b ${plan.accent} flex items-end px-8 pb-12`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto w-full"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 mb-4">
            <Star size={12} className="text-zinc-900" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Partner Plan</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-zinc-950 mb-2" style={{ fontFamily: "'Libre Baskerville', serif" }}>
            {plan.name}
          </h1>
          <p className="text-zinc-800 font-medium">{plan.description}</p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-8 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="md:col-span-8 space-y-12">

            {/* Highlights Grid */}
            <section className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-zinc-200">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Prezzo Mensile</p>
                <p className="text-2xl font-bold text-zinc-950">€{plan.price}</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-zinc-200">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Commissione</p>
                <p className="text-2xl font-bold text-zinc-950">{plan.commission}</p>
              </div>
            </section>

            {/* Features List */}
            <section className="space-y-6">
              <h2 className="text-[20px] font-bold text-zinc-950" style={{ fontFamily: "'Libre Baskerville', serif" }}>
                Cosa include il piano
              </h2>
              <div className="space-y-4">
                {plan.features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                    </div>
                    <p className="text-[15px] font-medium text-zinc-700">{f}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* FAQ Section */}
            <section className="pt-8 border-t border-zinc-200">
              <h2 className="text-[20px] font-bold text-zinc-950 mb-6" style={{ fontFamily: "'Libre Baskerville', serif" }}>
                Domande Frequenti
              </h2>
              <div className="bg-white rounded-[40px] px-8 py-2 border border-zinc-200">
                {FAQ_ITEMS.map((item, i) => (
                  <AccordionItem
                    key={i}
                    q={item.q}
                    a={item.a}
                    isOpen={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Info (Desktop Only) */}
          <div className="hidden md:block md:col-span-4 space-y-6">
            <div className="sticky top-24 p-8 rounded-[40px] bg-zinc-950 text-white space-y-6">
              <h3 className="text-xl font-bold leading-tight" style={{ fontFamily: "'Libre Baskerville', serif" }}>
                Pronto a iniziare?
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Entra nel club e inizia ad accogliere i soci Desideri di Puglia oggi stesso.
              </p>
              <button
                onClick={handleJoin}
                className="w-full py-4 rounded-full bg-white text-zinc-950 font-bold text-sm"
              >
                Inizia ora
              </button>
              <div className="pt-4 flex items-center gap-3">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="text-[11px] text-white/50 uppercase tracking-widest font-bold">Pagamenti sicuri con Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA (Mobile Only) */}
      <div className="md:hidden fixed bottom-6 inset-x-6 z-50">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleJoin}
          className="w-full h-16 rounded-full bg-zinc-950 text-white font-bold text-[15px] shadow-2xl flex items-center justify-center gap-2"
          style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
        >
          Diventa un Partner Certificato
          <TrendingUp size={18} />
        </motion.button>
      </div>
    </div>
  );
}
