import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { Gift } from 'lucide-react'

const Premi = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('premi_mensili')
        .select('*')
        .order('posizione', { ascending: true })

      if (!error) setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-olive-light">Caricamento premi…</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-olive-dark flex items-center gap-2">
        <Gift className="w-6 h-6" /> Premi del mese
      </h2>

      {items.length === 0 ? (
        <div className="card">Nessun premio pubblicato.</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {items.map(p => (
            <div key={p.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-olive-light">Posizione #{p.posizione}</span>
                <span className="text-xs bg-olive-light bg-opacity-20 text-olive-dark px-2 py-1 rounded">
                  {new Date(p.mese).toLocaleDateString()}
                </span>
              </div>
              {p.immagine_url && (
                <img src={p.immagine_url} alt={p.titolo} className="w-full h-40 object-cover rounded-lg" />
              )}
              <h3 className="text-lg font-semibold text-olive-dark">{p.titolo}</h3>
              <p className="text-sm text-olive-light">{p.descrizione}</p>
              {p.termini && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-olive-dark">Termini & condizioni</summary>
                  <div className="text-olive-light mt-2">{p.termini}</div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Premi
