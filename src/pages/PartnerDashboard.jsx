// src/pages/PartnerDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import toast from "react-hot-toast";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const weeklyData = [
  { name: "Lun", unlocks: 12 },
  { name: "Mar", unlocks: 19 },
  { name: "Mer", unlocks: 15 },
  { name: "Gio", unlocks: 22 },
  { name: "Ven", unlocks: 45 },
  { name: "Sab", unlocks: 68 },
  { name: "Dom", unlocks: 51 },
];

export default function PartnerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [stats, setStats] = useState({
    views: 0,
    gps_proximity: 0,
    completed_unlocks: 0,
    clicks_instagram: 0,
    clicks_website: 0,
  });
  const [recentAccesses] = useState([
    { id: 1, user: "Marco R.", time: "10 min fa", source: "Mappa App" },
    { id: 2, user: "Giulia M.", time: "35 min fa", source: "Cattedrale di Trani" },
    { id: 3, user: "Andrea P.", time: "1 ora fa", source: "Ricerca Organica" },
    { id: 4, user: "Elena F.", time: "Oggi 14:30", source: "Castello Svevo" },
    { id: 5, user: "Luca D.", time: "Oggi 11:15", source: "Mappa App" },
  ]);

  const [showEventForm, setShowEventForm] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "", description: "", date: "", startTime: "",
    endTime: "", location: "", city: "", interestTags: "",
  });
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [modeTransition, setModeTransition] = useState({ active: false, target: null, flip: false });
  const [showPin, setShowPin] = useState(false);

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

      const baseViews = data?.visits || 842;
      const proximityMock = Math.floor(baseViews * 0.45);
      const unlocksMock = Math.floor(proximityMock * 0.3);

      setStats({
        views: baseViews,
        gps_proximity: proximityMock,
        completed_unlocks: unlocksMock,
        clicks_instagram: data?.clicks_instagram || 0,
        clicks_website: data?.clicks_website || 0,
      });
    } catch (e) {
      console.warn("[PartnerDashboard] loadStats catch:", e);
    }
  };

  const loadEvents = async (partnerId) => {
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from("partner_events_created")
        .select(`id, title, starts_at, ends_at, location, city, is_active, attendances:partner_event_attendances_created(count)`)
        .eq("partner_id", partnerId)
        .order("starts_at", { ascending: true });

      if (error) { console.error("[PartnerDashboard] loadEvents error:", error); setEvents([]); return; }

      const normalized = data?.map((ev) => ({
        ...ev,
        attendance_count: ev.attendances?.[0]?.count != null ? ev.attendances[0].count : 0,
      })) || [];

      setEvents(normalized);
    } catch (e) {
      console.error("[PartnerDashboard] loadEvents catch:", e);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (!profile?.id) { navigate("/login"); return; }

        const { data, error } = await supabase
          .from("partners")
          .select("*")
          .eq("owner_user_id", profile.id)
          .maybeSingle();

        if (error) console.error(error);
        if (!data) { navigate("/partner/join"); return; }

        setPartner(data);
        await Promise.all([loadStats(data.id), loadEvents(data.id)]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id, navigate]);

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

    if (!title) return toast.error("Inserisci un titolo per l'evento.");
    if (!eventForm.date || !eventForm.startTime) return toast.error("Inserisci data e orario di inizio.");

    const startsAt = new Date(`${eventForm.date}T${eventForm.startTime}:00`);
    if (Number.isNaN(startsAt.getTime())) return toast.error("Data o orario non validi.");

    let endsAt = null;
    if (eventForm.endTime) {
      const tmp = new Date(`${eventForm.date}T${eventForm.endTime}:00`);
      if (!Number.isNaN(tmp.getTime())) endsAt = tmp;
    }

    const interestTags = eventForm.interestTags.split(",").map((t) => t.trim()).filter(Boolean);

    setCreatingEvent(true);
    try {
      const { error } = await supabase.from("partner_events_created").insert({
        title, description, location, city,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt ? endsAt.toISOString() : null,
        interest_tags: interestTags.length ? interestTags : null,
        is_active: true,
        partner_id: partner.id,
      });

      if (error) { toast.error(error.message || "Errore nella creazione dell'evento."); return; }

      toast.success("Evento creato correttamente.");
      setEventForm({ title: "", description: "", date: "", startTime: "", endTime: "", location: "", city: "", interestTags: "" });
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
                  <div key={ev.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-100/50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-900 truncate">{ev.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                        {ev.starts_at && <span>{formatEventDateTime(ev.starts_at)}</span>}
                        {(ev.location || ev.city) && <span>{ev.location || ""}{ev.city ? ` · ${ev.city}` : ""}</span>}
                        <span>Partecipazioni: <strong>{ev.attendance_count || 0}</strong></span>
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
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Descrizione</label>
                <textarea rows={2} className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/20 resize-y" placeholder="Racconta cosa succederà..." value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
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

      {/* Badge verificato */}
      {partner.is_verified && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-950 text-white text-[11px] rounded-full flex items-center gap-2 shadow-xl pointer-events-none print:hidden">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Partner verificato Desideri di Puglia
        </div>
      )}

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
    </div>
  );
}