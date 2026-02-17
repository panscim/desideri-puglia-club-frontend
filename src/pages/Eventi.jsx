// src/pages/Eventi.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, CalendarDays, MapPin, Sparkles, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const Eventi = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // prenotazioni dell’utente
  const [reservations, setReservations] = useState([])
  const [loadingReservations, setLoadingReservations] = useState(false)

  const navigate = useNavigate()
  const { profile } = useAuth()

  // interessi scelti in onboarding (array di stringhe)
  const userInterests = Array.isArray(profile?.interessi_tags)
    ? profile.interessi_tags
    : []

  // ---- CARICAMENTO EVENTI FUTURI ----
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)

        const nowIso = new Date().toISOString()

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
              logo_url
            )
          `
          )
          .eq('is_active', true)
          .gte('starts_at', nowIso)
          .order('starts_at', { ascending: true })

        if (error) throw error

        setEvents(data || [])
      } catch (err) {
        console.error('[Eventi] load error:', err)
        toast.error('Errore nel caricamento degli eventi')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  // ---- CARICAMENTO PRENOTAZIONI PER GLI EVENTI MOSTRATI ----
  useEffect(() => {
    const loadReservations = async () => {
      // se non sono loggato o non ho eventi, niente prenotazioni
      if (!profile?.id || !events.length) {
        setReservations([])
        return
      }

      try {
        setLoadingReservations(true)

        const eventIds = events.map((e) => e.id)

        const { data, error } = await supabase
          .from('partner_event_reservations')
          .select('event_id, status')
          .eq('user_id', profile.id)
          .in('event_id', eventIds)

        if (error) {
          console.warn('[Eventi] reservations load error:', error)
          return
        }

        setReservations(data || [])
      } catch (err) {
        console.warn('[Eventi] reservations load catch:', err)
      } finally {
        setLoadingReservations(false)
      }
    }

    loadReservations()
  }, [profile?.id, events])

  const handleOpenEvent = (eventId) => {
    if (!eventId) return
    navigate(`/eventi/${eventId}`)
  }

  const formatDateTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('it-IT', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const eventMatchesUser = (e) => {
    if (!userInterests.length) return false
    const tags = Array.isArray(e.interest_tags) ? e.interest_tags : []
    return tags.some((t) => userInterests.includes(t))
  }

  // evento prenotato da questo utente?
  const isEventReserved = (eventId) => {
    if (!eventId) return false
    return reservations.some(
      (r) => r.event_id === eventId && (r.status || 'booked') !== 'cancelled'
    )
  }

  // 👉 prima gli eventi che combaciano con gli interessi, poi tutti gli altri
  const sortedEvents = useMemo(() => {
    if (!events.length) return []
    if (!userInterests.length) return events

    const matches = []
    const others = []

    for (const ev of events) {
      if (eventMatchesUser(ev)) matches.push(ev)
      else others.push(ev)
    }

    return [...matches, ...others]
  }, [events, userInterests])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-olive-dark" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-6">
      {/* HEADER */}
      <section className="rounded-3xl border border-sand bg-warm-white shadow-md px-5 py-4 md:px-7 md:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-olive-light">
              <CalendarDays className="h-3 w-3" />
              <span>Eventi del Club</span>
            </div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-olive-dark md:text-3xl">
              <Sparkles className="h-6 w-6 text-amber-500" />
              <span>Eventi in programma</span>
            </h1>
            <p className="max-w-xl text-sm text-olive-light md:text-[15px]">
              Serate, degustazioni, esperienze speciali organizzate dai partner
              del Club. Quando arrivi sul posto, apri l’evento in app e fatti
              validare la partecipazione dal locale.
            </p>

            {userInterests.length > 0 && (
              <p className="text-[11px] text-olive-light/80">
                Prima vedi gli eventi più vicini ai tuoi interessi:{' '}
                <span className="font-medium">
                  {userInterests.join(' · ')}
                </span>
                . Subito dopo trovi tutti gli altri eventi in programma.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* LISTA EVENTI */}
      {sortedEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand bg-white px-4 py-6 text-center text-sm text-olive-light">
          Al momento non ci sono eventi futuri in calendario.
          Torna a dare un’occhiata tra qualche giorno ✨
        </div>
      ) : (
        <section className="space-y-3">
          <div className="text-xs text-olive-light flex items-center gap-2">
            <span>
              {sortedEvents.length} evento
              {sortedEvents.length > 1 ? 'i' : ''} in arrivo
            </span>
            {loadingReservations && (
              <span className="inline-flex items-center gap-1 text-[10px] text-olive-light/70">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Verifica prenotazioni…</span>
              </span>
            )}
          </div>

          <div className="space-y-3">
            {sortedEvents.map((e) => {
              const isForYou = eventMatchesUser(e)
              const reserved = isEventReserved(e.id)

              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => handleOpenEvent(e.id)}
                  className="w-full text-left rounded-3xl border border-sand bg-white px-4 py-3 md:px-5 md:py-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition flex gap-3"
                >
                  {/* Colonna data */}
                  <div className="flex flex-col items-center justify-center px-2 py-1 rounded-2xl bg-olive-dark text-white text-xs min-w-[70px]">
                    <span className="uppercase tracking-[0.16em] text-[10px]">
                      {formatDateTime(e.starts_at).split(' ')[0]}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {new Date(e.starts_at)
                        .getDate()
                        .toString()
                        .padStart(2, '0')}
                    </span>
                    <span className="text-[11px] mt-1">
                      {new Date(e.starts_at).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Contenuto evento */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <h2 className="text-sm md:text-base font-semibold text-olive-dark truncate">
                        {e.title}
                      </h2>

                      <div className="flex items-center gap-1">
                        {reserved && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Prenotato
                          </span>
                        )}

                        {isForYou && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Per te
                          </span>
                        )}

                        {e.partner?.name && (
                          <span className="text-[11px] text-olive-light truncate">
                            by{' '}
                            <span className="font-medium">
                              {e.partner.name}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {e.location && (
                      <p className="flex items-center gap-1 text-[11px] text-olive-light">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {e.location}
                          {e.city ? ` · ${e.city}` : ''}
                        </span>
                      </p>
                    )}

                    {Array.isArray(e.interest_tags) &&
                      e.interest_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {e.interest_tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-sand text-[10px] text-olive-dark"
                            >
                              {tag}
                            </span>
                          ))}
                          {e.interest_tags.length > 3 && (
                            <span className="text-[10px] text-olive-light">
                              +{e.interest_tags.length - 3} altri
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

export default Eventi