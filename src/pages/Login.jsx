import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'
import { Mail, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '' })

  // Sposta l'eventuale sessione da localStorage a sessionStorage
  // quando l'utente NON vuole restare connesso.
  const moveSupabaseSessionToSessionStorage = () => {
    try {
      // trova la chiave token Supabase in localStorage (forma: sb-<projectRef>-auth-token)
      const tokenKey = Object.keys(localStorage).find(
        (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
      )
      if (!tokenKey) return
      const tokenVal = localStorage.getItem(tokenKey)
      if (!tokenVal) return
      sessionStorage.setItem(tokenKey, tokenVal)
      localStorage.removeItem(tokenKey)
    } catch {
      // ignora eventuali errori di storage
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      })
      if (error) throw error

      // Se NON vuole restare connesso, porta il token in sessionStorage
      if (!rememberMe) moveSupabaseSessionToSessionStorage()

      if (!rememberMe) moveSupabaseSessionToSessionStorage()

      toast.success(t('common.welcome') + '!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-warm-white to-sand relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Desideri di Puglia"
            className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
          />
          <h1 className="text-2xl font-bold text-olive-dark">{t('auth.login_title')}</h1>
        </div>

        {/* Card Login */}
        <section className="card">
          <h2 className="text-xl font-bold text-olive-dark mb-6">{t('common.login')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-olive-dark mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                  placeholder="tua@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-olive-dark mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Resta connesso */}
            <label className="flex items-center gap-2 text-sm text-olive-dark">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-sand"
              />
              {t('auth.remember_me')}
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.login_loading') : t('auth.login_submit')}
            </button>
          </form>

          <div className="mt-3 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-olive-dark font-medium hover:text-gold transition-colors"
            >
              {t('auth.forgot_password')}
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-olive-light">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-olive-dark font-medium hover:text-gold transition-colors">
                {t('auth.register_link')}
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-olive-light mt-6">
            {t('auth.terms')}
          </p>
        </section>
      </div>
    </div>
  )
}

export default Login