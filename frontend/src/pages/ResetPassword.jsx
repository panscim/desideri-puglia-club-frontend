import { useState } from 'react'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'
import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('La password deve avere almeno 6 caratteri')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password aggiornata con successo ✅')
      navigate('/login')
    } catch (error) {
      toast.error(error.message || 'Errore durante il reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-warm-white to-sand">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold text-olive-dark mb-4">Imposta una nuova password</h1>
        <p className="text-sm text-olive-light mb-6">
          Inserisci la tua nuova password qui sotto.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-olive-dark mb-2">Nuova password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword