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
  FacebookLogo, YoutubeLogo, BookOpenText, Sun, Moon
} from '@phosphor-icons/react'
import { useTheme } from '../contexts/ThemeContext'


export default function Profilo() {
  const navigate = useNavigate()
  const { profile, refreshProfile, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()


  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState(null)

  // -- Stats Nuove (Cards/Km/XP) --
  const [stats, setStats] = useState({ cards: 0, km: 0, xp: 0 })

  // -- Form Data --
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nome: '', cognome: '', nickname: '', citta: '',
    biografia: '', instagram_url: '', facebook_url: '',
    tiktok_url: '', youtube_url: ''
  })

  // -- Modali --
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
      text: 'Scopri le bellezze della Puglia con me su Desideri di Puglia! Scarica l\'app.',
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
    <div className="min-h-[100dvh] bg-[#f9f9f7] font-sans pb-32">
      {/* ── HERO ── */}
      <div className="relative w-full bg-zinc-950 pt-12 pb-16 px-6 flex flex-col items-center text-center overflow-hidden transition-colors duration-400">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-orange-400/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -right-20 w-56 h-56 bg-emerald-400/10 rounded-full blur-[60px]" />
        </div>

        <div className="w-full flex justify-between items-center absolute top-4 px-4 z-20">
          {isAdmin ? <Link to="/admin" className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold tracking-widest text-white backdrop-blur-md">ADMIN</Link> : <div />}
          <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition hover:bg-rose-500/80 hover:border-rose-500"><SignOut weight="bold" className="w-4 h-4 ml-0.5" /></button>
        </div>

        <label className="relative cursor-pointer group z-10 mb-4 mt-6">
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div className="w-24 h-24 rounded-full border-2 border-white/20 overflow-hidden shadow-xl bg-zinc-800 flex items-center justify-center text-3xl font-bold text-white/70">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md border border-white/30 text-zinc-900"><Camera weight="fill" className="w-3.5 h-3.5" /></div>
        </label>

        <h1 className="text-[22px] font-bold text-white tracking-tight z-10">{displayName}</h1>
        <p className="text-[12px] text-white/50 mt-1 z-10 flex items-center gap-1"><MapPin weight="fill" className="w-3 h-3" />{profile?.citta || 'Puglia, Italia'}</p>

        <div className="flex items-center gap-2 mt-3 z-10">
          <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold text-white/60 uppercase tracking-widest backdrop-blur-md">Passaporto Digitale</span>
          {partner && <button onClick={() => handleModeSwitch('partner')} className="px-3 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-[11px] font-bold text-amber-300 uppercase tracking-widest active:scale-95 transition shadow-[0_0_15px_rgba(251,191,36,0.2)]">HUB Partner</button>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-30 space-y-4">
        {/* ── BENTO STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white border border-zinc-200/60 p-4 shadow-sm text-center flex flex-col justify-center">
            <CardsThree weight="duotone" className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="text-2xl font-bold font-mono tracking-tighter text-zinc-950 mt-2">{loading ? '...' : stats.cards}</p>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">Card Sbloccate</p>
          </div>
          <div className="rounded-2xl bg-white border border-zinc-200/60 p-4 shadow-sm text-center flex flex-col justify-center">
            <Path weight="duotone" className="w-6 h-6 text-blue-500 mx-auto" />
            <p className="text-2xl font-bold font-mono tracking-tighter text-zinc-950 mt-2">{loading ? '...' : stats.km}</p>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">Km Percorsi</p>
          </div>
          <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 shadow-sm text-center flex flex-col justify-center relative overflow-hidden no-theme-flip">

            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent pointer-events-none" />
            <Medal weight="duotone" className="w-6 h-6 text-orange-400 mx-auto relative z-10" />
            <p className="text-2xl font-bold font-mono tracking-tighter text-white mt-2 relative z-10">{loading ? '...' : stats.xp}</p>
            <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider mt-0.5 relative z-10">Punti XP</p>
          </div>
        </div>

        {/* ── SHARE APP ── */}
        <button onClick={handleShare} className="w-full rounded-2xl bg-zinc-950 text-white p-4 flex items-center justify-between shadow-md hover:shadow-lg active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><ShareNetwork weight="fill" className="w-5 h-5 text-white" /></div>
            <div className="text-left">
              <p className="text-[14px] font-bold tracking-tight">Invita un Amico</p>
              <p className="text-[11px] text-white/50">Mostra le bellezze della Puglia</p>
            </div>
          </div>
          <ArrowRight weight="bold" className="w-4 h-4 text-white/30" />
        </button>

        {/* ── MODIFICA PROFILO ── */}
        <section className="rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-zinc-950 tracking-tight flex items-center gap-2"><UserCircle weight="duotone" className="w-4.5 h-4.5 text-zinc-400" /> Il tuo Profilo</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-200 transition">
                <PencilSimple weight="bold" className="w-3 h-3" /> Modifica
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)} className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center hover:bg-zinc-200 transition"><X weight="bold" className="w-3 h-3 text-zinc-500" /></button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950 text-white text-[11px] font-semibold disabled:opacity-50 active:scale-95 transition">
                  <FloppyDisk weight="bold" className="w-3 h-3" /> {saving ? 'Salvo...' : 'Salva'}
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <div className="space-y-3">
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
              <FormField label="Città (Residenza)" value={formData.citta} onChange={v => setFormData({ ...formData, citta: v })} />
              <FormField label="Biografia" value={formData.biografia} multiline onChange={v => setFormData({ ...formData, biografia: v })} />

              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-6 mb-2 border-b border-zinc-100 pb-2">Social Hub</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Instagram" value={formData.instagram_url} icon={<InstagramLogo />} onChange={v => setFormData({ ...formData, instagram_url: v })} />
                <FormField label="TikTok" value={formData.tiktok_url} icon={<TiktokLogo />} onChange={v => setFormData({ ...formData, tiktok_url: v })} />
                <FormField label="Facebook" value={formData.facebook_url} icon={<FacebookLogo />} onChange={v => setFormData({ ...formData, facebook_url: v })} />
                <FormField label="YouTube" value={formData.youtube_url} icon={<YoutubeLogo />} onChange={v => setFormData({ ...formData, youtube_url: v })} />
              </div>
            </form>
          )}
        </section>

        {/* ── HOW-TO EDUCATIONAL ── */}
        <section className="rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm">
          <h2 className="text-[14px] font-bold text-zinc-950 tracking-tight mb-4 flex items-center gap-2">
            <Books weight="duotone" className="w-4.5 h-4.5 text-zinc-400" /> Come Funziona
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <HowToCard icon={<Compass weight="duotone" className="w-6 h-6 text-blue-500" />} title="Sblocco GPS" desc="Avvicinati a un monumento entro 50m per ottenere la Card." />
            <HowToCard icon={<Key weight="duotone" className="w-6 h-6 text-amber-500" />} title="PIN Partner" desc="Visita un locale affiliato e richiedi il codice segreto." />
            <HowToCard icon={<CardsThree weight="duotone" className="w-6 h-6 text-emerald-500" />} title="Collezione" desc="Completa i Set Regionali sfidando gli altri esploratori." />
          </div>
          <div className="mt-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-500 leading-relaxed">
            <strong className="text-zinc-700">Le Saghe (Set di Carte):</strong> Sono percorsi tematici legati alla cultura pugliese. Completando internamente i set si ottengono punti XP massimizzati. Visita i tab "Missioni" per scoprire le sfide in corso!
          </div>
        </section>

        {/* ── SICUREZZA E LEGAL ── */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white border border-zinc-200/60 p-2 shadow-sm space-y-1">
            {/* ─── THEME TOGGLE ─── */}
            <div className="w-full flex items-center justify-between p-3 rounded-xl group">
              <div className="flex items-center gap-3 text-violet-600">
                {theme === 'dark' ? <Moon weight="duotone" className="w-5 h-5" /> : <Sun weight="duotone" className="w-5 h-5" />}
                <span className="text-[13px] font-bold text-zinc-800">Tema {theme === 'dark' ? 'Scuro' : 'Chiaro'}</span>
              </div>
              {/* Pill Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Cambia tema"
                className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-400/40 ${
                  theme === 'dark' ? 'bg-violet-600' : 'bg-zinc-200'
                }`}
              >
                <span
                  className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                  }`}
                >
                  {theme === 'dark'
                    ? <Moon size={12} weight="fill" className="text-violet-600" />
                    : <Sun size={12} weight="fill" className="text-amber-500" />}
                </span>
              </button>
            </div>
            <ActionRow icon={<Lock weight="duotone" />} color="text-zinc-600" label="Reimposta Password" onClick={() => setShowPasswordModal(true)} />
            <ActionRow icon={<ShieldCheck weight="duotone" />} color="text-emerald-500" label="Informativa sulla Privacy" onClick={() => navigate('/privacy')} />
            <ActionRow icon={<BookOpenText weight="duotone" />} color="text-orange-500" label="Termini e Condizioni" onClick={() => navigate('/termini')} />
          </div>
          <div className="rounded-2xl bg-rose-50 border border-rose-200/60 p-2 shadow-sm">
            <ActionRow icon={<Warning weight="fill" />} color="text-rose-600" label="Elimina Account" onClick={() => setShowDeleteModal(true)} />
          </div>
        </div>

      </div>

      {/* ════ MODALI ════ */}
      <BottomModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Reset Password">
        <p className="text-[12px] text-zinc-500 mb-5 leading-relaxed">Riceverai un'email su <strong className="text-zinc-800">{profile?.email}</strong> per reimpostare la tua password.</p>
        <button onClick={handleResetPassword} disabled={passwordSending} className="w-full py-3 rounded-xl bg-zinc-950 text-white text-[13px] font-bold active:scale-95 transition disabled:opacity-50">{passwordSending ? 'Invio in corso...' : 'Invia Modulo Reset'}</button>
      </BottomModal>

      <BottomModal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirmText('') }} title={<span className="text-rose-600 flex items-center gap-2"><Warning weight="fill" /> Danger Zone</span>}>
        <p className="text-[12px] text-zinc-600 mb-4 leading-relaxed">Eliminando l'account perderai per sempre le card sbloccate, gli XP e il ranking nel Club. <strong>L'azione non è reversibile.</strong></p>
        <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder='Scrivi "elimina" per confermare' className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl mb-4 text-[13px] outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400" />
        <button onClick={handleDeleteAccount} disabled={deletingAccount || deleteConfirmText.trim().toLowerCase() !== 'elimina'} className="w-full py-3 rounded-xl bg-rose-600 text-white text-[13px] font-bold disabled:opacity-40 active:scale-95 transition">Conferma Eliminazione</button>
      </BottomModal>

      {modeTransition.active && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <div className="relative w-32 h-32 mb-6">
            <img src="/cambioview/partner.png" className="absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-out" style={{ opacity: modeTransition.flip ? 0 : 1, transform: modeTransition.flip ? "translateX(-50px) scale(0.9)" : "translateX(0) scale(1)" }} />
            <img src="/cambioview/utente.png" className={`absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-out ${modeTransition.flip ? "animate-pulse" : ""}`} style={{ opacity: modeTransition.flip ? 1 : 0, transform: modeTransition.flip ? "translateX(0) scale(1)" : "translateX(50px) scale(0.9)" }} />
          </div>
          <p className="text-[16px] font-bold text-zinc-950">Avvio HUB Partner...</p>
        </div>
      )}
    </div>
  )
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex gap-4 py-2 border-b border-zinc-100 last:border-0 justify-between items-start">
      <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold shrink-0">{label}</span>
      <span className="text-[12px] text-zinc-900 font-medium text-right break-words">{value}</span>
    </div>
  )
}

function FormField({ label, value, onChange, type = "text", multiline = false, icon = null }) {
  const cls = "w-full pl-3 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30 transition resize-none"
  return (
    <div className="relative">
      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">{icon}{label}</label>
      {multiline
        ? <textarea rows={2} className={cls} value={value} onChange={e => onChange(e.target.value)} />
        : <input type={type} className={cls} value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  )
}

function ActionRow({ icon, color, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 active:scale-95 rounded-xl transition group">
      <div className={`flex items-center gap-3 ${color}`}>
        {icon}
        <span className="text-[13px] font-bold text-zinc-800">{label}</span>
      </div>
      <ArrowRight weight="bold" className="w-4 h-4 text-zinc-300" />
    </button>
  )
}

function HowToCard({ icon, title, desc }) {
  return (
    <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 flex flex-col gap-3 hover:bg-zinc-100/60 transition">
      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm text-zinc-500">
        {icon}
      </div>
      <div>
        <p className="text-[12px] font-bold text-zinc-900">{title}</p>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function BottomModal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-zinc-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      {/* 
        Aggiungiamo mb-20 sm:mb-0 al contenitore del modale in modo che si alzi sopra la navbar 
        del layout globale, che fissa in basso la navigazione su mobile. 
      */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 flex flex-col max-h-[80vh] mb-24 sm:mb-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h3 className="text-[16px] font-bold text-zinc-950">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200"><X weight="bold" /></button>
        </div>
        <div className="overflow-y-auto overflow-x-hidden pr-2 -mr-2 pb-2">
          {children}
        </div>
      </div>
    </div>
  )
}