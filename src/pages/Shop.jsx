// src/pages/Shop.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'
import {
  ShoppingBag,
  Shirt,
  Loader2,
  Package,
  ArrowRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const isSoldOut = (item) =>
  typeof item?.stock === 'number' && item.stock <= 0

const Shop = () => {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('market_items')
          .select('*')
          .eq('is_active', true)
          .eq('category', 'physical')
          .order('name', { ascending: true })

        if (error) throw error
        setItems(data || [])
      } catch (err) {
        console.error(err)
        toast.error(t('common.error'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleOpenItem = (item) => {
    if (!item?.id) return
    navigate(`/shop/${item.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-olive-dark" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-sand/60 bg-gradient-to-br from-olive-dark via-olive-dark/95 to-olive-dark/85 shadow-xl">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />

        <div className="relative px-6 py-8 md:px-8 md:py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70">
                <Package className="h-3 w-3" />
                <span>{t('shop.subtitle')}</span>
              </div>
              <h1 className="flex items-center gap-3 text-2xl font-extrabold text-white md:text-3xl">
                <ShoppingBag className="h-7 w-7 text-gold" />
                <span>{t('shop.title')}</span>
              </h1>
              <p className="max-w-md text-sm text-white/60 md:text-[15px] leading-relaxed">
                {t('shop.desc')}
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 px-5 py-4">
              <Shirt className="w-8 h-8 text-gold" />
              <div>
                <p className="text-2xl font-extrabold text-white">{items.length}</p>
                <p className="text-xs text-white/50">{t('shop.available_products')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRODUCTS GRID ── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sand/60 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-olive-light" />
          </div>
          <h3 className="text-lg font-semibold text-olive-dark mb-1">{t('shop.empty_title')}</h3>
          <p className="text-sm text-olive-light max-w-xs">
            {t('shop.empty_desc')}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const soldOut = isSoldOut(item)

            return (
              <div
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className={[
                  'group relative flex flex-col rounded-2xl border border-sand/60 bg-white shadow-sm transition-all duration-300 cursor-pointer',
                  soldOut
                    ? 'opacity-60'
                    : 'hover:-translate-y-1 hover:shadow-xl hover:border-gold/30',
                ].join(' ')}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-sand/30">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Shirt className="w-12 h-12 text-sand" />
                    </div>
                  )}

                  {soldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <span className="rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-olive-dark shadow-lg">
                        {t('shop.sold_out')}
                      </span>
                    </div>
                  )}

                  {/* Stock badge */}
                  {!soldOut && typeof item.stock === 'number' && item.stock <= 5 && item.stock > 0 && (
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                        {t('shop.last_pieces', { count: item.stock })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-4 gap-3">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-olive-dark leading-snug line-clamp-2 group-hover:text-olive-dark/80 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-olive-light line-clamp-2 leading-relaxed">
                      {item.short_description || item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-sand/40">
                    {item.price_eur && Number(item.price_eur) > 0 ? (
                      <span className="text-lg font-extrabold text-olive-dark">
                        €{Number(item.price_eur).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-olive-light">{t('shop.price_on_request')}</span>
                    )}

                    <span className="inline-flex items-center gap-1 rounded-full bg-olive-dark/5 px-3 py-1.5 text-xs font-semibold text-olive-dark group-hover:bg-olive-dark group-hover:text-white transition-all">
                      <span>{t('shop.details')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Shop