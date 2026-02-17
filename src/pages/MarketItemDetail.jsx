// src/pages/MarketItemDetail.jsx
import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'
import { Loader2, ShoppingBag, ArrowLeft, Shirt, Package, Truck } from 'lucide-react'

const isSoldOut = (item) =>
  typeof item?.stock === 'number' && item.stock <= 0

const MarketItemDetail = () => {
  const { itemId } = useParams()
  const navigate = useNavigate()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(null)

  // ---- LOAD ITEM ----
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('market_items')
          .select('*')
          .eq('id', itemId)
          .maybeSingle()

        if (error) throw error
        if (!data) {
          toast.error('Prodotto non trovato')
          navigate('/shop')
          return
        }

        setItem(data)
        setActiveImage(
          data.image_url || data.image_url_2 || data.image_url_3 || null
        )
      } catch (err) {
        console.error('[MarketItemDetail] load error:', err)
        toast.error('Errore nel caricamento del prodotto')
        navigate('/shop')
      } finally {
        setLoading(false)
      }
    }

    if (itemId) load()
  }, [itemId, navigate])

  const images = useMemo(() => {
    if (!item) return []
    return [item.image_url, item.image_url_2, item.image_url_3].filter(Boolean)
  }, [item])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-olive-dark" />
      </div>
    )
  }

  if (!item) return null

  const hasEuro = item.price_eur && Number(item.price_eur) > 0
  const soldOut = isSoldOut(item)

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Back */}
      <div className="flex items-center gap-2 py-4">
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="inline-flex items-center gap-1.5 text-xs text-olive-light hover:text-olive-dark transition-colors rounded-lg bg-sand/40 px-3 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna allo Shop</span>
        </button>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        {/* IMMAGINI */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] rounded-2xl border border-sand/60 overflow-hidden bg-sand/20 shadow-sm">
            {activeImage ? (
              <img
                src={activeImage}
                className="w-full h-full object-cover"
                alt={item.name}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Shirt className="w-16 h-16 text-sand" />
              </div>
            )}

            {soldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <span className="rounded-full bg-white px-5 py-2 text-sm font-bold uppercase tracking-wider text-olive-dark shadow-lg">
                  Esaurito
                </span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-[3/4] w-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === img
                      ? 'border-olive-dark shadow-md'
                      : 'border-sand/60 opacity-60 hover:opacity-100'
                    }`}
                >
                  <img
                    src={img}
                    className="h-full w-full object-cover"
                    alt={item.name}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sand/50 px-3 py-1 text-[11px] uppercase tracking-wider text-olive-light">
              <Package className="w-3 h-3" />
              <span>Prodotto fisico</span>
            </div>

            <h1 className="text-2xl font-extrabold text-olive-dark leading-tight">{item.name}</h1>

            {typeof item.stock === 'number' && (
              <p className="text-xs text-olive-light">
                {item.stock > 0
                  ? `Disponibilità: ${item.stock} pezzi`
                  : 'Non ci sono più pezzi disponibili.'}
              </p>
            )}
          </div>

          {item.description && (
            <p className="text-sm text-olive-dark/80 whitespace-pre-line leading-relaxed">
              {item.description}
            </p>
          )}

          {/* PREZZO */}
          {hasEuro && (
            <div className="rounded-2xl border border-sand/60 bg-gradient-to-br from-sand/20 to-white p-4 space-y-1">
              <p className="text-[11px] uppercase text-olive-light tracking-wider">Prezzo</p>
              <p className="text-3xl font-extrabold text-olive-dark">
                €{Number(item.price_eur).toFixed(2)}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-olive-light mt-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Spedizione in tutta Italia</span>
              </div>
            </div>
          )}

          {/* AZIONI */}
          <div className="space-y-3">
            {soldOut ? (
              <div className="rounded-xl border border-sand bg-sand/30 px-4 py-4 text-sm text-olive-dark flex items-center gap-3">
                <Package className="w-5 h-5 text-olive-light shrink-0" />
                <span>
                  Questo prodotto al momento è <strong>esaurito</strong>. Tieni
                  d&apos;occhio lo Shop: potrebbe tornare disponibile più avanti.
                </span>
              </div>
            ) : (
              <>
                {hasEuro && item.payment_url && (
                  <a
                    href={item.payment_url}
                    className="w-full inline-flex items-center justify-center gap-2 bg-olive-dark text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-olive-dark/90 transition-all active:scale-[0.98] shadow-lg shadow-olive-dark/10"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Acquista · €{Number(item.price_eur).toFixed(2)}</span>
                  </a>
                )}

                {hasEuro && !item.payment_url && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs text-olive-dark">
                    <strong>Pagamento in arrivo</strong> — il link di pagamento per
                    questo prodotto sarà disponibile a breve.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketItemDetail