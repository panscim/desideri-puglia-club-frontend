// src/components/Layout.jsx
import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  Target,
  Trophy,
  User,
  Settings,
  LogOut,
  Handshake,
  TicketPercent,
  MessageCircle,   // 👈 NUOVA ICONA CHAT
  MapPin,          // 👈 NUOVA ICONA MAPPA
  Grid,            // 👈 NUOVA ICONA ALBUM
  Plus,            // 👈 NUOVA ICONA FAB
  Menu,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'
import Splash from './Splash'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, isAdmin } = useAuth()
  const [activeIndex, setActiveIndex] = useState(0)

  // We keep the logic for Desktop Sidebar active state
  useEffect(() => {
    const index = navItems.findIndex(item => isActive(item.path))
    if (index !== -1) setActiveIndex(index)
  }, [location.pathname])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) toast.error('Errore durante il logout')
    else {
      toast.success('Logout effettuato')
      navigate('/login')
    }
  }

  const { t } = useTranslation()

  // 🔹 Sidebar Navigation (Desktop)
  const navItems = [
    { path: '/dashboard', icon: Home, label: t('nav.home') },
    { path: '/missioni', icon: Target, label: t('nav.missions') || 'Missioni' },
    { path: '/chat', icon: MessageCircle, label: t('nav.chat') },
    { path: '/partner', icon: Handshake, label: 'Partner' },
    { path: '/classifica', icon: Trophy, label: t('nav.ranking') },
    { icon: MapPin, label: t('nav.map'), path: '/mappa' },
    { icon: Grid, label: 'Album', path: '/album' },
    { path: '/profilo', icon: User, label: t('nav.profile') },
  ]

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="min-h-screen flex flex-col md:pb-0 bg-[#F9F9F7]">
      {typeof window !== 'undefined' && <Splash />}

      {/* ░ HEADER ░ */}
      <header className="bg-white border-b border-sand sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Desideri di Puglia"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h1 className="text-lg font-bold text-olive-dark">Desideri di Puglia</h1>
              <p className="text-xs text-olive-light">Club</p>
            </div>
          </div>

          {/* Azioni header */}
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden md:flex items-center space-x-2 text-sm text-olive-dark hover:text-gold transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center space-x-2 text-sm text-coral hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Esci</span>
            </button>

            {profile && (
              <div className="flex items-center space-x-2">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.nome || 'Avatar'}
                    className="w-8 h-8 rounded-full object-cover border border-sand"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-olive-light flex items-center justify-center text-white font-medium">
                    {profile.nome?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* ░ MAIN CONTENT ░ */}
      <main className="flex-1 max-w-[100vw] overflow-x-hidden md:ml-64 w-full">
        <Outlet />
      </main>

      {/* ░ NEW NAV MOBILE (Premium Custom Layout) ░ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">

        {/* Quick Map Floating Button */}
        <div className="px-4 mb-4 pointer-events-auto">
          <Link to="/mappa" className="w-full bg-[#E4AE2F] text-olive-dark rounded-xl p-4 flex items-center justify-between shadow-lg shadow-[#E4AE2F]/30 active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-olive-dark text-[#E4AE2F] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">explore</span>
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Open Map</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-olive-dark/80">Next Discovery: 250m</p>
              </div>
            </div>
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>
        </div>

        {/* Bottom Tab Bar */}
        <nav className="bg-white border-t border-sand pb-[env(safe-area-inset-bottom)] pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative">
          <div className="flex justify-between items-center h-[70px] px-2 relative">

            {/* Item 1: Dashboard */}
            <Link to="/dashboard" className={`flex flex-col items-center justify-center w-1/5 h-full space-y-1 ${isActive('/dashboard') ? 'text-gold' : 'text-slate-400'}`}>
              <Home size={24} strokeWidth={isActive('/dashboard') ? 2.5 : 2} className={isActive('/dashboard') ? 'fill-gold/20' : ''} />
              <span className={`text-[9px] font-bold tracking-widest uppercase ${isActive('/dashboard') ? 'text-gold' : 'text-slate-400'}`}>Dashboard</span>
            </Link>

            {/* Item 2: Mappa */}
            <Link to="/mappa" className={`flex flex-col items-center justify-center w-1/5 h-full space-y-1 ${isActive('/mappa') ? 'text-gold' : 'text-slate-400'}`}>
              <MapPin size={24} strokeWidth={isActive('/mappa') ? 2.5 : 2} className={isActive('/mappa') ? 'fill-gold/20' : ''} />
              <span className={`text-[9px] font-bold tracking-widest uppercase ${isActive('/mappa') ? 'text-gold' : 'text-slate-400'}`}>Mappa</span>
            </Link>

            {/* Item 3: Center Action Button (Placeholder for multi-action menu) */}
            <div className="w-1/5 flex justify-center relative -top-6">
              <button className="w-14 h-14 rounded-full bg-olive-dark text-white flex items-center justify-center shadow-lg shadow-olive-dark/40 active:scale-90 transition-transform border-4 border-[#F9F9F7]">
                <Plus size={28} strokeWidth={2.5} />
              </button>
            </div>

            {/* Item 4: Album */}
            <Link to="/album" className={`flex flex-col items-center justify-center w-1/5 h-full space-y-1 ${isActive('/album') ? 'text-gold' : 'text-slate-400'}`}>
              <Grid size={24} strokeWidth={isActive('/album') ? 2.5 : 2} className={isActive('/album') ? 'fill-gold/20' : ''} />
              <span className={`text-[9px] font-bold tracking-widest uppercase ${isActive('/album') ? 'text-gold' : 'text-slate-400'}`}>Album</span>
            </Link>

            {/* Item 5: Opzioni (Profilo/Menu) */}
            <Link to="/profilo" className={`flex flex-col items-center justify-center w-1/5 h-full space-y-1 ${isActive('/profilo') ? 'text-gold' : 'text-slate-400'}`}>
              <Settings size={24} strokeWidth={isActive('/profilo') ? 2.5 : 2} className={isActive('/profilo') ? 'fill-gold/20' : ''} />
              <span className={`text-[9px] font-bold tracking-widest uppercase ${isActive('/profilo') ? 'text-gold' : 'text-slate-400'}`}>Opzioni</span>
            </Link>

          </div>
        </nav>
      </div>

      {/* ░ SIDEBAR DESKTOP ░ */}
      < div className="hidden md:block fixed left-0 top-20 bottom-0 w-64 bg-white border-r border-sand p-4 z-40" >
        < nav className="space-y-2 h-full overflow-y-auto pb-20" >
          {
            navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${active
                    ? 'bg-olive-light bg-opacity-20 text-olive-dark font-medium'
                    : 'text-olive-light hover:bg-sand'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })
          }

          {/* Admin */}
          {
            isAdmin && (
              <>
                <div className="my-4 border-t border-sand"></div>

                <Link
                  to="/admin"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${location.pathname === '/admin' || location.pathname === '/admin/'
                    ? 'bg-gold bg-opacity-20 text-gold font-medium'
                    : 'text-olive-light hover:bg-sand'
                    }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Amministrazione</span>
                </Link>

                <Link
                  to="/admin/partners"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${location.pathname.startsWith('/admin/partners')
                    ? 'bg-gold bg-opacity-20 text-gold font-medium'
                    : 'text-olive-light hover:bg-sand'
                    }`}
                >
                  <Handshake className="w-5 h-5" />
                  <span>Gestione Partner</span>
                </Link>
              </>
            )
          }

          {/* Logout */}
          <div className="my-4 border-t border-sand"></div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-coral hover:bg-sand transition-all w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('common.logout')}</span>
          </button>

          <div className="mt-4 pt-4 border-t border-sand flex justify-center">
            <LanguageSwitcher />
          </div>
        </nav >
      </div >
    </div >
  )
}

export default Layout