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

            {/* CTA Secondaria (Social Login mock) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full bg-white text-zinc-950 font-medium text-[14px] py-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                onClick={() => toast('Apple login coming soon')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.365 21.43c-1.127.818-2.27 1.229-3.435 1.229-1.09 0-2.311-.47-3.66-1.408-1.579-1.077-3.235-2.887-4.965-5.431C2.564 13.255 1.693 10.662 1.693 8.04c0-2.585.805-4.636 2.417-6.152C5.69 1.492 7.55.733 9.682.733c1.071 0 2.227.355 3.468 1.066 1.144.664 1.838 1.002 2.08 1.014.244-.012.973-.362 2.188-1.05 1.156-.665 2.247-1.012 3.275-1.04 1.578-.046 2.972.4 4.184 1.339.814.638 1.5 1.458 2.054 2.46-.388.24-.764.498-1.127.773a4.707 4.707 0 00-1.748 3.96c0 1.86.666 3.425 2.001 4.694.464.437.954.786 1.472 1.047-.394 1.168-.946 2.37-1.655 3.606-1.053 1.821-2.183 3.327-3.39 4.516-.761.758-1.653 1.282-2.673 1.57zm-4.14-15.003c-1.42 0-2.627-.514-3.619-1.542-.991-1.029-1.487-2.243-1.487-3.643 0-1.4.52-2.643 1.56-3.729 1.041-1.085 2.296-1.628 3.765-1.628 1.48 0 2.7.534 3.663 1.604.962 1.07 1.443 2.316 1.443 3.738 0 1.426-.502 2.656-1.503 3.69-.999 1.034-2.274 1.51-3.822 1.51z" />
                </svg>
                Apple
              </button>
              <button
                type="button"
                className="w-full bg-white text-zinc-950 font-medium text-[14px] py-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                onClick={() => toast('Google login coming soon')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </div>
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