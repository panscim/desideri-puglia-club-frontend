// src/pages/Profilo.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'

import {
  UserCircle, PencilSimple, SignOut, ShareNetwork, ShieldCheck,
  Trash, Lock, MapPin, Medal, Path, Books, X, CardsThree, Key,
  ArrowRight, Warning, Camera, FloppyDisk, Storefront, CalendarStar,
  IdentificationCard, Package, Sparkle, Headset, InstagramLogo,
  FacebookLogo, YoutubeLogo, TiktokLogo, Compass, IdentificationBadge
} from '@phosphor-icons/react'

export default function Profilo() {
  const navigate = useNavigate()
  const { profile, refreshProfile, isAdmin } = useAuth()

  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)

  // -- Stats Nuove (Cards/Km/XP) --
  const [stats, setStats] = useState({ cards: 0, km: 0, xp: 0 })

  // -- Stats Vecchie (Missioni app) --
  const [missionStats, setMissionStats] = useState({
    missioniTotaliApprovate: 0,
    missioniMeseApprovate: 0,
    ultimaMissioneData: null
  })

  // -- Form Data --
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nome: '', cognome: '', nickname: '', citta: '', sesso: '', biografia: '',
    instagram_url: '', facebook_url: '', tiktok_url: '', youtube_url: '',
    telefono: '', paese: '', via: '', cap: '', civico: ''
  })

  // -- Passaporto --
  const [showPassport, setShowPassport] = useState(false)
  const infoSectionRef = useRef(null)

  // -- Modali --
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Cerca transition (partner view)
  const [modeTransition, setModeTransition] = useState({ active: false, target: null, flip: false })

  useEffect(() => {
    if (!profile?.id) return

    setFormData({
      nome: profile.nome || '', cognome: profile.cognome || '', nickname: profile.nickname || '',
      citta: profile.citta || '', sesso: profile.sesso || '', biografia: profile.biografia || '',
      instagram_url: profile.instagram_url || '', facebook_url: profile.facebook_url || '', tiktok_url: profile.tiktok_url || '',
      youtube_url: profile.youtube_url || '', telefono: profile.telefono || '', paese: profile.paese || '',
      via: profile.via || '', cap: profile.cap || '', civico: profile.civico || ''
    })

    const loadData = async () => {
      try {
        setLoading(true)

        // Nuove Stats: Card Sbloccate 
        const { count: cardCount } = await supabase.from('user_cards').select('id', { count: 'exact', head: true }).eq('user_id', profile.id)

        // Partner
        const { data: partnerData } = await supabase.from('partners').select('id,name').eq('owner_user_id', profile.id).maybeSingle()
        setPartner(partnerData || null)

        // Vecchie Stats: Missioni
        const { data: missionData } = await supabase.from('missioni_inviate').select('stato, data_creazione, period_key').eq('id_utente', profile.id).order('data_creazione', { ascending: false })

        const approvate = (missionData || []).filter((r) => r.stato === 'Approvata')
        const meseKey = profile.mese_corrente_key || new Date().toISOString().slice(0, 7)
        const approvateMese = approvate.filter((r) => r.period_key && r.period_key.startsWith(meseKey))

        const cards = cardCount ?? 0
        setStats({ cards, km: Math.round(cards * 2.3), xp: cards * 50 })

        setMissionStats({
          missioniTotaliApprovate: approvate.length,
          missioniMeseApprovate: approvateMese.length,
          ultimaMissioneData: approvate.length > 0 ? approvate[0].data_creazione : null
        })

      } catch (e) {
        console.error('Errore load Stats:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [profile?.id, profile?.mese_corrente_key])

  // --- AZIONI ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) { toast.success('Logout effettuato'); navigate('/login') }
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
      toast.error('Errore durante l\'upload')
    }
  }

  const handleSave = async (e) => {
    e?.preventDefault()
    setSaving(true)
    try {
      const payload = {
        nome: formData.nome?.trim() || null, cognome: formData.cognome?.trim() || null,
        nickname: formData.nickname?.trim() || null, citta: formData.citta?.trim() || null,
        sesso: formData.sesso || null, biografia: formData.biografia?.trim() || null,
        instagram_url: formData.instagram_url?.trim() || null, facebook_url: formData.facebook_url?.trim() || null,
        youtube_url: formData.youtube_url?.trim() || null, tiktok_url: formData.tiktok_url?.trim() || null,
        telefono: formData.telefono?.trim() || null, paese: formData.paese?.trim() || null,
        via: formData.via?.trim() || null, cap: formData.cap?.trim() || null, civico: formData.civico?.trim() || null,
        ultima_attivita: new Date().toISOString()
      }
      const { error } = await supabase.from('utenti').update(payload).eq('id', profile.id)
      if (error) throw error
      toast.success('Profilo aggiornato!')
      await refreshProfile()
      setEditing(false)
    } catch (error) {
      toast.error('Errore aggiornamento profilo')
    } finally {
      setSaving(false)
    }
  }

  // Navigazione Legacy:
  const handleMarketClick = async () => {
    try { const audio = new Audio('/Sound_market/store-entrance.mp3'); await audio.play(); } catch (err) { }
    navigate('/shop')
  }
  const handleEventiClick = () => navigate('/eventi')
  const handlePassportClick = () => {
    setShowPassport(!showPassport)
    setTimeout(() => infoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
  }

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Desideri di Puglia', text: 'Scopri le bellezze della Puglia con me su Desideri di Puglia! Scarica l\'app.', url: window.location.origin })
      else { await navigator.clipboard.writeText(window.location.origin); toast.success('Link copiato!') }
    } catch (e) { }
  }

  const handleResetPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${window.location.origin}/reset-password` })
    if (!error) { toast.success('Email di reset inviata!'); setShowPasswordModal(false) }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'elimina') return toast.error('Scrivi "elimina"')
    setDeletingAccount(true)
    try {
      await supabase.from('user_cards').delete().eq('user_id', profile.id)
      await supabase.from('utenti').delete().eq('id', profile.id)
      await supabase.auth.signOut(); localStorage.clear(); sessionStorage.clear()
      toast.success('Account eliminato'); navigate('/login')
    } catch (err) { toast.error('Errore eliminazione account') }
    finally { setDeletingAccount(false) }
  }

  const handleModeSwitch = (target) => {
    setModeTransition({ active: true, target, flip: false })
    setTimeout(() => setModeTransition((prev) => ({ ...prev, flip: true })), 1500)
    setTimeout(() => navigate(target === 'partner' ? '/partner/dashboard' : '/dashboard'), 3000)
  }

  const displayName = profile?.nome && profile?.cognome ? `${profile.nome} ${profile.cognome}` : profile?.nickname || profile?.email?.split('@')[0] || 'Esploratore'
  const initials = (profile?.nome?.[0] || profile?.nickname?.[0] || '?').toUpperCase()
  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'

  return (
    <div className="min-h-[100dvh] bg-[#f9f9f7] font-sans pb-32">

      {/* ── HERO ── */}
      <div className="relative w-full bg-zinc-950 pt-12 pb-16 px-6 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-orange-400/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -right-20 w-56 h-56 bg-emerald-400/10 rounded-full blur-[60px]" />
        </div>

        <div className="w-full flex justify-between items-center absolute top-4 px-4 z-20">
          {isAdmin ? (
            <Link to="/admin" className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold tracking-widest text-white backdrop-blur-md active:scale-95 transition">ADMIN</Link>
          ) : <div />}
          <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition hover:bg-rose-500/80 hover:border-rose-500">
            <SignOut weight="bold" className="w-4 h-4 ml-0.5" />
          </button>
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
          {partner && <button onClick={() => handleModeSwitch('partner')} className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-[10px] font-bold text-amber-300 uppercase tracking-widest active:scale-95 transition">Partner HUB</button>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-30 space-y-4">

        {/* ── BENTO STATS (Nuove) ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white border border-zinc-200/60 p-4 shadow-sm text-center flex flex-col justify-center">
            <CardsThree weight="duotone" className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="text-2xl font-bold font-mono tracking-tighter text-zinc-950 mt-2">{loading ? '...' : stats.cards}</p>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">Card</p>
          </div>
          <div className="rounded-2xl bg-white border border-zinc-200/60 p-4 shadow-sm text-center flex flex-col justify-center">
            <Path weight="duotone" className="w-6 h-6 text-blue-500 mx-auto" />
            <p className="text-2xl font-bold font-mono tracking-tighter text-zinc-950 mt-2">{loading ? '...' : stats.km}</p>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">Km</p>
          </div>
          <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 shadow-sm text-center flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent pointer-events-none" />
            <Medal weight="duotone" className="w-6 h-6 text-orange-400 mx-auto relative z-10" />
            <p className="text-2xl font-bold font-mono tracking-tighter text-white mt-2 relative z-10">{loading ? '...' : stats.xp}</p>
            <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider mt-0.5 relative z-10">XP</p>
          </div>
        </div>

        {/* ── APP SHORTCUTS (Vecchie Funzioni Ripristinate) ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ShortcutCard icon={<Storefront weight="duotone" />} color="text-violet-500" bg="bg-violet-50" title="Mercato" desc="Acquista gadget" onClick={handleMarketClick} />
          <ShortcutCard icon={<CalendarStar weight="duotone" />} color="text-rose-500" bg="bg-rose-50" title="Eventi" desc="Serate in Puglia" onClick={handleEventiClick} />
          <ShortcutCard icon={<Package weight="duotone" />} color="text-amber-500" bg="bg-amber-50" title="Ordini" desc="I tuoi acquisti" onClick={() => navigate('/orders')} />
          <ShortcutCard icon={<Sparkle weight="duotone" />} color="text-emerald-500" bg="bg-emerald-50" title="Booking" desc="Desideri di Puglia" onClick={() => navigate('/desideridipugliabad')} />
          <ShortcutCard icon={<Headset weight="duotone" />} color="text-blue-500" bg="bg-blue-50" title="Assistenza" desc="Supporto 24/7" onClick={() => navigate('/contatti')} />
          <ShortcutCard
            icon={<IdentificationBadge weight={showPassport ? "fill" : "duotone"} />}
            color={showPassport ? "text-zinc-900" : "text-zinc-500"}
            bg={showPassport ? "bg-zinc-200" : "bg-zinc-100"}
            title="Passaporto" desc="Il tuo ID"
            onClick={handlePassportClick}
          />
        </div>

        {/* ── SEZIONE PASSAPORTO ESPANSA (Dati & Modifica) ── */}
        {showPassport && (
          <div ref={infoSectionRef} className="rounded-3xl bg-white border border-zinc-200/60 p-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold text-zinc-950 flex items-center gap-2"><IdentificationCard weight="duotone" className="w-5 h-5 text-zinc-400" /> Dati Passaporto</h2>
              <button onClick={() => setEditing(!editing)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition">
                {editing ? <X weight="bold" /> : <PencilSimple weight="bold" />}
              </button>
            </div>

            {/* Mission Stats (Legacy) */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
              <StatBadge label="Missioni Approvate" value={missionStats.missioniTotaliApprovate} />
              <StatBadge label="Fatte sto mese" value={missionStats.missioniMeseApprovate} />
              <StatBadge label="Ultima missione" value={formatDate(missionStats.ultimaMissioneData)} />
            </div>

            {!editing ? (
              <div className="space-y-3">
                <ProfileRow label="Nome" value={`${profile?.nome || ''} ${profile?.cognome || ''}`.trim() || '—'} />
                <ProfileRow label="Nickname" value={profile?.nickname || '—'} />
                <ProfileRow label="Email" value={profile?.email || '—'} />
                <ProfileRow label="Città" value={profile?.citta || '—'} />
                <ProfileRow label="Telefono" value={profile?.telefono || '—'} />
                <ProfileRow label="Indirizzo" value={`${profile?.via || ''} ${profile?.civico || ''}, ${profile?.cap || ''} ${profile?.citta || ''}`} />
                {profile?.biografia && <ProfileRow label="Bio" value={profile.biografia} />}
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Nome" value={formData.nome} onChange={v => setFormData({ ...formData, nome: v })} />
                  <FormField label="Cognome" value={formData.cognome} onChange={v => setFormData({ ...formData, cognome: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Nickname" value={formData.nickname} onChange={v => setFormData({ ...formData, nickname: v })} />
                  <FormField label="Telefono" value={formData.telefono} type="tel" onChange={v => setFormData({ ...formData, telefono: v })} />
                </div>
                <FormField label="Indirizzo (Via)" value={formData.via} onChange={v => setFormData({ ...formData, via: v })} />
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1"><FormField label="Civico" value={formData.civico} onChange={v => setFormData({ ...formData, civico: v })} /></div>
                  <div className="col-span-1"><FormField label="CAP" value={formData.cap} onChange={v => setFormData({ ...formData, cap: v })} /></div>
                  <div className="col-span-1"><FormField label="Città" value={formData.citta} onChange={v => setFormData({ ...formData, citta: v })} /></div>
                </div>
                <FormField label="Biografia" value={formData.biografia} multiline onChange={v => setFormData({ ...formData, biografia: v })} />

                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-6 mb-2 border-b border-zinc-100 pb-2">Social Network</h3>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Instagram" value={formData.instagram_url} icon={<InstagramLogo />} onChange={v => setFormData({ ...formData, instagram_url: v })} />
                  <FormField label="TikTok" value={formData.tiktok_url} icon={<TiktokLogo />} onChange={v => setFormData({ ...formData, tiktok_url: v })} />
                  <FormField label="Facebook" value={formData.facebook_url} icon={<FacebookLogo />} onChange={v => setFormData({ ...formData, facebook_url: v })} />
                  <FormField label="YouTube" value={formData.youtube_url} icon={<YoutubeLogo />} onChange={v => setFormData({ ...formData, youtube_url: v })} />
                </div>

                <button disabled={saving} className="w-full mt-2 py-3.5 rounded-xl bg-zinc-950 text-white text-[13px] font-bold shadow-md active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  <FloppyDisk weight="bold" className="w-4 h-4" /> {saving ? 'Salvataggio...' : 'Salva Passaporto'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── INVITA AMICO ── */}
        <button onClick={handleShare} className="w-full rounded-2xl bg-zinc-950 text-white p-4 flex items-center justify-between shadow-md hover:shadow-lg active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><ShareNetwork weight="fill" className="w-5 h-5 text-white" /></div>
            <div className="text-left">
              <p className="text-[14px] font-bold tracking-tight">Invita un Amico</p>
              <p className="text-[11px] text-white/50">Condividi la tua Sagha pugliese</p>
            </div>
          </div>
          <ArrowRight weight="bold" className="w-4 h-4 text-white/30" />
        </button>

        {/* ── SICUREZZA & LEGAL ── */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white border border-zinc-200/60 p-2 shadow-sm">
            <ActionRow icon={<Lock weight="duotone" />} color="text-zinc-600" label="Reimposta Password" onClick={() => setShowPasswordModal(true)} />
            <ActionRow icon={<ShieldCheck weight="duotone" />} color="text-zinc-600" label="Privacy e Termini" onClick={() => setShowPrivacyModal(true)} />
          </div>
          <div className="rounded-2xl bg-rose-50 border border-rose-200/60 p-2">
            <ActionRow icon={<Warning weight="fill" />} color="text-rose-600" label="Elimina Account" onClick={() => setShowDeleteModal(true)} />
          </div>
        </div>

      </div>

      {/* ════ MODALI ════ */}
      <BottomModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Reset Password">
        <p className="text-[12px] text-zinc-500 mb-5 leading-relaxed">Riceverai un'email all'indirizzo <strong className="text-zinc-800">{profile?.email}</strong> con il link per scegliere una nuova password.</p>
        <button onClick={handleResetPassword} className="w-full py-3 rounded-xl bg-zinc-950 text-white text-[13px] font-bold active:scale-95 transition">Invia Modulo Reset</button>
      </BottomModal>

      <BottomModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="Privacy & Termini">
        <div className="text-[12px] text-zinc-600 space-y-3 max-h-[50vh] overflow-y-auto pr-2 pb-4 -mr-2">
          <p><strong>Desideri di Puglia CSRL</strong> - Trattiamo i dati nel rispetto del GDPR (UE 2016/679) per l'erogazione dei servizi legati al Club e alle esperienze territoriali.</p>
          <p>I dati utente, posizione GPS e cards sbloccate sono protetti crittograficamente in Supabase. Non vendiamo dati a terzi. Cliccando su mercati e partner, acconsenti al redirect ai loro portali in formato WebView.</p>
          <button onClick={() => setShowTermsModal(true)} className="mt-2 text-zinc-950 font-bold underline">Leggi tutti i Termini di Servizio completi</button>
        </div>
      </BottomModal>

      <BottomModal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirmText('') }} title={<span className="text-rose-600 flex items-center gap-2"><Warning weight="fill" /> Danger Zone</span>}>
        <p className="text-[12px] text-zinc-600 mb-4 leading-relaxed">Eliminando l'account perderai per sempre le card sbloccate, gli XP e il ranking nel Club. L'azione non è reversibile.</p>
        <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder='Scrivi "elimina" per confermare' className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl mb-4 text-[13px] outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400" />
        <button onClick={handleDeleteAccount} disabled={deletingAccount || deleteConfirmText.trim().toLowerCase() !== 'elimina'} className="w-full py-3 rounded-xl bg-rose-600 text-white text-[13px] font-bold disabled:opacity-40 active:scale-95 transition">Conferma Eliminazione</button>
      </BottomModal>

      {/* Animazione Transizione Partner */}
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

// ──────────────── HOC & MINI COMPONENTS ────────────────
function ShortcutCard({ icon, color, bg, title, desc, onClick }) {
  return (
    <button onClick={onClick} className="rounded-2xl bg-white border border-zinc-200/60 p-3.5 shadow-sm hover:shadow-md hover:border-zinc-300 active:scale-[0.98] transition-all text-left flex flex-col gap-2">
      <div className={`w-8 h-8 rounded-full ${bg} ${color} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-[12px] font-bold text-zinc-900 leading-tight">{title}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{desc}</p>
      </div>
    </button>
  )
}

function StatBadge({ label, value }) {
  return (
    <div className="flex-shrink-0 bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 flex flex-col justify-center min-w-[90px]">
      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
      <p className="text-[14px] font-bold text-zinc-900 mt-0.5 font-mono">{value}</p>
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

function BottomModal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-zinc-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-bold text-zinc-950">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200"><X weight="bold" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}