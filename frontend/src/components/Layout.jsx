// src/components/Layout.jsx
import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Compass,
  Sparkle,
  Swatches,
  UserCircle,
  Gear,
  SignOut,
  Handshake,
  Buildings,
  BookOpen,
  MapTrifold,
  User,
  House,
  Storefront,
  BookBookmark,
  MapPin,
  Aperture,
  Scroll,
  Crown,
  Ticket
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
    { path: '/daily-plans', icon: Scroll, label: 'Piani' },
    { path: '/partner', icon: Buildings, label: 'Partner' },
    { path: '/album', icon: BookOpen, label: 'Album' },
    { path: '/profilo', icon: User, label: t('nav.profile') || 'Profilo' },
  ]

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="min-h-[100dvh] flex flex-col md:pb-0 bg-bg-primary font-sans">
      {typeof window !== 'undefined' && <Splash />}

      {/* ░ HEADER ░ */}
      <header className="hidden md:block bg-surface border-b border-border-default sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <img
              src="/logo.png"
              alt="Desideri di Puglia"
              className="w-12 h-12 rounded-full object-cover border-2 border-accent/20 shadow-sm"
            />
            <div>
              <h1 className="text-xl font-serif font-black text-text-primary tracking-tight">Desideri di Puglia</h1>
              <p className="overline !text-accent-gold !mb-0">Club</p>
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
        <div className="backdrop-blur-md border-t pb-[env(safe-area-inset-bottom)] transition-colors duration-300 bg-surface/90 border-border-default shadow-card">
          <nav className="flex justify-around items-center h-[68px] px-2 max-w-md mx-auto">

            {[
              { path: '/dashboard', icon: Sparkle, label: 'Scopri' },
              { path: '/daily-plans', icon: Scroll, label: 'Piani' },
              { path: '/partner', icon: Buildings, label: 'Partner' },
              { path: '/album', icon: BookBookmark, label: 'Album' },
              { path: '/profilo', icon: UserCircle, label: 'Profilo' }
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
                    size={26}
                    weight={active ? "bold" : "regular"}
                    className={`transition-all duration-300 ${active ? 'text-accent scale-110' : 'text-text-light'
                      }`}
                  />
                  <span className={`text-[10px] font-sans tracking-tight transition-colors duration-300 ${active ? 'text-accent font-black' : 'text-text-muted'
                    }`}>
                    {item.label}
                  </span>
                </Link>
              );

            })}
          </nav>
        </div>
      </div>

      {/* ░ SIDEBAR DESKTOP ░ */}
      <div className="hidden md:block fixed left-0 top-20 bottom-0 w-64 border-r p-4 z-40 transition-colors duration-300 bg-white border-zinc-200">

        <nav className="space-y-2 h-full overflow-y-auto pb-20">
          {
            navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-4 px-5 py-4 rounded-lg transition-all ${active
                    ? 'bg-accent/10 text-accent font-black shadow-sm'
                    : 'text-text-muted hover:bg-bg-secondary hover:text-text-primary'
                    }`}
                >
                  <Icon className="w-6 h-6" size={24} weight={active ? "bold" : "regular"} />
                  <span className="text-[15px]">{item.label}</span>
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