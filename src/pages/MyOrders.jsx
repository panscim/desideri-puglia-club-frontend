// src/pages/MyOrders.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Sparkles, ShoppingBag, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const MyOrders = () => {
  const { t, i18n } = useTranslation()
  const { profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!profile?.id) return

    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('market_orders')
        .select(`
          *,
          item:market_items(name, image_url)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (!error) setOrders(data || [])
      setLoading(false)
    }

    load()
  }, [profile])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-olive-dark" />
      </div>
    )
  }

  if (!orders.length) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <Package className="w-12 h-12 mx-auto mb-4 text-olive-light" />
        <h2 className="text-xl font-bold text-olive-dark mb-2">{t('orders.empty_title')}</h2>
        <p className="text-olive-light mb-2">
          {t('orders.empty_desc')}
        </p>
        <p className="text-xs text-olive-light max-w-md mx-auto mb-6">
          <span className="font-semibold">{t('orders.note_title')}</span> {t('orders.note_desc_1')}{' '}
          <span className="font-semibold">{t('orders.note_desc_2')}</span>.
          {t('orders.note_desc_3')}
        </p>
        <button
          onClick={() => navigate('/shop')}
          className="rounded-lg bg-olive-dark text-white px-4 py-2 text-sm"
        >
          {t('orders.go_shop')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-olive-dark mb-1">{t('orders.title')}</h1>
      <p className="text-xs text-olive-light mb-6">
        {t('orders.page_desc_1')}{' '}
        <span className="font-semibold">{t('orders.page_desc_2')}</span>
        {t('orders.page_desc_3')}
      </p>

      <div className="space-y-4">
        {orders.map((o) => (
          <div
            key={o.id}
            className="p-4 border border-sand rounded-xl bg-white shadow-sm"
          >
            <div className="flex gap-4">
              <div className="w-20 h-20 overflow-hidden rounded-lg border border-sand bg-sand/40">
                {o.item?.image_url ? (
                  <img
                    src={o.item.image_url}
                    className="w-full h-full object-cover"
                    alt={o.item?.name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-olive-light">
                    {t('orders.no_image')}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="font-semibold text-olive-dark">{o.item?.name}</h2>
                <p className="text-xs text-olive-light">
                  {t('orders.ordered_on')} {new Date(o.created_at).toLocaleDateString(i18n.language)}
                </p>

                <div className="mt-2 flex items-center gap-2 text-sm">
                  {o.metodo === 'desideri' ? (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{o.prezzo_pagato} Desideri</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-olive-dark" />
                      <span>€ {o.prezzo_pagato}</span>
                    </>
                  )}
                </div>

                <div className="mt-3 text-xs text-olive-light">
                  {t('orders.status')}:{' '}
                  <span className="font-medium text-olive-dark">{o.status}</span>
                </div>

                <button
                  onClick={() => navigate(`/order/${o.id}`)}
                  className="mt-3 text-xs text-olive-dark underline"
                >
                  {t('orders.details_btn')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyOrders