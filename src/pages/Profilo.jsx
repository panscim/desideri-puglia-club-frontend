// src/pages/Profilo.jsx
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'

import {
  Edit,
  Save,
  X,
  Settings,
  LogOut,
  Instagram,
  Facebook,
  Youtube,
  Link as LinkIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const Profilo = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile, refreshProfile, isAdmin } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  // Partner collegato all'utente (se esiste)
  const [partner, setPartner] = useState(null)

  // Stato per l’animazione di cambio modalità (flip tra le due icone)
  const [modeTransition, setModeTransition] = useState({
    active: false,
    target: null,
    flip: false
  })

  // Ref per scroll alle info personali (Passaporto)
  const infoSectionRef = useRef(null)

  // Stato: passaporto aperto/chiuso
  const [showPassport, setShowPassport] = useState(false)

  // Stato form
  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    cognome: profile?.cognome || '',
    nickname: profile?.nickname || '',
    citta: profile?.citta || '',
    sesso: profile?.sesso || '',
    biografia: profile?.biografia || '',
    instagram_url: profile?.instagram_url || '',
    facebook_url: profile?.facebook_url || '',
    tiktok_url: profile?.tiktok_url || '',
    youtube_url: profile?.youtube_url || '',
    telefono: profile?.telefono || '',
    paese: profile?.paese || '',
    via: profile?.via || '',
    cap: profile?.cap || '',
    civico: profile?.civico || ''
  })

  // Stats calcolate
  const [missionStats, setMissionStats] = useState({
    missioniTotaliApprovate: 0,
    missioniMeseApprovate: 0,
    puntiTotaliMissioni: 0,
    puntiMeseMissioni: 0,
    ultimaMissioneData: null
  })



  // Card stile “Airbnb”: bianca, ombra morbida
  const headerCardClasses =
    'card relative overflow-hidden bg-white text-olive-dark'

  // Carica Partner collegato + stats missioni quando cambia il profilo
  useEffect(() => {
    if (!profile?.id) return

    const loadPartner = async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id,name')
        .eq('owner_user_id', profile.id)
        .maybeSingle()

      if (error) {
        console.error('Errore caricamento partner', error)
        return
      }
      setPartner(data || null)
    }

    const loadMissionStats = async () => {
      try {
        const { data, error } = await supabase
          .from('missioni_inviate')
          .select('stato, data_creazione, period_key')
          .eq('id_utente', profile.id)
          .order('data_creazione', { ascending: false })

        if (error) {
          console.error('Errore caricamento missioni_inviate', error)
          return
        }

        const approvate = (data || []).filter(
          (row) => row.stato === 'Approvata'
        )

        const missioniTotaliApprovate = approvate.length

        const meseKey =
          profile.mese_corrente_key || new Date().toISOString().slice(0, 7)

        const approvateMese = approvate.filter(
          (row) => row.period_key && row.period_key.slice(0, 7) === meseKey
        )

        const missioniMeseApprovate = approvateMese.length

        const ultimaMissioneData =
          approvate.length > 0 ? approvate[0].data_creazione : null

        setMissionStats({
          missioniTotaliApprovate,
          missioniMeseApprovate,
          ultimaMissioneData
        })
      } catch (e) {
        console.error('Errore elaborazione missionStats', e)
      }
    }

    loadPartner()
    loadMissionStats()
  }, [profile?.id, profile?.mese_corrente_key])

  // Logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Errore durante il logout')
      return
    }
    toast.success(t('auth.logout_success') || 'Logout effettuato')
    navigate('/login')
  }

  // Switch modalità con animazione flip
  const handleModeSwitch = (target) => {
    if (!target || modeTransition.active) return

    // Se l'utente non ha un partner collegato, non facciamo nulla
    if (target === 'partner' && !partner) return

    // Avviamo overlay + stato iniziale (icona di partenza visibile)
    setModeTransition({ active: true, target, flip: false })

    // Dopo un attimo facciamo il flip (sparisce la prima icona, appare la seconda)
    setTimeout(() => {
      setModeTransition((prev) => ({ ...prev, flip: true }))
    }, 1500)

    // Poi navighiamo nella modalità scelta
    setTimeout(() => {
      if (target === 'partner') {
        navigate('/partner/dashboard')
      } else {
        navigate('/dashboard')
      }
    }, 3000)
  }

  // Upload avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.avatar_error'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L’immagine deve essere più piccola di 5MB')
      return
    }

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `avatar-${Date.now()}.${ext}`
      const filePath = `${profile.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const avatarUrl = data?.publicUrl
      if (!avatarUrl) throw new Error('Errore nel recupero URL pubblico')

      const { error: updateError } = await supabase
        .from('utenti')
        .update({
          avatar_url: avatarUrl,
          ultima_attivita: new Date().toISOString()
        })
        .eq('id', profile.id)
      if (updateError) throw updateError

      toast.success(t('profile.avatar_success'))
      await refreshProfile()
    } catch (error) {
      console.error('Errore upload avatar:', error)
      toast.error(t('profile.avatar_error'))
    }
  }

  const handleSave = async (e) => {
    e?.preventDefault?.()
    setLoading(true)
    try {
      const payload = {
        nome: formData.nome?.trim() || profile.nome,
        cognome: formData.cognome?.trim() || profile.cognome,
        nickname: formData.nickname?.trim() || profile.nickname,
        citta: formData.citta?.trim() || null,
        sesso: formData.sesso || null,
        biografia: formData.biografia?.trim() || null,
        instagram_url: formData.instagram_url?.trim() || null,
        facebook_url: formData.facebook_url?.trim() || null,
        tiktok_url: formData.tiktok_url?.trim() || null,
        youtube_url: formData.youtube_url?.trim() || null,
        telefono: formData.telefono?.trim() || profile.telefono || null,
        paese: formData.paese?.trim() || profile.paese || null,
        via: formData.via?.trim() || profile.via || null,
        cap: formData.cap?.trim() || profile.cap || null,
        civico: formData.civico?.trim() || profile.civico || null,
        ultima_attivita: new Date().toISOString()
      }

      const { error } = await supabase
        .from('utenti')
        .update(payload)
        .eq('id', profile.id)

      if (error) throw error
      toast.success(t('profile.update_success'))
      await refreshProfile()
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error?.message || t('profile.update_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      nome: profile?.nome || '',
      cognome: profile?.cognome || '',
      nickname: profile?.nickname || '',
      citta: profile?.citta || '',
      sesso: profile?.sesso || '',
      biografia: profile?.biografia || '',
      instagram_url: profile?.instagram_url || '',
      facebook_url: profile?.facebook_url || '',
      tiktok_url: profile?.tiktok_url || '',
      youtube_url: profile?.youtube_url || '',
      telefono: profile?.telefono || '',
      paese: profile?.paese || '',
      via: profile?.via || '',
      cap: profile?.cap || '',
      civico: profile?.civico || ''
    })
    setEditing(false)
  }

  // 🔊 Click Mercato: suono + navigazione
  const handleMarketClick = async () => {
    try {
      const audio = new Audio('/Sound_market/store-entrance.mp3')
      await audio.play()
    } catch (err) {
      console.warn('[Profilo] errore riproduzione audio mercato:', err)
    }
    navigate('/shop')
  }

  // Eventi: solo navigazione (pagina da creare)
  const handleEventiClick = () => {
    navigate('/eventi')
  }

  // Passaporto: mostra la sezione + scroll
  const handlePassportClick = () => {
    setShowPassport(true)
    setTimeout(() => {
      if (infoSectionRef.current) {
        infoSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }, 100)
  }

  const cityLabel = profile?.citta || 'Puglia, Italia'

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Titolo pagina */}
        <h1 className="text-2xl font-bold text-olive-dark mb-1">{t('profile.title')}</h1>

        {/* Header profilo stile Airbnb */}
        <div className={headerCardClasses}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div className="flex flex-col items-center md:flex-row md:items-center md:space-x-4 flex-1">
              {/* Avatar */}
              <div className="relative mb-3 md:mb-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-sand flex items-center justify-center text-3xl text-olive-dark">
                    {profile?.nome?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById('avatar-input')?.click()
                  }
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white shadow border flex items-center justify-center hover:scale-105 transition-transform"
                  title={t('profile.change_photo')}
                >
                  📷
                </button>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-olive-dark">
                  {profile?.nome} {profile?.cognome}
                </h2>
                <p className="text-sm text-olive-light">
                  @{profile?.nickname}
                </p>
              </div>
            </div>

            {/* Azioni: Admin + Logout */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 border border-sand bg-white hover:bg-sand/60 px-4 py-2 rounded-lg text-olive-dark text-sm transition"
                >
                  <Settings className="w-4 h-4" />
                  <span>{t('profile.admin_area')}</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 border border-sand bg-white hover:bg-sand/60 px-4 py-2 rounded-lg text-red-500 text-sm transition"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('profile.logout')}</span>
              </button>
            </div>
          </div>

          {/* Griglia card: Mercato / Eventi / Passaporto / Ordini / Desideri di Puglia / Assistenza */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
            {/* Mercato */}
            <button
              type="button"
              onClick={handleMarketClick}
              className="flex flex-col items-start bg-sand/60 hover:bg-sand rounded-2xl p-4 transition shadow-sm"
            >
              <img
                src="/Profilo_icon/mercato.png"
                alt="Mercato"
                className="w-12 h-12 mb-3"
              />
              <p className="text-base font-semibold text-olive-dark">
                {t('profile.market_card')}
              </p>
              <p className="text-xs text-olive-light mt-1">
                {t('profile.market_desc')}
              </p>
            </button>

            {/* Eventi */}
            <button
              type="button"
              onClick={handleEventiClick}
              className="flex flex-col items-start bg-sand/60 hover:bg-sand rounded-2xl p-4 transition shadow-sm"
            >
              <img
                src="/Profilo_icon/eventi.png"
                alt="Eventi"
                className="w-12 h-12 mb-3"
              />
              <p className="text-base font-semibold text-olive-dark">{t('profile.events_card')}</p>
              <p className="text-xs text-olive-light mt-1">
                {t('profile.events_desc')}
              </p>
            </button>

            {/* Passaporto (info personali + stats) */}
            <button
              type="button"
              onClick={handlePassportClick}
              className="flex flex-col items-start bg-sand/60 hover:bg-sand rounded-2xl p-4 transition shadow-sm"
            >
              <img
                src="/Profilo_icon/passaporto.png"
                alt="Passaporto"
                className="w-12 h-12 mb-3"
              />
              <p className="text-base font-semibold text-olive-dark">
                {t('profile.passport_card')}
              </p>
              <p className="text-xs text-olive-light mt-1">
                {t('profile.passport_desc')}
              </p>
            </button>

            {/* Ordini */}
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="flex flex-col items-start bg-sand/60 hover:bg-sand rounded-2xl p-4 transition shadow-sm"
            >
              <img
                src="/Profilo_icon/orders.png"
                alt="I miei ordini"
                className="w-12 h-12 mb-3"
              />
              <p className="text-base font-semibold text-olive-dark">
                {t('profile.orders_card')}
              </p>
              <p className="text-xs text-olive-light mt-1">
                {t('profile.orders_desc')}
              </p>
            </button>

            {/* Desideri di Puglia (ex BAD) */}
            <button
              type="button"
              onClick={() => navigate('/desideridipugliabad')}
              className="flex flex-col items-start bg-sand/60 hover:bg-sand rounded-2xl p-4 transition shadow-sm"
            >
              <img
                src="/Profilo_icon/bad.png"
                alt="Desideri di Puglia"
                className="w-12 h-12 mb-3"
              />
              <p className="text-base font-semibold text-olive-dark">
                {t('profile.desideri_card')}
              </p>
              <p className="text-xs text-olive-light mt-1">
                {t('profile.desideri_desc')}
              </p>
            </button>

            {/* Assistenza (sotto Desideri di Puglia) */}
            <button
              type="button"
              onClick={() => navigate('/contatti')}
              className="flex flex-col items-start bg-sand/60 hover:bg-sand rounded-2xl p-4 transition shadow-sm"
            >
              <img
                src="/Profilo_icon/assistenza.png"
                alt="Assistenza"
                className="w-12 h-12 mb-3"
              />
              <p className="text-base font-semibold text-olive-dark">
                {t('profile.support_card')}
              </p>
              <p className="text-xs text-olive-light mt-1">
                {t('profile.support_desc')}
              </p>
            </button>
          </div>
        </div>

        {/* Pulsante "Modalità Partner" sticky in basso */}
        {partner && (
          <div className="fixed inset-x-0 bottom-20 md:bottom-4 flex justify-center z-50 px-4">
            <button
              type="button"
              onClick={() => handleModeSwitch('partner')}
              className="mt-2 inline-flex items-center justify-center rounded-full border border-olive-light/50 bg-white px-6 py-3 text-sm font-semibold text-olive-dark shadow-sm hover:shadow-md hover:border-olive-dark/50 transition-all"
            >
              {t('profile.partner_mode')}
            </button>
          </div>
        )}

        {/* PASSAPORTO – appare solo dopo click sull’icona */}
        {showPassport && (
          <section ref={infoSectionRef} className="mt-2 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-olive-dark">
                  {t('profile.passport_title')}
                </h2>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 border border-sand bg-white hover:bg-sand/60 px-3 py-1.5 rounded-lg text-olive-dark text-xs transition"
                  >
                    <Edit className="w-3 h-3" />
                    <span>{t('profile.edit_profile')}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
                <div className="bg-sand/60 rounded-xl p-3">
                  <p className="text-[11px] text-olive-light uppercase tracking-wide">
                    {t('profile.stats_month_missions')}
                  </p>
                  <p className="text-lg font-semibold text-olive-dark">
                    {missionStats.missioniMeseApprovate}
                  </p>
                </div>
                <div className="bg-sand/60 rounded-xl p-3">
                  <p className="text-[11px] text-olive-light uppercase tracking-wide">
                    {t('profile.stats_total_missions')}
                  </p>
                  <p className="text-lg font-semibold text-olive-dark">
                    {missionStats.missioniTotaliApprovate}
                  </p>
                </div>


                <div className="bg-sand/60 rounded-xl p-3">
                  <p className="text-[11px] text-olive-light uppercase tracking-wide">
                    {t('profile.stats_last_mission')}
                  </p>
                  <p className="text-xs font-medium text-olive-dark">
                    {formatDate(missionStats.ultimaMissioneData)}
                  </p>
                </div>
              </div>

              {/* Dati personali / Modifica profilo */}
              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-olive-light mb-1">
                        {t('common.name')}
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nome: e.target.value
                          }))
                        }
                        className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-olive-light mb-1">
                        {t('common.surname')}
                      </label>
                      <input
                        type="text"
                        value={formData.cognome}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            cognome: e.target.value
                          }))
                        }
                        className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-olive-light mb-1">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nickname: e.target.value
                          }))
                        }
                        className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-olive-light mb-1">
                        Città
                      </label>
                      <input
                        type="text"
                        value={formData.citta}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            citta: e.target.value
                          }))
                        }
                        className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-olive-light mb-1">
                        {t('auth.gender_select')}
                      </label>
                      <select
                        value={formData.sesso || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            sesso: e.target.value || null
                          }))
                        }
                        className="w-full border border-sand rounded-lg px-3 py-2 text-sm bg-white"
                      >
                        <option value="">{t('auth.gender_select')}</option>
                        <option value="M">{t('auth.gender_male')}</option>
                        <option value="F">{t('auth.gender_female')}</option>
                        <option value="Altro">{t('auth.gender_other')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Dati di spedizione */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-olive-light mb-2 uppercase tracking-wide">
                      {t('profile.shipping_data')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-olive-light mb-1">
                          {t('common.country')}
                        </label>
                        <input
                          type="text"
                          value={formData.paese}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              paese: e.target.value
                            }))
                          }
                          className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                          placeholder="Italia"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-olive-light mb-1">
                          {t('common.city')}
                        </label>
                        <input
                          type="text"
                          value={formData.citta}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              citta: e.target.value
                            }))
                          }
                          className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                          placeholder="Es. Barletta"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-olive-light mb-1">
                          {t('common.address')}
                        </label>
                        <input
                          type="text"
                          value={formData.via}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              via: e.target.value
                            }))
                          }
                          className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                          placeholder="Via / strada"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-olive-light mb-1">
                            {t('common.zip')}
                          </label>
                          <input
                            type="text"
                            value={formData.cap}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                cap: e.target.value
                              }))
                            }
                            className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                            placeholder="76121"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-olive-light mb-1">
                            {t('common.civico')}
                          </label>
                          <input
                            type="text"
                            value={formData.civico}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                civico: e.target.value
                              }))
                            }
                            className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                            placeholder="Es. 10/B"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-olive-light mb-1">
                          Telefono per consegna
                        </label>
                        <input
                          type="text"
                          value={formData.telefono}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              telefono: e.target.value
                            }))
                          }
                          className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                          placeholder="+39 3XX XXX XXXX"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-olive-light mb-1">
                      Biografia
                    </label>
                    <textarea
                      rows={3}
                      value={formData.biografia}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          biografia: e.target.value
                        }))
                      }
                      className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Link social */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-olive-light mb-1 flex items-center gap-1">
                        <Instagram className="w-3 h-3" /> Instagram
                      </label>
                      <input
                        type="text"
                        value={formData.instagram_url}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            instagram_url: e.target.value
                          }))
                        }
                        placeholder="https://instagram.com/..."
                        className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-olive-light mb-1 flex items-center gap-1">
                        <Facebook className="w-3 h-3" /> Facebook
                      </label>
                      <input
                        type="text"
                        value={formData.facebook_url}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            facebook_url: e.target.value
                          }))
                        }
                        placeholder="https://facebook.com/..."
                        className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-olive-light mb-1 flex items-center gap-1">
                        <Youtube className="w-3 h-3" /> YouTube
                      </label>
                      <input
                        type="text"
                        value={formData.youtube_url}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            youtube_url: e.target.value
                          }))
                        }
                        placeholder="https://youtube.com/..."
                        className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-olive-light mb-1 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> TikTok
                      </label>
                      <input
                        type="text"
                        value={formData.tiktok_url}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            tiktok_url: e.target.value
                          }))
                        }
                        placeholder="https://tiktok.com/@..."
                        className="w-full border border-sand rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-sand text-olive-light text-sm hover:bg-sand/50 transition"
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-olive-dark text-white text-sm hover:bg-olive-light transition disabled:opacity-60"
                      disabled={loading}
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Salvataggio...' : 'Salva modifiche'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-sm text-olive-dark space-y-2">
                  <p>
                    <span className="font-semibold">Nome completo:</span>{' '}
                    {profile?.nome} {profile?.cognome}
                  </p>
                  <p>
                    <span className="font-semibold">Nickname:</span> @
                    {profile?.nickname}
                  </p>
                  {profile?.citta && (
                    <p>
                      <span className="font-semibold">Città:</span>{' '}
                      {profile.citta}
                    </p>
                  )}
                  {profile?.biografia && (
                    <p>
                      <span className="font-semibold">Bio:</span>{' '}
                      {profile.biografia}
                    </p>
                  )}

                  <div className="pt-2 space-y-1">
                    {(profile?.paese ||
                      profile?.via ||
                      profile?.cap ||
                      profile?.civico) && (
                        <p>
                          <span className="font-semibold">
                            Indirizzo spedizione:
                          </span>{' '}
                          {[profile?.via, profile?.civico, profile?.cap, profile?.paese]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </p>
                      )}
                    {profile?.telefono && (
                      <p>
                        <span className="font-semibold">Telefono:</span>{' '}
                        {profile.telefono}
                      </p>
                    )}
                  </div>

                  {/* Link social se presenti */}
                  <div className="pt-2 space-y-1">
                    {profile?.instagram_url && (
                      <p className="flex items-center gap-1 text-xs">
                        <Instagram className="w-3 h-3" />
                        <a
                          href={profile.instagram_url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          Instagram
                        </a>
                      </p>
                    )}
                    {profile?.facebook_url && (
                      <p className="flex items-center gap-1 text-xs">
                        <Facebook className="w-3 h-3" />
                        <a
                          href={profile.facebook_url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          Facebook
                        </a>
                      </p>
                    )}
                    {profile?.youtube_url && (
                      <p className="flex items-center gap-1 text-xs">
                        <Youtube className="w-3 h-3" />
                        <a
                          href={profile.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          YouTube
                        </a>
                      </p>
                    )}
                    {profile?.tiktok_url && (
                      <p className="flex items-center gap-1 text-xs">
                        <LinkIcon className="w-3 h-3" />
                        <a
                          href={profile.tiktok_url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          TikTok
                        </a>
                      </p>
                    )}
                    {/* Altri Contatti */}
                    <div>
                      <h3 className="text-xs font-semibold text-olive-dark mb-1">
                        {t('profile.contact_info')}
                      </h3>
                      {profile?.telefono && (
                        <p className="text-sm text-olive-light flex items-center gap-2 mb-1">
                          📞 {profile.telefono}
                        </p>
                      )}
                      {profile?.email && (
                        <p className="text-sm text-olive-light flex items-center gap-2">
                          ✉️ {profile.email}
                        </p>
                      )}
                      {!profile?.telefono && !profile?.email && (
                        <p className="text-sm text-olive-light">
                          {t('profile.no_contact_info')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* OVERLAY DI TRANSIZIONE (per lo switch animato tra le due icone) */}
      {
        modeTransition.active && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
            <div className="relative w-40 h-40 mb-6">
              {/* Icona di partenza */}
              <img
                src={
                  modeTransition.target === 'partner'
                    ? '/cambioview/utente.png'
                    : '/cambioview/partner.png'
                }
                alt="Icona attuale"
                className="absolute inset-0 w-full h-full object-contain transition-all duration-800 ease-out"
                style={{
                  opacity: modeTransition.flip ? 0 : 1,
                  transform: modeTransition.flip
                    ? 'translateX(-80px) scale(0.9)'
                    : 'translateX(0) scale(1)'
                }}
              />

              {/* Icona di arrivo */}
              <img
                src={
                  modeTransition.target === 'partner'
                    ? '/cambioview/partner.png'
                    : '/cambioview/utente.png'
                }
                alt="Nuova modalità"
                className={`absolute inset-0 w-full h-full object-contain transition-all duration-800 ease-out ${modeTransition.flip ? 'animate-pulse' : ''
                  }`}
                style={{
                  opacity: modeTransition.flip ? 1 : 0,
                  transform: modeTransition.flip
                    ? 'translateX(0) scale(1)'
                    : 'translateX(80px) scale(0.9)'
                }}
              />
            </div>

            <p className="text-lg font-semibold text-olive-dark mb-1">
              {modeTransition.target === 'partner'
                ? 'Modalità Partner'
                : 'Modalità Utente'}
            </p>
            <p className="text-sm text-olive-light">
              Stiamo cambiando visuale, resta connesso…
            </p>
          </div>
        )
      }
    </>
  )
}

export default Profilo