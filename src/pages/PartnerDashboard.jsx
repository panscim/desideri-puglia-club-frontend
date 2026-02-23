// src/pages/PartnerDashboard.jsx
import { useEffect, useState, useMemo } from "react";
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
  Coins,
  Clock,
  Trash2,
} from "lucide-react";





export default function PartnerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [stats, setStats] = useState({
    views: 0,
    clicks_instagram: 0,
    clicks_website: 0,
  });



  // 🎟️ Eventi partner (creati)
  const [showEventForm, setShowEventForm] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    city: "",
    interestTags: "",
  });
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // 🌗 Switch modalità Partner ⇄ Utente (animazione overlay)
  const [modeTransition, setModeTransition] = useState({
    active: false,
    target: null, // 'user' | 'partner'
    flip: false,
  });

  // 🔐 visibilità PIN nel box Profilo locale
  const [showPin, setShowPin] = useState(false);



  // 🔢 Carica statistiche mensili da partner_analytics_monthly
  const loadStats = async (partnerId) => {
    try {
      const { data, error } = await supabase
        .from("partner_analytics_monthly")
        .select("visits, clicks_instagram, clicks_website")
        .eq("partner_id", partnerId)
        .order("month_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("[PartnerDashboard] loadStats error:", error.message);
        setStats({
          views: 0,
          clicks_instagram: 0,
          clicks_website: 0,
        });
        return;
      }

      if (!data) {
        setStats({
          views: 0,
          clicks_instagram: 0,
          clicks_website: 0,
        });
        return;
      }

      setStats({
        views: data.visits ?? 0,
        clicks_instagram: data.clicks_instagram ?? 0,
        clicks_website: data.clicks_website ?? 0,
      });
    } catch (e) {
      console.warn("[PartnerDashboard] loadStats catch:", e);
      setStats({
        views: 0,
        clicks_instagram: 0,
        clicks_website: 0,
      });
    }
  };

  // 🗓️ Carica eventi creati dal partner con conteggio partecipazioni
  const loadEvents = async (partnerId) => {
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from("partner_events_created")
        .select(
          `
          id,
          title,
          starts_at,
          ends_at,
          location,
          city,
          is_active,
          attendances:partner_event_attendances_created(count)
        `
        )
        .eq("partner_id", partnerId)
        .order("starts_at", { ascending: true });

      if (error) {
        console.error("[PartnerDashboard] loadEvents error:", error);
        setEvents([]);
        return;
      }

      const normalized =
        data?.map((ev) => ({
          ...ev,
          attendance_count:
            ev.attendances?.[0]?.count != null ? ev.attendances[0].count : 0,
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
        if (!profile?.id) {
          navigate("/login");
          return;
        }

        // Recupera il partner di questo utente
        const { data, error } = await supabase
          .from("partners")
          .select("*")
          .eq("owner_user_id", profile.id)
          .maybeSingle();

        if (error) {
          console.error(error);
        }

        if (!data) {
          // Nessun partner creato: rimando alla registrazione
          navigate("/partner/join");
          return;
        }

        setPartner(data);

        await Promise.all([
          loadStats(data.id),
          loadEvents(data.id),
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profile?.id, navigate]);

  // Cambio modalità con overlay animato
  const handleModeSwitch = (target) => {
    setModeTransition({
      active: true,
      target,
      flip: false,
    });

    setTimeout(() => {
      setModeTransition((prev) => ({ ...prev, flip: true }));
    }, 500);

    setTimeout(() => {
      if (target === "user") {
        navigate("/dashboard");
      } else {
        navigate("/partner/dashboard");
      }
    }, 1500);
  };

  const goEditProfile = () => {
    navigate("/partner/join");
  };




  // 🗓️ CREA EVENTO
  const handleCreateEvent = async (e) => {
    e?.preventDefault?.();

    if (!partner?.id) return;

    const title = eventForm.title.trim();
    const description = eventForm.description.trim() || null;
    const location = eventForm.location.trim() || null;
    const city = (eventForm.city || partner.city || "").trim() || null;

    if (!title) {
      alert("Inserisci un titolo per l'evento.");
      return;
    }
    if (!eventForm.date || !eventForm.startTime) {
      alert("Inserisci data e orario di inizio dell'evento.");
      return;
    }

    const startsAt = new Date(`${eventForm.date}T${eventForm.startTime}:00`);
    if (Number.isNaN(startsAt.getTime())) {
      alert("Data o orario di inizio non validi.");
      return;
    }

    let endsAt = null;
    if (eventForm.endTime) {
      const tmp = new Date(`${eventForm.date}T${eventForm.endTime}:00`);
      if (!Number.isNaN(tmp.getTime())) {
        endsAt = tmp;
      }
    }

    const interestTags = eventForm.interestTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setCreatingEvent(true);
    try {
      const { error } = await supabase.from("partner_events_created").insert({
        title,
        description,
        location,
        city,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt ? endsAt.toISOString() : null,
        interest_tags: interestTags.length ? interestTags : null,
        is_active: true,
        partner_id: partner.id,
      });

      if (error) {
        console.error("[PartnerDashboard] create event error:", error);
        alert(error.message || "Errore nella creazione dell'evento.");
        return;
      }

      alert(
        "Evento creato correttamente. È ora visibile nella sezione Eventi dell'app."
      );

      setEventForm({
        title: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        city: "",
        interestTags: "",
      });
      setShowEventForm(false);

      await loadEvents(partner.id);
    } catch (err) {
      console.error("[PartnerDashboard] handleCreateEvent catch:", err);
      alert(err.message || "Errore nella creazione dell'evento.");
    } finally {
      setCreatingEvent(false);
    }
  };

  // ❌ ELIMINA EVENTO
  const handleDeleteEvent = async (eventId) => {
    if (!partner?.id) return;

    const ok = window.confirm(
      "Vuoi davvero eliminare questo evento? L’operazione non può essere annullata."
    );
    if (!ok) return;

    try {
      const { error } = await supabase
        .from("partner_events_created")
        .delete()
        .eq("id", eventId)
        .eq("partner_id", partner.id);

      if (error) {
        console.error("[PartnerDashboard] handleDeleteEvent error:", error);
        alert(error.message || "Errore nell’eliminazione dell’evento.");
        return;
      }

      await loadEvents(partner.id);
    } catch (err) {
      console.error("[PartnerDashboard] handleDeleteEvent catch:", err);
      alert(err.message || "Errore nell’eliminazione dell’evento.");
    }
  };

  const formatEventDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("it-IT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark" />
      </div>
    );
  }

  if (!partner) {
    return null;
  }

  const rawPin = String(
    partner.pin_code ||
    partner.redeem_pin ||
    partner.secret_pin ||
    partner.pin ||
    partner.partner_pin ||
    ""
  );
  const hasPin = rawPin.trim().length > 0;

  return (
    <div
      data-theme="dp-light"
      className="max-w-5xl mx-auto px-4 pb-10 space-y-10"
    >
      {/* HEADER */}
      <section className="rounded-3xl bg-gradient-to-r from-black via-[#050608] to-[#161616] text-white border border-neutral-900 shadow-lg px-6 md:px-10 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            {partner.logo_url ? (
              <img
                src={partner.logo_url}
                alt={partner.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-7 h-7 text-amber-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50 mb-1">
              Area Partner
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight break-words">
              {partner.name || "Il tuo locale nel Club Desideri di Puglia"}
            </h1>
            <p className="mt-2 text-xs md:text-sm text-white/70">
              Gestisci il tuo locale, i gettoni e gli eventi del Club.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 text-xs md:text-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Partner verificato Desideri di Puglia</span>
          </div>
          <button
            type="button"
            onClick={goEditProfile}
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-medium hover:bg-neutral-100 transition"
          >
            <Edit3 className="w-4 h-4" />
            Modifica profilo
          </button>
        </div>
      </section>

      {/* SWITCH MODALITÀ */}
      <section className="flex justify-center">
        <button
          type="button"
          onClick={() => handleModeSwitch("user")}
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-olive-dark text-white text-sm font-medium shadow-md active:scale-[0.98] transition-transform duration-300"
        >
          Modalità utente
        </button>
      </section>

      {/* BADGE VERIFICATO */}
      <section className="gap-4">


        {/* Badge Verificato */}
        <div className={`card ${partner.is_verified ? 'bg-gradient-to-br from-blue-50 to-warm-white border-blue-200/50' : ''}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-olive-light mb-1">Badge Verificato</p>
              <p className="text-lg font-bold text-olive-dark">
                {partner.is_verified ? '✓ Attivo' : 'Non attivo'}
              </p>
              {partner.is_verified ? (
                <p className="text-[11px] text-blue-600 mt-1">
                  Sei in cima alla lista e visibile sulla mappa
                </p>
              ) : (
                <p className="text-[11px] text-olive-light mt-1">
                  Ottieni la spunta blu, priorità in lista e contatto WhatsApp diretto
                </p>
              )}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${partner.is_verified ? 'bg-blue-100' : 'bg-sand'}`}>
              <CheckCircle2 className={`w-5 h-5 ${partner.is_verified ? 'text-blue-500' : 'text-olive-light'}`} />
            </div>
          </div>
          {!partner.is_verified && (
            <button
              type="button"
              onClick={() => {
                // TODO: link Stripe per Badge Verificato
                toast('Badge Verificato — contatta l\'admin per attivarlo', { icon: '✓' });
              }}
              className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition active:scale-[0.98]"
            >
              Attiva Badge Verificato
            </button>
          )}
        </div>
      </section>

      {/* GRID PRINCIPALE */}
      <section className="grid lg:grid-cols-3 gap-6">
        {/* COLONNA SINISTRA */}
        <div className="lg:col-span-2 space-y-6">
          {/* PROFILO / ANTEPRIMA */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h2 className="text-lg font-semibold text-olive-dark">
                Profilo locale
              </h2>
              <button
                type="button"
                onClick={goEditProfile}
                className="text-xs inline-flex items-center gap-1 px-3 py-1 rounded-full border border-sand text-olive-dark hover:bg-sand/70 transition whitespace-nowrap"
              >
                <Edit3 className="w-3 h-3" />
                Modifica
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-sand flex items-center justify-center overflow-hidden text-olive-dark font-bold text-xl flex-shrink-0">
                {partner.logo_url ? (
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (partner.name?.[0] || "?").toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1 text-sm">
                <p className="font-semibold text-olive-dark break-words">
                  {partner.name || "Nome attività non impostato"}
                </p>
                <p className="text-olive-light text-xs">
                  {partner.category || "Categoria"} · {partner.city || "Città"}
                </p>
                {partner.description && (
                  <p className="text-xs text-olive-dark mt-2 break-all">
                    {partner.description}
                  </p>
                )}



                {/* PIN segreto */}
                <div className="mt-3 rounded-xl border border-sand bg-white px-3 py-2 text-xs">
                  <p className="text-olive-light mb-1">
                    PIN segreto del partner
                  </p>
                  <p className="text-[11px] text-olive-light">
                    Questo PIN viene usato solo in cassa dal personale del
                    locale, per confermare le visite e la partecipazione agli eventi.
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center rounded-lg bg-sand/40 px-3 py-1 font-mono text-sm tracking-[0.35em] text-olive-dark max-w-full overflow-hidden">
                      {hasPin
                        ? showPin
                          ? rawPin
                          : "•".repeat(rawPin.length || 5)
                        : "Nessun PIN impostato"}
                    </span>

                    <button
                      type="button"
                      onClick={() => hasPin && setShowPin((v) => !v)}
                      disabled={!hasPin}
                      className={`inline-flex items-center gap-1 rounded-full border border-sand px-3 py-1 text-[11px] transition whitespace-nowrap ${hasPin
                        ? "text-olive-dark hover:bg-sand/60"
                        : "text-olive-light cursor-not-allowed bg-sand/30"
                        }`}
                    >
                      {hasPin ? (
                        showPin ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )
                      ) : null}
                      <span>
                        {hasPin ? (showPin ? "Nascondi" : "Mostra") : "Nessun PIN"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>




          <div className="card">
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-olive-dark flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-olive-dark" />
                  <span>Eventi del tuo locale</span>
                </h2>
                <p className="text-xs text-olive-light mt-1">
                  Crea serate, degustazioni ed eventi speciali visibili nella
                  sezione Eventi dell’app. La partecipazione viene confermata
                  dal locale tramite PIN e assegna Desideri agli utenti.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowEventForm((v) => !v)}
                  className="px-3 py-1 rounded-full bg-olive-dark text-white text-[11px] font-medium hover:bg-olive-dark/90 transition whitespace-nowrap"
                >
                  {showEventForm ? "Chiudi form evento" : "Crea nuovo evento"}
                </button>
              </div>
            </div>

            {
              showEventForm && (
                <form
                  onSubmit={handleCreateEvent}
                  className="mt-2 space-y-3 border-t border-sand pt-3"
                >
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-olive-dark mb-1">
                        Titolo evento *
                      </label>
                      <input
                        className="input w-full"
                        placeholder='Es. "Aperitivo del Club", "Serata degustazione vini"'
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm((f) => ({
                            ...f,
                            title: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-olive-dark mb-1">
                        Data *
                      </label>
                      <input
                        type="date"
                        className="input w-full"
                        value={eventForm.date}
                        onChange={(e) =>
                          setEventForm((f) => ({
                            ...f,
                            date: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-olive-dark mb-1">
                        Orario di inizio *
                      </label>
                      <input
                        type="time"
                        className="input w-full"
                        value={eventForm.startTime}
                        onChange={(e) =>
                          setEventForm((f) => ({
                            ...f,
                            startTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-olive-dark mb-1">
                        Orario di fine (facoltativo)
                      </label>
                      <input
                        type="time"
                        className="input w-full"
                        value={eventForm.endTime}
                        onChange={(e) =>
                          setEventForm((f) => ({
                            ...f,
                            endTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-olive-dark mb-1">
                        Luogo / nome del locale *
                      </label>
                      <input
                        className="input w-full"
                        placeholder='Es. "SGmetal", "Wine Bar Centro Storico"'
                        value={eventForm.location}
                        onChange={(e) =>
                          setEventForm((f) => ({
                            ...f,
                            location: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-olive-dark mb-1">
                        Città (facoltativo)
                      </label>
                      <input
                        className="input w-full"
                        placeholder={partner.city || "Es. Barletta"}
                        value={eventForm.city}
                        onChange={(e) =>
                          setEventForm((f) => ({
                            ...f,
                            city: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-olive-dark mb-1">
                      Tag / interessi (separati da virgola)
                    </label>
                    <input
                      className="input w-full"
                      placeholder='Es. "Bar, Serata, Degustazione"'
                      value={eventForm.interestTags}
                      onChange={(e) =>
                        setEventForm((f) => ({
                          ...f,
                          interestTags: e.target.value,
                        }))
                      }
                    />
                    <p className="text-[11px] text-olive-light mt-1">
                      Questi tag verranno usati per far vedere prima l’evento
                      agli utenti che hanno scelto interessi simili in
                      onboarding.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-olive-dark mb-1">
                      Descrizione evento (facoltativo)
                    </label>
                    <textarea
                      rows={3}
                      className="input w-full resize-y break-all"
                      placeholder='Racconta cosa succederà, se ci sono sconti speciali per i membri del Club, dress code, ecc.'
                      value={eventForm.description}
                      onChange={(e) =>
                        setEventForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={creatingEvent}
                      className="btn-primary text-xs"
                    >
                      {creatingEvent ? "Creazione evento…" : "Crea evento"}
                    </button>
                  </div>
                </form>
              )}

            {/* Lista eventi */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-olive-dark">
                  Eventi creati
                </p>
                {loadingEvents && (
                  <p className="text-[11px] text-olive-light flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Aggiornamento…
                  </p>
                )}
              </div>

              {events.length === 0 ? (
                <p className="text-xs text-olive-light">
                  Non hai ancora creato eventi. Quando crei un evento, lo
                  vedrai qui con le partecipazioni confermate.
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {events.map((ev) => {
                    const now = new Date();
                    const start = ev.starts_at ? new Date(ev.starts_at) : null;
                    const isPast = start && start < now;

                    let statusLabel = "Attivo";
                    let statusClass = "bg-emerald-100 text-emerald-700";

                    if (!ev.is_active) {
                      statusLabel = "Disattivato";
                      statusClass = "bg-neutral-200 text-neutral-700";
                    } else if (isPast) {
                      statusLabel = "Terminato";
                      statusClass = "bg-rose-100 text-rose-700";
                    }

                    return (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-sand bg-sand/30 px-3 py-3 flex flex-col gap-2"
                      >
                        <div className="flex items-start gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white border border-sand mt-0.5 flex-shrink-0">
                            <CalendarDays className="w-4 h-4 text-olive-dark" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-olive-dark truncate">
                                {ev.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEvent(ev.id)}
                                  className="inline-flex items-center gap-1 text-[10px] text-rose-700 hover:text-rose-800"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Elimina</span>
                                </button>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] ${statusClass}`}
                                >
                                  {statusLabel}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-olive-light mt-1">
                              {ev.starts_at && (
                                <span>
                                  Inizio: {formatEventDateTime(ev.starts_at)}
                                </span>
                              )}
                              {(ev.location || ev.city) && (
                                <span>
                                  {ev.location || ""}
                                  {ev.city ? ` · ${ev.city}` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-olive-dark">
                          <span>
                            Partecipazioni confermate:{" "}
                            <b>{ev.attendance_count || 0}</b>
                          </span>
                          <span className="text-olive-light">
                            I membri confermano la presenza tramite PIN
                            direttamente dall’app.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA */}
        <div className="space-y-6">
          {/* STATISTICHE */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-olive-dark">
                Statistiche profilo
              </h2>
              <BarChart3 className="w-4 h-4 text-olive-light" />
            </div>
            <p className="text-[11px] text-olive-light mb-4">
              Dati aggiornati sulle interazioni del tuo profilo nel Club (mese
              corrente).
            </p>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-sand bg-sand/40 py-3">
                <p className="text-[11px] text-olive-light mb-1">
                  Visualizzazioni
                </p>
                <p className="text-lg font-semibold text-olive-dark">
                  {stats.views}
                </p>
              </div>
              <div className="rounded-xl border border-sand bg-white py-3">
                <p className="text-[11px] text-olive-light mb-1">Click IG</p>
                <p className="text-lg font-semibold text-olive-dark">
                  {stats.clicks_instagram}
                </p>
              </div>
              <div className="rounded-xl border border-sand bg-white py-3">
                <p className="text-[11px] text-olive-light mb-1">Click sito</p>
                <p className="text-lg font-semibold text-olive-dark">
                  {stats.clicks_website}
                </p>
              </div>
            </div>
          </div>

          {/* LINK RAPIDI */}
          <div className="card">
            <h3 className="text-sm font-semibold text-olive-dark mb-2">
              Link rapidi
            </h3>
            <ul className="space-y-2 text-xs text-olive-dark">
              {partner.instagram_url && (
                <li className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2">
                    <Instagram className="w-3 h-3 text-olive-light" />
                    Instagram attività
                  </span>
                  <a
                    href={partner.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-olive-light underline text-[11px] break-all text-right"
                  >
                    Apri
                  </a>
                </li>
              )}
              {partner.website_url && (
                <li className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2">
                    <Globe className="w-3 h-3 text-olive-light" />
                    Sito web
                  </span>
                  <a
                    href={partner.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-olive-light underline text-[11px] break-all text-right"
                  >
                    Apri
                  </a>
                </li>
              )}
              <li className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-olive-light" />
                  Modifica profilo Partner
                </span>
                <button
                  type="button"
                  onClick={goEditProfile}
                  className="text-olive-light underline text-[11px]"
                >
                  Apri
                </button>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Overlay cambio modalità */}
      {
        modeTransition.active && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
            <div className="relative w-40 h-40 mb-6">
              <img
                src={
                  modeTransition.target === "user"
                    ? "/cambioview/partner.png"
                    : "/cambioview/utente.png"
                }
                alt="Icona attuale"
                className="absolute inset-0 w-full h-full object-contain transition-all duration-800 ease-out"
                style={{
                  opacity: modeTransition.flip ? 0 : 1,
                  transform: modeTransition.flip
                    ? "translateX(-80px) scale(0.9)"
                    : "translateX(0) scale(1)",
                }}
              />
              <img
                src={
                  modeTransition.target === "user"
                    ? "/cambioview/utente.png"
                    : "/cambioview/partner.png"
                }
                alt="Nuova modalità"
                className={`absolute inset-0 w-full h-full object-contain transition-all duration-800 ease-out ${modeTransition.flip ? "animate-pulse" : ""
                  }`}
                style={{
                  opacity: modeTransition.flip ? 1 : 0,
                  transform: modeTransition.flip
                    ? "translateX(0) scale(1)"
                    : "translateX(80px) scale(0.9)",
                }}
              />
            </div>

            <p className="text-lg font-semibold text-olive-dark mb-1">
              Modalità Utente
            </p>
            <p className="text-sm text-olive-light">
              Torni alla visuale del Club come ospite.
            </p>
          </div>
        )
      }
    </div >
  );
}