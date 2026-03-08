import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedAuthBackground from '../components/AnimatedAuthBackground'
import { AppleLogo } from '@phosphor-icons/react'
import { colors as TOKENS, typography, motion as springMotion } from '../utils/designTokens'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [focusedField, setFocusedField] = useState(null)

  const moveSupabaseSessionToSessionStorage = () => {
    try {
      const tokenKey = Object.keys(localStorage).find(
        (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
      )
      if (!tokenKey) return
      const tokenVal = localStorage.getItem(tokenKey)
      if (!tokenVal) return
      sessionStorage.setItem(tokenKey, tokenVal)
      localStorage.removeItem(tokenKey)
    } catch {
      // ignore
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
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden" style={{ background: TOKENS.bgPrimary }}>
      <AnimatedAuthBackground />

      <div className="absolute top-8 right-8 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[400px] z-10 flex flex-col">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springMotion.spring}
          className="mb-12 flex flex-col items-center text-center"
        >
          <div className="w-28 h-28 flex items-center justify-center mb-6 overflow-hidden">
            <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
          <h1 className="text-4xl font-black text-zinc-950 leading-tight mb-3" style={{ fontFamily: typography.serif }}>
            Bentornato nel <br />
            <span className="text-[#D4793A] italic">Club</span>
          </h1>
          <div className="w-12 h-1 bg-[#D4793A] rounded-full opacity-30" />
        </motion.div>

        {/* Form Section */}
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Email Input */}
          <div className="relative group">
            <motion.div
              animate={{
                borderColor: focusedField === 'email' ? '#D4793A' : 'rgba(0,0,0,0.08)',
                backgroundColor: focusedField === 'email' ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
              }}
              className="absolute inset-0 rounded-[1.5rem] border-2 backdrop-blur-md shadow-sm -z-10 transition-all"
            />
            <div className="flex items-center px-6 h-[72px]">
              <Mail size={20} className={`shrink-0 transition-colors ${focusedField === 'email' ? 'text-[#D4793A]' : 'text-zinc-400'}`} />
              <input
                type="email"
                required
                value={formData.email}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-transparent border-0 px-4 py-0 text-zinc-950 placeholder-zinc-400 focus:ring-0 text-[16px] font-bold"
                placeholder="Email o Username"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="relative group">
            <motion.div
              animate={{
                borderColor: focusedField === 'password' ? '#D4793A' : 'rgba(0,0,0,0.08)',
                backgroundColor: focusedField === 'password' ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
              }}
              className="absolute inset-0 rounded-[1.5rem] border-2 backdrop-blur-md shadow-sm -z-10 transition-all"
            />
            <div className="flex items-center px-6 h-[72px]">
              <Lock size={20} className={`shrink-0 transition-colors ${focusedField === 'password' ? 'text-[#D4793A]' : 'text-zinc-400'}`} />
              <input
                type="password"
                required
                value={formData.password}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-transparent border-0 px-4 py-0 text-zinc-950 placeholder-zinc-400 focus:ring-0 text-[16px] font-bold"
                placeholder="Password"
              />
              <Link to="/forgot-password" size={12} className="shrink-0 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#D4793A]">
                Reset
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 font-bold text-[13px]">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded-md border-2 border-stone-200 text-[#D4793A] focus:ring-[#D4793A]/20"
              />
              <span className="text-zinc-500">Resta connesso</span>
            </label>
          </div>

          <div className="pt-4 space-y-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full h-16 rounded-full bg-zinc-950 text-white font-black text-[15px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 transition hover:bg-black group"
            >
              {loading ? 'Entrando...' : 'Log In'}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('apple')}
                className="h-14 rounded-2xl bg-white border border-stone-200 flex items-center justify-center gap-3 shadow-sm hover:bg-stone-50 transition"
              >
                <AppleLogo size={20} weight="fill" />
                <span className="font-bold text-sm">Apple</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="h-14 rounded-2xl bg-white border border-stone-200 flex items-center justify-center gap-3 shadow-sm hover:bg-stone-50 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="font-bold text-sm">Google</span>
              </button>
            </div>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm font-bold text-zinc-400">
            Non hai ancora un account?{' '}
            <Link to="/register" className="text-zinc-950 underline underline-offset-4 decoration-stone-300">
              Registrati ora
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
