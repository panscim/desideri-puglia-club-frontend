// src/pages/EventiSuccess.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import {
  Loader2,
  CheckCircle2,
  CalendarDays,
  MapPin,
  Sparkles,
} from 'lucide-react'

const EventiSuccess = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const eventId = searchParams.get('event_id')

  const [eventData, setEventData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!eventId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('partner_events_created') // 👈 nuova tabella
          .select(
            `
            id,
            title,
            city,
            location,
            starts_at,
            partner:partner_id (
              id,
              name
            )
          `
          )
          .eq('id', eventId)
          .maybeSingle()

        if (error) throw error
        setEventData(data || null)
      } catch (e) {
        console.error('[EventiSuccess] load error:', e)
        setEventData(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [eventId])

  const formatDateTimeShort = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-olive-dark" />
      </div>
    )
  }

  const title = eventData?.title || 'Evento del Club'
  const partnerName = eventData?.partner?.name || null

  return (
    <div className="max-w-3xl mx-auto pb-10 px-4">
      <div className="mt-10 rounded-3xl bg-white shadow-lg border border-olive-light/20 p-6 md:p-8 space-y-5 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 mb-2">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-olive-dark">
            Partecipazione confermata ✨
          </h1>
          <p className="text-sm text-olive-light">
            La tua partecipazione all’evento è stata registrata correttamente.
            Per questo evento hai ricevuto{' '}
            <span className="font-semibold text-olive-dark">+3 Desideri</span>{' '}
            nel tuo portafoglio.
          </p>
        </div>

        <div className="mt-3 inline-flex flex-col items-stretch gap-2 text-sm text-olive-light bg-sand/40 rounded-2xl px-4 py-3 text-left max-w-md mx-auto border border-sand/70">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-olive-dark" />
            <span className="font-semibold text-olive-dark">{title}</span>
          </div>

          {partnerName && (
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Partner: {partnerName}</span>
            </div>
          )}

          {eventData?.starts_at && (
            <div className="flex items-center gap-2 text-xs">
              <CalendarDays className="w-3 h-3" />
              <span>{formatDateTimeShort(eventData.starts_at)}</span>
            </div>
          )}

          {(eventData?.location || eventData?.city) && (
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3 h-3" />
              <span>
                {eventData.location || ''}
                {eventData.city ? ` · ${eventData.city}` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="pt-4 flex flex-col md:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate('/eventi')}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-olive-dark text-white text-xs font-semibold hover:bg-olive-dark/90 transition"
          >
            Torna agli eventi
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-neutral-100 border border-olive-light/30 text-xs font-semibold text-olive-dark hover:bg-neutral-200 transition"
          >
            Vai alla home del Club
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventiSuccess