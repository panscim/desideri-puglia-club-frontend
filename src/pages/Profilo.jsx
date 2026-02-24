// src/pages/Profilo.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'

import {
  UserCircle,
  PencilSimple,
  SignOut,
  ShareNetwork,
  ShieldCheck,
  Trash,
  Lock,
  MapPin,
  Medal,
  Path,
  Books,
  X,
  CardsThree,
  Compass,
  Key,
  ArrowRight,
  Warning,
  Camera,
  FloppyDisk,
} from '@phosphor-icons/react'

// ─────────────────── SKELETON ───────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-zinc-200/60 rounded-xl ${className}`} />
)

// ─────────────────── MODAL ───────────────────
const Modal = ({ open, onClose, children }) => {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// ─────────────────── MAIN COMPONENT ───────────────────
export default function Profilo() {
  const navigate = useNavigate()
  const { profile, refreshProfile, isAdmin } = useAuth()

  const [statsLoading, setStatsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [partner, setPartner] = useState(null)

  // Stats
  const [stats, setStats] = useState({ cards: 0, km: 0, xp: 0 })

  // Form
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    nickname: '',
    citta: '',
    biografia: '',
  })

  // Modali
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordSending, setPasswordSending] = useState(false)

  // ── Load Data ──
  useEffect(() => {
    if (!profile?.id) return
    setFormData({
      nome: profile.nome || '',
      cognome: profile.cognome || '',
      nickname: profile.nickname || '',
      citta: profile.citta || '',
      biografia: profile.biografia || '',
    })

    const loadStats = async () => {
      try {
        setStatsLoading(true)
        const [cardsRes, partnerRes] = await Promise.all([
          supabase.from('user_cards').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
          supabase.from('partners').select('id,name').eq('owner_user_id', profile.id).maybeSingle(),
        ])
        const cardCount = cardsRes.count ?? 0
        const xp = cardCount * 50 // 50 XP per card sbloccata
        const km = Math.round(cardCount * 2.3)   // stima km percorsi
        setStats({ cards: cardCount, km, xp })
        setPartner(partnerRes.data || null)
      } catch (e) {
        console.error('Errore loadStats:', e)
      } finally {
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [profile?.id])

  // ── Logout ──
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) { toast.error('Errore durante il logout'); return }
    toast.success('Logout effettuato')
    navigate('/login')
  }

  // ── Avatar upload ──
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Formato immagine non valido'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Immagine troppo grande (max 5MB)'); return }
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${profile.id}/avatar-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const { error: updateError } = await supabase.from('utenti').update({ avatar_url: data?.publicUrl }).eq('id', profile.id)
      if (updateError) throw updateError
      toast.success('Foto aggiornata!')
      await refreshProfile()
    } catch (err) {
      toast.error('Errore durante l\'upload')
      console.error(err)
    }
  }

  // ── Save profile ──
  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('utenti').update({
        nome: formData.nome?.trim() || null,
        cognome: formData.cognome?.trim() || null,
        nickname: formData.nickname?.trim() || null,
        citta: formData.citta?.trim() || null,
        biografia: formData.biografia?.trim() || null,
        ultima_attivita: new Date().toISOString(),
      }).eq('id', profile.id)
      if (error) throw error
      toast.success('Profilo aggiornato!')
      await refreshProfile()
      setEditing(false)
    } catch (err) {
      toast.error(err.message || 'Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  // ── Reset Password ──
  const handleResetPassword = async () => {
    if (!profile?.email) { toast.error('Email non trovata'); return }
    setPasswordSending(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast.success('Email di reset inviata! Controlla la tua casella.')
      setShowPasswordModal(false)
    } catch (err) {
      toast.error(err.message || 'Errore invio email')
    } finally {
      setPasswordSending(false)
    }
  }

  // ── Share App ──
  const handleShare = async () => {
    const shareData = {
      title: 'Desideri di Puglia',
      text: 'Scopri le bellezze della Puglia con me su Desideri di Puglia! Entra nel Club e sblocca le esperienze più belle del Sud Italia.',
      url: 'https://desideri-puglia-club-frontend.vercel.app',
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareData.url)
        toast.success('Link copiato!')
      }
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('Errore nella condivisione')
    }
  }

  // ── Delete Account ──
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'elimina') {
      toast.error('Scrivi "elimina" per confermare')
      return
    }
    setDeletingAccount(true)
    try {
      // 1. Delete user data
      await supabase.from('user_cards').delete().eq('user_id', profile.id)
      await supabase.from('utenti').delete().eq('id', profile.id)
      // 2. Sign out auth session
      await supabase.auth.signOut()
      // 3. Clear local storage
      localStorage.clear()
      sessionStorage.clear()
      toast.success('Account eliminato.')
      navigate('/login')
    } catch (err) {
      console.error('Errore eliminazione account:', err)
      toast.error('Errore durante l\'eliminazione. Contatta il supporto.')
    } finally {
      setDeletingAccount(false)
    }
  }

  const displayName = profile?.nome && profile?.cognome
    ? `${profile.nome} ${profile.cognome}`
    : profile?.nickname || profile?.email?.split('@')[0] || 'Esploratore'

  const initials = (profile?.nome?.[0] || profile?.nickname?.[0] || '?').toUpperCase()

  // ─────────────────── RENDER ───────────────────
  return (
    <div className="min-h-[100dvh] bg-[#f9f9f7] font-sans pb-24">

      {/* ── HERO / AVATAR ── */}
      <div className="relative w-full bg-zinc-950 pt-14 pb-20 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Blob sfondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-orange-400/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-10 -right-20 w-56 h-56 bg-emerald-400/10 rounded-full blur-[60px]" />
        </div>

        {/* Avatar */}
        <label className="relative cursor-pointer group z-10 mb-4">
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div className="w-24 h-24 rounded-full border-2 border-white/20 overflow-hidden shadow-xl bg-zinc-800 flex items-center justify-center text-3xl font-bold text-white/70 group-hover:opacity-80 transition">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md border border-white/30">
            <Camera weight="fill" className="w-3.5 h-3.5 text-zinc-800" />
          </div>
        </label>

        <h1 className="text-[22px] font-bold text-white tracking-tight z-10">{displayName}</h1>
        <p className="text-[12px] text-white/50 mt-1 z-10 flex items-center gap-1">
          <MapPin weight="fill" className="w-3 h-3" />
          {profile?.citta || 'Puglia, Italia'}
        </p>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-3 z-10">
          {isAdmin && (
            <span className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-[10px] font-bold text-violet-300 uppercase tracking-widest">Admin</span>
          )}
          {partner && (
            <button onClick={() => navigate('/partner/dashboard')} className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-[10px] font-bold text-amber-300 uppercase tracking-widest active:scale-95 transition">Partner · {partner.name}</button>
          )}
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-widest">Club Member</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 space-y-4">

        {/* ── BENTO STATS ── */}
        <section className="grid grid-cols-3 gap-3">
          {statsLoading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : (
            <>
              <div className="rounded-2xl bg-white border border-zinc-200/60 p-4 flex flex-col justify-between shadow-sm text-center">
                <CardsThree weight="duotone" className="w-5 h-5 text-emerald-500 mx-auto" />
                <div className="mt-3">
                  <p className="text-2xl font-bold font-mono tracking-tighter text-zinc-950">{stats.cards}</p>
                  <p className="text-[10px] font-medium text-zinc-500 mt-0.5">Card Sbloccate</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white border border-zinc-200/60 p-4 flex flex-col justify-between shadow-sm text-center">
                <Path weight="duotone" className="w-5 h-5 text-blue-500 mx-auto" />
                <div className="mt-3">
                  <p className="text-2xl font-bold font-mono tracking-tighter text-zinc-950">{stats.km}</p>
                  <p className="text-[10px] font-medium text-zinc-500 mt-0.5">Km Percorsi</p>
                </div>
              </div>
              <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 flex flex-col justify-between shadow-sm text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
                <Medal weight="duotone" className="w-5 h-5 text-orange-400 mx-auto relative z-10" />
                <div className="mt-3 relative z-10">
                  <p className="text-2xl font-bold font-mono tracking-tighter text-white">{stats.xp}</p>
                  <p className="text-[10px] font-medium text-white/50 mt-0.5">Punti XP</p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── INVITA UN AMICO ── */}
        <button
          onClick={handleShare}
          className="w-full rounded-2xl bg-zinc-950 text-white p-4 flex items-center justify-between shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <ShareNetwork weight="fill" className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold leading-tight">Invita un Amico</p>
              <p className="text-[11px] text-white/50">Condividi il Club con chi ami la Puglia</p>
            </div>
          </div>
          <ArrowRight weight="bold" className="w-4 h-4 text-white/30" />
        </button>

        {/* ── MODIFICA PROFILO ── */}
        <section className="rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-zinc-950 tracking-tight flex items-center gap-2">
              <UserCircle weight="duotone" className="w-4.5 h-4.5 text-zinc-400" /> Il tuo Profilo
            </h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-200 transition"
              >
                <PencilSimple weight="bold" className="w-3 h-3" />
                Modifica
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)} className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center hover:bg-zinc-200 transition">
                  <X weight="bold" className="w-3 h-3 text-zinc-500" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950 text-white text-[11px] font-semibold disabled:opacity-50 active:scale-95 transition"
                >
                  <FloppyDisk weight="bold" className="w-3 h-3" />
                  {saving ? 'Salvo...' : 'Salva'}
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <div className="space-y-2.5">
              <ProfileRow label="Nome" value={`${profile?.nome || ''} ${profile?.cognome || ''}`.trim() || '—'} />
              <ProfileRow label="Nickname" value={profile?.nickname || '—'} />
              <ProfileRow label="Email" value={profile?.email || '—'} />
              <ProfileRow label="Città" value={profile?.citta || '—'} />
              {profile?.biografia && <ProfileRow label="Bio" value={profile.biografia} />}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Nome" value={formData.nome} onChange={(v) => setFormData({ ...formData, nome: v })} />
                <FormField label="Cognome" value={formData.cognome} onChange={(v) => setFormData({ ...formData, cognome: v })} />
              </div>
              <FormField label="Nickname" value={formData.nickname} onChange={(v) => setFormData({ ...formData, nickname: v })} />
              <FormField label="Città" value={formData.citta} onChange={(v) => setFormData({ ...formData, citta: v })} />
              <FormField label="Biografia" value={formData.biografia} onChange={(v) => setFormData({ ...formData, biografia: v })} multiline />
            </div>
          )}
        </section>

        {/* ── HOW-TO EDUCATIONAL ── */}
        <section className="rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm">
          <h2 className="text-[14px] font-bold text-zinc-950 tracking-tight mb-4 flex items-center gap-2">
            <Books weight="duotone" className="w-4.5 h-4.5 text-zinc-400" /> Come Funziona il Club
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <HowToCard
              icon={<Compass weight="duotone" className="w-6 h-6 text-blue-500" />}
              title="Sblocco GPS"
              desc="Avvicinati a un monumento entro 50m e sblocca la tua Card esclusiva."
            />
            <HowToCard
              icon={<Key weight="duotone" className="w-6 h-6 text-amber-500" />}
              title="PIN Partner"
              desc="Visita un locale partner, chiedi il codice segreto e riscatta la tua ricompensa."
            />
            <HowToCard
              icon={<CardsThree weight="duotone" className="w-6 h-6 text-emerald-500" />}
              title="L'Album dei Ricordi"
              desc="Ogni Card sbloccata va nell'Album. Completa i Set per sbloccare premi rari."
            />
          </div>
          <div className="mt-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              <strong className="text-zinc-700">Come funzionano i Set (Saghe)?</strong> Le Saghe sono percorsi tematici in Puglia. Ogni Saga ha una serie di card collezionabili collegate a luoghi storici, gastronomici o artistici. Completando una Saga intera sblocchi una Card Rara esclusiva. I Partner del Club sono attività locali selezionate che partecipano al circuito: ristoranti, cantine, musei, esperienze. Visitandoli ottieni Card bonus.
            </p>
          </div>
        </section>

        {/* ── SICUREZZA & ACCESSO ── */}
        <section className="rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm">
          <h2 className="text-[14px] font-bold text-zinc-950 tracking-tight mb-4 flex items-center gap-2">
            <ShieldCheck weight="duotone" className="w-4.5 h-4.5 text-zinc-400" /> Sicurezza & Accesso
          </h2>
          <div className="space-y-2">
            <ActionRow
              icon={<Lock weight="duotone" className="w-5 h-5 text-zinc-500" />}
              label="Reimposta Password"
              sublabel="Invia email di reset al tuo indirizzo"
              onClick={() => setShowPasswordModal(true)}
            />
            <ActionRow
              icon={<SignOut weight="duotone" className="w-5 h-5 text-zinc-500" />}
              label="Esci dall'account"
              sublabel="Logout immediato dal Club"
              onClick={handleLogout}
            />
          </div>
        </section>

        {/* ── LEGAL & COMPLIANCE ── */}
        <section className="rounded-2xl bg-white border border-zinc-200/60 p-5 shadow-sm">
          <h2 className="text-[14px] font-bold text-zinc-950 tracking-tight mb-4 flex items-center gap-2">
            <ShieldCheck weight="duotone" className="w-4.5 h-4.5 text-zinc-400" /> Legale & Privacy
          </h2>
          <div className="space-y-2">
            <ActionRow icon={<Books weight="duotone" className="w-5 h-5 text-zinc-500" />} label="Informativa Privacy (GDPR)" sublabel="Leggi come trattiamo i tuoi dati" onClick={() => setShowPrivacyModal(true)} />
            <ActionRow icon={<Books weight="duotone" className="w-5 h-5 text-zinc-500" />} label="Termini e Condizioni" sublabel="Regolamento del Club" onClick={() => setShowTermsModal(true)} />
          </div>
        </section>

        {/* ── ZONA PERICOLO ── */}
        <section className="rounded-2xl bg-rose-50 border border-rose-200/60 p-5">
          <h2 className="text-[13px] font-bold text-rose-700 tracking-tight mb-1 flex items-center gap-2">
            <Warning weight="fill" className="w-4 h-4" /> Zona Pericolo
          </h2>
          <p className="text-[11px] text-rose-500 mb-4 leading-relaxed">
            L'eliminazione dell'account è permanente e irreversibile. Tutti i tuoi dati, le card sbloccate e il tuo progressso verranno cancellati definitivamente.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 rounded-xl bg-rose-600 text-white text-[13px] font-bold shadow-sm hover:bg-rose-700 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Trash weight="bold" className="w-4 h-4" />
            Elimina Account
          </button>
        </section>

      </div>

      {/* ════════ MODALI ════════ */}

      {/* Privacy Modal */}
      <Modal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-[16px] font-bold text-zinc-950">Informativa Privacy</h3>
          <button onClick={() => setShowPrivacyModal(false)} className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center"><X weight="bold" className="w-3.5 h-3.5" /></button>
        </div>
        <div className="text-[12px] text-zinc-600 leading-relaxed space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          <p><strong>Titolare del trattamento:</strong> Desideri di Puglia Club — contatti: info@desideridipuglia.it</p>
          <p><strong>Dati trattati:</strong> Nome, email, avatar, posizione GPS (solo durante l'utilizzo attivo dell'app), cards sbloccate, preferenze di onboarding.</p>
          <p><strong>Finalità:</strong> Erogazione del servizio di gamification turistica, invio di comunicazioni transazionali (reset password, notifiche di sblocco).</p>
          <p><strong>Base giuridica (GDPR art. 6):</strong> Esecuzione del contratto (art. 6, comma 1, lett. b) per le funzionalità core; legittimo interesse (art. 6, comma 1, lett. f) per l'analisi aggregata dell'esperienza utente.</p>
          <p><strong>Conservazione:</strong> I dati sono conservati finché l'account è attivo. Dopo la cancellazione, i dati vengono rimossi entro 30 giorni.</p>
          <p><strong>Diritti dell'interessato:</strong> Hai diritto di accesso, rettifica, cancellazione, portabilità e opposizione. Puoi esercitarli scrivendo a info@desideridipuglia.it</p>
          <p><strong>Geolocalizzazione:</strong> Il GPS viene richiesto solo in-app per verificare la prossimità ai punti di interesse. Non viene tracciata in background.</p>
        </div>
      </Modal>

      {/* Terms Modal */}
      <Modal open={showTermsModal} onClose={() => setShowTermsModal(false)}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-[16px] font-bold text-zinc-950">Termini e Condizioni</h3>
          <button onClick={() => setShowTermsModal(false)} className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center"><X weight="bold" className="w-3.5 h-3.5" /></button>
        </div>
        <div className="text-[12px] text-zinc-600 leading-relaxed space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          <p><strong>Cos'è il Club:</strong> Desideri di Puglia è un'esperienza di gamification turistica che permette agli utenti di scoprire, visitare e collezionare esperienze legate al territorio pugliese.</p>
          <p><strong>Registrazione:</strong> L'iscrizione è gratuita. Per usufruire di alcune funzionalità (sblocco card GPS, eventi partner) è necessario avere un account attivo.</p>
          <p><strong>Card e Progressi:</strong> Le card sbloccate, i punti XP e i progressi nelle Saghe sono legati all'account personale e non trasferibili.</p>
          <p><strong>Partner del Club:</strong> I Partner sono attività locali aderenti in modo autonomo al circuito. Desideri di Puglia non è responsabile dell'offerta commerciale dei singoli partner.</p>
          <p><strong>Comportamento:</strong> È vietato l'utilizzo di sistemi automatizzati per lo sblocco fraudolento di card. L'accesso fraudolento comporta la cancellazione dell'account.</p>
          <p><strong>Modifiche:</strong> Ci riserviamo il diritto di aggiornare le presenti condizioni. Gli utenti verranno notificati via email con almeno 7 giorni di preavviso.</p>
          <p><strong>Legge applicabile:</strong> I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia sarà competente il Foro di Bari.</p>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-[16px] font-bold text-zinc-950">Reimposta Password</h3>
          <button onClick={() => setShowPasswordModal(false)} className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center"><X weight="bold" className="w-3.5 h-3.5" /></button>
        </div>
        <p className="text-[13px] text-zinc-500 mb-5 leading-relaxed">
          Ti invieremo un'email all'indirizzo <strong className="text-zinc-800">{profile?.email}</strong> con un link per reimpostare la password.
        </p>
        <button
          onClick={handleResetPassword}
          disabled={passwordSending}
          className="w-full py-3 rounded-xl bg-zinc-950 text-white text-[13px] font-bold active:scale-95 transition disabled:opacity-50"
        >
          {passwordSending ? 'Invio in corso...' : 'Invia Email di Reset'}
        </button>
      </Modal>

      {/* Delete Account Modal */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
            <Warning weight="fill" className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="text-[16px] font-bold text-zinc-950">Elimina Account</h3>
        </div>
        <p className="text-[12px] text-zinc-500 mb-4 leading-relaxed">
          Questa azione è <strong className="text-rose-600">permanente e irreversibile</strong>. Verranno eliminati tutti i tuoi dati, le card sbloccate e il tuo profilo dal Club.
        </p>
        <p className="text-[12px] font-medium text-zinc-700 mb-2">Scrivi <strong>"elimina"</strong> per confermare:</p>
        <input
          type="text"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder='Scrivi "elimina"'
          className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-[13px] mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 bg-zinc-50"
        />
        <div className="flex gap-3">
          <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }} className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-[13px] font-medium text-zinc-600 hover:bg-zinc-50 transition">
            Annulla
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={deletingAccount || deleteConfirmText.trim().toLowerCase() !== 'elimina'}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-[13px] font-bold disabled:opacity-40 active:scale-95 transition"
          >
            {deletingAccount ? 'Eliminazione...' : 'Elimina'}
          </button>
        </div>
      </Modal>

    </div>
  )
}

// ─────────────────── HELPERS ───────────────────
function ProfileRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-zinc-50 last:border-0">
      <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider flex-shrink-0">{label}</span>
      <span className="text-[13px] text-zinc-900 font-medium text-right break-words max-w-[65%]">{value}</span>
    </div>
  )
}

function FormField({ label, value, onChange, multiline }) {
  const cls = "w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 transition resize-none"
  return (
    <div>
      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{label}</label>
      {multiline
        ? <textarea rows={2} className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className={cls} value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  )
}

function ActionRow({ icon, label, sublabel, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-zinc-50 active:scale-[0.98] transition text-left group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center group-hover:border-zinc-200 transition">
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-zinc-900">{label}</p>
          {sublabel && <p className="text-[11px] text-zinc-400">{sublabel}</p>}
        </div>
      </div>
      <ArrowRight weight="bold" className="w-4 h-4 text-zinc-300 flex-shrink-0" />
    </button>
  )
}

function HowToCard({ icon, title, desc }) {
  return (
    <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 flex flex-col gap-3 hover:bg-zinc-100/60 transition">
      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[12px] font-bold text-zinc-900">{title}</p>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}