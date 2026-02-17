// src/pages/OnboardingInteressi.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Sparkles, MapPin, Compass, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Tag di interessi (verranno salvati in interessi_tags: text[])
const INTEREST_TAGS = [
  'Mare & spiagge',
  'Cibo tipico & ristoranti',
  'Street food',
  'Vini & cantine',
  'Olio & frantoi',
  'Borghi & centri storici',
  'Eventi & nightlife',
  'Relax & spa',
  'Trekking & natura',
  'Arte & musei',
  'Esperienze locali (tour, degustazioni)',
]

// Stile di viaggio (stile_viaggio: text)
const TRAVEL_STYLES = [
  'Food lover',
  'Beach addicted',
  'Notte & divertimento',
  'Relax & romanticismo',
  'Esploratore di borghi',
  'Viaggiatore curios* (un po’ di tutto)',
]

const OnboardingInteressi = () => {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedTags, setSelectedTags] = useState([])
  const [travelStyle, setTravelStyle] = useState('')
  const [favCity, setFavCity] = useState('')

  // Inizializza stato con dati esistenti (se già presenti)
  useEffect(() => {
    if (!profile) return

    // Se ha già completato onboarding → portalo via (es. home o classifica)
    if (profile.has_onboarding_completed) {
      navigate('/classifica', { replace: true })
      return
    }

    setSelectedTags(profile.interessi_tags || [])
    setTravelStyle(profile.stile_viaggio || '')
    setFavCity(profile.citta_preferita || '')
    setLoading(false)
  }, [profile, navigate])

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profile?.id) return

    if (selectedTags.length === 0) {
      toast.error('Seleziona almeno un interesse')
      return
    }

    setSaving(true)
    try {
      const payload = {
        interessi_tags: selectedTags,
        stile_viaggio: travelStyle || null,
        citta_preferita: favCity.trim() || null,
        has_onboarding_completed: true,
        ultima_attivita: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('utenti')
        .update(payload)
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Preferenze salvate 🎯')
      await refreshProfile?.()
      navigate('/classifica')
    } catch (err) {
      console.error('Onboarding error:', err)
      toast.error('Errore nel salvataggio delle preferenze')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('utenti')
        .update({
          has_onboarding_completed: true,
          ultima_attivita: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error
      await refreshProfile?.()
      navigate('/classifica')
    } catch (err) {
      console.error(err)
      toast.error('Errore nel proseguire')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-olive-light">Devi effettuare il login per continuare.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-olive-dark animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero */}
      <div className="card bg-gradient-to-b from-black via-[#050608] to-[#151515] text-white border border-neutral-900">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              Costruiamo il tuo Club su misura.
            </h1>
            <p className="text-sm text-white/80">
              In meno di 1 minuto ci dici cosa ti piace e noi useremo queste info per:
            </p>
            <ul className="text-xs text-white/70 list-disc list-inside space-y-1">
              <li>mostrarti partner e missioni più adatte a te</li>
              <li>creare premi speciali per i tuoi interessi</li>
              <li>mandarti solo notifiche utili (niente spam)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Interessi principali */}
        <section>
          <h2 className="text-lg font-semibold text-olive-dark flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-olive-dark" />
            Cosa ti interessa di più?
          </h2>
          <p className="text-xs text-olive-light mb-3">
            Seleziona uno o più interessi: li useremo per suggerirti partner, missioni e premi.
          </p>

          <div className="flex flex-wrap gap-2">
            {INTEREST_TAGS.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition ${
                    active
                      ? 'bg-olive-dark text-sand border-olive-dark'
                      : 'bg-sand/70 text-olive-dark border-sand hover:bg-sand'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </section>

        {/* Stile di viaggio */}
        <section>
          <h2 className="text-lg font-semibold text-olive-dark mb-1">
            Il tuo stile di viaggio (opzionale)
          </h2>
          <p className="text-xs text-olive-light mb-3">
            Questo ci aiuta a capire che tipo di esperienze ami di più.
          </p>

          <div className="grid sm:grid-cols-2 gap-2">
            {TRAVEL_STYLES.map((style) => {
              const active = travelStyle === style
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => setTravelStyle(style)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition ${
                    active
                      ? 'bg-olive-dark text-sand border-olive-dark'
                      : 'bg-sand/60 text-olive-dark border-sand hover:bg-sand'
                  }`}
                >
                  {style}
                </button>
              )
            })}
          </div>
        </section>

        {/* Città / zona preferita */}
        <section>
          <h2 className="text-lg font-semibold text-olive-dark flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-olive-dark" />
            La tua zona preferita in Puglia (opzionale)
          </h2>
          <p className="text-xs text-olive-light mb-2">
            Una città, un borgo o una zona dove vai spesso o che ami di più.
          </p>
          <input
            type="text"
            value={favCity}
            onChange={(e) => setFavCity(e.target.value)}
            className="w-full px-4 py-2 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light text-sm"
            placeholder="Es. Barletta, Valle d’Itria, Salento, Gargano..."
          />
        </section>

        {/* Azioni */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="text-xs text-olive-light hover:text-olive-dark underline disabled:opacity-50"
          >
            Salta per ora
          </button>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-sm px-6 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvataggio…' : 'Continua nel Club'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default OnboardingInteressi