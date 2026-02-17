import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Plus, Edit, Trash2, MapPin, Lock, Save, X, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminCards() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCard, setEditingCard] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        image_url: '',
        type: 'monument', // monument, partner
        rarity: 'common', // common, rare, legendary
        city: '',
        gps_lat: '',
        gps_lng: '',
        gps_radius: 100,
        pin_code: '',
        description: '',
        points_value: 100
    });

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Errore caricamento cards');
        } else {
            setCards(data);
        }
        setLoading(false);
    };

    const handleEdit = (card) => {
        setEditingCard(card);
        setFormData({
            title: card.title,
            image_url: card.image_url || '',
            type: card.type,
            rarity: card.rarity,
            city: card.city || '',
            gps_lat: card.gps_lat || '',
            gps_lng: card.gps_lng || '',
            gps_radius: card.gps_radius || 100,
            pin_code: card.pin_code || '',
            description: card.description || '',
            points_value: card.points_value || 100
        });
        setShowModal(true);
    };

    const handleNew = () => {
        setEditingCard(null);
        setFormData({
            title: '',
            image_url: '',
            type: 'monument',
            rarity: 'common',
            city: '',
            gps_lat: '',
            gps_lng: '',
            gps_radius: 100,
            pin_code: '',
            description: '',
            points_value: 100
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questa card?')) return;

        const { error } = await supabase.from('cards').delete().eq('id', id);
        if (error) {
            toast.error('Errore eliminazione');
        } else {
            toast.success('Card eliminata');
            fetchCards();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.title) return toast.error('Titolo obbligatorio');
        if (formData.type === 'monument' && (!formData.gps_lat || !formData.gps_lng)) {
            return toast.error('Coordinate GPS obbligatorie per i Monumenti');
        }
        if (formData.type === 'partner' && !formData.pin_code) {
            return toast.error('PIN obbligatorio per i Partner');
        }

        const payload = {
            ...formData,
            // Convert numbers
            gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
            gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null,
            gps_radius: parseInt(formData.gps_radius),
            points_value: parseInt(formData.points_value)
        };

        let error;
        if (editingCard) {
            const { error: updateError } = await supabase
                .from('cards')
                .update(payload)
                .eq('id', editingCard.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('cards')
                .insert(payload);
            error = insertError;
        }

        if (error) {
            console.error(error);
            toast.error('Errore salvataggio');
        } else {
            toast.success(editingCard ? 'Card aggiornata' : 'Card creata');
            setShowModal(false);
            fetchCards();
        }
    };

    const filteredCards = cards.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-olive-dark">Gestione Album Figurine</h1>
                    <p className="text-olive-light">Aggiungi monumenti (GPS) o partner (PIN)</p>
                </div>
                <button
                    onClick={handleNew}
                    className="bg-gold text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold/90 transition-colors"
                >
                    <Plus className="w-5 h-5" /> Nuova Card
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-light w-5 h-5" />
                <input
                    type="text"
                    placeholder="Cerca per titolo o città..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-sand focus:border-gold outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table/List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-sand">
                <table className="w-full text-left">
                    <thead className="bg-sand/20 text-olive-dark font-serif">
                        <tr>
                            <th className="p-4">Img</th>
                            <th className="p-4">Titolo</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Rarità</th>
                            <th className="p-4">Città</th>
                            <th className="p-4">Sblocco</th>
                            <th className="p-4 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sand/30">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-olive-light">Caricamento...</td></tr>
                        ) : filteredCards.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-olive-light">Nessuna card trovata</td></tr>
                        ) : (
                            filteredCards.map(card => (
                                <tr key={card.id} className="hover:bg-sand/10 transition-colors">
                                    <td className="p-4">
                                        <img src={card.image_url || 'https://via.placeholder.com/50'} alt="" className="w-10 h-10 rounded object-cover bg-slate-100" />
                                    </td>
                                    <td className="p-4 font-bold text-olive-dark">{card.title}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${card.type === 'monument' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                            {card.type}
                                        </span>
                                    </td>
                                    <td className="p-4 capitalize text-sm">{card.rarity}</td>
                                    <td className="p-4 text-sm">{card.city}</td>
                                    <td className="p-4 text-xs font-mono">
                                        {card.type === 'monument' ? (
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <MapPin className="w-3 h-3" /> GPS
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <Lock className="w-3 h-3" /> PIN: {card.pin_code}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(card)} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(card.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-sand p-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold font-serif text-olive-dark">
                                {editingCard ? 'Modifica Card' : 'Nuova Card'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Titolo</label>
                                    <input required className="w-full p-2 border rounded-lg" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Immagine URL</label>
                                    <input className="w-full p-2 border rounded-lg" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Tipo</label>
                                    <select className="w-full p-2 border rounded-lg" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="monument">Monumento (GPS)</option>
                                        <option value="partner">Partner (PIN)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Rarità</label>
                                    <select className="w-full p-2 border rounded-lg" value={formData.rarity} onChange={e => setFormData({ ...formData, rarity: e.target.value })}>
                                        <option value="common">Comune</option>
                                        <option value="rare">Rara</option>
                                        <option value="legendary">Leggendaria</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Città</label>
                                    <input className="w-full p-2 border rounded-lg" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Punti Valore</label>
                                    <input type="number" className="w-full p-2 border rounded-lg" value={formData.points_value} onChange={e => setFormData({ ...formData, points_value: e.target.value })} />
                                </div>

                                <div className="col-span-2 border-t pt-4 mt-2">
                                    <h3 className="font-bold text-olive-dark mb-3">Dettagli Sblocco</h3>
                                    {formData.type === 'monument' ? (
                                        <div className="grid grid-cols-3 gap-3 bg-blue-50 p-4 rounded-xl">
                                            <div>
                                                <label className="block text-xs font-bold mb-1">Latitudine</label>
                                                <input type="number" step="any" className="w-full p-2 border rounded" value={formData.gps_lat} onChange={e => setFormData({ ...formData, gps_lat: e.target.value })} placeholder="41.xxxx" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-1">Longitudine</label>
                                                <input type="number" step="any" className="w-full p-2 border rounded" value={formData.gps_lng} onChange={e => setFormData({ ...formData, gps_lng: e.target.value })} placeholder="16.xxxx" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-1">Raggio (metri)</label>
                                                <input type="number" className="w-full p-2 border rounded" value={formData.gps_radius} onChange={e => setFormData({ ...formData, gps_radius: e.target.value })} />
                                            </div>
                                            <div className="col-span-3 text-xs text-blue-600">
                         * Usa Google Maps per trovare le coordinate (tasto destro sul punto -> copia valori).
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 p-4 rounded-xl">
                                            <label className="block text-sm font-bold mb-1">Codice PIN (4 cifre)</label>
                                            <input type="text" maxLength={4} className="w-full p-2 border rounded font-mono tracking-widest" value={formData.pin_code} onChange={e => setFormData({ ...formData, pin_code: e.target.value })} placeholder="1234" />
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-olive-dark mb-1">Descrizione</label>
                                    <textarea className="w-full p-2 border rounded-lg h-24" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-600">Annulla</button>
                                <button type="submit" className="flex-1 py-3 bg-gold font-bold rounded-xl text-white flex items-center justify-center gap-2">
                                    <Save className="w-5 h-5" /> Salva
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
