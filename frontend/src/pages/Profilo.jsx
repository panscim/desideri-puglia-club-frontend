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
  FacebookLogo, YoutubeLogo, BookOpenText
} from '@phosphor-icons/react'
import { useTheme } from '../contexts/ThemeContext'


export default function Profilo() {
  const navigate = useNavigate()
  const { profile, refreshProfile, isAdmin } = useAuth()
  const { theme } = useTheme()


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
    <div className="min-h-[100dvh] bg-bg-primary font-sans pb-32">
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

        <h1 className="text-[22px] font-serif font-black text-white tracking-tight z-10">{displayName}</h1>
        <p className="text-[12px] font-sans text-white/75 mt-1 z-10 flex items-center gap-1"><MapPin weight="bold" className="w-3 h-3" />{profile?.citta || 'Puglia, Italia'}</p>

        <div className="flex items-center gap-2 mt-3 z-10 no-theme-flip">
          <span className="px-3 py-1 rounded-full bg-stone-100 border border-zinc-950 text-[10px] font-bold text-zinc-950 uppercase tracking-widest">
            Passaporto Digitale
          </span>
          {partner && (
            <button
              onClick={() => handleModeSwitch('partner')}
              className="px-3 py-1 rounded-full bg-stone-100 border border-zinc-950 text-[10px] font-bold text-zinc-950 uppercase tracking-widest active:scale-95 transition-transform shadow-sm"
            >
              HUB Partner
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-30 space-y-4">
        {/* ── BENTO STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-card bg-white border border-border-default p-4 shadow-sm text-center flex flex-col justify-center">
            <CardsThree weight="bold" className="w-6 h-6 text-success mx-auto" />
            <p className="text-[28px] font-serif font-black tracking-tighter text-text-primary mt-2 leading-none">{loading ? '...' : stats.cards}</p>
            <p className="overline mt-2">Card</p>
          </div>
          <div className="rounded-card bg-white border border-border-default p-4 shadow-sm text-center flex flex-col justify-center">
            <Path weight="bold" className="w-6 h-6 text-accent mx-auto" />
            <p className="text-[28px] font-serif font-black tracking-tighter text-text-primary mt-2 leading-none">{loading ? '...' : stats.km}</p>
            <p className="overline mt-2">Km</p>
          </div>
          <div className="rounded-card bg-surface border border-border-default p-4 shadow-sm text-center flex flex-col justify-center relative overflow-hidden no-theme-flip">
            <Medal weight="bold" className="w-6 h-6 text-accent-gold mx-auto relative z-10" />
            <p className="text-[28px] font-serif font-black tracking-tighter text-text-primary mt-2 relative z-10 leading-none">{loading ? '...' : stats.xp}</p>
            <p className="overline mt-2 relative z-10">Punti XP</p>
          </div>
        </div>

        {/* ── SHARE APP ── */}
        <button onClick={handleShare} className="w-full rounded-card bg-bg-dark text-white p-5 flex items-center justify-between shadow-md hover:shadow-lg active:scale-[0.98] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center"><ShareNetwork weight="bold" className="w-6 h-6 text-white" /></div>
            <div className="text-left">
              <p className="text-[15px] font-bold tracking-tight family-sans">Invita un Amico</p>
              <p className="text-[12px] text-white/50">Mostra le bellezze della Puglia</p>
            </div>
          </div>
          <ArrowRight weight="bold" className="w-4 h-4 text-white/30" />
        </button>

        {!partner && (
          <button
            onClick={() => navigate('/partner/join')}
            className="w-full rounded-card p-6 text-left border border-white/10 bg-bg-dark text-white shadow-card hover:shadow-2xl active:scale-[0.99] transition-all relative overflow-hidden"
          >
             <div className="absolute top-0 left-5 right-5 h-[2px] bg-accent opacity-80" />
            <p className="overline text-accent-gold mb-2">Area Business</p>
            <p className="text-[20px] leading-tight font-serif font-black tracking-tight mb-2">Hai un&apos;attività? Diventa nostro Partner</p>
            <p className="text-[13px] text-white/60 leading-relaxed">
              Entra nella rete Desideri di Puglia, vendi eventi, ottieni visibilità premium e monitora i guadagni.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-[14px] font-bold text-accent">
              Inizia onboarding <ArrowRight weight="bold" className="w-3.5 h-3.5" />
            </div>
          </button>
        )}

        {/* ── MODIFICA PROFILO ── */}
        <section className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-serif font-black text-text-primary tracking-tight flex items-center gap-3">
              <UserCircle weight="bold" className="w-5 h-5 text-text-light" /> Il tuo Profilo
            </h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-ghost !px-4 !py-2 !text-[11px]">
                <PencilSimple weight="bold" className="w-3.5 h-3.5" /> Modifica
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-full bg-bg-secondary border border-border-default flex items-center justify-center hover:bg-zinc-200 transition"><X weight="bold" className="w-4 h-4 text-text-muted" /></button>
                <button onClick={handleSave} disabled={saving} className="btn-primary !px-4 !py-2 !text-[11px] !shadow-none">
                  <FloppyDisk weight="bold" className="w-3.5 h-3.5" /> {saving ? 'Salvo...' : 'Salva'}
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
        <section className="card">
          <h2 className="text-[16px] font-serif font-black text-text-primary tracking-tight mb-6 flex items-center gap-3">
            <Books weight="bold" className="w-5 h-5 text-text-light" /> Come Funziona
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <HowToCard icon={<Compass weight="bold" className="w-6 h-6 text-accent" />} title="Sblocco GPS" desc="Avvicinati a un monumento entro 50m per ottenere la Card." />
            <HowToCard icon={<Key weight="bold" className="w-6 h-6 text-accent-gold" />} title="PIN Partner" desc="Visita un locale affiliato e richiedi il codice segreto." />
            <HowToCard icon={<CardsThree weight="bold" className="w-6 h-6 text-success" />} title="Collezione" desc="Completa i Set Regionali sfidando gli altri esploratori." />
          </div>
          <div className="mt-6 p-4 rounded-xl bg-bg-secondary border border-border-default text-[12px] text-text-muted leading-relaxed">
            <strong className="text-text-primary font-bold">Le Saghe (Set di Carte):</strong> Sono percorsi tematici legati alla cultura pugliese. Completando internamente i set si ottengono punti XP massimizzati. Visita i tab "Missioni" per scoprire le sfide in corso!
          </div>
        </section>

        {/* ── SICUREZZA E LEGAL ── */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card !p-2 space-y-1">
            {profile?.ruolo !== 'creator' && (
              <ActionRow
                icon={<Compass weight="bold" />}
                color="text-accent"
                label="Diventa Creator"
                onClick={() => navigate('/diventa-creator')}
              />
            )}
            <ActionRow icon={<Lock weight="bold" />} color="text-text-muted" label="Reimposta Password" onClick={() => setShowPasswordModal(true)} />
            <ActionRow icon={<ShieldCheck weight="bold" />} color="text-success" label="Informativa sulla Privacy" onClick={() => navigate('/privacy')} />
            <ActionRow icon={<BookOpenText weight="bold" />} color="text-accent-orange" label="Termini e Condizioni" onClick={() => navigate('/termini')} />
          </div>
          <div className="rounded-card bg-red-50/50 border border-red-100 p-2 shadow-sm">
            <ActionRow icon={<Warning weight="fill" />} color="text-danger" label="Elimina Account" onClick={() => setShowDeleteModal(true)} />
          </div>
        </div>

      </div>

      {/* ════ MODALI ════ */}
      <BottomModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Reset Password">
        <p className="text-[13px] text-text-muted mb-6 leading-relaxed">Riceverai un'email su <strong className="text-text-primary">{profile?.email}</strong> per reimpostare la tua password.</p>
        <button onClick={handleResetPassword} disabled={passwordSending} className="btn-primary w-full">{passwordSending ? 'Invio in corso...' : 'Invia Modulo Reset'}</button>
      </BottomModal>

      <BottomModal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirmText('') }} title={<span className="text-danger flex items-center gap-2"><Warning weight="fill" /> Danger Zone</span>}>
        <p className="text-[13px] text-text-muted mb-4 leading-relaxed">Eliminando l'account perderai per sempre le card sbloccate, gli XP e il ranking nel Club. <strong>L'azione non è reversibile.</strong></p>
        <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder='Scrivi "elimina" per confermare' className="w-full px-4 py-3 bg-bg-secondary border border-border-default rounded-md mb-4 text-[14px] outline-none focus:border-danger transition" />
        <button onClick={handleDeleteAccount} disabled={deletingAccount || deleteConfirmText.trim().toLowerCase() !== 'elimina'} className="w-full py-4 rounded-pill bg-danger text-white text-[14px] font-black disabled:opacity-40 active:scale-95 transition shadow-lg">Conferma Eliminazione</button>
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
    <div className="flex gap-4 py-3 border-b border-border-default last:border-0 justify-between items-start">
      <span className="overline !mb-0 shrink-0">{label}</span>
      <span className="text-[13px] text-text-primary font-medium text-right break-words">{value}</span>
    </div>
  )
}

function FormField({ label, value, onChange, type = "text", multiline = false, icon = null }) {
  const cls = "w-full pl-3 pr-3 py-3 bg-white border border-border-default rounded-md text-[14px] text-text-primary placeholder:text-text-light focus:outline-none focus:border-accent transition resize-none shadow-sm"
  return (
    <div className="relative">
      <label className="overline !text-text-muted flex items-center gap-2">{icon}{label}</label>
      {multiline
        ? <textarea rows={3} className={cls} value={value} onChange={e => onChange(e.target.value)} />
        : <input type={type} className={cls} value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  )
}

function ActionRow({ icon, color, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 active:scale-95 rounded-xl transition group">
      <div className={`flex items-center gap-3 ${color}`}>
        {icon}
        <span className="text-[13px] font-bold text-zinc-900">{label}</span>
      </div>
      <ArrowRight weight="bold" className="w-4 h-4 text-zinc-500" />
    </button>
  )
}

function HowToCard({ icon, title, desc }) {
  return (
    <div className="rounded-lg bg-bg-secondary border border-border-default p-5 flex flex-col gap-4 hover:bg-white hover:shadow-md transition-all duration-300">
      <div className="w-12 h-12 rounded-lg bg-white border border-border-default flex items-center justify-center shadow-sm text-text-light">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-serif font-black text-text-primary">{title}</p>
        <p className="text-[12px] text-text-muted mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function BottomModal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-bg-dark/60 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="w-full max-w-sm bg-bg-primary rounded-t-lg sm:rounded-lg p-7 shadow-card animate-in slide-in-from-bottom-10 sm:scale-95 flex flex-col max-h-[85vh] mb-24 sm:mb-0 relative" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-10 right-10 h-[2px] bg-accent rounded-full opacity-50" />
        <div className="flex items-center justify-between mb-6 shrink-0 pt-2">
          <h3 className="text-[20px] font-serif font-black text-text-primary tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white border border-border-default flex items-center justify-center text-text-muted hover:bg-zinc-100 transition shadow-sm"><X weight="bold" /></button>
        </div>
        <div className="overflow-y-auto overflow-x-hidden pr-2 -mr-2 pb-4 scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  )
}
