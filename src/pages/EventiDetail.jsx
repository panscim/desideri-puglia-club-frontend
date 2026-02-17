// src/pages/EventiDetail.jsx
import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Loader2,
  CalendarDays,
  MapPin,
  Clock,
  Sparkles,
  Lock,
  X,
  AlertCircle,
  CheckCircle2,
  Phone,
} from 'lucide-react'
import toast from 'react-hot-toast'

const FALLBACK_LOGO = 'https://placehold.co/64x64?text=Logo'

const EventiDetail = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()

  const [eventData, setEventData] = useState(null)
  const [loading, setLoading] = useState(true)

  // stato prenotazione
  const [reservation, setReservation] = useState(null)
  const [loadingReservation, setLoadingReservation] = useState(true)
  const [reserving, setReserving] = useState(false)

  // modal PIN
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState('')
  const [submittingPin, setSubmittingPin] = useState(false)

  const userInterests = Array.isArray(profile?.interessi_tags)
    ? profile.interessi_tags
    : []

  const eventMatchesUser = useMemo(() => {
    if (!eventData || !userInterests.length) return false
    const tags = Array.isArray(eventData.interest_tags)
      ? eventData.interest_tags
      : []
    return tags.some((t) => userInterests.includes(t))
  }, [eventData, userInterests])

  // Carica dati evento
  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from('partner_events_created')
          .select(
            `
            id,
            title,
            description,
            location,
            city,
            starts_at,
            ends_at,
            interest_tags,
            is_active,
            partner:partner_id (
              id,
              name,
              city,
              logo_url,
              address,
              google_maps_url,
              phone
            )
          `
          )
          .eq('id', eventId)
          .maybeSingle()

        if (error) throw error
        if (!data) {
          toast.error('Evento non trovato')
          navigate('/eventi')
          return
        }

        setEventData(data)
      } catch (err) {
        console.error('[EventiDetail] load error:', err)
        toast.error('Errore nel caricamento dell’evento')
        navigate('/eventi')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventId, navigate])

  // Carica / verifica prenotazione dell'utente per questo evento
  useEffect(() => {
    const loadReservation = async () => {
      if (!eventId || !profile?.id) {
        setReservation(null)
        setLoadingReservation(false)
        return
      }

      try {
        setLoadingReservation(true)
        const { data, error } = await supabase
          .from('partner_event_reservations')
          .select('id, status, created_at')
          .eq('event_id', eventId)
          .eq('user_id', profile.id)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.warn('[EventiDetail] reservation load error:', error)
        }

        setReservation(data || null)
      } catch (err) {
        console.warn('[EventiDetail] reservation load catch:', err)
        setReservation(null)
      } finally {
        setLoadingReservation(false)
      }
    }

    loadReservation()
  }, [eventId, profile?.id])

  const hasReservation =
    !!reservation && (reservation.status || 'booked') !== 'cancelled'

  const formatDateTimeLong = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const mapUrl = useMemo(() => {
    if (!eventData?.partner) return null
    if (eventData.partner.google_maps_url)
      return eventData.partner.google_maps_url

    const addr = eventData.partner.address || eventData.partner.city
    if (!addr) return null

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      addr
    )}`
  }, [eventData])

  // Prenotazione posto (utente da solo)
  const handleReserve = async () => {
    if (!profile?.id) {
      toast.error('Devi accedere per prenotare questo evento')
      navigate('/login')
      return
    }
    if (!eventData?.id) {
      toast.error('Evento non valido')
      return
    }

    // se già prenotato, non fare nulla
    if (hasReservation) {
      toast('Hai già prenotato questo evento ✅')
      return
    }

    try {
      setReserving(true)

      const { data, error } = await supabase
        .from('partner_event_reservations')
        .insert({
          event_id: eventData.id,
          user_id: profile.id,
          status: 'booked',
        })
        .select('id, status, created_at')
        .single()

      if (error) {
        console.error('[EventiDetail] reserve error:', error)

        // caso: unique (event_id, user_id) già esistente → tratto come già prenotato
        if (
          error.code === '23505' ||
          (error.message && error.message.toLowerCase().includes('duplicate'))
        ) {
          toast('Risulti già prenotato per questo evento ✅')
          // ricarica eventuale prenotazione
          const { data: existing } = await supabase
            .from('partner_event_reservations')
            .select('id, status, created_at')
            .eq('event_id', eventData.id)
            .eq('user_id', profile.id)
            .maybeSingle()
          if (existing) setReservation(existing)
          return
        }

        toast.error('Errore durante la prenotazione')
        return
      }

      setReservation(data)
      toast.success('Prenotazione effettuata ✅')
    } catch (err) {
      console.error('[EventiDetail] reserve catch:', err)
      toast.error('Errore inatteso durante la prenotazione')
    } finally {
      setReserving(false)
    }
  }

  const handleOpenPinModal = () => {
    if (!profile?.id) {
      toast.error('Devi essere loggato per confermare la partecipazione')
      return
    }
    if (!hasReservation) {
      toast.error('Prenota prima il tuo posto per questo evento')
      return
    }
    setPin('')
    setPinError('')
    setPinSuccess('')
    setPinModalOpen(true)
  }

  const handleClosePinModal = () => {
    if (submittingPin) return
    setPinModalOpen(false)
    setPin('')
    setPinError('')
    setPinSuccess('')
  }

  // Conferma presenza con PIN (solo dopo prenotazione)
  const handleConfirmAttendance = async (e) => {
    e?.preventDefault?.()

    if (!profile?.id) {
      toast.error('Devi essere loggato per confermare la partecipazione')
      return
    }
    if (!eventData?.id) {
      toast.error('Evento non valido')
      return
    }
    if (!hasReservation) {
      toast.error('Prima prenota il tuo posto, poi conferma con il PIN')
      return
    }

    const trimmedPin = pin.trim()
    if (!trimmedPin) {
      setPinError('Chiedi al personale di inserire il PIN del locale.')
      toast.error('Inserisci il PIN con il personale.')
      return
    }

    try {
      setSubmittingPin(true)
      setPinError('')
      setPinSuccess('')

      const { data, error } = await supabase.rpc(
        'event_created_confirm_attendance_with_pin', // RPC lato server
        {
          p_event_id: eventData.id,
          p_pin: trimmedPin,
        }
      )

      if (error) {
        console.error('[EventiDetail] confirm error:', error)
        const msg =
          error.message ||
          'PIN non valido o errore nella conferma. Riprova con il personale.'
        setPinError(msg)
        toast.error(msg)
        return
      }

      const earned = data?.earned_desideri ?? 3

      setPinSuccess(
        `Partecipazione confermata. Hai ricevuto +${earned} Desideri per questo evento.`
      )
      toast.success('Partecipazione confermata ✅')

      if (refreshProfile) {
        await refreshProfile()
      }

      setTimeout(() => {
        handleClosePinModal()
        navigate(`/eventi/success?event_id=${eventData.id}`)
      }, 700)
    } catch (err) {
      console.error('[EventiDetail] confirm catch:', err)
      const msg =
        err?.message ||
        'Errore inatteso nella conferma. Riprova con il personale.'
      setPinError(msg)
      toast.error(msg)
    } finally {
      setSubmittingPin(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-olive-dark" />
      </div>
    )
  }

  if (!eventData) return null

  const now = new Date()
  const isPast =
    eventData.starts_at && new Date(eventData.starts_at) < now

  const { partner } = eventData
  const heroLogo = partner?.logo_url || FALLBACK_LOGO

  return (
    <>
      <div className="max-w-3xl mx-auto pb-10 space-y-6">
        {/* Back */}
        <div className="flex items-center gap-2 py-4">
          <button
            type="button"
            onClick={() => navigate('/eventi')}
            className="text-xs text-olive-light hover:text-olive-dark inline-flex items-center gap-1"
          >
            ← Torna agli eventi
          </button>
        </div>

        {/* HERO EVENTO */}
        <section className="rounded-3xl overflow-hidden bg-white shadow-lg border border-olive-light/20">
          <div className="h-40 w-full overflow-hidden bg-black/5 flex items-center justify-center">
            <CalendarDays className="w-10 h-10 text-olive-light" />
          </div>

          <div className="p-5 md:p-6 space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-olive-light/40 flex-shrink-0 -mt-10 shadow-md">
                <img
                  src={heroLogo}
                  alt={partner?.name || 'Partner'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (e.currentTarget.src !== FALLBACK_LOGO) {
                      e.currentTarget.src = FALLBACK_LOGO
                    }
                  }}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-olive-dark">
                    {eventData.title}
                  </h1>
                  {eventMatchesUser && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-700">
                      <Sparkles className="w-3 h-3" />
                      Per te
                    </span>
                  )}
                </div>

                {partner?.name && (
                  <p className="text-xs text-olive-light">
                    Organizzato da{' '}
                    <span className="font-medium">{partner.name}</span>
                    {partner.city ? ` · ${partner.city}` : ''}
                  </p>
                )}

                <p className="flex items-center gap-1 text-xs text-olive-light">
                  <Clock className="w-3 h-3" />
                  <span>{formatDateTimeLong(eventData.starts_at)}</span>
                </p>

                {eventData.location && (
                  <p className="flex items-center gap-1 text-xs text-olive-light">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {eventData.location}
                      {eventData.city ? ` · ${eventData.city}` : ''}
                    </span>
                  </p>
                )}

                {Array.isArray(eventData.interest_tags) &&
                  eventData.interest_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {eventData.interest_tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-sand text-[10px] text-olive-dark"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Descrizione evento */}
            {eventData.description && (
              <div className="pt-2">
                <p className="text-sm text-olive-light whitespace-pre-line leading-relaxed">
                  {eventData.description}
                </p>
              </div>
            )}

            {/* Info partner base */}
            {partner && (
              <div className="mt-3 grid gap-3 text-xs text-olive-light md:grid-cols-2">
                {(partner.address || partner.city) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 mt-0.5" />
                    <div>
                      <p className="font-semibold text-olive-dark">
                        Indirizzo partner
                      </p>
                      <p>
                        {partner.address || 'Indirizzo non disponibile'}
                        {partner.city ? ` · ${partner.city}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {partner.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-3 h-3 mt-0.5" />
                    <div>
                      <p className="font-semibold text-olive-dark">Telefono</p>
                      <p className="break-all">{partner.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CTA: PRENOTAZIONE + PIN */}
            <div className="pt-3 border-t border-sand/60 mt-2 space-y-2">
              {isPast ? (
                <>
                  <p className="text-[11px] text-rose-500 font-medium">
                    Questo evento è già passato. Non è più possibile prenotare
                    o confermare la partecipazione.
                  </p>
                  <p className="text-[11px] text-olive-light">
                    Continua a seguire gli eventi del Club: presto troverai
                    nuove serate e attività adatte ai tuoi interessi.
                  </p>
                </>
              ) : (
                <>
                  {loadingReservation ? (
                    <div className="flex items-center gap-2 text-[11px] text-olive-light">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Verifica prenotazione in corso…</span>
                    </div>
                  ) : !profile?.id ? (
                    <>
                      <p className="text-[11px] text-olive-light">
                        Accedi al Club per prenotare il tuo posto a questo
                        evento e confermare la partecipazione al tuo arrivo.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-olive-dark text-white text-xs font-semibold hover:bg-olive-dark/90 transition"
                      >
                        Accedi per prenotare
                      </button>
                    </>
                  ) : !hasReservation ? (
                    <>
                      <p className="text-[11px] text-olive-light">
                        Prenota il tuo posto per questo evento. Una volta
                        confermata la prenotazione, al tuo arrivo al locale
                        potrai far inserire al personale il PIN per registrare
                        la presenza e ottenere i Desideri.
                      </p>
                      <button
                        type="button"
                        onClick={handleReserve}
                        disabled={reserving}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-olive-dark text-white text-xs font-semibold hover:bg-olive-dark/90 transition disabled:opacity-70"
                      >
                        {reserving ? 'Prenotazione…' : 'Prenota il tuo posto'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 mt-0.5" />
                        <div>
                          <p className="font-semibold">
                            Prenotazione confermata
                          </p>
                          {reservation?.created_at && (
                            <p>
                              Hai prenotato il tuo posto in data{' '}
                              {new Date(
                                reservation.created_at
                              ).toLocaleString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              .
                            </p>
                          )}
                          <p className="mt-0.5">
                            Quando arrivi al locale, apri questa schermata e
                            fai inserire al personale il PIN segreto per
                            confermare la tua presenza.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenPinModal}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-olive-dark text-white text-xs font-semibold hover:bg-olive-dark/90 transition"
                      >
                        <Lock className="w-3 h-3" />
                        Conferma partecipazione con PIN
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* eventualmente un pulsante per aprire Maps */}
        {mapUrl && (
          <section>
            <button
              type="button"
              onClick={() =>
                window.open(mapUrl, '_blank', 'noopener,noreferrer')
              }
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-100 border border-olive-light/30 text-xs font-medium text-olive-dark hover:bg-neutral-200 transition"
            >
              <MapPin className="w-4 h-4" />
              Apri percorso in Google Maps
            </button>
          </section>
        )}
      </div>

      {/* MODAL PIN EVENTO */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-3xl overflow-hidden bg-gradient-to-b from-black via-[#050608] to-[#151515] text-white border border-neutral-800 shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/60">
                Conferma partecipazione
              </p>
              <button
                type="button"
                onClick={handleClosePinModal}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-4">
              {/* riepilogo evento */}
              <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
                <p className="text-[11px] text-white/60 uppercase tracking-[0.16em] mb-1">
                  Evento
                </p>
                <p className="text-sm font-semibold">{eventData.title}</p>
                {partner?.name && (
                  <p className="text-[11px] text-white/70 mt-0.5">
                    {partner.name}
                  </p>
                )}
                <p className="text-[11px] text-white/70 mt-1">
                  {formatDateTimeLong(eventData.starts_at)}
                </p>
              </div>

              {/* testo guida */}
              <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-[11px] text-white/80 flex items-start gap-2">
                <Lock className="w-3 h-3 mt-0.5 text-amber-200" />
                <div>
                  <p className="font-semibold mb-0.5">
                    Il PIN lo conosce solo il locale
                  </p>
                  <p>
                    Passa il telefono al personale: sarà il bar/locale a
                    inserire il PIN segreto per confermare la tua partecipazione
                    all’evento.
                  </p>
                </div>
              </div>

              {/* form PIN */}
              <form onSubmit={handleConfirmAttendance} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-white mb-1">
                    PIN del partner
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="input w-full bg-white/5 border-white/20 text-sm text-white placeholder:text-white/40"
                    placeholder="Digita il PIN solo con il personale del locale"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                </div>

                {pinError && (
                  <p className="flex items-center gap-1 text-[11px] text-rose-300">
                    <AlertCircle className="w-3 h-3" />
                    {pinError}
                  </p>
                )}

                {pinSuccess && (
                  <p className="flex items-center gap-1 text-[11px] text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    {pinSuccess}
                  </p>
                )}

                <div className="pt-1 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={submittingPin}
                    className={`inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-100 transition ${
                      submittingPin ? 'opacity-80' : ''
                    }`}
                  >
                    {submittingPin ? 'Verifica PIN…' : 'Conferma partecipazione'}
                  </button>
                  <p className="text-[10px] text-white/50">
                    La conferma viene salvata sui server Desideri di Puglia e
                    ti assegna automaticamente +3 Desideri per questo evento.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EventiDetail