import { colors as TOKENS, typography, motion as springMotion } from "../utils/designTokens";
import {
  XCircle,
  CheckCircle,
  Plus,
  ArrowLeft
} from "lucide-react";

const PLAN_DATA = {
  discovery: {
    name: 'Essenziale',
    price: 'Gratuito',
    tag: 'Per iniziare',
    accentColor: TOKENS.textMuted,
    accentGradient: 'from-stone-200/50 to-stone-100/30',
    description: 'Il punto di partenza per qualsiasi attività che vuole farsi trovare dai soci Desideri di Puglia. Nessun costo, nessun impegno. Sei sulla mappa, sei visibile.',
    includes: [
      'Profilo attività con foto, descrizione, orari',
      'Posizionamento sulla mappa del Club',
      'Visibilità ai soci in zona',
      'Pannello partner per aggiornare i dati',
    ],
    excludes: [
      'Creazione e gestione eventi',
      'Biglietteria e incassi automatici',
      'Analytics e dati prenotazioni',
      'Badge verificato sul profilo',
    ],
    faq: [
      { q: 'Posso passare a Pro in qualsiasi momento?', a: 'Sì. L\'upgrade è immediato. I tuoi dati e il tuo profilo rimangono invariati.' },
      { q: 'Devo inserire una carta di credito?', a: 'No. Il piano Essenziale non richiede nessun metodo di pagamento.' },
      { q: 'Quanto ci vuole per apparire sulla mappa?', a: 'Una volta completata la registrazione, il profilo è visibile entro pochi minuti.' },
    ],
  },
  pro: {
    name: 'Puglia Pro',
    price: '€49 / mese',
    tag: 'Il più scelto',
    accentColor: TOKENS.accent,
    accentGradient: 'from-[#D4793A]/30 to-[#D4793A]/10',
    description: 'Il piano per chi vuole trasformare la propria attività in un punto di riferimento per i soci. Crea eventi, incassa online, gestisci gli accessi con QR. Tutto in un unico strumento.',
    includes: [
      'Tutto il piano Essenziale',
      'Creazione eventi illimitati',
      'Biglietteria integrata con pagamento immediato',
      'Incassi automatici sul tuo conto bancario',
      'QR di accesso e scanner per verificare i ticket',
      'Dashboard con analytics prenotazioni',
      'Badge verificato sul profilo pubblico',
      'Supporto prioritario via chat',
    ],
    excludes: [
      'Account manager dedicato',
      'Integrazioni con sistemi gestionali esterni',
    ],
    faq: [
      { q: 'Quando ricevo i pagamenti?', a: 'Entro 2 giorni lavorativi dalla transazione, tramite Stripe Connect.' },
      { q: 'Stripe è obbligatorio?', a: 'Sì. Garantisce sicurezza e regolarità degli incassi. La configurazione richiede pochi minuti.' },
      { q: 'Posso creare eventi gratuiti?', a: 'Sì. Puoi creare eventi a ingresso libero, a pagamento, o con prezzi differenziati.' },
      { q: 'Quanto prende il Club per biglietto?', a: 'Una commissione del 5% sul valore del biglietto. Nessun costo fisso per transazione.' },
    ],
  },
  grande: {
    name: 'Puglia Elite',
    price: 'Su misura',
    tag: 'Per grandi strutture',
    accentColor: TOKENS.accentGold,
    accentGradient: 'from-amber-200/30 to-amber-100/10',
    description: 'Pensato per strutture ricettive, agriturismi, cantine e realtà con volumi elevati o esigenze specifiche. Un partner commerciale, non solo uno strumento.',
    includes: [
      'Tutto il piano Pro',
      'Account manager dedicato con contatto diretto',
      'Integrazione API con il tuo sistema gestionale',
      'Campagne promozionali mirate ai soci',
      'Priorità nei percorsi e itinerari consigliati',
      'Report mensile personalizzato',
      'Contratto su misura con SLA garantiti',
    ],
    excludes: [],
    faq: [
      { q: 'Come si attiva il piano Elite?', a: 'Contattaci dopo la registrazione. Un account manager ti risponde entro 24 ore.' },
      { q: 'Posso integrare il mio sistema di prenotazione?', a: 'Sì. Gestiamo integrazioni personalizzate via API con i principali sistemi gestionali hospitality.' },
      { q: 'C\'è un volume minimo?', a: 'Non esiste un volume minimo obbligatorio. Il piano Elite si costruisce sulle tue esigenze reali.' },
    ],
  },
};

const FaqItem = ({ item, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-stone-200/60 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group focus:outline-none"
      >
        <span className="text-lg font-bold text-zinc-950 pr-8 group-hover:text-[#D4793A] transition-colors" style={{ fontFamily: typography.serif }}>
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0"
        >
          <Plus size={18} className="text-[#D4793A]" strokeWidth={3} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springMotion.spring}
            className="overflow-hidden"
          >
            <p className="pb-8 text-[15px] leading-relaxed text-zinc-500 font-medium max-w-2xl">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function PartnerPlanDetail() {
  const { tier } = useParams();
  const navigate = useNavigate();
  const plan = PLAN_DATA[tier] || PLAN_DATA.pro;

  const handleJoin = () => {
    navigate(`/partner/join?plan=${tier}`);
  };

  return (
    <div className="min-h-screen pb-32 selection:bg-[#D4793A]/30" style={{ background: TOKENS.bgPrimary }}>
      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md border border-stone-200 flex items-center justify-center shadow-sm pointer-events-auto active:scale-90 transition"
        >
          <ArrowLeft size={20} className="text-zinc-950" />
        </button>
      </nav>

      {/* Hero Header */}
      <header className={`pt-32 pb-20 px-8 bg-gradient-to-b ${plan.accentGradient}`}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-white mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4793A]" style={{ color: plan.accentColor }}>
                {plan.tag}
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-zinc-950 leading-none tracking-tight mb-4" style={{ fontFamily: typography.serif }}>
              {plan.name}
            </h1>
            <p className="text-3xl font-black mb-8" style={{ color: plan.accentColor }}>{plan.price}</p>
            <div className="w-20 h-1 bg-zinc-950 mb-8 rounded-full opacity-10" />
            <p className="text-xl text-zinc-600 font-medium leading-relaxed max-w-2xl">
              {plan.description}
            </p>
          </motion.div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-8 py-20 divide-y divide-stone-200/60">

        {/* Includes */}
        <section className="py-12 first:pt-0">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 mb-10">Cosa include</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {plan.includes.map((item, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                key={i}
                className="flex items-start gap-4"
              >
                <CheckCircle size={20} className="text-[#16a34a] shrink-0 mt-0.5" />
                <span className="text-[15px] font-semibold text-zinc-800">{item}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Excludes */}
        {plan.excludes.length > 0 && (
          <section className="py-12">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 mb-10">Non include</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 opacity-60">
              {plan.excludes.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <XCircle size={20} className="text-stone-400 shrink-0 mt-0.5" />
                  <span className="text-[15px] font-medium text-zinc-500">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="py-12">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 mb-4">Domande frequenti</h2>
          <div className="space-y-0">
            {plan.faq.map((item, i) => (
              <FaqItem key={i} item={item} index={i} />
            ))}
          </div>
        </section>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2] to-transparent z-40">
        <div className="max-w-4xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleJoin}
            className="w-full h-16 md:h-20 rounded-full bg-zinc-950 text-white font-black text-[15px] md:text-lg uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 transition hover:bg-black"
          >
            Diventa un Partner Certificato
            <CheckCircle size={22} weight="fill" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
