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
} from "lucide-react";
import toast from "react-hot-toast";
import QRScannerModal from "../components/QRScannerModal";
import { PartnerService } from "../services/partner";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Calendar } from "lucide-react";

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

        const { data, error } = await supabase
          .from("partners")
          .select("*, stripe_account_id, charges_enabled, payouts_enabled")
          .eq("owner_user_id", profile.id)
          .maybeSingle();

        if (error) console.error(error);
        if (!data) { navigate("/partner/join"); return; }
        if (Boolean(data.must_choose_plan_once)) {
          navigate("/partner/subscription");
          return;
        }

        setPartner(data);
        if (params.get("subscribed") === "1") {
          toast.success("Abbonamento attivo. Completa ora la configurazione pagamenti.");
        }
        if (!data?.charges_enabled && params.get("payments_setup_required") === "1") {
          setShowPaymentsModal(true);
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
          returnUrl: `${window.location.origin}/partner/dashboard?connect=success`,
          refreshUrl: `${window.location.origin}/partner/dashboard?payments_setup_required=1`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Impossibile avviare Stripe Connect");
      window.location.href = payload.url;
    } catch (e) {
      console.error(e);
      toast.error("Errore nell'avvio della configurazione pagamenti.");
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
        latitudine: lat,
        longitudine: lng
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

        {/* STRIPE STATUS BANNER (Gating) */}
        {!partner?.charges_enabled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-amber-50 border border-amber-200 p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm"
          >
            <div className="w-16 h-16 rounded-[2rem] bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
              <CreditCard size={32} className="text-amber-700" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-amber-900">Incassi non ancora attivi</h3>
              <p className="text-sm text-amber-800 leading-relaxed mt-1">
                Per pubblicare eventi e incassare, devi completare l’attivazione degli incassi.
              </p>
            </div>
            <button
              onClick={openStripeConnectOnboarding}
              className="h-12 px-8 rounded-full bg-amber-900 text-white font-bold text-sm shadow-lg whitespace-nowrap active:scale-95 transition"
            >
              {openingConnect ? "Apertura..." : "Completa configurazione pagamenti"}
            </button>
          </motion.div>
        )}

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
    </div>
  );
}
