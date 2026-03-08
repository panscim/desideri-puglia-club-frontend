import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Gift, QrCode, Clock, Check, XCircle, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const VoucherList = () => {
  const { profile } = useAuth()
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVouchers()
  }, [profile?.id])

  const loadVouchers = async () => {
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select(`
          *,
          offer:offer_id (
            id, title, desideri_cost, type,
            partner:partner_id (id, name, logo_url)
          )
        `)
        .eq('id_utente', profile?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVouchers(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Errore nel caricamento dei voucher')
    } finally {
      setLoading(false)
    }
  }

  const statusBadge = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'issued') return <span className="text-olive-dark">🟡 Attivo</span>
    if (s === 'redeemed') return <span className="text-green-600">🟢 Utilizzato</span>
    if (s === 'expired') return <span className="text-coral">🔴 Scaduto</span>
    if (s === 'cancelled') return <span className="text-gray-400">⚪️ Annullato</span>
    return status || '—'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-olive-dark">I miei Voucher</h1>
        <Gift className="w-6 h-6 text-olive-dark" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vouchers.length ? vouchers.map((v) => {
          // ✅ Fallback QR: se il trigger non ha ancora scritto qrcode_url, generiamo dal code
          const qrSrc = v.qrcode_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(v.code || '')}`

          return (
            <div key={v.id} className="card relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={v.offer?.partner?.logo_url || '/logo.png'}
                    alt={v.offer?.partner?.name || 'Partner'}
                    className="w-10 h-10 rounded-full object-cover border border-sand"
                  />
                  <div>
                    <p className="text-sm text-olive-light">{v.offer?.partner?.name || 'Partner'}</p>
                    <h3 className="font-semibold text-olive-dark">{v.offer?.title || 'Voucher'}</h3>
                  </div>
                </div>
                <div className="text-xs">{statusBadge(v.status)}</div>
              </div>

              <div className="mt-3 text-sm text-olive-light">
                <p>
                  Codice:{' '}
                  <span className="font-semibold text-olive-dark">{v.code}</span>
                </p>
                {v.expires_at && (
                  <p>
                    <Clock className="w-3 h-3 inline-block mr-1" />
                    Scade: {new Date(v.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* QR SEMPRE visibile (con fallback) */}
              <div className="mt-3 flex flex-col items-center gap-2">
                <img
                  src={qrSrc}
                  alt="QR Voucher"
                  className="w-32 h-32 object-contain"
                />
                <a
                  href={qrSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-olive-dark hover:text-gold inline-flex items-center gap-1"
                  title="Apri QR a schermo intero"
                >
                  <ExternalLink className="w-3 h-3" /> Apri QR
                </a>
              </div>

              <div className="mt-3 flex justify-end gap-2 text-xs">
                {v.status === 'issued' && (
                  <div className="text-olive-dark flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    Mostra questo QR al Partner
                  </div>
                )}
                {v.status === 'redeemed' && (
                  <div className="text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Utilizzato
                  </div>
                )}
                {v.status === 'expired' && (
                  <div className="text-coral flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Scaduto
                  </div>
                )}
              </div>
            </div>
          )
        }) : (
          <div className="col-span-3 text-center py-12 text-olive-light">
            Nessun voucher ancora riscattato
          </div>
        )}
      </div>
    </div>
  )
}

export default VoucherList