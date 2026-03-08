// src/pages/MarketPurchaseSuccess.jsx
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Sparkles, ShoppingBag } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const PURCHASE_SOUND = '/Sound_market/purchase.mp3'

function useQuery() {
  const { search } = useLocation()
  return new URLSearchParams(search)
}

const MarketPurchaseSuccess = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const query = useQuery()

  const method = query.get('method') || 'desideri' // 'desideri' | 'card'
  const itemId = query.get('item_id') || null

  useEffect(() => {
    try {
      if (typeof Audio === 'undefined') return
      const audio = new Audio(PURCHASE_SOUND)
      audio.volume = 0.6
      audio.play().catch(() => {})
    } catch {
      // no-op
    }
  }, [])

  const isCard = method === 'card'
  const isDesideri = method === 'desideri'

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="card text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-2" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-olive-dark mb-2">
          Acquisto completato 🎉
        </h1>

        {isDesideri && (
          <p className="text-sm text-olive-dark mb-2">
            Il tuo ordine è stato registrato correttamente usando i{" "}
            <span className="font-semibold">Desideri del Club</span>.
          </p>
        )}

        {isCard && (
          <p className="text-sm text-olive-dark mb-2">
            Il pagamento con carta è andato a buon fine.
          </p>
        )}

        <p className="text-sm text-olive-light mb-4">
          {/*
            Testo generico: valido sia per digitale che fisico.
            Se in futuro vuoi distinguere, puoi passare anche category nel query param.
          */}
          Se si tratta di un prodotto fisico, il tuo ordine verrà preparato e spedito
          entro massimo <span className="font-semibold">7 giorni lavorativi</span>.
          Per prodotti digitali riceverai il materiale direttamente via email
          o in un’area dedicata del Club.
        </p>

        <div className="space-y-2 text-[13px] text-olive-light mb-6">
          <p>
            👀 Se non trovi le nostre comunicazioni, controlla anche la
            cartella <span className="font-semibold">Spam</span> o
            <span className="font-semibold"> Promozioni</span>.
          </p>
          <p>
            Per qualunque dubbio puoi scriverci rispondendo alle email del Club
            o tramite la chat interna.
          </p>
        </div>

        {/* RIEPILOGO DATI SPEDIZIONE */}
        <div className="mb-8 text-left border border-sand rounded-lg p-4 bg-warm-white/60">
          <h2 className="text-lg font-bold text-olive-dark mb-2">
            Riepilogo dati di spedizione
          </h2>

          <p className="text-sm text-olive-dark">
            <span className="font-semibold">Nome:</span> {profile?.nome} {profile?.cognome}
          </p>
          <p className="text-sm text-olive-dark">
            <span className="font-semibold">Indirizzo:</span> {profile?.via}, {profile?.numero_civico}
          </p>
          <p className="text-sm text-olive-dark">
            <span className="font-semibold">Città:</span> {profile?.cap} {profile?.citta} ({profile?.paese})
          </p>
          <p className="text-sm text-olive-dark">
            <span className="font-semibold">Telefono:</span> {profile?.telefono || 'Non fornito'}
          </p>

          <p className="text-xs text-olive-light mt-3">
            Se i dati sono errati puoi scriverci dalla tua sezione Profilo &gt; Contatti.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-sand px-4 py-2 text-sm font-medium text-olive-dark hover:bg-sand/70"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Torna al Mercato</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-olive-dark px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
          >
            <span>Vai alla Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MarketPurchaseSuccess