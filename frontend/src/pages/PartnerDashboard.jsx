// src/pages/PartnerDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Building2,
  CheckCircle2,
  BarChart3,
  Instagram,
  Globe,
  Edit3,
  Eye,
  EyeOff,
  CalendarDays,
  Trash2,
  ArrowRight,
  MapPin,
  Map,
  ScanLine,
  CreditCard,
  X,
  User,
  Mail,
  Calendar,
  Sparkles,
  Camera
} from "lucide-react";
import toast from "react-hot-toast";
import QRScannerModal from "../components/QRScannerModal";
import PartnerProfileModal from "../components/PartnerProfileModal";
import { PartnerService } from "../services/partner";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Removed static weeklyData mock

export default function PartnerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [stats, setStats] = useState({
    views: 0,
    gps_proximity: 0,
    completed_unlocks: 0,
    clicks_instagram: 0,
    clicks_website: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentAccesses, setRecentAccesses] = useState([]);
  const [finance, setFinance] = useState({
    gross: 0,
    platformFees: 0,
    net: 0,
  });

  // Participants modal state
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null);
  const [eventParticipants, setEventParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [showEventForm, setShowEventForm] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "", description: "", date: "", startTime: "",
    endTime: "", location: "", city: "", interestTags: "",
    deadlineDate: "", deadlineTime: "", price: "", availableSpots: "",
    paymentMethods: { carta: false, in_loco: false },
    iban: "", paymentInstructions: ""
  });
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [modeTransition, setModeTransition] = useState({ active: false, target: null, flip: false });
  const [showPin, setShowPin] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [openingConnect, setOpeningConnect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [partnerRank, setPartnerRank] = useState(null);
  const [syncingStripe, setSyncingStripe] = useState(false);

  // New Tabs & Modal state
  const [currentTab, setCurrentTab] = useState("profilo"); // "profilo" | "analytics"
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Computed field per capire se il profilo è completo
  const isProfileComplete = 
    partner?.name &&
    partner?.city &&
    partner?.address &&
    partner?.category &&
    partner?.description;

  const syncStripeStatus = async () => {
    if (!partner?.id) return;
    setSyncingStripe(true);
    try {
      const response = await fetch("/api/sync-stripe-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: partner.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Errore sincronizzazione");

      toast.success(payload.details);
      if (payload.success && payload.chargesEnabled) {
        // Aggiorna lo stato locale senza ricaricare tutto se possibile
        setPartner(prev => ({ 
          ...prev, 
          charges_enabled: payload.chargesEnabled, 
          payouts_enabled: payload.payoutsEnabled 
        }));
      }
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Errore durante la sincronizzazione.");
    } finally {
      setSyncingStripe(false);
    }
  };

  const loadStats = async (partnerId) => {
    try {
      const { data, error } = await supabase
        .from("partner_analytics_monthly")
        .select("visits, clicks_instagram, clicks_website")
        .eq("partner_id", partnerId)
        .order("month_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) console.warn("[PartnerDashboard] loadStats error:", error.message);

      const baseViews = data?.visits || 0;
      const proximityMock = Math.floor(baseViews * 0.45);

      const realStats = await PartnerService.getPartnerStats(partnerId, partner?.pin_code || "");

      setStats({
        views: baseViews,
        gps_proximity: proximityMock,
        completed_unlocks: realStats?.completed_unlocks || 0,
        clicks_instagram: data?.clicks_instagram || 0,
        clicks_website: data?.clicks_website || 0,
      });

      if (realStats) {
        setRecentAccesses(realStats.recentAccesses || []);
        setWeeklyData(realStats.weeklyData || []);
      }
    } catch (e) {
      console.warn("[PartnerDashboard] loadStats catch:", e);
    }
  };

  const loadEvents = async (partnerId) => {
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from("partner_events_created")
        .select(`id, title, starts_at, ends_at, location, city, is_active, price, available_spots, registration_deadline`)
        .eq("partner_id", partnerId)
        .order("starts_at", { ascending: true });

      if (error) { console.error("[PartnerDashboard] loadEvents error:", error); setEvents([]); return; }

      // Fetch real counts for each event
      const normalized = await Promise.all((data || []).map(async (ev) => {
        const { count } = await supabase
          .from('prenotazioni_eventi')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', ev.id)
          .eq('status', 'confermato');

        return {
          ...ev,
          attendance_count: count || 0,
        };
      }));

      setEvents(normalized);
    } catch (e) {
      console.error("[PartnerDashboard] loadEvents catch:", e);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadFinance = async (partnerData) => {
    try {
      const { data, error } = await supabase
        .from("booking_payments")
        .select("amount_total_cents, application_fee_amount, status")
        .eq("partner_id", partnerData.id)
        .eq("status", "paid");

      if (error) {
        console.warn("[PartnerDashboard] loadFinance error:", error.message);
        return;
      }

      const grossCents = (data || []).reduce((sum, row) => sum + Number(row.amount_total_cents || 0), 0);
      const feeCents = (data || []).reduce((sum, row) => sum + Number(row.application_fee_amount || 0), 0);

      setFinance({
        gross: grossCents / 100,
        platformFees: feeCents / 100,
        net: (grossCents - feeCents) / 100,
      });
    } catch (e) {
      console.warn("[PartnerDashboard] loadFinance catch:", e);
    }
  };

  const formatEuro = (value) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(value || 0));

  const openParticipantsModal = async (event) => {
    setSelectedEventForParticipants(event);
    setLoadingParticipants(true);
    try {
      const pData = await PartnerService.getEventParticipants(event.id);
      setEventParticipants(pData);
    } catch (err) {
      console.error("Error loading event participants:", err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (!profile?.id) { navigate("/login"); return; }

        let { data, error } = await supabase
          .from("partners")
          .select("*")
          .eq("owner_user_id", profile.id)
          .maybeSingle();

        if (error) console.error(error);

        // Se non trovo il partner ma ho subscribed=1, aspetto un attimo (eventual consistency)
        if (!data && params.get("subscribed") === "1") {
          console.log("[PartnerDashboard] Partner non trovato post-payment, riprovo tra 3s...");
          await new Promise(r => setTimeout(r, 3000));
          const retry = await supabase
            .from("partners")
            .select("*")
            .eq("owner_user_id", profile.id)
            .maybeSingle();
          data = retry.data;
          if (retry.error) console.error(retry.error);
        }

        if (!data) {
          console.log("[PartnerDashboard] No partner data, redirecting to /partner/join");
          navigate("/partner/join");
          return;
        }

        // Se ho appena pagato (subscribed=1), ignoro il flag di scelta piano forzata
        const isFreshlySubscribed = params.get("subscribed") === "1";
        
        // --- SUBSCRIPTION GUARD ---
        const subStatus = String(data.subscription_status || "").toLowerCase();
        const isSubscribed = subStatus === "active" || subStatus === "trialing" || isFreshlySubscribed;

        if (!isSubscribed) {
          console.log("[PartnerDashboard] Subscription not active, redirecting to /partner/subscription");
          navigate("/partner/subscription");
          return;
        }

        if (Boolean(data.must_choose_plan_once) && !isFreshlySubscribed) {
          navigate("/partner/subscription");
          return;
        }

        setPartner(data);

        // --- CELEBRATION LOGIC ---
        if (params.get("subscribed") === "1") {
          // Trigger confetti
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D4793A', '#B8B48F', '#5A5A40']
          });

          // Fetch partner count for the "rank"
          const { count } = await supabase
            .from('partners')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_status', 'active');
          
          setPartnerRank(count || 1);
          setShowCelebration(true);
        }

        if (params.get("subscribed") === "1") {
          toast.success("Abbonamento attivo! Benvenuto nel Club.");
        }
        if (!data?.charges_enabled && params.get("payments_setup_required") === "1") {
          setShowPaymentsModal(true);
        }

        // Handle Stripe Connect return notifications
        if (params.get("stripe_success") === "1") {
          toast.success("Conto collegato con successo! Puoi ora incassare pagamenti.");
        }
        if (params.get("stripe_refresh") === "1") {
          toast("Completa la configurazione Stripe per attivare gli incassi.");
        }
        if (params.get("stripe_error") === "1") {
          toast.error("Errore configurazione Stripe. Riprova o contattaci.");
        }

        await Promise.all([loadStats(data.id), loadEvents(data.id), loadFinance(data)]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id, navigate, params]);

  const openStripeConnectOnboarding = async () => {
    if (!profile?.id || !partner?.id) return;
    setOpeningConnect(true);
    try {
      const response = await fetch("/api/create-connect-onboarding-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          partnerId: partner.id,
          returnUrl: `${window.location.origin}/partner/dashboard?stripe_success=1`,
          refreshUrl: `${window.location.origin}/partner/dashboard?stripe_refresh=1`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Impossibile avviare Stripe Connect");
      window.location.href = payload.url;
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Errore nell'avvio della configurazione pagamenti.");
    } finally {
      setOpeningConnect(false);
    }
  };

  const handleModeSwitch = (target) => {
    setModeTransition({ active: true, target, flip: false });
    setTimeout(() => setModeTransition((prev) => ({ ...prev, flip: true })), 500);
    setTimeout(() => { if (target === "user") navigate("/dashboard"); else navigate("/partner/dashboard"); }, 1500);
  };

  const goEditProfile = () => navigate("/partner/join");

  const handleExportReport = () => {
    toast.success("Report PDF avviato...");
    setTimeout(() => window.print(), 800);
  };

  const handleCreateEvent = async (e) => {
    e?.preventDefault?.();
    if (!partner?.id) return;

    const title = eventForm.title.trim();
    const description = eventForm.description.trim() || null;
    const location = eventForm.location.trim() || null;
    const city = (eventForm.city || partner.city || "").trim() || null;

    if (!partner?.charges_enabled) {
      return toast.error("Per pubblicare eventi devi prima attivare gli incassi su Stripe.");
    }

    if (!title) return toast.error("Inserisci un titolo per l'evento.");
    if (!eventForm.date || !eventForm.startTime) return toast.error("Inserisci data e orario di inizio.");

    const startsAt = new Date(`${eventForm.date}T${eventForm.startTime}:00`);
    if (Number.isNaN(startsAt.getTime())) return toast.error("Data o orario di inizio non validi.");

    let endsAt = null;
    if (eventForm.endTime) {
      const tmp = new Date(`${eventForm.date}T${eventForm.endTime}:00`);
      if (!Number.isNaN(tmp.getTime())) endsAt = tmp;
    }

    let registrationDeadline = null;
    if (eventForm.deadlineDate && eventForm.deadlineTime) {
      const tmpDeadline = new Date(`${eventForm.deadlineDate}T${eventForm.deadlineTime}:00`);
      if (!Number.isNaN(tmpDeadline.getTime())) registrationDeadline = tmpDeadline;
    }

    const interestTags = eventForm.interestTags.split(",").map((t) => t.trim()).filter(Boolean);
    const selectedPayment = eventForm.paymentMethod;

    const priceNum = parseFloat(eventForm.price);
    const spotsNum = parseInt(eventForm.availableSpots, 10);

    setCreatingEvent(true);

    // Geocoding manuale via Nominatim (Free, no-auth)
    let lat = null;
    let lng = null;
    try {
      const searchString = `${location || ""} ${city || ""}`.trim();
      if (searchString) {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchString)}&limit=1`, {
          headers: { 'User-Agent': 'DesideriDiPuglia/1.0' }
        });
        const geoData = await res.json();
        if (geoData && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      }
    } catch (e) {
      console.warn("Geocoding failed:", e);
    }

    try {
      const { error } = await supabase.from("partner_events_created").insert({
        title, description, location, city,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt ? endsAt.toISOString() : null,
        interest_tags: interestTags.length ? interestTags : null,
        is_active: true,
        partner_id: partner.id,
        registration_deadline: registrationDeadline ? registrationDeadline.toISOString() : null,
        price: !isNaN(priceNum) && priceNum > 0 ? priceNum : 0,
        available_spots: !isNaN(spotsNum) && spotsNum > 0 ? spotsNum : null,
        payment_methods: selectedPayment ? [selectedPayment] : null,
        latitude: lat,
        longitude: lng
      });

      if (error) { toast.error(error.message || "Errore nella creazione dell'evento."); return; }

      toast.success("Evento creato correttamente.");
      setEventForm({
        title: "", description: "", date: "", startTime: "", endTime: "",
        location: "", city: "", interestTags: "", deadlineDate: "", deadlineTime: "",
        price: "", availableSpots: "", paymentMethod: "carta"
      });
      setShowEventForm(false);
      await loadEvents(partner.id);
    } catch (err) {
      toast.error(err.message || "Errore nella creazione dell'evento.");
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!partner?.id) return;
    const ok = window.confirm("Vuoi davvero eliminare questo evento?");
    if (!ok) return;

    try {
      const { error } = await supabase.from("partner_events_created").delete().eq("id", eventId).eq("partner_id", partner.id);
      if (error) return toast.error(error.message || "Errore nell'eliminazione.");
      toast.success("Evento eliminato.");
      await loadEvents(partner.id);
    } catch (err) {
      toast.error(err.message || "Errore eliminazione.");
    }
  };

  const formatEventDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#f5f5f5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-950" />
      </div>
    );
  }

  if (!partner) return null;

  const rawPin = String(partner.pin_code || partner.redeem_pin || partner.secret_pin || partner.pin || partner.partner_pin || "");
  const hasPin = rawPin.trim().length > 0;

  return (
    <div className="min-h-[100dvh] bg-[#f9f9f7] text-zinc-900 pb-24 font-sans">

      {/* Header Sticky Glass */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 px-4 py-4 flex items-center justify-between print:hidden shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200 shadow-sm flex-shrink-0">
            {partner.logo_url
              ? <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" />
              : <Building2 className="w-4 h-4 text-zinc-400" />}
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-zinc-950 leading-none">{partner.name}</h1>
            <p className="text-[11px] text-zinc-400 font-medium tracking-tight mt-0.5">Business Intelligence HUB</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[12px] font-bold shadow-md active:scale-95 transition"
          >
            <ScanLine className="w-4 h-4" />
            <span className="hidden sm:inline">Scansiona QR</span>
          </button>
          <button onClick={handleExportReport} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200 transition">
            <Globe className="w-3 h-3" />
            Esporta PDF
          </button>
          <button onClick={() => handleModeSwitch("user")} className="px-3 py-1.5 rounded-full bg-zinc-950 text-white text-[12px] font-medium shadow-md active:scale-95 transition">
            Modalità Utente
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* STRIPE STATUS BANNER — only show if profile is complete (is_active) */}
        {(partner?.is_active || isProfileComplete) && (partner?.charges_enabled ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-[13px] font-bold text-emerald-800">Conto verificato ✓ — Puoi pubblicare eventi e incassare pagamenti.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-[#FAF7F0] border border-[#E8DDD0] rounded-[32px] p-6 md:p-8 shadow-sm overflow-hidden"
          >
            {/* Background texture/glass effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4793A]/5 rounded-full blur-[100px] -mr-32 -mt-32" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              {/* Sticker/Icon area */}
              <div className="shrink-0 relative">
                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border border-[#E8DDD0] rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500">
                  <CreditCard className="w-7 h-7 text-[#D4793A]" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                  <Sparkles size={12} className="text-white" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4793A]">Configurazione Pagamenti</span>
                <h3 className="text-2xl font-black text-zinc-900 leading-tight" style={{ fontFamily: 'serif' }}>
                  Configura il conto per incassare
                </h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed max-w-lg">
                  Per creare eventi e ricevere pagamenti, collega il tuo conto bancario tramite Stripe.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                <button
                  onClick={openStripeConnectOnboarding}
                  disabled={openingConnect}
                  className="w-full md:w-auto h-14 px-8 rounded-2xl bg-zinc-950 text-white font-bold text-[13px] uppercase tracking-widest shadow-xl hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {openingConnect ? "Apertura..." : "Configura ora"}
                  {!openingConnect && <ArrowRight className="w-4 h-4" />}
                </button>

                {/* Information text about Stripe requests */}
                <p className="text-[10px] font-bold text-zinc-400 italic text-center md:text-right max-w-[220px] leading-tight opacity-70">
                  Nota: Stripe potrebbe richiedere documenti aggiuntivi per la verifica dell'identità.
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* --- TABS --- */}
        <div className="flex bg-white/60 p-1.5 rounded-2xl border border-zinc-200/50 shadow-sm w-fit">
          <button
            onClick={() => setCurrentTab('profilo')}
            className={`px-6 py-2 rounded-xl text-[13px] font-bold transition-all ${currentTab === 'profilo' ? 'bg-zinc-950 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
          >
            Profilo
          </button>
          <button
            onClick={() => setCurrentTab('analytics')}
            className={`px-6 py-2 rounded-xl text-[13px] font-bold transition-all ${currentTab === 'analytics' ? 'bg-zinc-950 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
          >
            Insight
          </button>
        </div>

        {currentTab === "profilo" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="profilo-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* Box Profilo */}
              <div className="bg-white rounded-[32px] p-6 md:p-8 border border-[#E8DDD0] shadow-sm relative overflow-hidden">
                {!isProfileComplete && (
                  <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white border-2 border-[#D4793A]/30 p-8 rounded-[32px] shadow-2xl text-center max-w-sm">
                      <div className="w-16 h-16 bg-[#D4793A]/10 text-[#D4793A] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera size={28} />
                      </div>
                      <h3 className="text-xl font-black text-zinc-900 mb-2 font-serif">Profilo Incompleto</h3>
                      <p className="text-[13px] text-zinc-500 mb-6 leading-relaxed">Racconta ai membri la tua storia, aggiungi foto e configura i tuoi dati di contatto per entrare nella mappa del Club.</p>
                      <button 
                        onClick={() => setShowProfileModal(true)}
                        className="w-full py-4 rounded-xl bg-[#D4793A] text-white font-bold tracking-widest text-[13px] uppercase shadow-lg hover:scale-105 active:scale-95 transition-all"
                      >
                        Completa Profilo
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3 space-y-4">
                    <div className="w-full aspect-square rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden relative group">
                      {partner?.logo_url ? <img src={partner.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-zinc-300"><Sparkles size={48} /></div>}
                      <button onClick={() => setShowProfileModal(true)} className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={16}/></button>
                    </div>
                  </div>
                  <div className="w-full md:w-2/3 space-y-6 pt-2">
                     <div>
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4793A]">{partner?.category || "Categoria non definita"}</span>
                       <h2 className="text-4xl font-black text-zinc-900 leading-tight mt-1" style={{ fontFamily: "serif" }}>{partner?.name || "Nuovo Partner"}</h2>
                       <p className="text-zinc-500 font-medium text-sm flex items-center gap-2 mt-2"><MapPin size={16}/> {partner?.city || "Città"}, {partner?.address || "Indirizzo manca"}</p>
                     </div>
                     <div className="h-px w-full bg-[#E8DDD0]" />
                     <p className="text-zinc-600 leading-relaxed text-[15px]">{partner?.description || "Nessuna descrizione inserita. Racconta la tua storia."}</p>
                     <div className="flex gap-4 pt-4">
                        {partner?.website_url && <a href={partner.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors"><Globe size={16}/> SITO WEB</a>}
                        {partner?.instagram_url && <a href={partner.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-pink-400 hover:text-pink-600 transition-colors"><Instagram size={16}/> INSTAGRAM</a>}
                     </div>
                  </div>
                </div>
              </div>

              {/* Gestione piano */}
              <div className="flex items-center justify-between bg-[#FAF7F0] border border-[#E8DDD0] rounded-2xl px-5 py-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Piano attivo</p>
                  <p className="text-[15px] font-bold text-zinc-900">
                    {partner?.plan_tier ? String(partner.plan_tier).charAt(0).toUpperCase() + String(partner.plan_tier).slice(1) : "Nessun piano"}
                    {partner?.subscription_status && (
                      <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        · {partner.subscription_status}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/partner/subscription')}
                  className="px-4 py-2 rounded-full bg-white border border-[#E8DDD0] text-zinc-700 text-[11px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition hover:border-zinc-300"
                >
                  Modifica o disdici piano
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {currentTab === "analytics" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="analytics-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* Piano + trasparenza economica */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Piano Attivo</p>
            <p className="text-[20px] font-black text-zinc-950 mt-1">
              {partner.plan_tier ? String(partner.plan_tier).toUpperCase() : "NON ATTIVO"}
            </p>
            <p className="text-[12px] text-zinc-500 mt-2">
              Stato: <b className="text-zinc-800">{partner.subscription_status || "inactive"}</b>
            </p>
            <p className="text-[12px] text-zinc-500">
              Commissione: <b className="text-zinc-800">{Number(partner.commission_rate ?? 25)}%</b>
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Volume Lordo</p>
            <p className="text-[28px] font-black text-zinc-950 mt-2">{formatEuro(finance.gross)}</p>
            <p className="text-[11px] text-zinc-500 mt-2">Incassi complessivi eventi (Stripe)</p>
          </div>

          <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-5 shadow-lg">
            <p className="text-[10px] uppercase tracking-widest font-bold text-white/50">Guadagno Netto</p>
            <p className="text-[28px] font-black text-white mt-2">{formatEuro(finance.net)}</p>
            <p className="text-[11px] text-white/70 mt-2">
              Commissioni piattaforma: <b>{formatEuro(finance.platformFees)}</b>
            </p>
          </div>
        </section>

        {/* === BENTO: FUNNEL KPI === */}
        <section>
          <div className="mb-4">
            <h2 className="text-[18px] font-bold tracking-tight text-zinc-950">Insight del Mese</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">Il tuo funnel di conversione turistico in tempo reale.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* KPI Views */}
            <div className="rounded-2xl bg-white border border-zinc-200/60 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                  <Map className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold font-mono">+12%</span>
              </div>
              <div className="mt-6">
                <p className="text-[12px] text-zinc-500 font-medium">Visualizzazioni Card</p>
                <p className="text-4xl font-bold font-mono tracking-tighter text-zinc-950 mt-1">{stats.views}</p>
              </div>
            </div>

            {/* KPI GPS */}
            <div className="rounded-2xl bg-white border border-zinc-200/60 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-50/60 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between relative z-10">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100/60 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-[10px] text-zinc-400 font-mono font-medium">raggio 50m</span>
              </div>
              <div className="mt-6 relative z-10">
                <p className="text-[12px] text-zinc-500 font-medium">Interesse GPS</p>
                <p className="text-4xl font-bold font-mono tracking-tighter text-zinc-950 mt-1">{stats.gps_proximity}</p>
              </div>
            </div>

            {/* KPI Unlocks */}
            <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-emerald-400/10 rounded-full blur-[30px] pointer-events-none" />
              <div className="flex items-start justify-between relative z-10">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-[10px] text-white/40 font-medium">conversione PIN</span>
              </div>
              <div className="mt-6 relative z-10">
                <p className="text-[12px] text-white/70 font-medium">Sblocchi Finalizzati</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-4xl font-bold font-mono tracking-tighter text-white">{stats.completed_unlocks}</p>
                  <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Top 15%</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* === BENTO: CHART + ACCESSI === */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chart AreaChart */}
          <div className="lg:col-span-2 rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-[14px] font-bold text-zinc-950 tracking-tight">Trend Sblocchi Settimanale</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Volume di conversioni per giorno (7 giorni)</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-zinc-400" />
              </div>
            </div>
            <div className="flex-1 min-h-[220px] -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUnlocks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181b" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#a1a1aa", fontWeight: 500 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e4e4e7", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: "12px" }}
                    itemStyle={{ color: "#18181b", fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="unlocks" stroke="#18181b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUnlocks)" activeDot={{ r: 5, strokeWidth: 0, fill: "#18181b" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ultimi Accessi */}
          <div className="lg:col-span-1 rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-bold text-zinc-950 tracking-tight">Ultimi Accessi</h3>
              <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full">Live</span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[220px] pr-1">
              {recentAccesses.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-500 font-mono flex-shrink-0">
                      {acc.user.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-zinc-900 leading-tight">{acc.user}</p>
                      <p className="text-[10px] text-zinc-400 truncate max-w-[110px]">da {acc.source}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono tracking-tighter flex-shrink-0 ml-2">{acc.time}</span>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[12px] font-semibold text-zinc-700 hover:bg-zinc-100 transition active:scale-[0.98]">
              Vedi tutti (20)
            </button>
          </div>

        </section>

        {/* === BENTO: PIN + EVENTI === */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* PIN Segreto */}
          <div className="rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm flex flex-col justify-between min-h-[180px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[14px] font-bold text-zinc-950 tracking-tight">Codice Autenticatore</h3>
              <Edit3 onClick={goEditProfile} className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-zinc-900 transition" />
            </div>
            <p className="text-[11px] text-zinc-500 mb-5 leading-relaxed">Fornisci questo codice ai clienti in cassa per registrare la visita e sbloccare le Cards nell'App.</p>
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 shadow-inner rounded-xl p-3.5">
              <span className="font-mono text-2xl tracking-[0.4em] text-zinc-950 font-bold ml-1 select-all">
                {hasPin ? (showPin ? rawPin : "•••••") : "—"}
              </span>
              <button
                onClick={() => hasPin && setShowPin(!showPin)}
                className="w-9 h-9 rounded-lg flex items-center justify-center border transition shadow-sm bg-white border-zinc-200 text-zinc-400 hover:text-zinc-900"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Gestione Eventi */}
          <div className="rounded-2xl bg-zinc-100/60 border border-zinc-200/60 p-5 shadow-sm flex flex-col justify-between min-h-[180px]">
            <div>
              <h3 className="text-[14px] font-bold text-zinc-950 tracking-tight flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4" /> Gestione Eventi
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">
                Promuovi serate ed eventi speciali. I soci presenti confermano la presenza con il tuo PIN dall'App e ottengono ricompense.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEventForm((v) => !v)}
                className="flex-1 py-3 bg-zinc-950 text-white font-semibold text-[13px] rounded-xl shadow-md hover:shadow-lg transition active:scale-[0.98]"
              >
                {showEventForm ? "Chiudi Form" : "Crea Nuovo Evento"}
              </button>
              <button className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition shadow-sm">
                <ArrowRight className="w-4 h-4 text-zinc-800" />
              </button>
            </div>
          </div>

        </section>

        {/* Elenco eventi esistenti */}
        {events.length > 0 && (
          <section className="rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-zinc-950 mb-4 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-zinc-400" />
              I tuoi eventi ({events.length})
              {loadingEvents && <span className="text-[10px] text-zinc-400 ml-1">Aggiornamento...</span>}
            </h3>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {events.map((ev) => {
                const now = new Date();
                const start = ev.starts_at ? new Date(ev.starts_at) : null;
                const isPast = start && start < now;
                let statusClass = "bg-emerald-100 text-emerald-700";
                let statusLabel = "Attivo";
                if (!ev.is_active) { statusClass = "bg-zinc-100 text-zinc-500"; statusLabel = "Disattivato"; }
                else if (isPast) { statusClass = "bg-rose-100 text-rose-600"; statusLabel = "Terminato"; }

                return (
                  <div key={ev.id}
                    onClick={() => openParticipantsModal(ev)}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-100/50 transition cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-900 truncate">{ev.title}</p>

                      {/* Info base evento */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 mt-1 mb-1">
                        {ev.starts_at && <span>{formatEventDateTime(ev.starts_at)}</span>}
                        {(ev.location || ev.city) && <span>{ev.location || ""}{ev.city ? ` · ${ev.city}` : ""}</span>}
                        <span>Partecipazioni: <strong>{ev.attendance_count || 0}</strong></span>
                      </div>

                      {/* Info premium evento (prezzo, posti, scadenza) se presenti */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="px-2 py-0.5 rounded uppercase tracking-wider text-[9px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {ev.price > 0 ? `€ ${ev.price}` : 'Gratis'}
                        </span>
                        {ev.available_spots && (
                          <span className="px-2 py-0.5 rounded uppercase tracking-wider text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                            {ev.available_spots - (ev.attendance_count || 0)} / {ev.available_spots} Posti
                          </span>
                        )}
                        {ev.registration_deadline && (
                          <span className="px-2 py-0.5 rounded uppercase tracking-wider text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                            Scadenza: {formatEventDateTime(ev.registration_deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusClass}`}>{statusLabel}</span>
                      <button onClick={() => handleDeleteEvent(ev.id)} className="text-zinc-300 hover:text-rose-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Form Evento (condizionale) */}
        {showEventForm && (
          <form onSubmit={handleCreateEvent} className="rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-zinc-950 mb-4 pb-3 border-b border-zinc-100">Nuovo Evento In-Store</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Titolo *</label>
                <input className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/20" placeholder='Es. "Aperitivo del Club"' value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Data *</label>
                <input type="date" className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/20" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Ore Inizio *</label>
                <input type="time" className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/20" value={eventForm.startTime} onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Ore Fine (opzionale)</label>
                <input type="time" className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/20" value={eventForm.endTime} onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })} />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Scadenza Iscrizioni</label>
                <div className="flex gap-2">
                  <input type="date" className="w-2/3 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/20" value={eventForm.deadlineDate} onChange={(e) => setEventForm({ ...eventForm, deadlineDate: e.target.value })} />
                  <input type="time" className="w-1/3 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/20" value={eventForm.deadlineTime} onChange={(e) => setEventForm({ ...eventForm, deadlineTime: e.target.value })} />
                </div>
              </div>

              {/* Price & Spots */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Prezzo (€)</label>
                  <input type="number" min="0" step="0.01" className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/20" placeholder="Es. 0 per gratis" value={eventForm.price} onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Posti Disponibili</label>
                  <input type="number" min="1" className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/20" placeholder="Es. 40" value={eventForm.availableSpots} onChange={(e) => setEventForm({ ...eventForm, availableSpots: e.target.value })} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Descrizione</label>
                <textarea rows={2} className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/20 resize-y" placeholder="Racconta cosa succederà..." value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
              </div>

              {/* Payment Methods */}
              <div className="sm:col-span-2 mt-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Metodo di pagamento *</label>
                <div className="flex flex-wrap gap-3">
                  {['carta', 'in_loco'].map((method) => (
                    <label key={method} className="flex items-center gap-2 text-[12px] font-medium text-zinc-700 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="w-4 h-4 text-zinc-950 focus:ring-zinc-950"
                        checked={eventForm.paymentMethod === method}
                        onChange={() => setEventForm({ ...eventForm, paymentMethod: method })}
                      />
                      {method === 'carta' ? 'Ho carta' : 'Pagamento in loco'}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowEventForm(false)} className="px-4 py-2 rounded-xl text-[13px] font-medium text-zinc-500 hover:bg-zinc-100 transition">Annulla</button>
              <button type="submit" disabled={creatingEvent} className="px-5 py-2 rounded-xl bg-zinc-950 text-white text-[13px] font-semibold shadow-md active:scale-95 transition disabled:opacity-50">
                {creatingEvent ? "Pubblicazione..." : "Pubblica Evento"}
              </button>
            </div>
          </form>
        )}

      </motion.div>
    </AnimatePresence>
  )}

      </div>

      {/* Badge verificato rimosso su richiesta utente */}

      {/* Overlay Modalità Animata */}
      {modeTransition.active && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <div className="relative w-32 h-32 mb-6">
            <img src={modeTransition.target === "user" ? "/cambioview/partner.png" : "/cambioview/utente.png"} alt="Icona" className="absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-out" style={{ opacity: modeTransition.flip ? 0 : 1, transform: modeTransition.flip ? "translateX(-50px) scale(0.9)" : "translateX(0) scale(1)" }} />
            <img src={modeTransition.target === "user" ? "/cambioview/utente.png" : "/cambioview/partner.png"} alt="Nuova Icona" className={`absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-out ${modeTransition.flip ? "animate-pulse" : ""}`} style={{ opacity: modeTransition.flip ? 1 : 0, transform: modeTransition.flip ? "translateX(0) scale(1)" : "translateX(50px) scale(0.9)" }} />
          </div>
          <p className="text-[16px] font-bold text-zinc-950 tracking-tight">Cambiando modalità...</p>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />

      <PartnerProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        partner={partner}
        onSuccess={(updatedData) => {
          setPartner({ ...partner, ...updatedData });
          setShowProfileModal(false);
          toast.success("I tuoi dati sono stati aggiornati su tutte le piattaforme!");
        }}
      />

      {/* Participants Modal */}
      <AnimatePresence>
        {selectedEventForParticipants && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEventForParticipants(null)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-[17px] font-bold text-zinc-950 truncate">{selectedEventForParticipants.title}</h2>
                  <p className="text-[12px] text-zinc-500 font-medium">Lista Partecipanti Confermati</p>
                </div>
                <button
                  onClick={() => setSelectedEventForParticipants(null)}
                  className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:border-zinc-300 transition shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {loadingParticipants ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-950" />
                    <p className="text-[13px] font-medium text-zinc-400">Caricamento partecipanti...</p>
                  </div>
                ) : eventParticipants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-10 text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 mb-2">
                      <User className="w-6 h-6 text-zinc-300" />
                    </div>
                    <p className="text-[15px] font-bold text-zinc-900">Ancora nessun partecipante</p>
                    <p className="text-[13px] text-zinc-500">I soci potranno prenotare il loro posto direttamente dall'App.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {eventParticipants.map((p, idx) => {
                      let statusBadge = null;
                      if (p.status === 'confermato') {
                        statusBadge = <div className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100"><span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Confermato</span></div>;
                      } else if (p.status === 'da_pagare_in_loco') {
                        statusBadge = <div className="shrink-0 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">Pagamento in loco</div>;
                      }

                      return (
                        <div key={idx} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50/50 transition">
                          <div className="w-11 h-11 rounded-full overflow-hidden border border-zinc-200 shadow-sm shrink-0">
                            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-zinc-900 truncate">{p.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                                <Mail className="w-3 h-3" /> {p.email || 'N/A'}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                                <Calendar className="w-3 h-3" /> {p.date}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {statusBadge}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between">
                <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest ml-2">Totale: {eventParticipants.length} soci</p>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-[12px] font-bold text-zinc-700 hover:bg-white hover:border-zinc-300 transition shadow-sm"
                >
                  Stampa Lista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blocking payments setup modal */}
      <AnimatePresence>
        {showPaymentsModal && !partner?.charges_enabled && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              className="relative w-full max-w-md rounded-3xl bg-white border border-zinc-200 p-6 shadow-2xl"
            >
              <h3 className="text-xl font-black text-zinc-950">Per creare eventi e ricevere pagamenti devi impostare un metodo di incasso</h3>
              <p className="text-sm text-zinc-600 mt-2">
                Finché gli incassi non risultano attivi, la pubblicazione eventi resta bloccata.
              </p>
              <div className="mt-5 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowPaymentsModal(false)}
                  className="h-11 px-4 rounded-full border border-zinc-300 bg-white text-zinc-900 text-[13px] font-bold"
                >
                  Torna indietro
                </button>
                <button
                  type="button"
                  onClick={openStripeConnectOnboarding}
                  className="h-11 px-5 rounded-full bg-zinc-950 text-white text-[13px] font-bold"
                >
                  {openingConnect ? "Apertura..." : "Completa configurazione pagamenti"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] p-8 shadow-[0_32px_120px_rgba(0,0,0,0.5)] border border-zinc-200 text-center overflow-hidden"
            >
              {/* Background decorative elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-60" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-100 rounded-full blur-3xl opacity-60" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-zinc-950 flex items-center justify-center mb-6 shadow-xl rotate-3">
                  <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
                </div>
                
                <h2 className="text-[28px] font-black tracking-tight text-zinc-900 leading-none mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                  Benvenuto nel Club!
                </h2>
                
                <p className="text-[14px] text-zinc-600 font-medium leading-relaxed mb-8 px-2">
                  È ufficiale: da oggi sei il nostro <span className="text-zinc-950 font-black">#{partnerRank}</span> partner. Inizia ora la tua avventura artistica e turistica.
                </p>

                <div className="w-full space-y-3">
                  <button
                    onClick={() => {
                      setShowCelebration(false);
                      // Clear params to avoid repeat
                      window.history.replaceState({}, '', window.location.pathname);
                    }}
                    className="w-full h-14 rounded-2xl bg-zinc-950 text-white font-black uppercase tracking-widest text-[13px] shadow-lg active:scale-95 transition"
                  >
                    Inizia ora
                  </button>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    Desideri di Puglia Business
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
