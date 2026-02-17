import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { Trophy, Plus, Edit, Trash2, Save, X, Image as ImageIcon, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navigate } from 'react-router-dom'
import AdminNav from '../../components/AdminNav'
import { useTranslation } from 'react-i18next'
import { getLocalized } from '../../utils/content'

const AdminPrizes = () => {
  const { t, i18n } = useTranslation() // Usa i18n
  const { isAdmin } = useAuth()
  const [prizes, setPrizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    mese: new Date().toISOString().slice(0, 7),
    posizione: 1,
    titolo: '',
    titolo_en: '',        // NUOVO
    descrizione: '',
    descrizione_en: '',   // NUOVO
    immagine_url: '',
    termini: '',
    termini_en: ''        // NUOVO
  })

  useEffect(() => {
    if (isAdmin) {
      loadPrizes()
    }
  }, [isAdmin])

  const loadPrizes = async () => {
    try {
      const { data, error } = await supabase
        .from('premi_mensili')
        .select('*')
        .order('mese', { ascending: false })
        .order('posizione', { ascending: true })

      if (error) throw error
      setPrizes(data || [])
    } catch (error) {
      console.error('Error loading prizes:', error)
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    const payload = { ...formData }
    if (!payload.titolo_en) delete payload.titolo_en
    if (!payload.descrizione_en) delete payload.descrizione_en
    if (!payload.termini_en) delete payload.termini_en

    try {
      const { error } = await supabase
        .from('premi_mensili')
        .insert([payload])

      if (error) throw error

      toast.success(t('admin.prizes.messages.created'))
      setCreating(false)
      resetForm()
      loadPrizes()
    } catch (error) {
      console.error('Error creating prize:', error)
      toast.error(error.message || t('common.error'))
    }
  }

  const handleUpdate = async (id) => {
    const payload = { ...formData }
    // Non cancelliamo per update, vogliamo sovrascrivere o svuotare
    try {
      const { error } = await supabase
        .from('premi_mensili')
        .update(payload)
        .eq('id', id)

      if (error) throw error

      toast.success(t('admin.prizes.messages.updated'))
      setEditing(null)
      resetForm()
      loadPrizes()
    } catch (error) {
      console.error('Error updating prize:', error)
      toast.error(t('common.error'))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('admin.missions.messages.confirm_delete', { title: 'premio' }))) return

    try {
      const { error } = await supabase
        .from('premi_mensili')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success(t('admin.prizes.messages.deleted'))
      loadPrizes()
    } catch (error) {
      console.error('Error deleting prize:', error)
      toast.error(t('common.error'))
    }
  }

  const startEdit = (prize) => {
    setFormData({
      mese: prize.mese,
      posizione: prize.posizione,
      titolo: prize.titolo,
      titolo_en: prize.titolo_en || '',
      descrizione: prize.descrizione,
      descrizione_en: prize.descrizione_en || '',
      immagine_url: prize.immagine_url || '',
      termini: prize.termini || '',
      termini_en: prize.termini_en || ''
    })
    setEditing(prize.id)
    setCreating(false)
  }

  const resetForm = () => {
    setFormData({
      mese: new Date().toISOString().slice(0, 7),
      posizione: 1,
      titolo: '',
      titolo_en: '',
      descrizione: '',
      descrizione_en: '',
      immagine_url: '',
      termini: '',
      termini_en: ''
    })
  }

  // 🔼 Upload immagine sul bucket "premi-mensili"
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop()
      const safeMonth = (formData.mese || 'premio').replace(/[^0-9-]/g, '')
      const fileName = `${safeMonth}-pos${formData.posizione || 1}-${Date.now()}.${ext}`
      const filePath = fileName

      const { error: uploadError } = await supabase
        .storage
        .from('premi-mensili') // 👈 NOME BUCKET
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      const { data } = supabase
        .storage
        .from('premi-mensili')
        .getPublicUrl(filePath)

      const publicUrl = data?.publicUrl
      if (!publicUrl) {
        throw new Error(t('mission.errors.url_error'))
      }

      setFormData((prev) => ({
        ...prev,
        immagine_url: publicUrl
      }))

      toast.success(t('mission.errors.sent_success')) // Reusing a success message or generic
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(t('mission.errors.upload_media'))
    } finally {
      setUploadingImage(false)
      // reset input file per permettere di ricaricare la stessa immagine se serve
      event.target.value = ''
    }
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-dark"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Admin Navigation */}
      <AdminNav />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-olive-dark mb-2">{t('admin.prizes.title')}</h1>
          <p className="text-olive-light">{t('admin.prizes.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setCreating(true)
            setEditing(null)
            resetForm()
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.prizes.new_btn')}</span>
        </button>
      </div>

      {/* Create/Edit Form */}
      {(creating || editing) && (
        <div className="card bg-sand bg-opacity-50">
          <h3 className="text-xl font-bold text-olive-dark mb-4">
            {creating ? t('admin.prizes.create_modal') : t('admin.prizes.edit_modal')}
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-olive-dark mb-2">
                {t('admin.prizes.form.month')}
              </label>
              <input
                type="month"
                value={formData.mese}
                onChange={(e) => setFormData({ ...formData, mese: e.target.value })}
                className="w-full px-4 py-2 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-olive-dark mb-2">
                {t('admin.prizes.form.position')}
              </label>
              <select
                value={formData.posizione}
                onChange={(e) => setFormData({ ...formData, posizione: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
              >
                <option value={1}>1° Posto 🥇</option>
                <option value={2}>2° Posto 🥈</option>
                <option value={3}>3° Posto 🥉</option>
              </select>
            </div>

            {/* Titoli IT/EN */}
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">
                  {t('admin.prizes.form.title')} (IT)
                </label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                  className="w-full px-4 py-2 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light"
                  placeholder="es. Cena per Due"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">
                  Title (EN)
                </label>
                <input
                  type="text"
                  value={formData.titolo_en}
                  onChange={(e) => setFormData({ ...formData, titolo_en: e.target.value })}
                  className="w-full px-4 py-2 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light bg-blue-50/50"
                  placeholder="e.g. Dinner for Two"
                />
              </div>
            </div>

            {/* Descrizioni IT/EN */}
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">
                  {t('admin.prizes.form.description')} (IT)
                </label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light resize-none"
                  placeholder="Descrizione..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">
                  Description (EN)
                </label>
                <textarea
                  value={formData.descrizione_en}
                  onChange={(e) => setFormData({ ...formData, descrizione_en: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light resize-none bg-blue-50/50"
                  placeholder="Description..."
                />
              </div>
            </div>

            {/* BLOCCO IMMAGINE */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-olive-dark mb-1">
                {t('admin.prizes.form.image')}
              </label>

              <div className="flex flex-col md:flex-row md:items-center gap-3">
                {/* Upload file */}
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-sand rounded-lg cursor-pointer text-sm text-olive-dark bg-white hover:bg-sand/60">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingImage ? t('admin.prizes.form.uploading') : t('admin.prizes.form.upload_btn')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>

                {/* URL manuale (fallback / override) */}
                <input
                  type="url"
                  value={formData.immagine_url}
                  onChange={(e) => setFormData({ ...formData, immagine_url: e.target.value })}
                  className="flex-1 px-4 py-2 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light text-sm"
                  placeholder="oppure incolla una URL https://..."
                />
              </div>

              {/* Anteprima */}
              {formData.immagine_url && (
                <div className="mt-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-olive-light" />
                  <img
                    src={formData.immagine_url}
                    alt="Anteprima premio"
                    className="h-28 rounded-xl object-cover border border-sand"
                  />
                </div>
              )}
            </div>

            {/* Termini IT/EN */}
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">
                  {t('admin.prizes.form.terms')} (IT)
                </label>
                <textarea
                  value={formData.termini}
                  onChange={(e) => setFormData({ ...formData, termini: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light resize-none"
                  placeholder="Termini..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">
                  Terms (EN)
                </label>
                <textarea
                  value={formData.termini_en}
                  onChange={(e) => setFormData({ ...formData, termini_en: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-light resize-none bg-blue-50/50"
                  placeholder="Terms..."
                />
              </div>
            </div>

          </div>

          <div className="flex space-x-3 mt-4">
            <button
              onClick={() => (editing ? handleUpdate(editing) : handleCreate())}
              disabled={!formData.titolo || !formData.descrizione}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{editing ? t('admin.prizes.form.save') : t('admin.prizes.form.create')}</span>
            </button>
            <button
              onClick={() => {
                setCreating(false)
                setEditing(null)
                resetForm()
              }}
              className="btn-secondary flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>{t('admin.prizes.form.cancel')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Prizes List */}
      <div className="space-y-4">
        {prizes.length > 0 ? (
          prizes.map((prize) => (
            <div key={prize.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">
                    {prize.posizione === 1 ? '🥇' : prize.posizione === 2 ? '🥈' : '🥉'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-olive-dark">
                        {getLocalized(prize, 'titolo', i18n.language)}
                      </h3>
                      {prize.titolo_en && <span className="text-[10px] text-olive-light bg-sand/30 px-1 rounded">EN</span>}
                      <span className="text-sm text-olive-light border-l border-sand pl-3">
                        {new Date(prize.mese + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-olive-light mb-2">
                      {getLocalized(prize, 'descrizione', i18n.language)}
                    </p>

                    {prize.immagine_url && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={prize.immagine_url}
                          alt={prize.titolo}
                          className="h-24 w-32 object-cover rounded-lg border border-sand"
                        />
                        <a
                          href={prize.immagine_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-olive-dark hover:text-gold underline"
                        >
                          🔗 {t('admin.dashboard.view_proof')}
                        </a>
                      </div>
                    )}

                    {(prize.termini || prize.termini_en) && (
                      <details className="mt-2">
                        <summary className="text-sm text-olive-light cursor-pointer">Termini e condizioni</summary>
                        <p className="text-xs text-olive-light mt-1">
                          {getLocalized(prize, 'termini', i18n.language)}
                        </p>
                      </details>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(prize)}
                    className="p-2 text-olive-dark hover:bg-sand rounded-lg transition-colors"
                    title="Modifica"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(prize.id)}
                    className="p-2 text-coral hover:bg-red-50 rounded-lg transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-olive-light opacity-50" />
            <p className="text-olive-light mb-4">{t('admin.prizes.empty')}</p>
            <button
              onClick={() => {
                setCreating(true)
                resetForm()
              }}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('admin.prizes.create_first')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPrizes