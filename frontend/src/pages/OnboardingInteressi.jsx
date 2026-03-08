// src/pages/OnboardingInteressi.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Sparkles, MapPin, Compass, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import AnimatedAuthBackground from '../components/AnimatedAuthBackground'

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

    // Se ha già completato onboarding → portalo via (es. home)
    if (profile.has_onboarding_completed) {
      navigate('/dashboard', { replace: true })
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
      navigate('/dashboard')
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
      navigate('/dashboard')
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
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#EAE5DF]">
        <AnimatedAuthBackground />
        <Loader2 className="w-10 h-10 text-zinc-900 animate-spin z-10" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#EAE5DF] flex items-center justify-center p-6">
      <AnimatedAuthBackground />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl z-10 space-y-6"
      >
        {/* Intro / Header Glass */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-zinc-900 flex shrink-0 items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-amber-300" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-[28px] font-black text-zinc-900 leading-tight tracking-tight mix-blend-color-burn">
                Cosa ti appassiona?
              </h1>
              <p className="text-sm text-zinc-700 font-medium">
                Seleziona i tuoi interessi per scoprire Partner, Eventi e Missioni create su misura per te in Puglia.
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Interessi principali (Tags) */}
          <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-[17px] font-black text-zinc-900 flex items-center gap-2 mb-1">
              <Compass className="w-5 h-5 text-zinc-800" />
              I tuoi Interessi
            </h2>
            <p className="text-[13px] text-zinc-600 mb-5">
              Puoi sceglierne quanti ne vuoi. Più ne scegli, migliore sarà l'esperienza.
            </p>

            <div className="flex flex-wrap gap-2.5">
              {INTEREST_TAGS.map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2.5 rounded-full text-[13px] font-bold transition-all border shadow-sm ${active
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-2 ring-zinc-950/20'
                      : 'bg-white/70 text-zinc-700 border-zinc-200/50 hover:bg-white hover:text-zinc-900 hover:border-zinc-300'
                      }`}
                  >
                    {tag}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Stile di viaggio e Città Flex Row */}
          <div className="grid sm:grid-cols-2 gap-6">

            {/* Stile di viaggio */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
              <h2 className="text-[17px] font-black text-zinc-900 mb-1">
                Stile di viaggio
              </h2>
              <p className="text-[13px] text-zinc-600 mb-4 pb-2 border-b border-zinc-200/50">
                Che tipo di esploratore sei?
              </p>
              <div className="flex flex-col gap-2 mt-auto">
                {TRAVEL_STYLES.map((style) => {
                  const active = travelStyle === style
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setTravelStyle(style)}
                      className={`text-left px-4 py-3 rounded-[1rem] text-[13px] font-bold transition-all border ${active
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-md'
                        : 'bg-white/50 text-zinc-700 border-zinc-200/50 hover:bg-white hover:text-zinc-900'
                        }`}
                    >
                      {style}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Città / zona preferita */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-start">
              <h2 className="text-[17px] font-black text-zinc-900 flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-zinc-800" />
                Zona del Cuore
              </h2>
              <p className="text-[13px] text-zinc-600 mb-6">
                Una città o un borgo pugliese dove vai spesso.
              </p>

              <div className="relative group mt-auto">
                <div className="absolute inset-0 rounded-2xl bg-white/60 border border-zinc-200/50 shadow-sm backdrop-blur-md -z-10 group-focus-within:border-zinc-400/50 transition-colors" />
                <input
                  type="text"
                  value={favCity}
                  onChange={(e) => setFavCity(e.target.value)}
                  className="w-full bg-transparent border-0 px-4 py-4 text-zinc-900 placeholder-zinc-500 focus:ring-0 text-[15px] font-medium"
                  placeholder="Es. Ostuni, Salento..."
                />
              </div>
            </div>

          </div>

          {/* Azioni */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-950 transition-colors disabled:opacity-50 px-4 py-2"
            >
              Salta per ora
            </button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-zinc-950 text-white font-medium text-[15px] px-8 py-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvataggio...' : 'Entra nel Club'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default OnboardingInteressi