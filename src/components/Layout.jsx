// src/components/Layout.jsx
import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Compass,
  MapTrifold,
  Target,
  BookOpen,
  User,
  Gear,
  SignOut,
  Handshake
} from '@phosphor-icons/react'
import {
  Settings,
  LogOut,
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
    { path: '/dashboard', icon: Compass, label: t('nav.home') || 'Scopri' },
    { path: '/partner', icon: Handshake, label: 'Partner' },
    { path: '/mappa', icon: MapTrifold, label: t('nav.map') || 'Mappa' },
    { path: '/album', icon: BookOpen, label: 'Album' },
    { path: '/profilo', icon: User, label: t('nav.profile') || 'Profilo' },
  ]

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="min-h-[100dvh] flex flex-col md:pb-0 bg-zinc-950 font-satoshi">
      {typeof window !== 'undefined' && <Splash />}

      {/* ░ HEADER ░ */}
      <header className="hidden md:block bg-white border-b border-sand sticky top-0 z-40">
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

      {/* ░ NEW NAV MOBILE (GetYourGuide Clone Bottom Tab Nav) ░ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-zinc-950/90 backdrop-blur-md border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
          <nav className="flex justify-around items-center h-[64px] px-2 max-w-md mx-auto">
            {[
              { path: '/dashboard', icon: Compass, label: 'Scopri' },
              { path: '/partner', icon: Handshake, label: 'Partner' },
              { path: '/mappa', icon: MapTrifold, label: 'Mappa' },
              { path: '/album', icon: BookOpen, label: 'Album' },
              { path: '/profilo', icon: User, label: 'Profilo' }
            ].map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center w-[20%] h-full gap-1"
                >
                  <Icon
                    size={24}
                    weight={active ? "fill" : "regular"}
                    className={`transition-colors duration-200 ${active ? 'text-white' : 'text-zinc-500'}`}
                  />
                  <span className={`text-[10px] font-geist transition-colors duration-200 ${active ? 'text-white font-medium' : 'text-zinc-500'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ░ SIDEBAR DESKTOP ░ */}
      <div className="hidden md:block fixed left-0 top-20 bottom-0 w-64 bg-zinc-950 border-r border-white/10 p-4 z-40">
        <nav className="space-y-2 h-full overflow-y-auto pb-20">
          {
            navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
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
                <div className="my-4 border-t border-white/10"></div>

                <Link
                  to="/admin"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${location.pathname === '/admin' || location.pathname === '/admin/'
                    ? 'bg-red-500/20 text-red-500 font-medium'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Amministrazione</span>
                </Link>

                <Link
                  to="/admin/partners"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${location.pathname.startsWith('/admin/partners')
                    ? 'bg-red-500/20 text-red-500 font-medium'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <Handshake className="w-5 h-5" />
                  <span>Gestione Partner</span>
                </Link>
              </>
            )
          }

          {/* Logout */}
          <div className="my-4 border-t border-white/10"></div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('common.logout')}</span>
          </button>

          <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
            <LanguageSwitcher />
          </div>
        </nav >
      </div >
    </div >
  )
}

export default Layout