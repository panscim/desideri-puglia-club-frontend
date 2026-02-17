// src/pages/MissionDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Upload, Link as LinkIcon, Clock, Star, CheckCircle, Camera, Image as ImageIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { claimMission } from '../services/missionsClaim'
import { getPeriodKeyAndReset, shouldShowResetCountdown, formatResetLabel } from '../utils/periods'
import { getLocalized } from '../utils/content'

// --- HELPERS (Invariati) ---
function getTipoVerifica(mission) {
  const raw = String(mission?.tipo_verifica || '').toLowerCase()
  if (raw === 'bottone') return 'bottone'
  if (['live', 'camera', 'screenshot'].includes(raw)) return 'live'
  if (['galleria', 'upload', 'manuale'].includes(raw)) return 'galleria'
  if (raw === 'link') return 'link'
  return 'galleria'
}

// --- SKELETON UI ---
const DetailSkeleton = () => (
  <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
    <div className="h-4 w-32 bg-sand/40 rounded" />
    <div className="rounded-3xl border border-sand bg-white p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="w-16 h-16 rounded-full bg-sand/30" />
        <div className="space-y-2 flex flex-col items-end">
          <div className="h-8 w-24 bg-sand/40 rounded-full" />
          <div className="h-4 w-20 bg-sand/30 rounded" />
        </div>
      </div>
      <div className="h-8 w-3/4 bg-sand/40 rounded" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-sand/20 rounded" />
        <div className="h-4 w-5/6 bg-sand/20 rounded" />
      </div>
    </div>
    <div className="h-40 bg-sand/10 rounded-2xl border border-sand/30" />
  </div>
)

// --- MAIN COMPONENT ---
const MissionDetail = () => {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()

  // Data State
  const [mission, setMission] = useState(null)
  const [periodKey, setPeriodKey] = useState('permanent')
  const [resetAt, setResetAt] = useState(null)
  const [existingSubmission, setExistingSubmission] = useState(null)

  // UI State
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [claiming, setClaiming] = useState(false)

  // Form State
  const [formData, setFormData] = useState({ prova_url: '', nota_utente: '' })
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    loadMissionDetail()
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile?.id])

  const loadMissionDetail = async () => {
    try {
      setLoading(true)

      // 1. Fetch Missione
      const { data: missionData, error: missionError } = await supabase
        .from('missioni_catalogo')
        .select('*')
        .eq('id', id)
        .single()

      if (missionError) throw missionError

      // 2. Calcolo Chiavi Periodo
      const { key: pk, resetAt: ra } = getPeriodKeyAndReset(missionData?.cadenza)

      // 3. Fetch Submission (Solo se user loggato)
      let submissionData = null
      if (profile?.id) {
        const { data, error } = await supabase
          .from('missioni_inviate')
          .select('*')
          .eq('id_utente', profile.id)
          .eq('id_missione', id)
          .eq('period_key', pk)
          .order('data_creazione', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw error
        submissionData = data
      }

      // 4. Batch Updates
      setMission(missionData)
      setPeriodKey(pk)
      setResetAt(ra)
      setExistingSubmission(submissionData)

    } catch (error) {
      console.error('Error:', error)
      toast.error(t('mission.not_found'))
      navigate('/missioni')
    } finally {
      setLoading(false)
    }
  }

  // --- HANDLERS (Logica Invariata) ---

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) {
      toast.error(t('mission.errors.upload_media'))
      return
    }
    if (f.size > 25 * 1024 * 1024) {
      toast.error(t('mission.errors.file_size'))
      return
    }
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!mission || !profile?.id) return

    const tipo = getTipoVerifica(mission)

    // Validazioni
    if (tipo === 'live' && !file) {
      return toast.error(t('mission.errors.live_req'))
    }
    if (tipo === 'galleria' && !file && !formData.prova_url.trim()) {
      return toast.error(t('mission.errors.gallery_req'))
    }
    if (tipo === 'link' && !formData.prova_url.trim()) {
      return toast.error(t('mission.errors.link_req'))
    }

    setSubmitting(true)

    try {
      // Logic Checks
      if (existingSubmission) {
        if (existingSubmission.stato === 'In attesa') {
          setSubmitting(false)
          return toast(t('mission.errors.already_sent'), { icon: '⏳' })
        }
        if (existingSubmission.stato === 'Approvata') {
          setSubmitting(false)
          return toast(t('mission.errors.already_completed'), { icon: '✅' })
        }
      }

      let provaUrl = formData.prova_url?.trim() || null

      // Upload Storage
      if (file) {
        const ext = file.name.split('.').pop()
        const safeCode = (mission?.codice || 'mission').replace(/[^a-zA-Z0-9_-]/g, '')
        const path = `${profile.id}/${safeCode}-${Date.now()}.${ext}`

        const { error: upErr } = await supabase.storage.from('proofs').upload(path, file, { upsert: true, contentType: file.type })
        if (upErr) throw upErr

        const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(path)
        provaUrl = urlData?.publicUrl || null
        if (!provaUrl) throw new Error(t('mission.errors.url_error'))
      }

      const basePayload = {
        id_utente: profile.id,
        id_missione: mission.id,
        period_key: periodKey,
        stato: 'In attesa',
        prova_url: provaUrl,
        nota_utente: formData.nota_utente || null,
        punti_approvati: 0
      }

      if (existingSubmission?.stato === 'Rifiutata') {
        const { error: updErr } = await supabase.from('missioni_inviate').update({
          stato: 'In attesa',
          prova_url: basePayload.prova_url,
          nota_utente: basePayload.nota_utente,
          nota_admin: null,
          punti_approvati: 0,
          data_creazione: new Date().toISOString()
        }).eq('id', existingSubmission.id)
        if (updErr) throw updErr
        toast.success(t('mission.errors.resubmitted'))
      } else {
        const { error: insErr } = await supabase.from('missioni_inviate').insert([basePayload])
        if (insErr) {
          if (String(insErr.message).includes('duplicate')) toast(t('mission.errors.already_sent'), { icon: 'ℹ️' })
          else throw insErr
        } else {
          toast.success(t('mission.errors.sent_success'))
        }
      }

      // Cleanup
      setFormData({ prova_url: '', nota_utente: '' })
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setFile(null)
      await loadMissionDetail()

    } catch (error) {
      console.error(error)
      toast.error(error.message || t('mission.errors.generic_error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleClaim = async () => {
    if (!mission || !profile?.id) return
    setClaiming(true)
    const res = await claimMission({ missionId: mission.id, userId: profile.id })
    setClaiming(false)

    if (res.ok) {
      toast.success(t('mission.errors.claimed_success'))
      await refreshProfile?.()
      await loadMissionDetail()
      return
    }

    // Error mapping
    const map = {
      already_claimed_period: t('mission.errors.claimed_period'),
      already_claimed_once: t('mission.errors.claimed_once'),
      cooldown_active: `${t('mission.errors.cooldown')} (${res.cooldown_ore}h).`,
      mission_not_found: t('mission.errors.not_available')
    }
    toast.error(map[res.reason] || t('mission.errors.cannot_complete'))
  }

  // --- RENDER HELPERS ---
  if (loading) return <div className="mt-8"><DetailSkeleton /></div>
  if (!mission) return null

  const tipo = getTipoVerifica(mission)
  const isApproved = existingSubmission?.stato === 'Approvata'
  const isPending = existingSubmission?.stato === 'In attesa'
  const isRejected = existingSubmission?.stato === 'Rifiutata'
  const canSubmit = !existingSubmission || isRejected

  const missionIcons = { live: Camera, galleria: ImageIcon, link: LinkIcon, bottone: CheckCircle }
  const MainIcon = missionIcons[tipo] || Star

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">

      {/* NAV BACK */}
      <button onClick={() => navigate('/missioni')} className="group flex items-center gap-2 text-sm font-medium text-olive-light hover:text-olive-dark transition-colors">
        <div className="p-1.5 rounded-full bg-sand/30 group-hover:bg-sand/60 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span>{t('mission.back_catalog')}</span>
      </button>

      {/* HERO CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-sand bg-white p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <MainIcon className="w-32 h-32 text-olive-dark" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="w-16 h-16 rounded-2xl bg-olive-dark text-white flex items-center justify-center shadow-lg shadow-olive-dark/20">
              <MainIcon className="w-8 h-8" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-4 py-1.5 rounded-full bg-gold text-black text-sm font-bold shadow-sm">
                +{mission.punti} Punti
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium text-olive-light uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                {mission.cadenza}
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-olive-dark mb-3 leading-tight">
            {getLocalized(mission, 'titolo', i18n.language)}
          </h1>
          <p className="text-olive-light text-lg leading-relaxed max-w-xl">
            {getLocalized(mission, 'descrizione', i18n.language)}
          </p>
        </div>
      </div>

      {/* GUIDELINES */}
      {mission.linee_guida && (
        <div className="rounded-2xl border border-sand/60 bg-sand/20 p-5">
          <h3 className="flex items-center gap-2 font-bold text-olive-dark mb-2 text-sm uppercase tracking-wide">
            <Star className="w-4 h-4 text-gold" /> {t('mission.guidelines')}
          </h3>
          <p className="text-sm text-olive-dark/80 whitespace-pre-wrap leading-relaxed">
            {mission.linee_guida}
          </p>
        </div>
      )}

      {/* --- STATUS FEEDBACK --- */}
      {isApproved && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 flex gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="mt-1"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          <div>
            <h4 className="font-bold text-green-800">{t('mission.completed_title')}</h4>
            <p className="text-sm text-green-700 mt-1">
              {t('mission.completed_desc', { points: existingSubmission.punti_approvati })}
            </p>
            {existingSubmission.nota_admin && (
              <div className="mt-2 text-xs bg-white/50 p-2 rounded text-green-800 border border-green-100">
                {t('mission.admin_notes')}: {existingSubmission.nota_admin}
              </div>
            )}
            {shouldShowResetCountdown(true, false, resetAt) && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-green-800 bg-green-200/50 px-3 py-1 rounded-full">
                <Clock className="w-3 h-3" /> {t('mission.available_in')} {formatResetLabel(true, false, resetAt)}
              </div>
            )}
          </div>
        </div>
      )}

      {isPending && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="mt-1"><Clock className="w-6 h-6 text-amber-600" /></div>
          <div>
            <h4 className="font-bold text-amber-800">{t('mission.pending_title')}</h4>
            <p className="text-sm text-amber-700 mt-1">
              {t('mission.pending_desc')}
            </p>
            {existingSubmission.nota_utente && (
              <p className="mt-2 text-xs text-amber-700/70 italic">
                {t('mission.your_note')}: "{existingSubmission.nota_utente}"
              </p>
            )}
          </div>
        </div>
      )}

      {isRejected && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="mt-1"><X className="w-6 h-6 text-red-600" /></div>
          <div>
            <h4 className="font-bold text-red-800">{t('mission.rejected_title')}</h4>
            <p className="text-sm text-red-700 mt-1">
              {t('mission.rejected_desc')}
            </p>
            {existingSubmission.nota_admin && (
              <div className="mt-2 text-xs bg-white/50 p-2 rounded text-red-800 border border-red-100 font-medium">
                {t('mission.reason')}: {existingSubmission.nota_admin}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ACTION SECTION --- */}

      {/* CASO A: BOTTONE (Click rapido) */}
      {tipo === 'bottone' ? (
        !isApproved && (
          <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <h3 className="font-bold text-olive-dark mb-2">{t('mission.confirm_action')}</h3>
            <p className="text-sm text-olive-light mb-6">
              {t('mission.confirm_desc')}
            </p>
            <button
              onClick={handleClaim}
              disabled={claiming || isPending || (!canSubmit && !isApproved)}
              className="w-full py-4 rounded-xl bg-olive-dark text-white font-bold text-lg hover:bg-gold hover:text-black hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {claiming ? t('mission.verifying') : t('mission.completed_btn')}
            </button>
          </div>
        )
      ) : (
        // CASO B: FORM UPLOAD (Live / Galleria / Link)
        canSubmit && (
          <div className="rounded-3xl border border-sand bg-white p-6 shadow-sm">
            <h3 className="font-bold text-olive-dark mb-4 text-lg">{t('mission.submit_proof')}</h3>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* FILE INPUT AREA */}
              {['live', 'galleria'].includes(tipo) && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-olive-dark">
                    {tipo === 'live' ? t('mission.take_photo') : t('mission.upload_media')}
                  </label>

                  {!file ? (
                    <label className="cursor-pointer group relative flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed border-sand hover:border-gold hover:bg-sand/10 transition-all">
                      <div className="p-4 rounded-full bg-sand/20 group-hover:bg-white transition-colors mb-3">
                        <Upload className="w-6 h-6 text-olive-light group-hover:text-olive-dark" />
                      </div>
                      <p className="text-sm font-medium text-olive-dark">{t('mission.click_upload')}</p>
                      <p className="text-xs text-olive-light mt-1">{t('mission.drag_drop')}</p>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                        capture={tipo === 'live' ? 'environment' : undefined}
                      />
                    </label>
                  ) : (
                    // PREVIEW AREA
                    <div className="relative rounded-2xl overflow-hidden border border-sand bg-black/5">
                      {file.type.startsWith('video/') ? (
                        <video src={previewUrl} controls className="w-full max-h-[300px] object-contain" />
                      ) : (
                        <img src={previewUrl} alt="Preview" className="w-full max-h-[300px] object-contain" />
                      )}
                      <button
                        type="button"
                        onClick={() => { setFile(null); setPreviewUrl(null); }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-red-600 transition-colors backdrop-blur-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* URL INPUT */}
              {(tipo === 'link' || (tipo === 'galleria' && !file)) && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-olive-dark">
                    {tipo === 'link' ? t('mission.link_label') : t('mission.paste_link')}
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-olive-light" />
                    <input
                      type="url"
                      required={tipo === 'link'}
                      value={formData.prova_url}
                      onChange={(e) => setFormData({ ...formData, prova_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-sand bg-sand/10 focus:bg-white focus:border-olive-dark focus:ring-1 focus:ring-olive-dark outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* NOTES */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-olive-dark">{t('mission.notes_optional')}</label>
                <textarea
                  value={formData.nota_utente}
                  onChange={(e) => setFormData({ ...formData, nota_utente: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-sand bg-sand/10 focus:bg-white focus:border-olive-dark focus:ring-1 focus:ring-olive-dark outline-none transition-all resize-none"
                  placeholder={t('mission.add_comment')}
                />
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-olive-dark text-white font-bold hover:bg-gold hover:text-black shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('mission.sending') : (isRejected ? t('mission.resubmit_btn') : t('mission.submit_btn'))}
              </button>
            </form>
          </div>
        )
      )}
    </div>
  )
}

export default MissionDetail