// src/pages/admin/AdminMissions.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { Plus, Edit, Trash2, Power, PowerOff, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navigate } from 'react-router-dom'
import AdminNav from '../../components/AdminNav'
import { useTranslation } from 'react-i18next'
import { getLocalized } from '../../utils/content'

/** Toggle: se TRUE usa la RPC admin_upsert_mission, altrimenti scrive direttamente in tabella */
const USE_RPC_PREFERRED = true

const CADENZE = ['giornaliera', 'settimanale', 'mensile', 'speciale']
const VERIFICHE_UI = ['galleria', 'live', 'link', 'bottone']

/** Mappa valore UI -> valore ammesso dal DB (check constraint). */
const mapVerificaToDb = (v) => {
  const t = String(v || '').toLowerCase()
  return t === 'bottone' ? 'button' : t
}

/** Mappa valore DB -> label UI */
const mapVerificaToUi = (v) => (String(v || '').toLowerCase() === 'button' ? 'bottone' : v || 'galleria')

const defaultForm = {
  codice: '',
  titolo: '',
  titolo_en: '',        // NUOVO
  descrizione: '',
  descrizione_en: '',   // NUOVO
  cadenza: 'giornaliera',
  punti: 10,
  cooldown_ore: 0,
  tipo_verifica: 'galleria',
  linee_guida: '',
  is_sponsored: false,
  cost_tokens: 0,
  attiva: true
}

function sanitizeForm(f) {
  const codice = (f.codice || '').toUpperCase().replace(/[^A-Z0-9_]/g, '')
  const cadenza = String(f.cadenza || '').toLowerCase()
  const tipo_verifica_ui = String(f.tipo_verifica || '').toLowerCase()

  const cleaned = {
    codice,
    titolo: (f.titolo || '').trim(),
    titolo_en: (f.titolo_en || '').trim() || null, // NUOVO
    descrizione: (f.descrizione || '').trim(),
    descrizione_en: (f.descrizione_en || '').trim() || null, // NUOVO
    cadenza: CADENZE.includes(cadenza) ? cadenza : 'giornaliera',
    punti: Number.isFinite(+f.punti) ? Math.max(0, parseInt(f.punti)) : 0,
    cooldown_ore: Number.isFinite(+f.cooldown_ore) ? Math.max(0, parseInt(f.cooldown_ore)) : 0,
    tipo_verifica_ui: VERIFICHE_UI.includes(tipo_verifica_ui) ? tipo_verifica_ui : 'galleria',
    tipo_verifica_db: mapVerificaToDb(tipo_verifica_ui),
    linee_guida: f.linee_guida ? String(f.linee_guida) : null,
    is_sponsored: !!f.is_sponsored,
    cost_tokens: Number.isFinite(+f.cost_tokens) ? Math.max(0, parseInt(f.cost_tokens)) : 0,
    attiva: !!f.attiva
  }
  return cleaned
}

const AdminMissions = () => {
  const { t, i18n } = useTranslation() // Usa i18n
  const { isAdmin } = useAuth()
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMission, setEditingMission] = useState(null)
  const [formData, setFormData] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isAdmin) loadMissions()
  }, [isAdmin])

  async function loadMissions() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('missioni_catalogo')
        .select('*')
        .order('data_creazione', { ascending: false })

      if (error) throw error
      setMissions(data || [])
    } catch (error) {
      console.error(error)
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData(defaultForm)
    setEditingMission(null)
  }

  function handleEdit(m) {
    setEditingMission(m)
    setFormData({
      codice: m.codice || '',
      titolo: m.titolo || '',
      titolo_en: m.titolo_en || '', // NUOVO
      descrizione: m.descrizione || '',
      descrizione_en: m.descrizione_en || '', // NUOVO
      cadenza: m.cadenza || 'giornaliera',
      punti: Number.isFinite(m.punti) ? m.punti : 0,
      cooldown_ore: Number.isFinite(m.cooldown_ore) ? m.cooldown_ore : 0,
      tipo_verifica: mapVerificaToUi(m.tipo_verifica),
      linee_guida: m.linee_guida || '',
      is_sponsored: m.is_sponsored ?? false,
      cost_tokens: m.cost_tokens || 0,
      attiva: m.attiva ?? true
    })
    setShowModal(true)
  }

  async function fallbackInsertOrUpdate(payload, editingId) {
    if (editingId) {
      const { error } = await supabase
        .from('missioni_catalogo')
        .update(payload)
        .eq('id', editingId)
      if (error) throw error
      return 'updated'
    } else {
      const { error } = await supabase
        .from('missioni_catalogo')
        .insert([payload])
      if (error) throw error
      return 'inserted'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return
    setSaving(true)

    const s = sanitizeForm(formData)
    if (!s.codice) {
      setSaving(false)
      toast.error(t('admin.missions.messages.error'))
      return
    }

    try {
      const payloadDb = {
        codice: s.codice,
        titolo: s.titolo,
        titolo_en: s.titolo_en, // NUOVO
        descrizione: s.descrizione,
        descrizione_en: s.descrizione_en, // NUOVO
        cadenza: s.cadenza,
        punti: s.punti,
        cooldown_ore: s.cooldown_ore,
        tipo_verifica: s.tipo_verifica_db,
        linee_guida: s.linee_guida,
        is_sponsored: s.is_sponsored,
        cost_tokens: s.cost_tokens,
        attiva: s.attiva
      }

      // ⚠️ ATTENZIONE: La RPC 'admin_upsert_mission' vecchia non accetta i campi _en!
      // Se usiamo RPC, dobbiamo aggiornarla o bypassarla.
      // Modifica strategica: per ora facciamo fallbackInsertOrUpdate che usa update() diretto di Supabase
      // che accetta le nuove colonne se esistono.

      /*
      if (USE_RPC_PREFERRED) {
        ... codice rpc vecchio ...
      } else { ... }
      */

      // FORZIAMO DIRECT INSERT/UPDATE finché non si aggiorna la RPC
      await fallbackInsertOrUpdate(payloadDb, editingMission?.id)

      toast.success(editingMission ? t('admin.missions.messages.updated') : t('admin.missions.messages.created'))
      setShowModal(false)
      resetForm()
      await loadMissions()
    } catch (error) {
      console.error(error)
      const m = (error?.message || '').toLowerCase()
      if (m.includes('missioni_catalogo_codice_key')) {
        toast.error(t('admin.missions.messages.error') + ': ' + t('admin.missions.table.code') + ' esistente')
      } else if (m.includes('rls') || m.includes('permission denied')) {
        toast.error(t('common.error'))
      } else {
        toast.error(t('admin.missions.messages.error'))
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(mission) {
    try {
      const { error } = await supabase
        .from('missioni_catalogo')
        .update({ attiva: !mission.attiva })
        .eq('id', mission.id)
      if (error) throw error
      toast.success(t('admin.missions.messages.status_changed'))
      loadMissions()
    } catch (error) {
      console.error(error)
      toast.error(t('admin.missions.messages.error'))
    }
  }

  async function handleDelete(mission) {
    if (!confirm(t('admin.missions.messages.confirm_delete', { title: mission.titolo }))) return
    try {
      const { error } = await supabase
        .from('missioni_catalogo')
        .delete()
        .eq('id', mission.id)
      if (error) throw error
      toast.success(t('admin.missions.messages.deleted'))
      loadMissions()
    } catch (error) {
      console.error(error)
      toast.error(t('admin.missions.messages.error'))
    }
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-10 w-10 border-2 border-olive-dark rounded-full border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminNav />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-olive-dark">{t('admin.missions.title')}</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> {t('admin.missions.new_mission')}
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sand">
              <th className="text-left p-2">{t('admin.missions.table.title')}</th>
              <th className="text-left p-2">{t('admin.missions.table.code')}</th>
              <th className="text-left p-2">{t('admin.missions.table.frequency')}</th>
              <th className="text-left p-2">{t('admin.missions.table.verification')}</th>
              <th className="text-center p-2">{t('admin.missions.table.points')}</th>
              <th className="text-center p-2">{t('admin.missions.table.status')}</th>
              <th className="text-center p-2">{t('admin.missions.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((m) => (
              <tr key={m.id} className="border-b border-sand">
                <td className="py-2 px-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 font-medium">
                      {m.is_sponsored && <Star className="w-4 h-4 text-gold fill-gold" title={t('admin.missions.form.is_sponsored')} />}
                      {/* Usa getLocalized se volessimo vedere l'anteprima nella lingua corrente della dashboard */}
                      {getLocalized(m, 'titolo', i18n.language)}
                    </div>
                    {/* Mostra piccolo badge se ha traduzione en */}
                    {m.titolo_en && <span className="text-[10px] text-olive-light bg-sand/30 px-1 rounded w-fit">EN available</span>}
                  </div>
                </td>
                <td className="py-2 px-2 font-mono text-xs">{m.codice}</td>
                <td className="py-2 px-2 capitalize">{m.cadenza}</td>
                <td className="py-2 px-2 capitalize">{mapVerificaToUi(m.tipo_verifica)}</td>
                <td className="py-2 px-2 text-center text-gold font-bold">+{m.punti}</td>
                <td className="py-2 px-2 text-center">
                  <button onClick={() => handleToggleActive(m)} title={m.attiva ? 'Disattiva' : 'Attiva'}>
                    {m.attiva ? <Power className="text-green-600" /> : <PowerOff className="text-gray-400" />}
                  </button>
                </td>
                <td className="py-2 px-2 text-center">
                  <button onClick={() => handleEdit(m)} title="Modifica">
                    <Edit className="inline w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(m)} title="Elimina">
                    <Trash2 className="inline w-4 h-4 text-red-600 ml-2" />
                  </button>
                </td>
              </tr>
            ))}
            {missions.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-olive-light">{t('admin.missions.table.empty')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-olive-dark mb-4">
              {editingMission ? t('admin.missions.edit_mission') : t('admin.missions.new_mission')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder={t('admin.missions.form.code')}
                  value={formData.codice}
                  onChange={e => setFormData({ ...formData, codice: e.target.value.toUpperCase() })}
                  required
                  disabled={!!editingMission}
                />
                <input
                  type="number"
                  className="input"
                  placeholder={t('admin.missions.form.points')}
                  value={formData.punti}
                  onChange={e => setFormData({ ...formData, punti: parseInt(e.target.value) || 0 })}
                  required
                  min={0}
                />
              </div>

              {/* TITOLO IT / EN */}
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-olive-light mb-1">Titolo (IT)</label>
                  <input
                    className="input"
                    placeholder="Titolo in Italiano"
                    value={formData.titolo}
                    onChange={e => setFormData({ ...formData, titolo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-olive-light mb-1">Title (EN)</label>
                  <input
                    className="input bg-blue-50/50"
                    placeholder="Title in English"
                    value={formData.titolo_en}
                    onChange={e => setFormData({ ...formData, titolo_en: e.target.value })}
                  />
                </div>
              </div>

              {/* DESCRIZIONE IT / EN */}
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-olive-light mb-1">Descrizione (IT)</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Descrizione in Italiano"
                    value={formData.descrizione}
                    onChange={e => setFormData({ ...formData, descrizione: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-olive-light mb-1">Description (EN)</label>
                  <textarea
                    className="input bg-blue-50/50"
                    rows={3}
                    placeholder="Description in English"
                    value={formData.descrizione_en}
                    onChange={e => setFormData({ ...formData, descrizione_en: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-olive-dark mb-1">{t('admin.missions.form.frequency')}</label>
                  <select
                    className="input"
                    value={formData.cadenza}
                    onChange={e => setFormData({ ...formData, cadenza: e.target.value })}
                  >
                    <option value="giornaliera">Giornaliera</option>
                    <option value="settimanale">Settimanale</option>
                    <option value="mensile">Mensile</option>
                    <option value="speciale">Speciale (una tantum)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-olive-dark mb-1">{t('admin.missions.form.verification')}</label>
                  <select
                    className="input"
                    value={formData.tipo_verifica}
                    onChange={e => setFormData({ ...formData, tipo_verifica: e.target.value })}
                  >
                    <option value="galleria">Galleria (file/link)</option>
                    <option value="live">Live (scatto/video)</option>
                    <option value="link">Link</option>
                    <option value="bottone">Bottone (claim)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-olive-dark mb-1">{t('admin.missions.form.cooldown')}</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.cooldown_ore}
                    onChange={e => setFormData({ ...formData, cooldown_ore: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-dark mb-1">{t('admin.missions.form.guidelines')}</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder={t('admin.missions.form.guidelines')}
                  value={formData.linee_guida}
                  onChange={e => setFormData({ ...formData, linee_guida: e.target.value })}
                />
              </div>

              {/* Sponsored & Tokens */}
              <div className="bg-sand/20 p-3 rounded-lg space-y-3 border border-sand">
                <div className="flex items-center gap-2">
                  <input
                    id="is_sponsored"
                    type="checkbox"
                    checked={formData.is_sponsored}
                    onChange={e => setFormData({ ...formData, is_sponsored: e.target.checked })}
                  />
                  <label htmlFor="is_sponsored" className="text-sm font-semibold text-olive-dark flex items-center gap-1">
                    <Star className="w-3 h-3 text-gold" /> {t('admin.missions.form.is_sponsored')}
                  </label>
                </div>

                {formData.is_sponsored && (
                  <div>
                    <label className="block text-sm font-medium text-olive-dark mb-1">
                      {t('admin.missions.form.cost_tokens')}
                    </label>
                    <input
                      type="number"
                      className="input"
                      placeholder="0"
                      value={formData.cost_tokens}
                      onChange={e => setFormData({ ...formData, cost_tokens: parseInt(e.target.value) || 0 })}
                      min={0}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="attiva"
                  type="checkbox"
                  checked={formData.attiva}
                  onChange={e => setFormData({ ...formData, attiva: e.target.checked })}
                />
                <label htmlFor="attiva" className="text-sm">{t('admin.missions.form.active')}</label>
              </div>

              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? t('admin.missions.form.saving') : (editingMission ? t('admin.missions.form.update') : t('admin.missions.form.create'))}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                  {t('admin.missions.form.close')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminMissions