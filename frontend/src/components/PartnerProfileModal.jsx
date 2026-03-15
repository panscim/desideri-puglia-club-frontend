import { useState, useRef, useEffect } from "react";
import { X, Camera, MapPin, Instagram, Globe, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { colors as TOKENS, typography } from "../utils/designTokens";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";
import { compressImage } from "../utils/imageUtils";

const BUCKET = "partner_assets";

export default function PartnerProfileModal({
  isOpen,
  onClose,
  partner,
  onSuccess
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: partner?.name || "",
    category: partner?.category || "",
    logo_url: partner?.logo_url || "",
    cover_image_url: partner?.cover_image_url || "",
    city: partner?.city || "",
    address: partner?.address || "",
    google_maps_url: partner?.google_maps_url || "",
    phone: partner?.phone || "",
    whatsapp_phone: partner?.whatsapp_phone || "",
    website_url: partner?.website_url || "",
    instagram_url: partner?.instagram_url || "",
    facebook_url: partner?.facebook_url || "",
    tiktok_url: partner?.tiktok_url || "",
    description: partner?.description || "",
  });

  // Previews separate from form data for better UX
  const [previews, setPreviews] = useState({
    logo: partner?.logo_url || null,
    cover: partner?.cover_image_url || null
  });

  const [openingHours, setOpeningHours] = useState(() =>
    Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      closed: true,
      open_time: '',
      close_time: '',
      break_open_time: '',
      break_close_time: '',
    }))
  );

  // Re-sync form when partner loads/changes (partner is null on first render)
  useEffect(() => {
    if (!partner?.id) return;
    setForm({
      name: partner.name || "",
      category: partner.category || "",
      logo_url: partner.logo_url || "",
      cover_image_url: partner.cover_image_url || "",
      city: partner.city || "",
      address: partner.address || "",
      google_maps_url: partner.google_maps_url || "",
      phone: partner.phone || "",
      whatsapp_phone: partner.whatsapp_phone || "",
      website_url: partner.website_url || "",
      instagram_url: partner.instagram_url || "",
      facebook_url: partner.facebook_url || "",
      tiktok_url: partner.tiktok_url || "",
      description: partner.description || "",
    });
    setPreviews({
      logo: partner.logo_url || null,
      cover: partner.cover_image_url || null,
    });
  }, [partner?.id]);

  useEffect(() => {
    if (!partner?.id) return;
    supabase
      .from('partner_opening_hours')
      .select('weekday,open_time,close_time,break_open_time,break_close_time')
      .eq('partner_id', partner.id)
      .order('weekday', { ascending: true })
      .then(({ data }) => {
        if (!data?.length) return;
        setOpeningHours(prev => {
          const next = [...prev];
          data.forEach(row => {
            const i = row.weekday;
            if (i >= 0 && i < 7) {
              next[i] = {
                weekday: i,
                closed: !row.open_time && !row.close_time,
                open_time: row.open_time ? row.open_time.slice(0, 5) : '',
                close_time: row.close_time ? row.close_time.slice(0, 5) : '',
                break_open_time: row.break_open_time ? row.break_open_time.slice(0, 5) : '',
                break_close_time: row.break_close_time ? row.break_close_time.slice(0, 5) : '',
              };
            }
          });
          return next;
        });
      });
  }, [partner?.id]);

  const uploadFile = async (file, type) => {
    if (!file) return;
    try {
      if (!partner?.id) {
        toast.error("Errore: ID partner mancante. Ricarica la pagina.");
        console.error("Partner ID is missing during upload");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Formato non valido. Scegli un'immagine.");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error("Immagine troppo pesante (max 15MB).");
        return;
      }

      // Preview locale immediata
      const localUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [type]: localUrl }));
      setForm(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'cover_image_url']: localUrl }));

      const toastId = toast.loading("Ottimizzazione...");
      const ts = Date.now();

      try {
        const isCover = type === 'cover';
        const [fullW, fullH, thumbW, thumbH] = isCover ? [1200, 675, 480, 270] : [500, 500, 0, 0];

        const compressed = await compressImage(file, { maxWidth: fullW, maxHeight: fullH, quality: 0.82, mimeType: 'image/webp' });
        const filename = `${partner.id}/${type}-${ts}.webp`;

        const uploads = [
          supabase.storage.from(BUCKET).upload(filename, compressed.file, { upsert: true, contentType: 'image/webp' }),
        ];

        // Thumbnail only for cover (logos shown small are already tiny after full compression)
        if (isCover) {
          const thumb = await compressImage(file, { maxWidth: thumbW, maxHeight: thumbH, quality: 0.72, mimeType: 'image/webp' });
          uploads.push(supabase.storage.from(BUCKET).upload(`${partner.id}/${type}-${ts}-thumb.webp`, thumb.file, { upsert: true, contentType: 'image/webp' }));
        }

        const [{ error: upErr }] = await Promise.all(uploads);
        if (upErr) throw upErr;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
        const url = data?.publicUrl;
        setForm(prev => ({ ...prev, [type === 'logo' ? 'logo_url' : 'cover_image_url']: url }));
        setPreviews(prev => ({ ...prev, [type]: url }));
        toast.success("Immagine salvata!", { id: toastId });
      } catch (upErr) {
        console.error("[Upload Error]", upErr);
        toast.error("Caricamento fallito.", { id: toastId });
        return;
      }
    } catch (e) {
      console.error("[Catch Upload]", e);
      toast.error("Errore durante l'upload.");
    }
  };

  const saveOpeningHours = async () => {
    if (!partner?.id) return;
    const rows = openingHours.map(d => ({
      partner_id: partner.id,
      weekday: d.weekday,
      open_time: d.closed ? null : d.open_time || null,
      close_time: d.closed ? null : d.close_time || null,
      break_open_time: d.closed ? null : d.break_open_time || null,
      break_close_time: d.closed ? null : d.break_close_time || null,
    }));
    await supabase.from('partner_opening_hours').upsert(rows, { onConflict: 'partner_id,weekday' });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.name.trim()) return toast.error("Nome attività obbligatorio.");
      if (!form.category) return toast.error("Seleziona una categoria.");
    }
    if (step === 2) {
      if (!form.city.trim()) return toast.error("La città è obbligatoria.");
      if (!form.address.trim()) return toast.error("L'indirizzo è obbligatorio.");
    }
    setStep(s => Math.min(6, s + 1));
  };

  const handleSave = async () => {
    if (!form.description.trim()) return toast.error("Descrivi la tua attività.");
    setSaving(true);
    const toastId = toast.loading("Salvataggio profilo...");
    await saveOpeningHours().catch(() => {});
    
    try {
      // Geocoding manuale via Nominatim (Free, no-auth)
      let lat = partner?.latitude || null;
      let lng = partner?.longitude || null;

      try {
        const searchString = `${form.address} ${form.city}, Italy`.trim();
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchString)}&limit=1`, {
          headers: { 'User-Agent': 'DesideriDiPuglia/1.0' }
        });
        const geoData = await res.json();
        if (geoData && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      } catch (e) {
        console.warn("Geocoding failed:", e);
      }

      const payload = {
        ...form,
        latitude: lat,
        longitude: lng,
        is_active: true, // Profilo completato = visibile (se pagato)
      };

      const { error } = await supabase
        .from("partners")
        .update(payload)
        .eq("id", partner.id);

      if (error) throw error;
      
      toast.success("Profilo completato con successo!", { id: toastId });
      onSuccess(payload);
    } catch (e) {
      console.error(e);
      toast.error("Errore durante il salvataggio.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-[#FAF7F0] rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[85vh] max-h-[800px]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(60,40,20,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Header */}
        <header className="px-6 py-5 border-b border-[#E8DDD0] flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-md">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4793A]">
              Step {step} di 6
            </span>
            <h2 className="text-xl font-black text-zinc-900 leading-tight mt-1" style={{ fontFamily: typography.serif }}>
              Configura il tuo Scrapbook
            </h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#E8DDD0] text-zinc-400 hover:text-zinc-900 hover:scale-105 transition-all">
            <X size={20} />
          </button>
        </header>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-2xl border border-[#E8DDD0] shadow-sm relative rotate-[-1deg]">
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-[#D4793A] text-white text-[9px] font-black uppercase tracking-widest rounded-sm rotate-[2deg]">Identità</div>
                  
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Nome Attività</label>
                      <input 
                        type="text" 
                        value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full bg-[#FAF7F0] border-none rounded-xl px-4 py-3 text-lg font-bold text-zinc-900 focus:ring-2 focus:ring-[#D4793A]/50 placeholder:text-zinc-400"
                        placeholder="Es. Masseria Le Torri"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Categoria Principale</label>
                      <select 
                        value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                        className="w-full bg-[#FAF7F0] border-none rounded-xl px-4 py-3 text-base font-medium text-zinc-900 focus:ring-2 focus:ring-[#D4793A]/50"
                      >
                        <option value="">Seleziona...</option>
                        <option value="Ristorante">Ristorante / Trattoria</option>
                        <option value="Masseria">Masseria / Agriturismo</option>
                        <option value="Esperienza">Esperienza / Tour</option>
                        <option value="Beach Club">Beach Club</option>
                        <option value="Boutique">Boutique / Shop</option>
                        <option value="Cantina">Cantina Vinicola</option>
                        <option value="Altro">Altro (Food & Leisure)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-[#E8DDD0] flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest absolute top-3 left-3">Logo (Quadrato)</label>
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#D5C8B8] flex items-center justify-center bg-[#FAF7F0] mt-6 overflow-hidden relative">
                      {previews.logo ? (
                        <img 
                          key={previews.logo}
                          src={previews.logo} 
                          alt="Logo" 
                          className="w-full h-full object-cover"
                          onError={() => setPreviews(prev => ({ ...prev, logo: null }))}
                        />
                      ) : (
                        <Sparkles size={24} className="text-zinc-300" />
                      )}
                      <input type="file" accept="image/*" onChange={e => uploadFile(e.target.files[0], 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#E8DDD0] flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest absolute top-3 left-3">Foto Copertina</label>
                    <div className="w-full h-20 rounded-xl border-2 border-dashed border-[#D5C8B8] flex items-center justify-center bg-[#FAF7F0] mt-6 overflow-hidden relative">
                      {previews.cover ? (
                        <img 
                          key={previews.cover}
                          src={previews.cover} 
                          alt="Cover" 
                          className="w-full h-full object-cover"
                          onError={() => setPreviews(prev => ({ ...prev, cover: null }))}
                        />
                      ) : (
                        <Camera size={24} className="text-zinc-300" />
                      )}
                      <input type="file" accept="image/*" onChange={e => uploadFile(e.target.files[0], 'cover')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-2xl border border-[#E8DDD0] shadow-sm relative rotate-[1deg]">
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-[#2C413E] text-white text-[9px] font-black uppercase tracking-widest rounded-sm rotate-[-2deg]">Dove sei?</div>
                  
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Città</label>
                      <input 
                        type="text" 
                        value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                        className="w-full bg-[#FAF7F0] border-none rounded-xl px-4 py-3 text-base font-medium text-zinc-900"
                        placeholder="Es. Polignano a Mare"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Indirizzo Fisico</label>
                      <input 
                        type="text" 
                        value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                        className="w-full bg-[#FAF7F0] border-none rounded-xl px-4 py-3 text-base font-medium text-zinc-900"
                        placeholder="Es. Via Roma, 42"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
                        <MapPin size={12} /> Google Maps Link (Opzionale)
                      </label>
                      <input 
                        type="url" 
                        value={form.google_maps_url} onChange={e => setForm({...form, google_maps_url: e.target.value})}
                        className="w-full bg-[#FAF7F0] border-none rounded-xl px-4 py-3 text-sm text-zinc-900"
                        placeholder="Copia e incolla il link di Maps"
                      />
                      <p className="text-[10px] text-zinc-400 mt-1">Aiuta i soci a trovarti più facilmente navigando.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-2xl border border-[#E8DDD0] shadow-sm relative">
                  <div className="space-y-4">
                     <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Telefono Primario</label>
                      <input 
                        type="tel" 
                        value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                        className="w-full bg-[#FAF7F0] border-none rounded-xl px-4 py-3 text-base font-medium text-zinc-900"
                        placeholder="+39 333 1234567"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#25D366] uppercase tracking-widest mb-1">WhatsApp (se diverso)</label>
                      <input 
                        type="tel" 
                        value={form.whatsapp_phone} onChange={e => setForm({...form, whatsapp_phone: e.target.value})}
                        className="w-full bg-[#FAF7F0] border-none rounded-xl px-4 py-3 text-base font-medium text-zinc-900 focus:ring-2 focus:ring-[#25D366]/50"
                        placeholder="Numero per prenotazioni WhatsApp"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-2xl border border-[#E8DDD0] shadow-sm relative">
                  <div className="space-y-4">
                     <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
                        <Globe size={12} /> Sito Web
                      </label>
                      <input 
                        type="url" 
                        value={form.website_url} onChange={e => setForm({...form, website_url: e.target.value})}
                        className="w-full bg-[#FAF7F0] border-none rounded-xl px-4 py-3 text-sm text-zinc-900"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-pink-500 uppercase tracking-widest mb-1">
                        <Instagram size={12} /> Profilo Instagram
                      </label>
                      <input 
                        type="url" 
                        value={form.instagram_url} onChange={e => setForm({...form, instagram_url: e.target.value})}
                        className="w-full bg-[#FAF7F0] border-none rounded-xl px-4 py-3 text-sm text-zinc-900"
                        placeholder="https://instagram.com/tuoprofilo"
                      />
                    </div>
                     <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-black uppercase tracking-widest mb-1">
                        TikTok URL
                      </label>
                      <input 
                        type="url" 
                        value={form.tiktok_url} onChange={e => setForm({...form, tiktok_url: e.target.value})}
                        className="w-full bg-[#FAF7F0] border-none rounded-xl px-4 py-3 text-sm text-zinc-900"
                        placeholder="https://tiktok.com/@tuoprofilo"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Orari di apertura</p>
                {openingHours.map((day, idx) => {
                  const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
                  return (
                    <div key={idx} className="rounded-2xl bg-white border border-[#E8DDD0] overflow-hidden">
                      <div
                        className="flex items-center justify-between px-5 py-4 cursor-pointer"
                        onClick={() => setOpeningHours(prev => prev.map((d, i) => i === idx ? { ...d, closed: !d.closed } : d))}
                      >
                        <span className="text-[14px] font-black text-zinc-950">{DAYS[idx]}</span>
                        <div className="flex items-center gap-3">
                          {day.closed
                            ? <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Chiuso</span>
                            : <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Aperto</span>}
                          <div className="w-12 h-6 rounded-full relative transition-colors" style={{ background: day.closed ? '#E5E7EB' : '#D4793A' }}>
                            <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: day.closed ? '4px' : '28px' }} />
                          </div>
                        </div>
                      </div>
                      {!day.closed && (
                        <div className="px-5 pb-4 space-y-3 border-t border-stone-100 pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 block">Apertura</label>
                              <input type="time" value={day.open_time}
                                onChange={e => setOpeningHours(prev => prev.map((d, i) => i === idx ? { ...d, open_time: e.target.value } : d))}
                                className="w-full px-4 py-3 rounded-xl border border-[#E8DDD0] bg-[#FAF7F0] text-[14px] font-bold text-zinc-950 focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 block">Chiusura</label>
                              <input type="time" value={day.close_time}
                                onChange={e => setOpeningHours(prev => prev.map((d, i) => i === idx ? { ...d, close_time: e.target.value } : d))}
                                className="w-full px-4 py-3 rounded-xl border border-[#E8DDD0] bg-[#FAF7F0] text-[14px] font-bold text-zinc-950 focus:outline-none" />
                            </div>
                          </div>
                          <details>
                            <summary className="text-[10px] font-black uppercase tracking-widest text-zinc-400 cursor-pointer list-none">+ Pausa pranzo</summary>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 block">Inizio pausa</label>
                                <input type="time" value={day.break_open_time}
                                  onChange={e => setOpeningHours(prev => prev.map((d, i) => i === idx ? { ...d, break_open_time: e.target.value } : d))}
                                  className="w-full px-4 py-3 rounded-xl border border-[#E8DDD0] bg-[#FAF7F0] text-[14px] font-bold text-zinc-950 focus:outline-none" />
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 block">Fine pausa</label>
                                <input type="time" value={day.break_close_time}
                                  onChange={e => setOpeningHours(prev => prev.map((d, i) => i === idx ? { ...d, break_close_time: e.target.value } : d))}
                                  className="w-full px-4 py-3 rounded-xl border border-[#E8DDD0] bg-[#FAF7F0] text-[14px] font-bold text-zinc-950 focus:outline-none" />
                              </div>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-2xl border border-[#E8DDD0] shadow-sm relative rotate-[1deg]">
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded-sm rotate-[-2deg]">La tua Storia</div>
                  <div className="pt-2">
                    <p className="text-sm text-zinc-500 mb-4 leading-relaxed">Racconta ai membri del club cosa rende unica la tua realtà. Sii creativo ed emozionante. Questo testo sarà il manifesto del tuo brand nell'app.</p>
                    <textarea
                      value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                      className="w-full bg-[#FAF7F0] border-none rounded-xl px-4 py-3 text-base text-zinc-900 min-h-[160px] resize-none focus:ring-2 focus:ring-zinc-900/20"
                      placeholder="C'era una volta..."
                    />
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <footer className="px-6 py-4 bg-white border-t border-[#E8DDD0] flex items-center justify-between shrink-0">
          <button 
            onClick={() => step > 1 ? setStep(s=>s-1) : onClose()}
            className="px-5 py-3 rounded-xl border border-[#E8DDD0] font-bold text-sm text-zinc-600 hover:bg-stone-50 transition-colors flex items-center gap-2"
          >
            {step === 1 ? 'Indietro' : <><ArrowLeft size={16}/> Indietro</>}
          </button>
          
          {step < 6 ? (
            <button 
              onClick={handleNext}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white flex items-center gap-2 hover:scale-105 transition-all shadow-md"
              style={{ background: '#D4793A' }}
            >
              Continua <ArrowRight size={16}/>
            </button>
          ) : (
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 rounded-xl font-bold text-sm text-white flex items-center gap-2 hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
              style={{ background: '#16a34a' }}
            >
              <CheckCircle2 size={16}/>
              {saving ? 'Salvataggio...' : 'Pubblica Profilo'}
            </button>
          )}
        </footer>
      </motion.div>
    </div>
  );
}
