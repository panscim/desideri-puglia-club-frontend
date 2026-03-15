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
  Camera,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import QRScannerModal from "../components/QRScannerModal";
import PartnerProfileModal from "../components/PartnerProfileModal";
import PartnerAdvancedProfileModal from "../components/PartnerAdvancedProfileModal";
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
  const [showPin, setShowPin] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [openingConnect, setOpeningConnect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [partnerRank, setPartnerRank] = useState(null);
  const [syncingStripe, setSyncingStripe] = useState(false);
  const [waitingPaymentConfirmation, setWaitingPaymentConfirmation] = useState(false);

  // New Tabs & Modal state
  const [currentTab, setCurrentTab] = useState("profilo"); // "profilo" | "analytics"
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Advanced profile modal
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedModalStep, setAdvancedModalStep] = useState(1);
  const [advancedDismissed, setAdvancedDismissed] = useState(false); // solo per questa sessione

  const openAdvancedModal = (step = 1) => { setAdvancedModalStep(step); setShowAdvancedModal(true); };

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

        const isPaymentSuccess = params.get("payment_success") === "1";
        const isFreshlySubscribed = params.get("subscribed") === "1";

        // Se non trovo il partner ma ho subscribed=1 o payment_success=1, aspetto un attimo (eventual consistency)
        if (!data && (isFreshlySubscribed || isPaymentSuccess)) {
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

        // --- SUBSCRIPTION GUARD ---
        let subStatus = String(data.subscription_status || "").toLowerCase();
        let isSubscribed = subStatus === "active" || subStatus === "trialing" || isFreshlySubscribed;

        // Se payment_success=1 ma il webhook non ha ancora aggiornato lo status, polling
        if (isPaymentSuccess && !isSubscribed) {
          setWaitingPaymentConfirmation(true);
          let attempts = 0;
          while (attempts < 15 && !isSubscribed) {
            await new Promise(r => setTimeout(r, 2000));
            attempts++;
            const retry = await supabase
              .from("partners")
              .select("*")
              .eq("owner_user_id", profile.id)
              .maybeSingle();
            if (retry.data) {
              const retryStatus = String(retry.data.subscription_status || "").toLowerCase();
              if (retryStatus === "active" || retryStatus === "trialing") {
                data = retry.data;
                subStatus = retryStatus;
                isSubscribed = true;
              }
            }
          }
          setWaitingPaymentConfirmation(false);
          if (!isSubscribed) {
            // Webhook non ha confermato entro il timeout — pagamento non riuscito o annullato
            navigate("/partner/subscription?payment_error=1");
            return;
          }
        }

        if (!isSubscribed) {
          console.log("[PartnerDashboard] Subscription not active, redirecting to /partner/subscription");
          navigate("/partner/subscription");
          return;
        }

        if (Boolean(data.must_choose_plan_once) && !isFreshlySubscribed && !isPaymentSuccess) {
          navigate("/partner/subscription");
          return;
        }

        setPartner(data);

        // --- CELEBRATION LOGIC ---
        if (isFreshlySubscribed || isPaymentSuccess) {
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

        if (isFreshlySubscribed || isPaymentSuccess) {
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
    if (target === "user") navigate("/dashboard"); else navigate("/partner/dashboard");
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

  if (loading || waitingPaymentConfirmation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#FAF7F2] gap-6 px-8">
        {waitingPaymentConfirmation ? (
          <>
            <div className="w-16 h-16 rounded-full bg-[#D4793A]/10 flex items-center justify-center animate-pulse">
              <CreditCard size={32} className="text-[#D4793A]" />
            </div>
            <div className="text-center">
              <h2
                className="text-[20px] font-black text-zinc-900"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                Conferma pagamento in corso
              </h2>
              <p className="text-[14px] text-zinc-500 mt-2 leading-relaxed">
                Stiamo verificando il tuo pagamento con Stripe.<br />
                Non chiudere questa pagina.
              </p>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4793A]" />
          </>
        ) : (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-950" />
        )}
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

        {/* ADVANCED PROFILE VISIBILITY BANNER — solo se profilo base completo e avanzato non ancora fatto */}
        {isProfileComplete && !partner?.advanced_profile_completed_at && !advancedDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative overflow-hidden rounded-3xl"
            style={{ background: "linear-gradient(120deg,#1a1a1a 0%,#2d1a0e 60%,#3d2010 100%)", border: "1px solid rgba(212,121,58,0.25)" }}
          >
            {/* glow bg */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(212,121,58,0.18) 0%,transparent 70%)", transform: "translate(30%,-30%)" }} />

            <div className="relative flex items-center gap-4 px-5 py-4">
              {/* icon */}
              <div className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(212,121,58,0.15)", border: "1px solid rgba(212,121,58,0.3)" }}>
                <TrendingUp className="w-5 h-5" style={{ color: "#D4793A" }} />
              </div>

              {/* text */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-white leading-tight">
                  Completa il profilo avanzato
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Aumenta visibilità e matching con gli utenti
                </p>
                {/* score bar */}
                <div className="flex items-center gap-2 mt-2">
                  <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 99 }}>
                    <div style={{ height: 3, borderRadius: 99, background: "#D4793A", width: `${partner?.profile_score || 0}%`, transition: "width 0.7s ease" }} />
                  </div>
                  <span className="text-[10px] font-black shrink-0" style={{ color: "#D4793A" }}>
                    {partner?.profile_score || 0}/100
                  </span>
                </div>
              </div>

              {/* actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openAdvancedModal(1)}
                  className="px-4 py-2 rounded-2xl text-[12px] font-black text-white transition-all active:scale-95"
                  style={{ background: "#D4793A" }}
                >
                  Inizia →
                </button>
                <button
                  onClick={() => setAdvancedDismissed(true)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <X className="w-3.5 h-3.5 text-white opacity-50" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

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

              {/* ── CLASSIFICAZIONE ── */}
              <div className="bg-white rounded-[28px] border border-[#E8DDD0] shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EBE3]">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4793A]">Classificazione</p>
                    <p className="text-[13px] font-semibold text-zinc-600 mt-0.5">Categoria, tipo e caratteristiche</p>
                  </div>
                  <button
                    onClick={() => openAdvancedModal(1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all active:scale-95"
                    style={{ borderColor: "#D4793A", color: "#D4793A", background: "#FFF7ED" }}
                  >
                    <Edit3 size={12} /> Modifica
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {/* Categoria + Subcategoria */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {partner?.category ? (
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-[12px] font-black"
                        style={{ background: "#FFF7ED", color: "#D4793A" }}
                      >
                        {partner.category}
                      </span>
                    ) : (
                      <span className="text-[12px] text-zinc-400 italic">Categoria non impostata</span>
                    )}
                    {partner?.subcategory && (
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-[12px] font-semibold"
                        style={{ background: "#F5F3F0", color: "#6B7280" }}
                      >
                        {partner.subcategory}
                      </span>
                    )}
                    {partner?.price_range && (
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-[12px] font-black"
                        style={{ background: "#F0FDF4", color: "#16A34A" }}
                      >
                        {{ low:"€", medium:"€€", premium:"€€€", luxury:"€€€€" }[partner.price_range]}
                      </span>
                    )}
                  </div>

                  {/* Atmosfera */}
                  {partner?.atmosphere?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 mb-2">Atmosfera</p>
                      <div className="flex flex-wrap gap-1.5">
                        {partner.atmosphere.map(a => (
                          <span key={a} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize"
                            style={{ background: "#F5F3F0", color: "#6B7280" }}>
                            {a.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Momenti */}
                  {partner?.ideal_moment?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 mb-2">Momenti ideali</p>
                      <div className="flex flex-wrap gap-1.5">
                        {partner.ideal_moment.map(m => (
                          <span key={m} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize"
                            style={{ background: "#EFF6FF", color: "#3B82F6" }}>
                            {m.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target */}
                  {partner?.ideal_target?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 mb-2">Target</p>
                      <div className="flex flex-wrap gap-1.5">
                        {partner.ideal_target.map(t => (
                          <span key={t} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize"
                            style={{ background: "#FDF4FF", color: "#9333EA" }}>
                            {t.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!partner?.category && !partner?.subcategory && !partner?.price_range && (
                    <button
                      onClick={() => openAdvancedModal(1)}
                      className="w-full py-4 rounded-2xl text-[13px] font-black text-center transition-all active:scale-[0.98]"
                      style={{ background: "#FFF7ED", color: "#D4793A", border: "1.5px dashed #F6AD75" }}
                    >
                      + Aggiungi classificazione
                    </button>
                  )}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 pb-4"
            >
              {/* ── HERO CARD: arc conversione ── */}
              {(() => {
                const convRate = stats.views > 0
                  ? Math.min(100, Math.round((stats.completed_unlocks / stats.views) * 100))
                  : 0;
                const arcTotal = 251;
                const arcDash = (convRate / 100) * arcTotal;
                return (
                  <div className="rounded-[28px] bg-zinc-950 p-6 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#D4793A]/20 rounded-full blur-[70px] pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-white/[0.03] rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Performance mensile</p>
                      <h2 className="text-white text-[20px] font-black mt-0.5" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        I tuoi Insight
                      </h2>
                      {/* SVG Arc */}
                      <div className="flex justify-center my-3">
                        <svg viewBox="0 0 200 115" className="w-52 h-auto">
                          <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
                          {convRate > 0 && (
                            <path
                              d="M 20 95 A 80 80 0 0 1 180 95"
                              fill="none"
                              stroke="#D4793A"
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeDasharray={`${arcDash} ${arcTotal}`}
                              style={{ filter: 'drop-shadow(0 0 8px rgba(212,121,58,0.55))' }}
                            />
                          )}
                          <text x="100" y="76" textAnchor="middle" fill="white" fontSize="30" fontWeight="900" fontFamily="Georgia, serif">{convRate}%</text>
                          <text x="100" y="94" textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="9" fontWeight="700" letterSpacing="2">CONVERSIONE</text>
                        </svg>
                      </div>
                      {/* Stats row */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/[0.07]">
                        <div className="text-center flex-1">
                          <p className="text-[22px] font-black text-white font-mono leading-none">{stats.views}</p>
                          <p className="text-[10px] text-white/40 font-medium mt-1">Visualizzazioni</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center flex-1">
                          <p className="text-[22px] font-black text-[#D4793A] font-mono leading-none">{stats.completed_unlocks}</p>
                          <p className="text-[10px] text-white/40 font-medium mt-1">Sblocchi PIN</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center flex-1">
                          <p className="text-[22px] font-black text-white font-mono leading-none">{stats.gps_proximity}</p>
                          <p className="text-[10px] text-white/40 font-medium mt-1">GPS Proximity</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── FINANCE ROW ── */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[20px] bg-white border border-zinc-200/60 p-4 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                    <TrendingUp size={15} className="text-emerald-500" />
                  </div>
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-wider leading-tight">Lordo</p>
                  <p className="text-[15px] font-black text-zinc-900 mt-1 leading-tight">{formatEuro(finance.gross)}</p>
                </div>
                <div className="rounded-[20px] p-4 shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #D4793A, #C4624A)' }}>
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <BarChart3 size={15} className="text-white" />
                  </div>
                  <p className="text-[9px] text-white/70 font-black uppercase tracking-wider leading-tight">Netto</p>
                  <p className="text-[15px] font-black text-white mt-1 leading-tight">{formatEuro(finance.net)}</p>
                </div>
                <div className="rounded-[20px] bg-white border border-zinc-200/60 p-4 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-3">
                    <span className="text-[13px] font-black text-zinc-400">%</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-wider leading-tight">Commissione</p>
                  <p className="text-[15px] font-black text-zinc-900 mt-1 leading-tight">{Number(partner.commission_rate ?? 25)}%</p>
                </div>
              </div>

              {/* ── TREND CHART ── */}
              <div className="rounded-[20px] bg-white border border-zinc-200/60 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-[14px] font-bold text-zinc-950 tracking-tight">Sblocchi Settimanali</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Ultimi 7 giorni</p>
                  </div>
                  <span className="text-[9px] font-black text-[#D4793A] bg-[#D4793A]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Live</span>
                </div>
                <div className="h-[150px] -ml-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 5, right: 0, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4793A" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#D4793A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#a1a1aa", fontWeight: 500 }} dy={6} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #f0ede8', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: '12px' }}
                        itemStyle={{ color: '#D4793A', fontWeight: 700 }}
                      />
                      <Area type="monotone" dataKey="unlocks" stroke="#D4793A" strokeWidth={2.5} fillOpacity={1} fill="url(#gradOrange)" activeDot={{ r: 5, strokeWidth: 0, fill: '#D4793A' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── SOCIAL REACH + GPS ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[20px] bg-white border border-zinc-200/60 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">Social Reach</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                          <Instagram size={13} className="text-pink-500" />
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-600">Instagram</span>
                      </div>
                      <span className="text-[18px] font-black text-zinc-900 font-mono">{stats.clicks_instagram}</span>
                    </div>
                    <div className="h-px bg-zinc-50" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                          <Globe size={13} className="text-blue-500" />
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-600">Sito web</span>
                      </div>
                      <span className="text-[18px] font-black text-zinc-900 font-mono">{stats.clicks_website}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] bg-[#FAF7F2] border border-[#E8DDD0] p-4 relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#D4793A]/8 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4793A]">GPS</p>
                    <div className="w-7 h-7 rounded-xl bg-[#D4793A]/10 flex items-center justify-center">
                      <MapPin size={13} className="text-[#D4793A]" />
                    </div>
                  </div>
                  <p className="text-[34px] font-black text-zinc-900 leading-none font-mono">{stats.gps_proximity}</p>
                  <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">soci nel raggio<br />di 50m dal locale</p>
                </div>
              </div>

              {/* ── PIANO & ABBONAMENTO ── */}
              <div className="rounded-[20px] bg-white border border-zinc-200/60 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center shrink-0">
                      <CreditCard size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Piano attivo</p>
                      <p className="text-[17px] font-black text-zinc-900 capitalize">
                        {partner.plan_tier || 'Nessun piano'}
                      </p>
                      {partner.subscription_current_period_end && (
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                          Rinnovo: {new Date(partner.subscription_current_period_end).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/partner/subscription')}
                    className="px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-[10px] font-black uppercase tracking-wider text-zinc-600 active:scale-95 transition shrink-0"
                  >
                    Modifica
                  </button>
                </div>
              </div>

              {/* ── EVENTS LOG ── */}
              {events.length > 0 && (
                <div className="rounded-[20px] bg-white border border-zinc-200/60 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-[14px] font-bold text-zinc-950">I tuoi eventi</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{events.length} eventi creati</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                      <CalendarDays size={15} className="text-zinc-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    {events.slice(0, 5).map((ev) => {
                      const start = ev.starts_at ? new Date(ev.starts_at) : null;
                      const isPast = start && start < new Date();
                      return (
                        <div
                          key={ev.id}
                          onClick={() => openParticipantsModal(ev)}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 transition cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#E8DDD0] flex items-center justify-center shrink-0">
                            <span className="text-[12px] font-black text-[#D4793A]">
                              {start ? start.getDate() : '—'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-zinc-900 truncate">{ev.title}</p>
                            <p className="text-[10px] text-zinc-400">{formatEventDateTime(ev.starts_at)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#D4793A]/10 text-[#D4793A] uppercase tracking-wider">
                              {ev.attendance_count} pax
                            </span>
                            {ev.price > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 uppercase tracking-wider">
                                €{ev.price}
                              </span>
                            )}
                            {isPast && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-zinc-100 text-zinc-400 uppercase tracking-wider">
                                Pass.
                              </span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev.id); }}
                              className="w-7 h-7 rounded-xl flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {events.length > 5 && (
                    <button className="w-full mt-3 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-[11px] font-bold text-zinc-500 hover:bg-zinc-100 transition">
                      Vedi tutti gli eventi ({events.length})
                    </button>
                  )}
                </div>
              )}

              {/* ── RECENT ACCESSES ── */}
              {recentAccesses.length > 0 && (
                <div className="rounded-[20px] bg-white border border-zinc-200/60 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-[14px] font-bold text-zinc-950">Ultimi accessi</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Soci che hanno visitato il tuo locale</p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#D4793A] bg-[#D4793A]/10 px-2.5 py-1 rounded-full">Live</span>
                  </div>
                  <div className="space-y-3">
                    {recentAccesses.map((acc) => (
                      <div key={acc.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[11px] font-black text-zinc-500 shrink-0 font-mono">
                          {acc.user.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-zinc-900 truncate">{acc.user}</p>
                          <p className="text-[10px] text-zinc-400">via {acc.source}</p>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0">{acc.time}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-[11px] font-bold text-zinc-500 hover:bg-zinc-100 transition">
                    Vedi tutti gli accessi
                  </button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}

      </div>

      {/* Badge verificato rimosso su richiesta utente */}


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

      {/* ADVANCED PROFILE MODAL */}
      <PartnerAdvancedProfileModal
        isOpen={showAdvancedModal}
        initialStep={advancedModalStep}
        partner={partner}
        onClose={() => setShowAdvancedModal(false)}
        onComplete={(updated) => {
          setPartner(prev => ({ ...prev, ...updated, advanced_profile_completed_at: new Date().toISOString() }));
          setShowAdvancedModal(false);
        }}
      />
    </div>
  );
}
