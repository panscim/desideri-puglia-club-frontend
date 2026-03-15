import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import { calcProfileScore } from '../utils/matching';

// ── Static data ──────────────────────────────────────────────
const CATEGORIES = [
  { id: 'ristorazione', label: 'Ristorazione', icon: '🍽️',
    subs: ['Ristorante tipico pugliese','Osteria','Trattoria','Fine dining','Ristorante vista mare','Ristorante in masseria','Seafood restaurant','Pizzeria','Bistrot','Street food locale','Brunch spot','Wine restaurant','Ristorante romantico','Family restaurant','Vegetariano / Vegano'] },
  { id: 'ospitalita', label: 'Ospitalità', icon: '🏡',
    subs: ['B&B','Casa vacanze','Boutique hotel','Masseria','Agriturismo','Resort','Glamping','Ostello','Dimora storica','Wellness stay','Pet-friendly stay'] },
  { id: 'esperienze', label: 'Esperienze & Tour', icon: '🧭',
    subs: ['Tour guidato città','Food tour','Wine tour','Tour in masseria','Boat tour','Escursione in bici','Walking tour','Cooking class','Laboratorio artigianale','Attività per famiglie','Tour fotografico','Tour serale','Esperienza privata'] },
  { id: 'food_specialita', label: 'Food & Specialità', icon: '🫙',
    subs: ['Enoteca','Cantina','Oleificio','Caseificio','Forno tipico','Pasticceria artigianale','Gelateria artigianale','Bottega gastronomica','Pescheria con degustazione','Specialty coffee'] },
  { id: 'nightlife', label: 'Nightlife & Social', icon: '🍸',
    subs: ['Cocktail bar','Lounge bar','Wine bar','Beach bar','Pub','Live music venue','Rooftop bar'] },
  { id: 'shopping', label: 'Shopping & Artigianato', icon: '🏺',
    subs: ['Bottega artigiana','Ceramica artistica','Tessuti e ricami','Gioielleria artigianale','Concept store locale','Libreria locale','Galleria / atelier','Prodotti naturali'] },
  { id: 'benessere', label: 'Benessere & Relax', icon: '🌿',
    subs: ['Spa','Centro benessere','Massaggi','Beach club relax','Yoga / retreat','Day use relax'] },
  { id: 'mobilita', label: 'Mobilità', icon: '🚴',
    subs: ['Noleggio bici','Noleggio scooter','Noleggio auto','Transfer privato','Noleggio barca','Shuttle turistico'] },
  { id: 'cultura', label: 'Cultura & Intrattenimento', icon: '🎭',
    subs: ['Museo','Galleria d\'arte','Teatro','Cinema all\'aperto','Venue per eventi','Festival locale','Evento gastronomico','Laboratorio culturale'] },
];

const PRICE_OPTIONS = [
  { id: 'low',     label: '€',       desc: 'Economico',  color: '#4ade80' },
  { id: 'medium',  label: '€€',      desc: 'Medio',      color: '#E8AB5C' },
  { id: 'premium', label: '€€€',     desc: 'Premium',    color: '#D4793A' },
  { id: 'luxury',  label: '€€€€',    desc: 'Luxury',     color: '#a78bfa' },
];

const ATMOSPHERE_OPTIONS = [
  'Autentico','Romantico','Elegante','Informale','Vivace','Slow & rilassante',
  'Esclusivo','Tradizionale','Moderno','Instagrammabile','Gastronomico','Panoramico',
];

const MOMENT_OPTIONS = [
  { id: 'colazione', label: 'Colazione', icon: '☀️' },
  { id: 'brunch',    label: 'Brunch',    icon: '🥐' },
  { id: 'pranzo',    label: 'Pranzo',    icon: '🍝' },
  { id: 'aperitivo', label: 'Aperitivo', icon: '🍷' },
  { id: 'cena',      label: 'Cena',      icon: '🕯️' },
  { id: 'dopocena',  label: 'Dopocena',  icon: '🌙' },
  { id: 'weekend',   label: 'Weekend',   icon: '📅' },
  { id: 'giornata_intera', label: 'Giornata intera', icon: '🗓️' },
];

const TARGET_OPTIONS = [
  { id: 'coppia',       label: 'Coppia',          icon: '💑' },
  { id: 'famiglia',     label: 'Famiglia',        icon: '👨‍👩‍👧' },
  { id: 'amici',        label: 'Amici',           icon: '👯' },
  { id: 'solo_traveler',label: 'Solo traveler',   icon: '🧳' },
  { id: 'business',     label: 'Business',        icon: '💼' },
  { id: 'gruppi',       label: 'Gruppi',          icon: '👥' },
  { id: 'bambini',      label: 'Con bambini',     icon: '👶' },
  { id: 'digital_nomad',label: 'Digital nomad',   icon: '💻' },
];

const TAG_GROUPS = [
  { group: 'emozione',  label: 'Atmosfera',
    tags: [
      { id: 'autentico', label: 'Autentico' }, { id: 'romantico', label: 'Romantico' },
      { id: 'esclusivo', label: 'Esclusivo' }, { id: 'informale', label: 'Informale' },
      { id: 'slow', label: 'Slow' }, { id: 'esperienziale', label: 'Esperienziale' },
      { id: 'panoramico', label: 'Panoramico' }, { id: 'instagrammabile', label: 'Instagrammabile' },
    ]},
  { group: 'contesto', label: 'Dove sei',
    tags: [
      { id: 'centro_storico', label: 'Centro storico' }, { id: 'mare', label: 'Mare' },
      { id: 'campagna', label: 'Campagna' }, { id: 'borgo', label: 'Borgo' },
      { id: 'terrazza', label: 'Terrazza' }, { id: 'vista_mare', label: 'Vista mare' },
      { id: 'outdoor', label: 'Outdoor' }, { id: 'indoor', label: 'Indoor' },
    ]},
  { group: 'stile', label: 'Stile',
    tags: [
      { id: 'food_lover', label: 'Food lover' }, { id: 'hidden_gems', label: 'Hidden gems' },
      { id: 'wine', label: 'Wine' }, { id: 'artigianato', label: 'Artigianato' },
      { id: 'wellness', label: 'Wellness' }, { id: 'nightlife', label: 'Nightlife' },
      { id: 'photo_spot', label: 'Photo spot' }, { id: 'tradizione', label: 'Tradizione' },
    ]},
];

const FEATURES = [
  { id: 'family_friendly', label: 'Family friendly',     icon: '👶' },
  { id: 'pet_friendly',    label: 'Pet friendly',        icon: '🐾' },
  { id: 'accessible',      label: 'Accessibile',         icon: '♿' },
  { id: 'parking',         label: 'Parcheggio',          icon: '🅿️' },
  { id: 'booking_required',label: 'Prenotazione richiesta', icon: '📅' },
  { id: 'outdoor_seating', label: 'Posti esterni',       icon: '🌿' },
  { id: 'wifi',            label: 'WiFi disponibile',    icon: '📶' },
  { id: 'english_spoken',  label: 'Parlano inglese',     icon: '🇬🇧' },
];

const TOTAL_STEPS = 4;
const T = {
  dark: '#111',
  terra: '#D4793A',
  bg: '#F9F9F7',
  text: '#1F2933',
  muted: '#6B7280',
  border: '#E5E7EB',
  serif: "'Playfair Display', Georgia, serif",
};

// ── Component ────────────────────────────────────────────────
export default function PartnerAdvancedProfileModal({ isOpen, onClose, partner, onComplete }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState({
    subcategory:   partner?.subcategory   || '',
    price_range:   partner?.price_range   || '',
    atmosphere:    partner?.atmosphere    || [],
    ideal_moment:  partner?.ideal_moment  || [],
    ideal_target:  partner?.ideal_target  || [],
    features:      partner?.features      || {},
    selectedTags:  [],
  });

  useEffect(() => {
    if (!partner?.id) return;
    // Load existing tags
    supabase.from('partner_tags').select('tag_id').eq('partner_id', partner.id)
      .then(({ data }) => {
        if (data) setForm(f => ({ ...f, selectedTags: data.map(r => r.tag_id) }));
      });
    // Pre-select category from partner.category
    if (partner.category) {
      const found = CATEGORIES.find(c =>
        c.label.toLowerCase().includes(partner.category.toLowerCase()) ||
        partner.category.toLowerCase().includes(c.label.toLowerCase())
      );
      if (found) setSelectedCategory(found);
    }
  }, [partner?.id]);

  if (!isOpen) return null;

  const progress = (step / TOTAL_STEPS) * 100;
  const activeSubs = selectedCategory?.subs || CATEGORIES.flatMap(c => c.subs);

  const toggleArray = (arr, val) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const handleSave = async () => {
    setSaving(true);
    const tid = toast.loading('Salvataggio...');
    try {
      // Update partner record
      const update = {
        subcategory:   form.subcategory || null,
        price_range:   form.price_range || null,
        atmosphere:    form.atmosphere.length ? form.atmosphere : null,
        ideal_moment:  form.ideal_moment.length ? form.ideal_moment : null,
        ideal_target:  form.ideal_target.length ? form.ideal_target : null,
        features:      form.features,
        advanced_profile_completed_at: new Date().toISOString(),
      };

      // Calculate profile score
      update.profile_score = calcProfileScore(
        { ...partner, ...update },
        form.selectedTags.length
      );

      const { error } = await supabase.from('partners').update(update).eq('id', partner.id);
      if (error) throw error;

      // Sync tags: delete old, insert new
      await supabase.from('partner_tags').delete().eq('partner_id', partner.id);
      if (form.selectedTags.length) {
        const rows = form.selectedTags.map(tag_id => ({ partner_id: partner.id, tag_id }));
        const { error: tagErr } = await supabase.from('partner_tags').insert(rows);
        if (tagErr) console.warn('Tag insert:', tagErr.message);
      }

      toast.success(`Profilo aggiornato! Score: ${update.profile_score}%`, { id: tid });
      onComplete?.({ ...update, tags: form.selectedTags });
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Errore salvataggio', { id: tid });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        style={{
          width: '100%', maxWidth: 580,
          background: '#fff',
          borderRadius: '28px 28px 0 0',
          overflow: 'hidden',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        }}>

        {/* Progress bar */}
        <div style={{ height: 3, background: T.border }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
            style={{ height: '100%', background: T.terra }}
          />
        </div>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:T.terra, marginBottom:2 }}>
              Step {step} di {TOTAL_STEPS}
            </div>
            <div style={{ fontFamily:T.serif, fontSize:18, fontWeight:700, color:T.text, lineHeight:1.2 }}>
              {step === 1 && 'Categoria & Sottocategoria'}
              {step === 2 && 'Prezzo & Atmosfera'}
              {step === 3 && 'Tag & Parole chiave'}
              {step === 4 && 'Dettagli pratici'}
            </div>
          </div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:'50%', border:`1px solid ${T.border}`, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.muted }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 20px 8px' }}>
          <AnimatePresence mode="wait">

            {/* STEP 1 — Category + Subcategory */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <p style={{ fontSize:13, color:T.muted, marginBottom:16 }}>Seleziona la categoria che descrive meglio la tua attività, poi la sottocategoria.</p>

                {/* Category grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:20 }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                      style={{
                        padding:'12px 8px', borderRadius:14, border:`2px solid ${selectedCategory?.id === cat.id ? T.terra : T.border}`,
                        background: selectedCategory?.id === cat.id ? '#FDF1E8' : '#fff',
                        cursor:'pointer', textAlign:'center', transition:'all 0.2s',
                      }}>
                      <div style={{ fontSize:22, marginBottom:4 }}>{cat.icon}</div>
                      <div style={{ fontSize:10, fontWeight:700, color: selectedCategory?.id === cat.id ? T.terra : T.text, lineHeight:1.3 }}>{cat.label}</div>
                    </button>
                  ))}
                </div>

                {/* Subcategory */}
                {selectedCategory && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:T.muted, marginBottom:10 }}>Sottocategoria</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {selectedCategory.subs.map(sub => (
                        <button key={sub} onClick={() => setForm(f => ({ ...f, subcategory: f.subcategory === sub ? '' : sub }))}
                          style={{
                            padding:'7px 14px', borderRadius:100, fontSize:13, cursor:'pointer', transition:'all 0.2s',
                            background: form.subcategory === sub ? T.terra : '#fff',
                            color: form.subcategory === sub ? '#fff' : T.text,
                            border: `1.5px solid ${form.subcategory === sub ? T.terra : T.border}`,
                            fontWeight: form.subcategory === sub ? 600 : 400,
                          }}>{sub}</button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2 — Price + Atmosphere + Moments + Target */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                {/* Price range */}
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:T.muted, marginBottom:12 }}>Fascia di prezzo</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {PRICE_OPTIONS.map(p => (
                      <button key={p.id} onClick={() => setForm(f => ({ ...f, price_range: f.price_range === p.id ? '' : p.id }))}
                        style={{
                          padding:'12px 8px', borderRadius:12, border:`2px solid ${form.price_range === p.id ? p.color : T.border}`,
                          background: form.price_range === p.id ? `${p.color}18` : '#fff',
                          cursor:'pointer', textAlign:'center', transition:'all 0.2s',
                        }}>
                        <div style={{ fontSize:16, fontWeight:900, color: form.price_range === p.id ? p.color : T.text }}>{p.label}</div>
                        <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Moments */}
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:T.muted, marginBottom:12 }}>Quando sei ideale? (anche più di uno)</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {MOMENT_OPTIONS.map(m => (
                      <button key={m.id} onClick={() => setForm(f => ({ ...f, ideal_moment: toggleArray(f.ideal_moment, m.id) }))}
                        style={{
                          padding:'8px 14px', borderRadius:100, fontSize:13, cursor:'pointer', transition:'all 0.2s',
                          display:'flex', alignItems:'center', gap:6,
                          background: form.ideal_moment.includes(m.id) ? T.dark : '#fff',
                          color: form.ideal_moment.includes(m.id) ? '#fff' : T.text,
                          border: `1.5px solid ${form.ideal_moment.includes(m.id) ? T.dark : T.border}`,
                        }}>
                        <span>{m.icon}</span> <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Atmosphere */}
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:T.muted, marginBottom:12 }}>Atmosfera (max 4)</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {ATMOSPHERE_OPTIONS.map(a => {
                      const active = form.atmosphere.includes(a);
                      const disabled = !active && form.atmosphere.length >= 4;
                      return (
                        <button key={a} disabled={disabled} onClick={() => setForm(f => ({ ...f, atmosphere: toggleArray(f.atmosphere, a) }))}
                          style={{
                            padding:'8px 14px', borderRadius:100, fontSize:13, cursor: disabled ? 'default' : 'pointer',
                            opacity: disabled ? 0.4 : 1, transition:'all 0.2s',
                            background: active ? '#FDF1E8' : '#fff',
                            color: active ? T.terra : T.text,
                            border: `1.5px solid ${active ? T.terra : T.border}`,
                            fontWeight: active ? 600 : 400,
                          }}>{a}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Target */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:T.muted, marginBottom:12 }}>Target ideale (anche più di uno)</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {TARGET_OPTIONS.map(t => (
                      <button key={t.id} onClick={() => setForm(f => ({ ...f, ideal_target: toggleArray(f.ideal_target, t.id) }))}
                        style={{
                          padding:'10px 6px', borderRadius:12, border:`2px solid ${form.ideal_target.includes(t.id) ? T.terra : T.border}`,
                          background: form.ideal_target.includes(t.id) ? '#FDF1E8' : '#fff',
                          cursor:'pointer', textAlign:'center', transition:'all 0.2s',
                        }}>
                        <div style={{ fontSize:20, marginBottom:2 }}>{t.icon}</div>
                        <div style={{ fontSize:9, fontWeight:600, color: form.ideal_target.includes(t.id) ? T.terra : T.muted, lineHeight:1.2 }}>{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Tags */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <p style={{ fontSize:13, color:T.muted, marginBottom:20 }}>Scegli le parole che meglio descrivono la tua attività. Più tag scegli, più preciso sarà il matching.</p>
                {TAG_GROUPS.map(group => (
                  <div key={group.group} style={{ marginBottom:24 }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:T.muted, marginBottom:10 }}>{group.label}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {group.tags.map(tag => {
                        const active = form.selectedTags.includes(tag.id);
                        return (
                          <button key={tag.id} onClick={() => setForm(f => ({ ...f, selectedTags: toggleArray(f.selectedTags, tag.id) }))}
                            style={{
                              padding:'8px 14px', borderRadius:100, fontSize:13, cursor:'pointer', transition:'all 0.2s',
                              background: active ? T.dark : '#fff',
                              color: active ? '#fff' : T.text,
                              border: `1.5px solid ${active ? T.dark : T.border}`,
                              fontWeight: active ? 600 : 400,
                              display:'flex', alignItems:'center', gap:4,
                            }}>
                            {active && <Check size={12} />}
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize:12, color:T.muted, background:'#F3F4F6', borderRadius:10, padding:'10px 14px', marginTop:8 }}>
                  ✓ {form.selectedTags.length} tag selezionati — consigliamo almeno 5 per un buon matching
                </div>
              </motion.div>
            )}

            {/* STEP 4 — Practical details */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                <p style={{ fontSize:13, color:T.muted, marginBottom:20 }}>Attiva le caratteristiche presenti nella tua attività. Aiutano i viaggiatori a trovarti nel momento giusto.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {FEATURES.map(feat => {
                    const active = form.features[feat.id];
                    return (
                      <button key={feat.id} onClick={() => setForm(f => ({ ...f, features: { ...f.features, [feat.id]: !active } }))}
                        style={{
                          padding:'14px 12px', borderRadius:14, border:`2px solid ${active ? T.terra : T.border}`,
                          background: active ? '#FDF1E8' : '#fff',
                          cursor:'pointer', textAlign:'left', transition:'all 0.2s',
                          display:'flex', alignItems:'center', gap:10,
                        }}>
                        <span style={{ fontSize:22 }}>{feat.icon}</span>
                        <span style={{ fontSize:13, fontWeight: active ? 600 : 400, color: active ? T.terra : T.text, lineHeight:1.2 }}>{feat.label}</span>
                        {active && <Check size={14} style={{ marginLeft:'auto', color:T.terra }} />}
                      </button>
                    );
                  })}
                </div>

                {/* Preview score */}
                <div style={{ marginTop:24, background:'#F9F9F7', borderRadius:16, padding:20, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:T.muted, marginBottom:10 }}>Punteggio profilo stimato</div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ height:8, background:T.border, borderRadius:100, overflow:'hidden' }}>
                        <motion.div
                          initial={{ width:0 }}
                          animate={{ width: `${calcProfileScore({ ...partner, subcategory: form.subcategory, price_range: form.price_range, atmosphere: form.atmosphere, ideal_moment: form.ideal_moment, ideal_target: form.ideal_target, features: form.features }, form.selectedTags.length)}%` }}
                          style={{ height:'100%', background: T.terra, borderRadius:100 }}
                        />
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize:22, fontWeight:900, color:T.terra, minWidth:46 }}>
                      {calcProfileScore({ ...partner, subcategory: form.subcategory, price_range: form.price_range, atmosphere: form.atmosphere, ideal_moment: form.ideal_moment, ideal_target: form.ideal_target, features: form.features }, form.selectedTags.length)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 20px 24px', borderTop:`1px solid ${T.border}`, display:'flex', gap:10, flexShrink:0 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ height:52, paddingInline:20, borderRadius:100, border:`1.5px solid ${T.border}`, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:T.muted, fontSize:14, fontWeight:500 }}>
              <ChevronLeft size={16} /> Indietro
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button onClick={() => setStep(s => s + 1)}
              style={{ flex:1, height:52, borderRadius:100, background:T.dark, color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:15, fontWeight:700 }}>
              Continua <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              style={{ flex:1, height:52, borderRadius:100, background:T.terra, color:'#fff', border:'none', cursor: saving ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:15, fontWeight:700, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvataggio...' : <><Sparkles size={18}/> Salva e aumenta visibilità</>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
