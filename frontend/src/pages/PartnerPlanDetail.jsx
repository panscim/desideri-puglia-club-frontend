import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { colors as TOKENS, typography, motion as springMotion } from "../utils/designTokens";
import {
  XCircle,
  CheckCircle,
  Plus,
  ArrowLeft
} from "lucide-react";
import { Bank } from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";

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
  const location = useLocation();
  const { profile } = useAuth();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  
  const plan = PLAN_DATA[tier] || PLAN_DATA.pro;

  const handleJoin = async () => {
    if (!profile?.id) {
      // Reindirizza al login e poi torna qui
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    setLoadingCheckout(true);
    const toastId = toast.loading("Preparazione checkout sicuro...");

    try {
      // 1. Controlla se l'utente ha già un record partner
      const { data: existingPartner, error: fetchError } = await supabase
        .from("partners")
        .select("id")
        .eq("owner_user_id", profile.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let partnerId = existingPartner?.id;

      // 2. Se non esiste, crea un record partner "scheletro"
      if (!partnerId) {
        toast.loading("Creazione profilo partner...", { id: toastId });
        const ownerName = `${profile?.nome || ""} ${profile?.cognome || ""}`.trim() || profile?.nickname || "Titolare";
        
        const skeletonPayload = {
          owner_user_id: profile.id,
          name: "Nuovo Partner", // Nome temporaneo, verrà cambiato nel profilo
          owner_name: ownerName,
          category: "Altro",     // Categoria temporanea
          is_active: false,
          subscription_status: "incomplete", // In attesa di pagamento
          plan_tier: tier,
          commission_rate: tier === 'grande' ? 10 : (tier === 'pro' ? 15 : 25), // Defaults
        };

        const { data: newPartner, error: insertError } = await supabase
          .from("partners")
          .insert([skeletonPayload])
          .select("id")
          .single();

        if (insertError) throw insertError;
        partnerId = newPartner.id;

        // Aggiorna anche l'ID partner sull'utente
        await supabase.from("utenti").update({ partner_id: partnerId }).eq("id", profile.id);
      }

      // 3. Avvia la sessione di Checkout Stripe
      toast.loading("Connessione a Stripe...", { id: toastId });
      
      const response = await fetch("/api/create-partner-subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          tier: tier,
          // Dopo il successo, reindirizza alla dashboard. Webhook farà il resto.
          successUrl: `${window.location.origin}/partner/dashboard?payment_success=1`,
          cancelUrl: `${window.location.origin}/partner/subscription/${encodeURIComponent(tier)}?canceled=1`,
        }),
      });

      const payload = await response.json();
      
      if (!response.ok) {
        throw new Error(payload.error || "Checkout non disponibile al momento");
      }

      // Redirezione a Stripe
      toast.success("Reindirizzamento...", { id: toastId });
      window.location.href = payload.url;

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Errore durante l'avvio del checkout.", { id: toastId });
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen pb-40 selection:bg-[#D4793A]/30"
      style={{
        background: '#FAF7F0',
        backgroundImage: 'radial-gradient(circle, rgba(60,40,20,0.04) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}>

      {/* Scrapbook corner decorations */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-5 left-5 w-20 h-5 rounded-sm rotate-[-10deg] opacity-30"
          style={{ background: plan.accentColor }} />
        <div className="absolute top-5 right-5 w-14 h-4 rounded-sm rotate-[7deg] opacity-20"
          style={{ background: '#B8882F' }} />
        <div className="absolute bottom-40 left-4 w-16 h-4 rounded-sm rotate-[-5deg] opacity-20"
          style={{ background: '#D4793A' }} />
      </div>

      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-2xl border-2 flex items-center justify-center shadow-md pointer-events-auto active:scale-90 transition"
          style={{ background: '#fff', borderColor: '#E8DDD0' }}
        >
          <ArrowLeft size={18} className="text-zinc-900" />
        </button>
      </nav>

      {/* Hero Header — scrapbook card */}
      <header className="pt-24 pb-10 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Photo-corner framed card */}
            <div className="relative rounded-3xl p-8 border-2"
              style={{
                background: '#fff',
                borderColor: '#E8DDD0',
                boxShadow: '4px 6px 24px rgba(0,0,0,0.08)',
              }}>
              {/* Corner tape */}
              <div className="absolute -top-3 left-8 w-12 h-6 rounded-sm opacity-70 rotate-[-2deg]"
                style={{ background: plan.accentColor + '60' }} />
              <div className="absolute -top-3 right-8 w-10 h-6 rounded-sm opacity-50 rotate-[3deg]"
                style={{ background: '#B8882F50' }} />

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-5"
                style={{ background: plan.accentColor + '12', borderColor: plan.accentColor + '30' }}>
                <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: plan.accentColor }}>
                  {plan.tag}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-3"
                style={{ fontFamily: typography.serif, color: '#1A1A1A' }}>
                {plan.name}
              </h1>
              <p className="text-2xl font-black mb-6" style={{ color: plan.accentColor }}>
                {plan.price}
              </p>
              <div className="h-px w-16 mb-6 opacity-20" style={{ background: '#1A1A1A' }} />
              <p className="text-base text-zinc-600 font-medium leading-relaxed max-w-xl">
                {plan.description}
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-5 md:px-8 space-y-6 pb-10">

        {/* Includes — carta bianca con bordo dashed */}
        <section className="rounded-3xl p-7 border-2 border-dashed relative"
          style={{ background: '#fff', borderColor: '#D5C8B8' }}>
          {/* Label sticker */}
          <div className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-[0.3em]"
            style={{ background: '#FAF7F0', borderColor: '#D5C8B8', color: '#B8882F' }}>
            Cosa include
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-2">
            {plan.includes.map((item, i) => (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                key={i}
                className="flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: '#4ade8020' }}>
                  <CheckCircle size={16} color="#16a34a" />
                </div>
                <span className="text-[14px] font-semibold" style={{ color: '#1A1A1A' }}>{item}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Excludes */}
        {plan.excludes.length > 0 && (
          <section className="rounded-3xl p-7 border-2 relative"
            style={{ background: '#F9F6F2', borderColor: '#E8DDD0' }}>
            <div className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-[0.3em]"
              style={{ background: '#FAF7F0', borderColor: '#E8DDD0', color: '#9CA3AF' }}>
              Non include
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-2 opacity-60">
              {plan.excludes.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <XCircle size={16} className="text-stone-400 shrink-0 mt-0.5" />
                  <span className="text-[14px] font-medium text-zinc-500">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="rounded-3xl border-2 overflow-hidden relative"
          style={{ background: '#fff', borderColor: '#D5C8B8' }}>
          <div className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-[0.3em]"
            style={{ background: '#FAF7F0', borderColor: '#D5C8B8', color: '#B8882F' }}>
            Domande frequenti
          </div>
          <div className="px-6 pt-4 divide-y" style={{ borderColor: '#F0EAE2' }}>
            {plan.faq.map((item, i) => (
              <FaqItem key={i} item={item} index={i} />
            ))}
          </div>
        </section>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40"
        style={{ background: 'linear-gradient(to top, #FAF7F0 60%, rgba(250,247,240,0))' }}>
        <div className="px-5 pb-28 pt-6 max-w-3xl mx-auto">
          <style>{`
            @keyframes borderFlow {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes shimmer {
              0% { transform: translateX(-150%) skewX(-15deg); }
              100% { transform: translateX(300%) skewX(-15deg); }
            }
          `}</style>
          <motion.div
            className="w-full p-[2px] rounded-[18px] overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(90deg, #D4793A, #B8882F, #D4793A, #B8882F)',
              backgroundSize: '300% 300%',
              animation: 'borderFlow 5s ease infinite',
            }}
          >
            <motion.button
              whileHover={{ scale: 0.995 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleJoin}
              className="group relative w-full h-[66px] rounded-[16px] font-black text-[15px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all overflow-hidden"
              style={{ background: '#fff', color: '#1A1A1A' }}
            >
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div 
                  className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-stone-200 to-transparent opacity-60"
                  style={{ animation: 'shimmer 2.5s infinite linear' }}
                />
              </div>

              <span className="relative z-10 transition-transform duration-300 group-hover:scale-105">
                {loadingCheckout ? 'Attendi...' : (tier === 'discovery' ? 'Attiva Gratis' : 'Paga in modo sicuro con Stripe')}
              </span>
              
              <div className="relative z-10 flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[#16a34a] shadow-[0_0_20px_rgba(22,163,74,0.5)] transition-transform duration-500 group-hover:rotate-[360deg] group-hover:scale-110">
                {loadingCheckout ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Plus size={16} color="#fff" />
                  </motion.div>
                ) : (
                  tier === 'discovery' ? <CheckCircle size={16} color="#fff" weight="fill" /> : <Bank size={14} color="#fff" />
                )}
              </div>
            </motion.button>
          </motion.div>
          
          <div className="mt-4 flex items-center justify-center gap-2 opacity-60">
            <CheckCircle size={12} color="#1A1A1A" />
            <span className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-widest">Zero Dati Iniziali. Configura tutto dopo.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
