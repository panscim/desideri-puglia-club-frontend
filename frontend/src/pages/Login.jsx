import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'
import { Mail, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { motion } from 'framer-motion'
import AnimatedAuthBackground from '../components/AnimatedAuthBackground'
import { AppleLogo } from '@phosphor-icons/react'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [focusedField, setFocusedField] = useState(null)

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

      toast.success(t('common.welcome') + '!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      })
      if (error) throw error
    } catch (error) {
      toast.error(error.message || t('common.error'))
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden bg-[#EAE5DF]">
      <AnimatedAuthBackground />

      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm z-10 flex flex-col flex-1">

        {/* Logo + Intestazione */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 mb-10 flex flex-col items-start gap-4"
        >
          <img
            src="/logo.png"
            alt="Desideri di Puglia"
            className="w-16 h-16 rounded-[1.25rem] object-cover shadow-[0_20px_40px_rgba(0,0,0,0.18)] border border-white/70 ring-4 ring-white/20"
          />
          <h1 className="text-[34px] font-black text-zinc-950 leading-[1.05] tracking-tight">
            Bentornato nel<br />Club
          </h1>
          <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-zinc-700">
            Accesso rapido e sicuro
          </p>
        </motion.div>

        {/* Form Astratto Base/Glass */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Email */}
          <div className="relative group">
            <motion.div
              animate={{
                borderColor: focusedField === 'email' ? 'rgba(24, 24, 27, 0.65)' : 'rgba(24, 24, 27, 0.24)',
                backgroundColor: focusedField === 'email' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.74)',
                height: '60px'
              }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-2xl border backdrop-blur-md shadow-sm -z-10"
            />
            <div className="flex items-center px-4 h-[60px]">
              <Mail size={18} className={`shrink-0 transition-colors duration-300 mr-3 ${focusedField === 'email' ? 'text-zinc-900' : 'text-zinc-700'}`} />
              <div className="flex-1 relative h-full flex items-center">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-transparent border-0 px-0 py-0 text-zinc-950 placeholder-zinc-600 focus:ring-0 text-[15px] font-semibold"
                  placeholder="Username/Email"
                  autoComplete="email"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="relative group">
            <motion.div
              animate={{
                borderColor: focusedField === 'password' ? 'rgba(24, 24, 27, 0.65)' : 'rgba(24, 24, 27, 0.24)',
                backgroundColor: focusedField === 'password' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.74)',
                height: '60px'
              }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-2xl border backdrop-blur-md shadow-sm -z-10"
            />
            <div className="flex items-center px-4 h-[60px]">
              <Lock size={18} className={`shrink-0 transition-colors duration-300 mr-3 ${focusedField === 'password' ? 'text-zinc-900' : 'text-zinc-700'}`} />
              <div className="flex-1 relative h-full flex items-center">
                <input
                  type="password"
                  required
                  value={formData.password}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-transparent border-0 px-0 py-0 text-zinc-950 placeholder-zinc-600 focus:ring-0 text-[15px] font-semibold pr-16"
                  placeholder="Password"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Link to="/forgot-password" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 text-[12px] font-black uppercase tracking-wider hover:text-zinc-950 transition-colors">
              Forgot?
            </Link>
          </div>

          {/* Resta connesso */}
          <div className="pt-2 px-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer appearance-none w-5 h-5 rounded-md border-2 border-zinc-300 bg-white/50 checked:bg-zinc-900 checked:border-zinc-900 transition-all cursor-pointer shadow-sm"
                />
                <motion.svg
                  initial={false}
                  animate={{ scale: rememberMe ? 1 : 0.5, opacity: rememberMe ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute w-3 h-3 text-white pointer-events-none"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </motion.svg>
              </div>
              <span className="text-[14px] font-semibold text-zinc-800 group-hover:text-zinc-950 transition-colors">
                Remember me
              </span>
            </label>
          </div>

          {/* CTA Principale Zinc-950 */}
          <div className="pt-8 space-y-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-950 text-white font-medium text-[15px] py-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.login_loading') : 'Log In'}
            </motion.button>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                className="w-full bg-zinc-950 backdrop-blur-md text-white font-semibold text-[14px] py-4 rounded-full border border-zinc-950 shadow-[0_6px_20px_rgb(0,0,0,0.18)] hover:bg-black transition-all flex items-center justify-center gap-2"
                onClick={() => handleSocialLogin('apple')}
              >
                <AppleLogo size={20} weight="fill" className="text-white" />
                Apple
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                className="w-full bg-white/90 backdrop-blur-md text-zinc-950 font-semibold text-[14px] py-4 rounded-full border border-zinc-300 shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all flex items-center justify-center gap-2"
                onClick={() => handleSocialLogin('google')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </motion.button>
            </div>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-auto pb-4 text-center"
        >
          <p className="text-[14px] text-zinc-700 font-semibold">
            Don't have an account?{' '}
            <Link to="/register" className="text-zinc-950 font-bold hover:underline underline-offset-4 decoration-2 decoration-zinc-950/20">
              Sign Up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
