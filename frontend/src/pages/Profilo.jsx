// src/pages/Profilo.jsx
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'

import {
  UserCircle, PencilSimple, SignOut, ShareNetwork, ShieldCheck,
  Trash, Lock, MapPin, Medal, Path, Books, X, CardsThree, Compass, Key,
  ArrowRight, Warning, Camera, FloppyDisk, InstagramLogo, TiktokLogo,
  FacebookLogo, YoutubeLogo, BookOpenText, CheckCircle,
  Ticket, CalendarBlank, QrCode, CaretRight, Buildings
} from '@phosphor-icons/react'
import { EventsService } from '../services/events'
import { format } from 'date-fns'
import { it as itLocale } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { typography } from '../utils/designTokens'

// ── Design Tokens (stessa palette di Partner.jsx) ──
const T = {
  serif: "'Libre Baskerville', 'Playfair Display', Georgia, serif",
  bgPage: '#F9F9F7',
  bgNavbar: '#0f0f0f',
  orange: '#f97316',
  terracotta: '#D4793A',
  textPri: '#1F2933',
  textMut: '#6B7280',
  border: '#E5E7EB',
}

export default function Profilo() {
  const navigate = useNavigate()
  const { profile, refreshProfile, isAdmin } = useAuth()

  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState(null)
  const [stats, setStats] = useState({ cards: 0, km: 0, xp: 0 })
  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nome: '', cognome: '', nickname: '', citta: '',
    biografia: '', instagram_url: '', facebook_url: '',
    tiktok_url: '', youtube_url: ''
  })

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordSending, setPasswordSending] = useState(false)
  const [modeTransition, setModeTransition] = useState({ active: false, target: null, flip: false })

  useEffect(() => {
    if (!profile?.id) return

    setFormData({
      nome: profile.nome || '', cognome: profile.cognome || '',
      nickname: profile.nickname || '', citta: profile.citta || '',
      biografia: profile.biografia || '', instagram_url: profile.instagram_url || '',
      facebook_url: profile.facebook_url || '', tiktok_url: profile.tiktok_url || '',
      youtube_url: profile.youtube_url || ''
    })

    const loadData = async () => {
      try {
        setLoading(true)
        const [cardsRes, partnerRes] = await Promise.all([
          supabase.from('user_cards').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
          supabase.from('partners').select('id,name').eq('owner_user_id', profile.id).maybeSingle()
        ])
        const cardCount = cardsRes.count ?? 0
        setStats({ cards: cardCount, km: Math.round(cardCount * 2.3), xp: cardCount * 50 })
        setPartner(partnerRes.data || null)
      } catch (e) {
        console.error('Errore loadStats:', e)
      } finally {
        setLoading(false)
      }
    }

    const loadBookings = async () => {
      try {
        setLoadingBookings(true)
        const data = await EventsService.getUserDetailedBookings()
        setBookings(data || [])
      } catch (e) {
        console.error('Errore loadBookings:', e)
        setBookings([])
      } finally {
        setLoadingBookings(false)
      }
    }

    loadData()
    loadBookings()
  }, [profile?.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    sessionStorage.clear()
    navigate('/login')
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Solo immagini ammesse'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${profile.id}/avatar-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      await supabase.from('utenti').update({ avatar_url: data?.publicUrl }).eq('id', profile.id)
      toast.success('Foto aggiornata!')
      refreshProfile()
    } catch (err) {
      toast.error('Errore upload')
    }
  }

  const handleSave = async (e) => {
    e?.preventDefault()
    setSaving(true)
    try {
      const payload = { ...formData, ultima_attivita: new Date().toISOString() }
      Object.keys(payload).forEach(k => { if (typeof payload[k] === 'string') payload[k] = payload[k].trim() || null })
      await supabase.from('utenti').update(payload).eq('id', profile.id)
      toast.success('Profilo aggiornato!')
      await refreshProfile()
      setEditing(false)
    } catch (error) { toast.error('Errore aggiornamento') }
    finally { setSaving(false) }
  }

  const handleShare = async () => {
    const shareData = { title: 'Desideri di Puglia', text: 'Scopri le bellezze della Puglia con me!', url: window.location.origin }
    try {
      if (navigator.share) await navigator.share(shareData)
      else { await navigator.clipboard.writeText(shareData.url); toast.success('Link copiato!') }
    } catch (e) { }
  }

  const handleResetPassword = async () => {
    setPasswordSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${window.location.origin}/reset-password` })
    if (!error) { toast.success('Email di reset inviata!'); setShowPasswordModal(false) }
    else toast.error(error.message)
    setPasswordSending(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'elimina') return toast.error('Scrivi "elimina"')
    setDeletingAccount(true)
    try {
      await supabase.from('user_cards').delete().eq('user_id', profile.id)
      await supabase.from('utenti').delete().eq('id', profile.id)
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      navigate('/login')
    } catch (err) { toast.error("Errore durante l'eliminazione") }
    finally { setDeletingAccount(false) }
  }

  const handleModeSwitch = (target) => {
    setModeTransition({ active: true, target, flip: false })
    setTimeout(() => setModeTransition((prev) => ({ ...prev, flip: true })), 1500)
    setTimeout(() => navigate(target === 'partner' ? '/partner/dashboard' : '/dashboard'), 3000)
  }

  const displayName = profile?.nome && profile?.cognome
    ? `${profile.nome} ${profile.cognome}`
    : profile?.nickname || profile?.email?.split('@')[0] || 'Esploratore'
  const initials = (profile?.nome?.[0] || profile?.nickname?.[0] || '?').toUpperCase()

  return (
    <div style={{ background: T.bgPage, minHeight: '100vh' }}>

      {/* ══ NAVBAR ══ */}
      <nav
        className="fixed top-0 inset-x-0 z-[100] px-5 h-16 flex items-center justify-between no-theme-flip"
        style={{ backgroundColor: T.bgNavbar, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase"
              style={{ background: '#27272a', border: '1px solid #3f3f46', color: 'white' }}>
              ADMIN
            </Link>
          )}
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: 'white' }}>
          Profilo
        </p>

        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform no-theme-flip"
          style={{ background: '#27272a', border: '1px solid #3f3f46' }}>
          <SignOut size={17} weight="bold" color="white" />
        </button>
      </nav>

      <main className="pt-24 pb-32 px-5 max-w-lg mx-auto">

        {/* ══ HERO AVATAR ══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-10">

          {/* Avatar */}
          <motion.label
            whileTap={{ scale: 0.96 }}
            className="relative cursor-pointer mb-6 mt-2">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-black"
              style={{ background: '#E5E7EB', color: T.textMut, border: `3px solid white`, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                : <span style={{ color: T.terracotta }}>{initials}</span>}
            </div>
            <div
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white"
              style={{ background: T.terracotta, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Camera size={14} weight="fill" color="white" />
            </div>
          </motion.label>

          <h1
            className="text-3xl font-black leading-tight tracking-tight mb-1"
            style={{ fontFamily: T.serif, color: T.textPri }}>
            {displayName}
          </h1>

          {profile?.citta && (
            <p className="flex items-center gap-1 text-[12px] font-semibold mb-4" style={{ color: T.textMut }}>
              <MapPin size={12} weight="fill" style={{ color: T.terracotta }} />
              {profile.citta}
            </p>
          )}

          {/* Mode pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span
              className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ background: `${T.terracotta}15`, color: T.terracotta, border: `1px solid ${T.terracotta}30` }}>
              {profile?.ruolo || 'Esploratore'}
            </span>
            {partner && (
              <button
                onClick={() => handleModeSwitch('partner')}
                className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-transform flex items-center gap-1.5"
                style={{ background: T.textPri, color: 'white' }}>
                <Buildings size={11} weight="bold" />
                HUB Partner
              </button>
            )}
          </div>
        </motion.div>

        {/* ══ STATS ══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8">
          {[
            { val: loading ? '·' : stats.cards, label: 'Card', color: '#16a34a' },
            { val: loading ? '·' : stats.km, label: 'Km', color: T.terracotta },
            { val: loading ? '·' : stats.xp, label: 'Punti', color: '#B8882F' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl bg-white p-4 text-center" style={{ border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p className="text-2xl font-black mb-0.5" style={{ fontFamily: T.serif, color: s.color }}>{s.val}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: T.textMut }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ══ CONDIVIDI ══ */}
        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={handleShare}
          className="w-full rounded-2xl bg-white p-4 flex items-center gap-4 mb-8 active:scale-[0.98] transition-transform"
          style={{ border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${T.terracotta}12` }}>
            <ShareNetwork size={20} weight="bold" style={{ color: T.terracotta }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[14px] font-black" style={{ color: T.textPri }}>Invita un Amico</p>
            <p className="text-[11px] font-medium" style={{ color: T.textMut }}>Mostra le bellezze della Puglia</p>
          </div>
          <ArrowRight size={16} weight="bold" style={{ color: T.textMut }} />
        </motion.button>

        {/* ══ I TUOI BIGLIETTI ══ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white mb-8 overflow-hidden"
          style={{ border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

          <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2">
              <Ticket size={16} weight="bold" style={{ color: T.terracotta }} />
              <span className="text-[13px] font-black uppercase tracking-[0.1em]" style={{ color: T.textPri }}>I tuoi Biglietti</span>
            </div>
            {bookings.length > 0 && (
              <button
                onClick={() => navigate('/biglietti')}
                className="text-[10px] font-black uppercase tracking-[0.15em]"
                style={{ color: T.terracotta }}>
                Vedi tutti →
              </button>
            )}
          </div>

          <div className="p-4">
            {loadingBookings ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${T.terracotta} transparent transparent transparent` }} />
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center text-center py-6 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${T.terracotta}10` }}>
                  <Ticket size={22} weight="bold" style={{ color: T.terracotta }} />
                </div>
                <div>
                  <p className="text-[14px] font-black" style={{ color: T.textPri }}>Nessun biglietto</p>
                  <p className="text-[12px] font-medium mt-0.5" style={{ color: T.textMut }}>Prenota un evento per trovarlo qui</p>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest"
                  style={{ background: T.textPri, color: 'white' }}>
                  Scopri eventi
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.slice(0, 3).map((booking) => {
                  const ev = booking.event
                  if (!ev) return null
                  const date = ev.data_inizio ? new Date(ev.data_inizio) : null
                  return (
                    <div
                      key={booking.id}
                      onClick={() => navigate(`/booking-confirmation/${ev.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
                      style={{ background: '#F9F9F7', border: `1px solid ${T.border}` }}>
                      <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0" style={{ background: T.border }}>
                        {(ev.immagine_url || ev.image_url) ? (
                          <img src={ev.immagine_url || ev.image_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Ticket size={18} weight="bold" style={{ color: T.terracotta }} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black truncate" style={{ color: T.textPri }}>{ev.titolo || ev.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {date && (
                            <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: T.textMut }}>
                              <CalendarBlank size={9} weight="bold" />
                              {format(date, 'dd MMM', { locale: itLocale })}
                            </span>
                          )}
                          <span
                            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={booking.status === 'confermato'
                              ? { background: '#dcfce7', color: '#16a34a' }
                              : { background: '#dbeafe', color: '#2563eb' }}>
                            {booking.status === 'confermato' ? 'Confermato' : 'In loco'}
                          </span>
                        </div>
                      </div>
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: T.textPri }}>
                        <QrCode size={15} weight="bold" color="white" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.section>

        {/* ══ PARTNER CTA ══ */}
        {!partner && (
          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            onClick={() => navigate('/partner/subscription')}
            className="w-full rounded-2xl p-6 text-left mb-8 active:scale-[0.98] transition-transform overflow-hidden relative"
            style={{ background: T.textPri, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-8 translate-x-8"
              style={{ background: T.terracotta }} />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: T.terracotta }}>Area Business</p>
            <p className="text-xl font-black leading-tight mb-2 text-white" style={{ fontFamily: T.serif }}>
              Diventa nostro Partner
            </p>
            <p className="text-[12px] font-medium mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Vendi eventi, ottieni visibilità premium e monitora i tuoi guadagni.
            </p>
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: T.terracotta }}>
              Scopri i piani <ArrowRight size={12} weight="bold" />
            </span>
          </motion.button>
        )}

        {/* ══ IL TUO PROFILO ══ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-white mb-8 overflow-hidden"
          style={{ border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

          <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
            <span className="text-[13px] font-black uppercase tracking-[0.1em]" style={{ color: T.textPri }}>Il tuo Profilo</span>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] active:scale-95 transition-transform"
                style={{ background: '#F4F4F5', color: T.textMut }}>
                <PencilSimple size={11} weight="bold" /> Modifica
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#F4F4F5' }}>
                  <X size={14} weight="bold" style={{ color: T.textMut }} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] disabled:opacity-50"
                  style={{ background: T.textPri, color: 'white' }}>
                  <FloppyDisk size={11} weight="bold" /> {saving ? '...' : 'Salva'}
                </button>
              </div>
            )}
          </div>

          <div className="p-5">
            {!editing ? (
              <div className="space-y-0">
                <ProfileRow label="Nome" value={`${profile?.nome || ''} ${profile?.cognome || ''}`.trim() || '—'} />
                <ProfileRow label="Nickname" value={profile?.nickname || '—'} />
                <ProfileRow label="Email" value={profile?.email || '—'} />
                <ProfileRow label="Città" value={profile?.citta || '—'} />
                {profile?.biografia && <ProfileRow label="Bio" value={profile.biografia} />}
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Nome" value={formData.nome} onChange={v => setFormData({ ...formData, nome: v })} />
                  <FormField label="Cognome" value={formData.cognome} onChange={v => setFormData({ ...formData, cognome: v })} />
                </div>
                <FormField label="Nickname" value={formData.nickname} onChange={v => setFormData({ ...formData, nickname: v })} />
                <FormField label="Città" value={formData.citta} onChange={v => setFormData({ ...formData, citta: v })} />
                <FormField label="Biografia" value={formData.biografia} multiline onChange={v => setFormData({ ...formData, biografia: v })} />

                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: T.textMut }}>Social</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Instagram" value={formData.instagram_url} icon={<InstagramLogo style={{ color: '#e1306c' }} />} onChange={v => setFormData({ ...formData, instagram_url: v })} />
                    <FormField label="TikTok" value={formData.tiktok_url} icon={<TiktokLogo style={{ color: T.textPri }} />} onChange={v => setFormData({ ...formData, tiktok_url: v })} />
                    <FormField label="Facebook" value={formData.facebook_url} icon={<FacebookLogo style={{ color: '#1877f2' }} />} onChange={v => setFormData({ ...formData, facebook_url: v })} />
                    <FormField label="YouTube" value={formData.youtube_url} icon={<YoutubeLogo style={{ color: '#ff0000' }} />} onChange={v => setFormData({ ...formData, youtube_url: v })} />
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.section>

        {/* ══ IMPOSTAZIONI ══ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl bg-white mb-4 overflow-hidden"
          style={{ border: `1px solid ${T.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

          {profile?.ruolo !== 'creator' && (
            <ActionRow icon={<Compass size={18} weight="bold" />} iconBg={`${T.terracotta}15`} iconColor={T.terracotta}
              label="Diventa Creator" onClick={() => navigate('/diventa-creator')} />
          )}
          <ActionRow icon={<Lock size={18} weight="bold" />} iconBg="#F4F4F5" iconColor={T.textMut}
            label="Reimposta Password" onClick={() => setShowPasswordModal(true)} />
          <ActionRow icon={<ShieldCheck size={18} weight="bold" />} iconBg="#f0fdf4" iconColor="#16a34a"
            label="Privacy Policy" onClick={() => navigate('/privacy')} />
          <ActionRow icon={<BookOpenText size={18} weight="bold" />} iconBg="#fefce8" iconColor="#ca8a04"
            label="Termini & Condizioni" onClick={() => navigate('/termini')} last />
        </motion.section>

        {/* ══ DANGER ZONE ══ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl overflow-hidden mb-4"
          style={{ border: '1px solid #fecaca', background: '#fff5f5' }}>
          <ActionRow icon={<Warning size={18} weight="fill" />} iconBg="#fee2e2" iconColor="#ef4444"
            label="Elimina Account" labelColor="#ef4444" onClick={() => setShowDeleteModal(true)} last />
        </motion.section>

      </main>

      {/* ════ MODALI ════ */}
      <AnimatePresence>
        {(showPasswordModal || showDeleteModal) && (
          <BottomModal
            open={true}
            onClose={() => { setShowPasswordModal(false); setShowDeleteModal(false); setDeleteConfirmText('') }}
            title={showPasswordModal ? 'Reset Password' : 'Danger Zone'}>
            {showPasswordModal ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: '#F4F4F5' }}>
                  <Lock size={28} weight="bold" style={{ color: T.textMut }} />
                </div>
                <p className="text-[14px] font-medium leading-relaxed mb-6" style={{ color: T.textMut }}>
                  Ti invieremo un link su <strong style={{ color: T.textPri }}>{profile?.email}</strong> per reimpostare la password.
                </p>
                <button
                  onClick={handleResetPassword}
                  disabled={passwordSending}
                  className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest disabled:opacity-50"
                  style={{ background: T.textPri }}>
                  {passwordSending ? 'Invio...' : 'Invia Email Reset'}
                </button>
              </div>
            ) : (
              <div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: '#fee2e2' }}>
                  <Warning size={28} weight="fill" style={{ color: '#ef4444' }} />
                </div>
                <p className="text-[14px] font-medium leading-relaxed text-center mb-6" style={{ color: T.textMut }}>
                  Perderai per sempre tutte le card e gli XP. <strong style={{ color: T.textPri }}>Azione definitiva.</strong>
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder='Scrivi "elimina"'
                  className="w-full px-5 py-4 rounded-2xl mb-4 text-[14px] font-bold outline-none text-center transition"
                  style={{ border: '2px solid #fecaca', background: 'white' }}
                  onFocus={e => e.target.style.borderColor = '#ef4444'}
                  onBlur={e => e.target.style.borderColor = '#fecaca'}
                />
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteConfirmText.trim().toLowerCase() !== 'elimina'}
                  className="w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest disabled:opacity-40"
                  style={{ background: '#ef4444' }}>
                  {deletingAccount ? '...' : 'Elimina Definitivamente'}
                </button>
              </div>
            )}
          </BottomModal>
        )}
      </AnimatePresence>

      {/* Transition Overlay */}
      <AnimatePresence>
        {modeTransition.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
            style={{ background: T.bgPage }}>
            <div className="relative w-48 h-48 mb-8">
              <img src="/cambioview/partner.png" className="absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-out shadow-2xl rounded-3xl" style={{ opacity: modeTransition.flip ? 0 : 1, transform: modeTransition.flip ? "scale(0.8) translateY(-20px)" : "scale(1)" }} />
              <img src="/cambioview/utente.png" className="absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-out" style={{ opacity: modeTransition.flip ? 1 : 0, transform: modeTransition.flip ? "scale(1)" : "scale(0.8) translateY(20px)" }} />
            </div>
            <p className="text-xl font-black tracking-widest uppercase" style={{ fontFamily: T.serif, color: T.textPri }}>
              {modeTransition.flip ? 'Benvenuto in HUB' : 'In preparazione...'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex gap-4 py-3.5 justify-between items-start" style={{ borderBottom: '1px solid #F4F4F5' }}>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] shrink-0 mt-0.5" style={{ color: '#9CA3AF' }}>{label}</span>
      <span className="text-[13px] font-bold text-right break-all" style={{ color: '#1F2933' }}>{value}</span>
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', multiline = false, icon = null }) {
  const style = {
    width: '100%', padding: '12px 16px', borderRadius: '14px',
    border: '1.5px solid #E5E7EB', background: '#F9F9F7',
    fontSize: '13px', fontWeight: 700, color: '#1F2933',
    outline: 'none', resize: 'none',
  }
  return (
    <div className="flex-1">
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 px-1" style={{ color: '#9CA3AF' }}>
        {icon}{label}
      </label>
      {multiline
        ? <textarea rows={3} style={style} value={value} onChange={e => onChange(e.target.value)}
            onFocus={e => e.target.style.borderColor = '#D4793A'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
        : <input type={type} style={style} value={value} onChange={e => onChange(e.target.value)}
            onFocus={e => e.target.style.borderColor = '#D4793A'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'} />}
    </div>
  )
}

function ActionRow({ icon, iconBg, iconColor, label, labelColor, onClick, last = false }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 active:bg-black/5 transition-colors"
      style={last ? {} : { borderBottom: '1px solid #F4F4F5' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <span className="flex-1 text-left text-[13px] font-black" style={{ color: labelColor || '#1F2933' }}>{label}</span>
      <ArrowRight size={15} weight="bold" style={{ color: '#D1D5DB' }} />
    </button>
  )
}

function BottomModal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col justify-end p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-sm mx-auto rounded-3xl p-7 shadow-2xl relative"
        style={{ background: '#F9F9F7', border: '1px solid #E5E7EB' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-7">
          <h3 className="text-xl font-black tracking-tight" style={{ fontFamily: "'Libre Baskerville', serif", color: '#1F2933' }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#F4F4F5' }}>
            <X size={15} weight="bold" style={{ color: '#6B7280' }} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}
