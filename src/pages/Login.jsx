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
    <div className="min-h-[100dvh] flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden bg-gradient-to-br from-[#D9D3CA] via-[#EAE5DF] to-[#C9C2B7]">
      {/* Soft blurred shapes to mimic the reference background */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D9D3CA]/30 to-[#C9C2B7]/80 backdrop-blur-[2px]"></div>

      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm w-full z-10 flex flex-col flex-1">

        {/* Intestazione */}
        <div className="mt-20 mb-12">
          <h1 className="text-[32px] font-bold text-white leading-tight font-sans drop-shadow-sm">
            Log into<br />your account
          </h1>
        </div>

        {/* Form Astratto Base/Glass */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="relative">
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-3 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
              placeholder="Username/Email"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-transparent border-0 border-b border-white/60 px-0 py-3 text-white placeholder-white/80 focus:ring-0 focus:border-white transition-colors text-[15px]"
              placeholder="Password"
              autoComplete="current-password"
            />
            <Link to="/forgot-password" className="absolute right-0 top-1/2 -translate-y-1/2 text-white/80 text-[13px] hover:text-white transition-colors">
              Forgot?
            </Link>
          </div>

          {/* Resta connesso */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer appearance-none w-4 h-4 rounded-sm border border-white/80 bg-white/20 checked:bg-white checked:border-white transition-all cursor-pointer"
                />
                <svg className="absolute w-3 h-3 text-zinc-900 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-[13px] text-white/90 group-hover:text-white transition-colors">
                Remember me
              </span>
            </label>
          </div>

          {/* CTA Principale Zinc-950 */}
          <div className="pt-8 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-950 text-white font-medium text-[15px] py-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.login_loading') : 'Log In'}
            </button>

            {/* CTA Secondaria (Facebook mock) */}
            <button
              type="button"
              className="w-full bg-white text-zinc-950 font-medium text-[15px] py-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              onClick={() => toast('Facebook login coming soon')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.196h3.312z" />
              </svg>
              Log in with Facebook
            </button>
          </div>
        </form>

        <div className="mt-auto pb-4 text-center">
          <p className="text-[14px] text-white/80">
            Don't have an account?{' '}
            <Link to="/register" className="text-white font-medium hover:underline underline-offset-4">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login