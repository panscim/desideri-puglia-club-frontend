// src/pages/Partner.jsx — Redesign v2 secondo DailyPlans Design System
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, X, Star, MapTrifold, List, ArrowUpRight as NavigationArrow, ShieldCheck,
  MagnifyingGlass, CaretLeft
} from "@phosphor-icons/react";

// ── LEAFLET ──
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Design Tokens inline (da designTokens.js) ──
const T = {
  serif: "'Libre Baskerville', 'Playfair Display', Georgia, serif",
  bgPage: '#F9F9F7',
  bgNavbar: '#0f0f0f',
  orange: '#f97316',
  terracotta: '#D4793A',
  textPri: '#1F2933',
  textMut: '#6B7280',
  border: '#E5E7EB',
  cardShadow: '0 24px 80px rgba(0,0,0,0.12)',
  gradient: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.15) 80%, transparent 100%)',
};

// ── Coordinate città ──
const CITY_COORDS = {
  "bari": [41.1171, 16.8719], "barletta": [41.3183, 16.2819],
  "polignano a mare": [40.9943, 17.2208], "lecce": [40.3516, 18.1718],
  "taranto": [40.4644, 17.2470], "brindisi": [40.6327, 17.9413],
  "foggia": [41.4622, 15.5446], "monopoli": [40.9503, 17.3022],
  "trani": [41.2767, 16.4186], "ostuni": [40.7295, 17.5786],
  "alberobello": [40.7846, 17.2372], "gallipoli": [40.0556, 17.9917],
  "otranto": [40.1466, 18.4913], "vieste": [41.8813, 16.1767],
  "fasano": [40.8339, 17.3636], "molfetta": [41.2005, 16.5978],
};

function getCoordsForPartner(p) {
  if (p.latitude && p.longitude) return [p.latitude, p.longitude];
  return CITY_COORDS[(p.city || "").trim().toLowerCase()] || null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom || 12, { duration: 1.2 }); }, [center, zoom]);
  return null;
}

function createPartnerIcon() {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width:36px;height:36px;background:${T.orange};border:3px solid white;border-radius:50%;box-shadow:0 4px 16px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="${T.orange}"/></svg>
    </div>`,
    iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36],
  });
}

// ── Stagger Motion ──
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 30, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } } };

// ─────────────────────────────────────────────────────────────
// PARTNER CARD — foto orizzontale + testi sotto, badge D
// ─────────────────────────────────────────────────────────────
function PartnerCard({ p }) {
  const rating = (4.5 + ((p.name?.length || 0) % 6) * 0.1).toFixed(1);
  const reviews = 12 + ((p.name?.length || 0) * 3) % 80;
  const imgSrc = p.cover_image_url || p.logo_url || `https://picsum.photos/seed/${p.id}/600/400`;

  return (
    <motion.div variants={itemVariants} className="mb-5">
      <Link
        to={`/partner/${p.id}`}
        className="group block active:scale-[0.98] transition-transform duration-200"
        style={{
          background: 'white',
          borderRadius: '1.75rem',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          border: `1px solid ${T.border}`,
        }}>

        {/* ── FOTO ORIZZONTALE 16/9 ── */}
        <div className="relative overflow-hidden no-theme-flip" style={{ aspectRatio: '16/9' }}>
          <img
            src={imgSrc} alt={p.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Scrim leggero solo in basso per leggere il badge */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
          />

          {/* Badge — stile "Originals by Desideri di Puglia" */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2 text-on-image">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 no-theme-flip"
              style={{ background: T.orange, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              D
            </div>
            <span className="text-[11px] font-bold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              Certificato by Desideri di Puglia
            </span>
          </div>
        </div>

        {/* ── TESTI SOTTO ── */}
        <div className="px-5 pt-4 pb-5">

          {/* City + Category */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {p.city && (
              <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: T.textMut }}>
                <MapPin size={9} weight="fill" style={{ color: T.orange }} />
                {p.city}
              </span>
            )}
            {p.city && p.category && (
              <span style={{ color: T.border, fontSize: 10 }}>·</span>
            )}
            {p.category && (
              <span
                className="text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full"
                style={{ background: `${T.orange}12`, color: T.terracotta }}>
                {p.category}
              </span>
            )}
            {p.distance != null && (
              <span className="text-[10px] font-semibold ml-auto" style={{ color: T.orange }}>
                {p.distance} km
              </span>
            )}
          </div>

          {/* Nome */}
          <h3
            className="font-black leading-tight mb-2"
            style={{ fontFamily: T.serif, fontSize: '1.15rem', letterSpacing: '-0.02em', color: T.textPri }}>
            {p.name}
          </h3>

          {/* Descrizione */}
          {p.description && (
            <p
              className="text-[12px] leading-relaxed mb-3 line-clamp-2"
              style={{ color: T.textMut }}>
              {p.description}
            </p>
          )}

          {/* Rating + CTA row */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-1.5">
              <Star size={11} weight="fill" style={{ color: T.orange }} />
              <span className="text-[12px] font-black" style={{ color: T.textPri }}>{rating}</span>
              <span className="text-[10px] font-medium" style={{ color: T.textMut }}>({reviews} recensioni)</span>
            </div>
            <span
              className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1 group-hover:gap-2 transition-all duration-300"
              style={{ color: T.orange }}>
              Scopri →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Partner() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const ALL_KEY = 'all';

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [activeCategory, setActiveCategory] = useState(ALL_KEY);
  const [activeCity, setActiveCity] = useState(ALL_KEY);

  const [userPos, setUserPos] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [radius, setRadius] = useState(20);

  const [mapCenter, setMapCenter] = useState([41.1171, 16.8719]);
  const [mapZoom, setMapZoom] = useState(9);

  useEffect(() => { loadPartners(); }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("partners")
        .select("id, name, city, category, description, cover_image_url, logo_url, visits_month, is_active, latitude, longitude, is_verified")
        .eq("is_active", true)
        .eq("subscription_status", "active")
        .order("is_verified", { ascending: false })
        .order("name", { ascending: true });
      if (error) throw error;
      setPartners((data || []).map(p => ({ ...p, coords: getCoordsForPartner(p) })));
    } catch (e) {
      toast.error("Errore nel caricare i partner.");
    } finally {
      setLoading(false);
    }
  };

  const requestGPS = () => {
    if (!navigator.geolocation) return toast.error("GPS non disponibile.");
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setUserPos([latitude, longitude]);
        setGpsActive(true);
        setGpsLoading(false);
        setMapCenter([latitude, longitude]);
        setMapZoom(12);
      },
      () => { setGpsLoading(false); toast.error("Attiva la localizzazione."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearGPS = () => { setGpsActive(false); setUserPos(null); setMapCenter([41.1171, 16.8719]); setMapZoom(9); };

  const categories = useMemo(() => [...new Set(partners.map(p => p.category).filter(Boolean))].sort(), [partners]);
  const cities = useMemo(() => [...new Set(partners.map(p => p.city).filter(Boolean))].sort(), [partners]);

  const filtered = useMemo(() => {
    let list = [...partners];
    const q = search.trim().toLowerCase();
    if (activeCategory !== ALL_KEY) list = list.filter(p => p.category === activeCategory);
    if (activeCity !== ALL_KEY) list = list.filter(p => p.city === activeCity);
    if (q) list = list.filter(p => `${p.name} ${p.city} ${p.category}`.toLowerCase().includes(q));
    if (gpsActive && userPos) {
      list = list
        .map(p => ({ ...p, distance: p.coords ? Math.round(haversineKm(userPos[0], userPos[1], p.coords[0], p.coords[1]) * 10) / 10 : null }))
        .filter(p => p.distance !== null && p.distance <= radius)
        .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    } else {
      list.sort((a, b) => a.is_verified === b.is_verified ? (a.name || "").localeCompare(b.name || "") : a.is_verified ? -1 : 1);
    }
    return list;
  }, [partners, search, activeCategory, activeCity, gpsActive, userPos, radius]);

  const mappablePartners = useMemo(() => filtered.filter(p => p.coords), [filtered]);

  // Pill component locale
  const FilterPill = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border transition-all duration-300 whitespace-nowrap shrink-0"
      style={active
        ? { backgroundColor: T.textPri, color: '#F9F9F7', borderColor: T.textPri }
        : { backgroundColor: 'white', color: T.textMut, borderColor: T.border }
      }>
      {label}
    </button>
  );

  return (
    <div style={{ background: T.bgPage, minHeight: '100vh' }}>

      {/* ══ NAVBAR — stile DailyPlans ══ */}
      <nav
        className="fixed top-0 inset-x-0 z-[100] px-5 h-16 flex items-center justify-between no-theme-flip"
        style={{ backgroundColor: T.bgNavbar, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

        <button
          onClick={() => window.history.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ backgroundColor: '#27272a', border: '1px solid #3f3f46' }}>
          <CaretLeft size={18} weight="bold" color="white" />
        </button>

        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-on-image" style={{ color: 'white' }}>
          Partner
        </p>

        <button
          onClick={() => setViewMode(v => v === 'list' ? 'map' : 'list')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all no-theme-flip"
          style={viewMode === 'map'
            ? { background: T.orange, color: 'white' }
            : { background: '#27272a', border: '1px solid #3f3f46', color: 'white' }}>
          {viewMode === 'map' ? <List size={17} weight="bold" color="white" /> : <MapTrifold size={17} weight="bold" color="white" />}
        </button>
      </nav>

      <main className="pt-28 px-5 max-w-lg mx-auto">

        {/* ══ HEADER HERO — stile DailyPlans ══ */}
        <header className="mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-4">
            <div className="h-[1px] w-8" style={{ background: T.orange }} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: T.orange }}>Eccellenze Locali</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-[2.8rem] font-black leading-[0.9] mb-4 lowercase first-letter:uppercase tracking-tighter"
            style={{ fontFamily: T.serif, color: T.textPri }}>
            I Migliori<br />Partner.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-[13px] font-medium leading-relaxed max-w-[85%]"
            style={{ color: T.textMut }}>
            Strutture selezionate e verificate dal nostro team. Solo chi offre un'esperienza autentica entra.
          </motion.p>
        </header>

        {/* ══ SEARCH ══ */}
        <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mb-8 space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 rounded-[2rem] blur-xl transition-colors"
              style={{ background: 'rgba(0,0,0,0.03)' }} />
            <div className="relative flex items-center gap-3 px-5 h-16 rounded-[2rem] bg-white"
              style={{ border: `1px solid ${T.border}`, boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
              <MagnifyingGlass size={20} style={{ color: T.textMut }} />
              <input
                className="flex-1 bg-transparent outline-none text-[13px] font-black uppercase tracking-widest"
                style={{ color: T.textPri }}
                placeholder="Cerca partner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={16} style={{ color: T.textMut }} />
                </button>
              )}
            </div>
          </div>

          {/* Filter pills row */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-0.5">
            {/* GPS */}
            <button
              onClick={gpsActive ? clearGPS : requestGPS}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border transition-all duration-300 whitespace-nowrap shrink-0"
              style={gpsActive
                ? { backgroundColor: T.textPri, color: '#F9F9F7', borderColor: T.textPri }
                : { backgroundColor: 'white', color: T.textMut, borderColor: T.border }}>
              {gpsLoading
                ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                : <NavigationArrow size={11} weight="bold" />}
              Vicino a me
            </button>

            <div className="w-px h-5 mt-auto mb-auto shrink-0" style={{ background: T.border }} />

            <FilterPill label="Tutte" active={activeCategory === ALL_KEY} onClick={() => setActiveCategory(ALL_KEY)} />
            {categories.map(c => <FilterPill key={c} label={c} active={activeCategory === c} onClick={() => setActiveCategory(c)} />)}
          </motion.div>

          {/* City pills — seconda riga */}
          {cities.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-0.5">
              <FilterPill label="Tutta la Puglia" active={activeCity === ALL_KEY} onClick={() => setActiveCity(ALL_KEY)} />
              {cities.map(c => <FilterPill key={c} label={c} active={activeCity === c} onClick={() => setActiveCity(c)} />)}
            </div>
          )}

          <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: T.textMut }}>
            {filtered.length} {filtered.length === 1 ? 'partner' : 'partner'} disponibili
          </p>
        </motion.section>

        {/* ══ LOADING skeleton ══ */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse" style={{ aspectRatio: '4/5', borderRadius: '3rem', background: '#E4E4E7' }} />
              ))}
            </motion.div>

          ) : viewMode === 'map' ? (
            /* ══ MAP VIEW ══ */
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="overflow-hidden shadow-xl mb-8" style={{ borderRadius: '2rem', height: '55vh', border: `1px solid ${T.border}` }}>
                <MapContainer center={mapCenter} zoom={mapZoom} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <RecenterMap center={mapCenter} zoom={mapZoom} />
                  {userPos && (
                    <>
                      <Marker position={userPos} icon={L.divIcon({ className: '', html: `<div style="width:18px;height:18px;background:${T.textPri};border:3px solid white;border-radius:50%;box-shadow:0 0 16px rgba(0,0,0,0.3)"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] })} />
                      <Circle center={userPos} radius={radius * 1000} pathOptions={{ color: T.orange, fillColor: T.orange, fillOpacity: 0.06, weight: 1.5, dashArray: '5 8' }} />
                    </>
                  )}
                  {mappablePartners.map(p => (
                    <Marker key={p.id} position={p.coords} icon={createPartnerIcon()}>
                      <Popup>
                        <div className="text-center p-2 w-40">
                          <img src={p.cover_image_url || p.logo_url} className="w-full h-16 object-cover rounded-xl mb-2" alt="" />
                          <h3 className="font-bold text-sm leading-tight" style={{ fontFamily: T.serif }}>{p.name}</h3>
                          <p className="text-[10px] mt-0.5" style={{ color: T.orange }}>{p.city}</p>
                          <Link to={`/partner/${p.id}`} className="block mt-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white" style={{ background: T.textPri }}>Scopri</Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-0">
                {filtered.map(p => <PartnerCard key={p.id} p={p} />)}
              </motion.div>
            </motion.div>

          ) : filtered.length === 0 ? (
            /* ══ EMPTY STATE ══ */
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 px-10">
              <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6" style={{ background: '#F4F4F5', border: `1px solid ${T.border}` }}>
                <MapPin size={32} weight="light" style={{ color: '#A1A1AA' }} />
              </div>
              <h3 className="text-xl font-black mb-2 uppercase tracking-tighter" style={{ fontFamily: T.serif, color: T.textPri }}>Nessun partner</h3>
              <p className="text-[13px] font-medium" style={{ color: T.textMut }}>Prova a cambiare i filtri o ampliare il raggio.</p>
              {gpsActive && (
                <button onClick={() => setRadius(r => r + 20)} className="mt-6 px-6 py-3 rounded-2xl text-xs font-bold" style={{ background: T.textPri, color: 'white' }}>
                  Estendi a {radius + 20} km
                </button>
              )}
            </motion.div>

          ) : (
            /* ══ LIST VIEW ══ */
            <motion.div key="list" variants={containerVariants} initial="hidden" animate="show" className="pb-28">
              {filtered.map(p => <PartnerCard key={p.id} p={p} />)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="py-16 flex flex-col items-center gap-5 opacity-40">
          <div className="w-10 h-[1px]" style={{ background: T.textMut }} />
          <p className="text-[8px] font-black uppercase tracking-[0.6em] text-center leading-relaxed" style={{ color: T.textMut }}>
            Eccellenze Pugliesi <br />Desideri Puglia Club © 2026
          </p>
        </footer>
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .leaflet-popup-content-wrapper { border-radius: 20px !important; box-shadow: 0 8px 24px rgba(0,0,0,.12) !important; padding: 0 !important; }
        .leaflet-popup-content { margin: 8px !important; width: auto !important; }
        .leaflet-popup-tip { display: none; }
      `}</style>
    </div>
  );
}
