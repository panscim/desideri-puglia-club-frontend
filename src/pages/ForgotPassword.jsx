import { useState } from 'react'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'
import { Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      })
      if (error) throw error
      toast.success('Controlla la tua email per reimpostare la password 📧')
    } catch (error) {
      toast.error(error.message || 'Errore durante l’invio dell’email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-warm-white to-sand">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold text-olive-dark mb-4">Recupera Password</h1>
        <p className="text-sm text-olive-light mb-6">
          Inserisci la tua email per ricevere un link di reimpostazione.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-olive-dark mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                placeholder="tua@email.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Invio in corso...' : 'Invia link di recupero'}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link to="/login" className="text-olive-dark hover:text-gold text-sm">
            Torna al login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword