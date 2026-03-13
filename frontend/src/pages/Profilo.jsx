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
  FacebookLogo, YoutubeLogo, BookOpenText, CheckCircle
} from '@phosphor-icons/react'
import { useTheme } from '../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { colors as TOKENS, typography } from "../utils/designTokens"

export default function Profilo() {
  const navigate = useNavigate()
  const { profile, refreshProfile, isAdmin } = useAuth()
  const { theme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState(null)
  const [stats, setStats] = useState({ cards: 0, km: 0, xp: 0 })

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
    loadData()
  }, [profile?.id])

  // --- AZIONI ---
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
    const shareData = {
      title: 'Desideri di Puglia',
      text: 'Scopri le bellezze della Puglia con me su Desideri di Puglia!',
      url: window.location.origin
    }
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
    } catch (err) { toast.error('Errore durante l\'eliminazione') }
    finally { setDeletingAccount(false) }
  }

  const handleModeSwitch = (target) => {
    setModeTransition({ active: true, target, flip: false })
    setTimeout(() => setModeTransition((prev) => ({ ...prev, flip: true })), 1500)
    setTimeout(() => navigate(target === 'partner' ? '/partner/dashboard' : '/dashboard'), 3000)
  }

  const displayName = profile?.nome && profile?.cognome ? `${profile.nome} ${profile.cognome}` : profile?.nickname || profile?.email?.split('@')[0] || 'Esploratore'
  const initials = (profile?.nome?.[0] || profile?.nickname?.[0] || '?').toUpperCase()

  return (
    <div className="min-h-[100dvh] pb-32 selection:bg-[#D4793A]/30"
      style={{
        background: '#FAF7F0',
        backgroundImage: 'radial-gradient(circle, rgba(60,40,20,0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}>

      {/* Decorative ribbons */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-10 left-[-20px] w-32 h-8 rounded-sm rotate-[-30deg] opacity-20"
          style={{ background: '#D4793A' }} />
        <div className="absolute top-20 right-[-10px] w-24 h-6 rounded-sm rotate-[10deg] opacity-15"
          style={{ background: '#B8882F' }} />
      </div>

      {/* ── HERO / POLAROID ── */}
      <div className="relative pt-12 pb-16 px-6 flex flex-col items-center text-center">
        <div className="w-full flex justify-between items-center absolute top-4 px-4 z-20">
          {isAdmin ? <Link to="/admin" className="px-3 py-1.5 rounded-xl bg-white border border-[#E8DDD0] text-[9px] font-black tracking-widest text-[#1A1A1A] shadow-sm">ADMIN</Link> : <div />}
          <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-white border border-[#E8DDD0] flex items-center justify-center text-[#1A1A1A] shadow-sm active:scale-95 transition hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500">
            <SignOut weight="bold" className="w-4 h-4 ml-0.5" />
          </button>
        </div>

        {/* Polaroid Avatar */}
        <motion.label 
          initial={{ rotate: -3 }}
          whileHover={{ rotate: 1, scale: 1.05 }}
          className="relative cursor-pointer z-10 mb-8 mt-6 p-3 bg-white shadow-2xl rounded-sm border border-stone-200/50"
        >
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div className="w-28 h-28 overflow-hidden bg-stone-100 flex items-center justify-center text-3xl font-black text-stone-300">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover grayscale-[20%]" />
            ) : initials}
            {/* Grain effect on photo */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 pointer-events-none" />
          </div>
          <div className="pt-3 pb-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest italic">{profile?.ruolo || 'Esploratore'}</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#D4793A] flex items-center justify-center shadow-lg border-2 border-white text-white">
            <Camera weight="fill" className="w-3.5 h-3.5" />
          </div>
          {/* Taped effect */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-[#B8882F30] rotate-[-2deg] rounded-sm pointer-events-none" />
        </motion.label>

        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight z-10" style={{ fontFamily: typography.serif }}>{displayName}</h1>
        <p className="text-[13px] font-bold text-stone-500 mt-2 z-10 flex items-center gap-1.5 uppercase tracking-wide">
          <MapPin weight="fill" className="text-[#D4793A] w-3.5 h-3.5" /> {profile?.citta || 'Puglia, Italia'}
        </p>

        <div className="flex items-center gap-2 mt-6 z-10">
          <div className="px-4 py-1.5 rounded-full bg-white border border-[#E8DDD0] text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest shadow-sm">
            Passaporto Digitale
          </div>
          {partner && (
            <button
              onClick={() => handleModeSwitch('partner')}
              className="px-4 py-1.5 rounded-full bg-[#D4793A] border border-[#B8882F50] text-[10px] font-black text-white uppercase tracking-widest shadow-md active:scale-95 transition-transform"
            >
              HUB Partner
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 space-y-8 relative z-30 pb-10">
        {/* ── STATS SCRAPBOOK ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { Icon: CardsThree, val: stats.cards, label: 'Card', color: '#16a34a' },
            { Icon: Path, val: stats.km, label: 'Km', color: '#D4793A' },
            { Icon: Medal, val: stats.xp, label: 'Punti', color: '#B8882F' }
          ].map((s, i) => (
            <div key={i} className="rounded-3xl bg-white border-2 border-dashed border-[#D5C8B8] p-4 text-center shadow-sm relative rotate-[1deg] odd:rotate-[-1deg] transition-transform hover:rotate-0">
              <s.Icon weight="bold" className="w-6 h-6 mx-auto" style={{ color: s.color }} />
              <p className="text-2xl font-black text-[#1A1A1A] mt-2 mb-1" style={{ fontFamily: typography.serif }}>{loading ? '...' : s.val}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">{s.label}</p>
              {/* Decorative tape on one corner */}
              <div className="absolute -top-2 left-2 w-6 h-3 bg-stone-200/50 rotate-[-15deg] rounded-sm" />
            </div>
          ))}
        </div>

        {/* ── SHARE ── */}
        <motion.button 
          whileHover={{ y: -2 }}
          onClick={handleShare} 
          className="w-full rounded-3xl bg-white border-2 border-[#E8DDD0] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#F0EAE2] flex items-center justify-center group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors">
              <ShareNetwork weight="bold" className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-black tracking-tight text-[#1A1A1A]">Invita un Amico</p>
              <p className="text-[12px] font-medium text-stone-500">Mostra le bellezze della Puglia</p>
            </div>
          </div>
          <ArrowRight weight="bold" className="w-4 h-4 text-stone-300 group-hover:text-[#D4793A] transition-colors" />
          <div className="absolute top-0 right-0 w-24 h-full bg-[#D4793A]/5 -skew-x-12 translate-x-12 group-hover:translate-x-8 transition-transform" />
        </motion.button>

        {!partner && (
          <button
            onClick={() => navigate('/partner/subscription')}
            className="w-full rounded-3xl p-6 text-left border-2 border-[#D5C8B8] bg-white shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#D4793A]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B8882F] mb-2">Area Business</p>
            <p className="text-2xl leading-tight font-black tracking-tight mb-3 text-[#1A1A1A]" style={{ fontFamily: typography.serif }}>Diventa nostro Partner</p>
            <p className="text-[14px] text-stone-500 font-medium leading-relaxed mb-4">
              Vendi eventi, ottieni visibilità premium e monitora i tuoi guadagni.
            </p>
            <div className="inline-flex items-center gap-2 text-[13px] font-black text-[#D4793A] group-hover:translate-x-1 transition-transform uppercase tracking-widest">
              Dettagli <ArrowRight weight="bold" className="w-3.5 h-3.5" />
            </div>
          </button>
        )}

        {/* ── SEZIONE PROFILO ── */}
        <section className="rounded-3xl border-2 border-[#E8DDD0] bg-white p-7 relative">
          <div className="absolute -top-4 left-6 px-4 py-1 rounded-full border-2 border-[#E8DDD0] bg-[#FAF7F0] text-[10px] font-black uppercase tracking-[0.3em] text-[#B8882F]">
            Il tuo Profilo
          </div>
          
          <div className="flex items-center justify-end mb-6">
            {!editing ? (
              <button 
                onClick={() => setEditing(true)} 
                className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-stone-200 text-[11px] font-black uppercase tracking-widest text-stone-500 hover:bg-stone-50 transition"
              >
                <PencilSimple weight="bold" className="w-3.5 h-3.5" /> Modifica
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)} className="w-9 h-9 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600 transition"><X weight="bold" className="w-4 h-4" /></button>
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="px-5 py-2 rounded-full bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <FloppyDisk weight="bold" className="w-4 h-4" /> {saving ? '...' : 'Salva'}
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <div className="space-y-4 pt-2">
              <ProfileRow label="Nome" value={`${profile?.nome || ''} ${profile?.cognome || ''}`.trim() || '—'} />
              <ProfileRow label="Nickname" value={profile?.nickname || '—'} />
              <ProfileRow label="Email" value={profile?.email || '—'} />
              <ProfileRow label="Città" value={profile?.citta || '—'} />
              {profile?.biografia && <ProfileRow label="Bio" value={profile.biografia} />}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nome" value={formData.nome} onChange={v => setFormData({ ...formData, nome: v })} />
                <FormField label="Cognome" value={formData.cognome} onChange={v => setFormData({ ...formData, cognome: v })} />
              </div>
              <FormField label="Nickname" value={formData.nickname} onChange={v => setFormData({ ...formData, nickname: v })} />
              <FormField label="Città" value={formData.citta} onChange={v => setFormData({ ...formData, citta: v })} />
              <FormField label="Biografia" value={formData.biografia} multiline onChange={v => setFormData({ ...formData, biografia: v })} />

              <div className="pt-4">
                <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="h-px bg-stone-200 flex-1" /> Social Hub <span className="h-px bg-stone-200 flex-1" />
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Instagram" value={formData.instagram_url} icon={<InstagramLogo className="text-pink-500" />} onChange={v => setFormData({ ...formData, instagram_url: v })} />
                  <FormField label="TikTok" value={formData.tiktok_url} icon={<TiktokLogo className="text-zinc-900" />} onChange={v => setFormData({ ...formData, tiktok_url: v })} />
                  <FormField label="Facebook" value={formData.facebook_url} icon={<FacebookLogo className="text-blue-600" />} onChange={v => setFormData({ ...formData, facebook_url: v })} />
                  <FormField label="YouTube" value={formData.youtube_url} icon={<YoutubeLogo className="text-red-600" />} onChange={v => setFormData({ ...formData, youtube_url: v })} />
                </div>
              </div>
            </form>
          )}
        </section>

        {/* ── COME FUNZIONA ── */}
        <section className="rounded-3xl border-2 border-dashed border-[#D5C8B8] bg-white p-7 relative">
          <div className="absolute -top-4 left-6 px-4 py-1 rounded-full border-2 border-dashed border-[#D5C8B8] bg-[#FAF7F0] text-[10px] font-black uppercase tracking-[0.3em] text-[#B8882F]">
            Guida Esplorativa
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4">
            <HowToCard icon={<Compass weight="bold" />} title="GPS" desc="Avvicinati a un monumento per ottenere la Card." />
            <HowToCard icon={<Key weight="bold" />} title="PIN" desc="Visita un partner e richiedi il codice." />
            <HowToCard icon={<CardsThree weight="bold" />} title="Set" desc="Completa le Saghe per XP massimi." />
          </div>
        </section>

        {/* ── AZIONI ── */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-3xl border-2 border-[#E8DDD0] bg-white p-2 space-y-1">
            {profile?.ruolo !== 'creator' && (
              <ActionRow
                icon={<Compass weight="bold" />}
                color="text-[#D4793A]"
                label="Diventa Creator"
                onClick={() => navigate('/diventa-creator')}
              />
            )}
            <ActionRow icon={<Lock weight="bold" />} color="text-stone-400" label="Reimposta Password" onClick={() => setShowPasswordModal(true)} />
            <ActionRow icon={<ShieldCheck weight="bold" />} color="text-green-500" label="Privacy Policy" onClick={() => navigate('/privacy')} />
            <ActionRow icon={<BookOpenText weight="bold" />} color="text-[#B8882F]" label="Termini & Condizioni" onClick={() => navigate('/termini')} />
          </div>
          <div className="rounded-3xl border-2 border-red-100 bg-red-50/30 p-2 flex items-center">
            <ActionRow icon={<Warning weight="fill" />} color="text-red-500" label="Elimina Account" onClick={() => setShowDeleteModal(true)} />
          </div>
        </div>
      </div>

      {/* ════ MODALI ════ */}
      <AnimatePresence>
        {(showPasswordModal || showDeleteModal) && (
          <BottomModal 
            open={true} 
            onClose={() => { setShowPasswordModal(false); setShowDeleteModal(false); setDeleteConfirmText('') }} 
            title={showPasswordModal ? "Reset Password" : "Danger Zone"}
          >
            {showPasswordModal ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                  <Lock weight="bold" className="text-stone-400 w-8 h-8" />
                </div>
                <p className="text-[14px] font-medium text-stone-600 mb-6 leading-relaxed">
                  Ti invieremo un link su <strong className="text-[#1A1A1A]">{profile?.email}</strong> per reimpostare la tua password in totale sicurezza.
                </p>
                <button 
                  onClick={handleResetPassword} 
                  disabled={passwordSending} 
                  className="w-full py-4 rounded-2xl bg-[#1A1A1A] text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition"
                >
                  {passwordSending ? 'Invio...' : 'Invia Email Reset'}
                </button>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Warning weight="fill" className="text-red-500 w-8 h-8" />
                </div>
                <p className="text-[14px] font-medium text-stone-600 mb-6 leading-relaxed text-center">
                  Eliminando l'account perderai per sempre le card sbloccate e gli XP. <strong>Questa azione è definitiva.</strong>
                </p>
                <input 
                  type="text" 
                  value={deleteConfirmText} 
                  onChange={e => setDeleteConfirmText(e.target.value)} 
                  placeholder='Scrivi "elimina"' 
                  className="w-full px-5 py-4 bg-white border-2 border-red-100 rounded-2xl mb-4 text-[14px] font-bold outline-none focus:border-red-400 transition text-center" 
                />
                <button 
                  onClick={handleDeleteAccount} 
                  disabled={deletingAccount || deleteConfirmText.trim().toLowerCase() !== 'elimina'} 
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest shadow-xl disabled:opacity-40 active:scale-95 transition"
                >
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
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF7F0]"
          >
            <div className="relative w-48 h-48 mb-8">
              <img src="/cambioview/partner.png" className="absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-out shadow-2xl rounded-3xl" style={{ opacity: modeTransition.flip ? 0 : 1, transform: modeTransition.flip ? "scale(0.8) translateY(-20px)" : "scale(1)" }} />
              <img src="/cambioview/utente.png" className={`absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-out`} style={{ opacity: modeTransition.flip ? 1 : 0, transform: modeTransition.flip ? "scale(1)" : "scale(0.8) translateY(20px)" }} />
            </div>
            <p className="text-xl font-black text-[#1A1A1A] tracking-widest uppercase italic" style={{ fontFamily: typography.serif }}>
              {modeTransition.flip ? "Benvenuto in HUB" : "In preparazione..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex gap-4 py-3 border-b border-stone-100 last:border-0 justify-between items-start">
      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 shrink-0 mt-0.5">{label}</span>
      <span className="text-[14px] text-[#1A1A1A] font-bold text-right break-all">{value}</span>
    </div>
  )
}

function FormField({ label, value, onChange, type = "text", multiline = false, icon = null }) {
  const cls = "w-full px-4 py-3.5 bg-white border-2 border-[#E8DDD0] rounded-2xl text-[14px] font-bold text-[#1A1A1A] placeholder:text-stone-300 focus:outline-none focus:border-[#D4793A] transition resize-none shadow-sm"
  return (
    <div className="relative flex-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 px-1 flex items-center gap-2">
        {icon}{label}
      </label>
      {multiline
        ? <textarea rows={3} className={cls} value={value} onChange={e => onChange(e.target.value)} />
        : <input type={type} className={cls} value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  )
}

function ActionRow({ icon, color, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-3.5 hover:bg-stone-50 active:scale-95 rounded-2xl transition group">
      <div className={`flex items-center gap-3 ${color}`}>
        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-stone-100 group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors">
          {icon}
        </div>
        <span className="text-[13px] font-black text-[#1A1A1A] uppercase tracking-wide">{label}</span>
      </div>
      <ArrowRight weight="bold" className="w-4 h-4 text-stone-300 group-hover:text-[#D4793A] transition-colors" />
    </button>
  )
}

function HowToCard({ icon, title, desc }) {
  return (
    <div className="rounded-2xl bg-[#F9F6F2] border border-[#E8DDD0] p-4 flex flex-col items-center text-center gap-3 hover:bg-white hover:shadow-lg transition-all">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#D4793A]">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-black text-[#1A1A1A] uppercase tracking-tighter" style={{ fontFamily: typography.serif }}>{title}</p>
        <p className="text-[11px] font-medium text-stone-500 mt-1 leading-tight">{desc}</p>
      </div>
    </div>
  )
}

function BottomModal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[110] flex flex-col justify-end bg-zinc-950/40 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="w-full max-w-sm mx-auto bg-[#FAF7F0] rounded-3xl p-8 shadow-2xl relative border-2 border-[#E8DDD0]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-8 bg-[#B8881F40] rotate-[3deg] rounded-sm" />
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tight" style={{ fontFamily: typography.serif }}>{title}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white border border-[#E8DDD0] flex items-center justify-center text-stone-400 hover:text-stone-900 transition shadow-sm"><X weight="bold" /></button>
        </div>
        <div>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
