// src/pages/admin/AdminEventi.jsx
import { useState, useEffect } from 'react'
import { Calendar, Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { EventsService } from '../../services/events'
import { supabase } from '../../services/supabase'

export default function AdminEventi() {
    const [events, setEvents] = useState([])
    const [partners, setPartners] = useState([])
    const [cards, setCards] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [formData, setFormData] = useState({
        id: null,
        titolo: '',
        titolo_en: '',
        descrizione: '',
        descrizione_en: '',
        luogo: '',
        latitudine: '',
        longitudine: '',
        data_inizio: '',
        data_fine: '',
        immagine_url: '',
        tipo_sblocco: 'gps',
        pin_code: '',
        partner_id: '',
        ricompensa_card_id: '',
        link_esterno: '',
        disponibile: true
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [eventsList, partnersResult, cardsResult] = await Promise.all([
                EventsService.getAllEvents(),
                supabase.from('partners').select('id, name').order('name'),
                supabase.from('cards').select('id, title').order('title')
            ])

            setEvents(eventsList || [])
            setPartners(partnersResult.data || [])
            setCards(cardsResult.data || [])
        } catch (error) {
            console.error(error)
            toast.error('Errore nel caricamento eventi')
        } finally {
            setLoading(false)
        }
    }

    const openModal = (ev = null) => {
        if (ev) {
            // Formatta date for input type="datetime-local"
            const formatDT = (dt) => dt ? new Date(dt).toISOString().slice(0, 16) : ''
            setFormData({
                id: ev.id,
                titolo: ev.titolo || '',
                titolo_en: ev.titolo_en || '',
                descrizione: ev.descrizione || '',
                descrizione_en: ev.descrizione_en || '',
                luogo: ev.luogo || '',
                latitudine: ev.latitudine || '',
                longitudine: ev.longitudine || '',
                data_inizio: formatDT(ev.data_inizio),
                data_fine: formatDT(ev.data_fine),
                immagine_url: ev.immagine_url || '',
                tipo_sblocco: ev.tipo_sblocco || 'gps',
                pin_code: ev.pin_code || '',
                partner_id: ev.partner_id || '',
                ricompensa_card_id: ev.ricompensa_card_id || '',
                link_esterno: ev.link_esterno || '',
                disponibile: ev.disponibile !== false
            })
        } else {
            setFormData({
                id: null,
                titolo: '',
                titolo_en: '',
                descrizione: '',
                descrizione_en: '',
                luogo: '',
                latitudine: '',
                longitudine: '',
                data_inizio: '',
                data_fine: '',
                immagine_url: '',
                tipo_sblocco: 'gps',
                pin_code: '',
                partner_id: '',
                ricompensa_card_id: '',
                link_esterno: '',
                disponibile: true
            })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const payload = { ...formData }
        if (!payload.partner_id) payload.partner_id = null
        if (!payload.ricompensa_card_id) payload.ricompensa_card_id = null
        if (!payload.pin_code) payload.pin_code = null
        if (payload.latitudine === '') payload.latitudine = null; else payload.latitudine = parseFloat(payload.latitudine)
        if (payload.longitudine === '') payload.longitudine = null; else payload.longitudine = parseFloat(payload.longitudine)
        if (payload.tipo_sblocco === 'gps') payload.pin_code = null

        // Converte datetime-local in timestamp ISO Postgres validi
        if (payload.data_inizio) payload.data_inizio = new Date(payload.data_inizio).toISOString()
        if (payload.data_fine) payload.data_fine = new Date(payload.data_fine).toISOString()

        try {
            if (payload.id) {
                const { id, ...updateData } = payload
                const res = await EventsService.updateEvent(id, updateData)
                if (res.error) throw new Error(res.error)
                toast.success('Evento aggiornato!')
            } else {
                const { id, ...insertData } = payload
                const res = await EventsService.createEvent(insertData)
                if (res.error) throw new Error(res.error)
                toast.success('Evento creato!')
            }
            setIsModalOpen(false)
            loadData()
        } catch (error) {
            toast.error('Errore nel salvataggio')
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm("Sei sicuro di voler eliminare definitivamente questo evento?")) {
            try {
                await EventsService.deleteEvent(id)
                toast.success('Evento eliminato')
                loadData()
            } catch (error) {
                toast.error('Errore durante l\'eliminazione')
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-serif text-olive-dark">Gestione Eventi</h1>
                    <p className="text-olive-light">Condividi notizie, party ed eventi in Puglia per rilasciare Card.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-olive-dark text-white px-4 py-2 rounded-xl hover:bg-gold transition-colors font-bold shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Nuovo Evento
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 opacity-50">Caricamento in corso...</div>
            ) : events.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-sand/40 italic text-olive-light">
                    Nessun evento configurato. Creane uno per farlo apparire in Home!
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-sand/40 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-sand/40 bg-sand/10">
                                    <th className="p-4 font-semibold text-olive-dark text-sm">Titolo & Immagine</th>
                                    <th className="p-4 font-semibold text-olive-dark text-sm">Partner</th>
                                    <th className="p-4 font-semibold text-olive-dark text-sm">Ricompensa</th>
                                    <th className="p-4 font-semibold text-olive-dark text-sm">Date</th>
                                    <th className="p-4 font-semibold text-olive-dark text-sm text-center">Stato</th>
                                    <th className="p-4 font-semibold text-olive-dark text-sm text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sand/20">
                                {events.map(ev => (
                                    <tr key={ev.id} className="hover:bg-sand/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-stone-200 overflow-hidden shrink-0">
                                                    {ev.immagine_url ? (
                                                        <img src={ev.immagine_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Calendar className="w-6 h-6 m-3 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-olive-dark">{ev.titolo}</div>
                                                    <div className="text-xs text-olive-light">{ev.luogo}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-medium">{ev.partners?.name || '-'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs px-2 py-1 bg-gold/20 text-[#D8B65A] font-bold rounded-full">
                                                {ev.cards?.title || 'Nessuna'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                                            {new Date(ev.data_inizio).toLocaleDateString()} - {new Date(ev.data_fine).toLocaleDateString()}
                                            <div className="mt-1">
                                                <span className="bg-sand/30 font-bold px-1.5 py-0.5 rounded uppercase text-[9px] text-olive-dark">
                                                    {ev.tipo_sblocco}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {ev.disponibile ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    <CheckCircle className="w-3 h-3" /> Attivo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    <XCircle className="w-3 h-3" /> Nascosto
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(ev)}
                                                    className="p-2 text-olive-light hover:text-olive-dark transition-colors bg-white rounded-lg shadow-sm border border-sand/40"
                                                    title="Modifica"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ev.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 transition-colors bg-white rounded-lg shadow-sm border border-sand/40"
                                                    title="Elimina"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

                        <div className="p-6 border-b border-sand/40 sticky top-0 bg-white/95 backdrop-blur z-10 flex justify-between items-center">
                            <h2 className="text-xl font-bold font-serif text-olive-dark">
                                {formData.id ? 'Modifica Evento' : 'Nuovo Evento'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Titolo (IT) *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.titolo}
                                        onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-sand/5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Titolo (EN)</label>
                                    <input
                                        type="text"
                                        value={formData.titolo_en}
                                        onChange={(e) => setFormData({ ...formData, titolo_en: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-sand/5"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Descrizione (IT) *</label>
                                    <textarea
                                        required
                                        rows="2"
                                        value={formData.descrizione}
                                        onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-sand/5 resize-none"
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Descrizione (EN)</label>
                                    <textarea
                                        rows="2"
                                        value={formData.descrizione_en}
                                        onChange={(e) => setFormData({ ...formData, descrizione_en: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-sand/5 resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-sand/40 pt-3">
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Luogo *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.luogo}
                                        onChange={(e) => setFormData({ ...formData, luogo: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-sand/5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Latitudine GPS</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.latitudine}
                                        onChange={(e) => setFormData({ ...formData, latitudine: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-sand/5"
                                        placeholder="es. 41.130"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Longitudine GPS</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.longitudine}
                                        onChange={(e) => setFormData({ ...formData, longitudine: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-sand/5"
                                        placeholder="es. 16.871"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Data Inizio *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.data_inizio}
                                        onChange={(e) => setFormData({ ...formData, data_inizio: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-sand/5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Data Fine *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.data_fine}
                                        onChange={(e) => setFormData({ ...formData, data_fine: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-sand/5"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-sand/40">
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Link Immagine</label>
                                    <input
                                        type="url"
                                        value={formData.immagine_url}
                                        onChange={(e) => setFormData({ ...formData, immagine_url: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-sand/5 text-sm"
                                        placeholder="https://"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Link Esterno (Ticket/Sito)</label>
                                    <input
                                        type="url"
                                        value={formData.link_esterno}
                                        onChange={(e) => setFormData({ ...formData, link_esterno: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-sand/5 text-sm"
                                        placeholder="https://"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-sand/40 bg-gold/5 p-4 rounded-xl border border-gold/20">
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Assegna Partner Organizzatore</label>
                                    <select
                                        value={formData.partner_id}
                                        onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-white text-sm"
                                    >
                                        <option value="">Nessun Partner</option>
                                        {partners.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Card Ricompensa 🎁</label>
                                    <select
                                        value={formData.ricompensa_card_id}
                                        onChange={(e) => setFormData({ ...formData, ricompensa_card_id: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-white text-sm"
                                    >
                                        <option value="">Nessuna Card In Palio</option>
                                        {cards.map(c => (
                                            <option key={c.id} value={c.id}>{c.title_it}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-sand/40 bg-[#eef1f6] p-4 rounded-xl border border-slate-200">
                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Metodo di Sblocco</label>
                                    <select
                                        value={formData.tipo_sblocco}
                                        onChange={(e) => setFormData({ ...formData, tipo_sblocco: e.target.value })}
                                        className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-white text-sm"
                                    >
                                        <option value="gps">GPS (Presenza sul luogo)</option>
                                        <option value="pin">PIN Segreto</option>
                                    </select>
                                </div>

                                {formData.tipo_sblocco === 'pin' && (
                                    <div>
                                        <label className="block text-sm font-bold text-olive-dark mb-1">Codice PIN Richiesto</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.pin_code}
                                            onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                                            className="w-full border-sand focus:border-gold focus:ring-gold rounded-xl bg-white text-sm uppercase"
                                            placeholder="Es: TARANTA24"
                                            maxLength={15}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center mt-4">
                                <input
                                    type="checkbox"
                                    id="disponibile"
                                    checked={formData.disponibile}
                                    onChange={(e) => setFormData({ ...formData, disponibile: e.target.checked })}
                                    className="rounded text-gold focus:ring-gold h-5 w-5 border-sand"
                                />
                                <label htmlFor="disponibile" className="ml-2 font-medium text-olive-dark">
                                    Evento attivo e visibile in Home
                                </label>
                            </div>

                            <div className="pt-6 flex gap-3 justify-end border-t border-sand/40">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-olive-light hover:bg-sand/20 transition-colors"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl font-bold bg-olive-dark text-white hover:bg-gold transition-colors shadow-md"
                                >
                                    {formData.id ? 'Salva Modifiche' : 'Crea Evento'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}
