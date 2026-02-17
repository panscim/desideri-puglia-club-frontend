// src/pages/Partner.jsx — Luxury Magazine Style + 2-col Desktop + Category Filter
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";
import {
  Search, ChevronRight, MapPin, Crown, X,
  Map as MapIcon, List, Locate, SlidersHorizontal, ArrowUpRight, BadgeCheck
} from "lucide-react";
import { useTranslation } from 'react-i18next';

// ── LEAFLET IMPORTS ──
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── COORDINATE FALLBACK (Puglia) ──
const CITY_COORDS = {
  "bari": [41.1171, 16.8719],
  "barletta": [41.3183, 16.2819],
  "polignano a mare": [40.9943, 17.2208],
  "polignano": [40.9943, 17.2208],
  "lecce": [40.3516, 18.1718],
  "taranto": [40.4644, 17.2470],
  "brindisi": [40.6327, 17.9413],
  "foggia": [41.4622, 15.5446],
  "monopoli": [40.9503, 17.3022],
  "trani": [41.2767, 16.4186],
  "ostuni": [40.7295, 17.5786],
  "conversano": [40.9669, 17.1147],
  "fasano": [40.8339, 17.3636],
  "andria": [41.2314, 16.2972],
  "altamura": [40.8269, 16.5531],
  "matera": [40.6664, 16.6043],
  "molfetta": [41.2005, 16.5978],
  "bitonto": [41.1087, 16.6901],
  "ruvo di puglia": [41.1149, 16.4859],
  "corato": [41.1515, 16.4119],
  "giovinazzo": [41.1866, 16.6706],
  "castellana grotte": [40.8871, 17.1651],
  "alberobello": [40.7846, 17.2372],
  "locorotondo": [40.7560, 17.3262],
  "martina franca": [40.7018, 17.3385],
  "casamassima": [40.9533, 16.9203],
  "gioia del colle": [40.7992, 16.9244],
  "noci": [40.7933, 17.1281],
  "putignano": [40.8510, 17.1220],
  "santeramo in colle": [40.7916, 16.7612],
  "gravina in puglia": [40.8193, 16.4178],
  "cerignola": [41.2644, 15.9009],
  "manfredonia": [41.6266, 15.9134],
  "san giovanni rotondo": [41.7066, 15.7296],
  "vieste": [41.8813, 16.1767],
  "gallipoli": [40.0556, 17.9917],
  "otranto": [40.1466, 18.4913],
  "nardo": [40.1793, 18.0323],
  "maglie": [40.1191, 18.2981],
  "galatina": [40.1742, 18.1701],
  "bisceglie": [41.2407, 16.5029],
  "mola di bari": [41.0601, 17.0906],
};

function getCoordsForPartner(partner) {
  if (partner.latitude && partner.longitude) return [partner.latitude, partner.longitude];
  const city = (partner.city || "").trim().toLowerCase();
  return CITY_COORDS[city] || null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}



function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom || 12, { duration: 1.2, easeLinearity: 0.25 }); }, [center, zoom]);
  return null;
}

function createPartnerIcon() {
  const color = "#3d5a3e";
  const size = 32;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="${size / 2}" height="${size / 2}" viewBox="0 0 24 24" fill="white" stroke="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="${color}"/></svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const RADIUS_OPTIONS = [
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "20 km", value: 20 },
  { label: "50 km", value: 50 },
];

// ── PARTNER CARD (Reusable) ──
function PartnerCard({ p }) {
  return (
    <Link
      to={`/partner/${p.id}`}
      className="group relative block w-full rounded-[2rem] overflow-hidden shadow-lg shadow-black/5 hover:shadow-2xl hover:shadow-olive-dark/10 transition-all duration-500 transform hover:-translate-y-1 bg-white"
    >
      {/* Cover Image */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
        <img
          src={p.cover_image_url || p.logo_url || "/placeholder.png"}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {p.distance != null && (
            <span className="backdrop-blur-md bg-black/50 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-white/10">
              <Locate size={10} className="text-gold" /> {p.distance} km
            </span>
          )}
        </div>
      </div>

      {/* Content Overlay */}
      <div className="relative px-4 pb-5 -mt-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-[1.2rem] p-4 shadow-sm border border-white/50 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-olive-dark truncate mb-1 leading-tight flex items-center gap-1.5">
              {p.name}
              {p.is_verified && <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500/10 shrink-0" />}
            </h3>
            <div className="flex items-center gap-2 text-[11px] font-medium text-olive-light mb-2">
              <span className="uppercase tracking-wider">{p.category}</span>
              <span className="w-1 h-1 rounded-full bg-sand" />
              <span className="truncate">{p.city}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-gold uppercase tracking-widest group-hover:underline decoration-gold decoration-2 underline-offset-4 transition-all">
              {/* Note: PartnerCard is outside main component, can't use hook easily unless I pass t or move hook. 
                  Actually, I can use useTranslation inside PartnerCard too. */}
              <PartnerCardContent p={p} />
            </div>
          </div>

          {/* Logo */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border-2 border-sand shadow-inner p-0.5 shrink-0">
            <img src={p.logo_url || "/avatar.png"} className="w-full h-full object-cover rounded-lg" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── MAIN COMPONENT ──
export default function Partner() {
  const { t } = useTranslation();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const ALL_KEY = 'all';

  // UI
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [activeCity, setActiveCity] = useState(ALL_KEY);
  const [activeCategory, setActiveCategory] = useState(ALL_KEY);

  // GPS
  const [userPos, setUserPos] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [radius, setRadius] = useState(10);
  const [showRadiusSelector, setShowRadiusSelector] = useState(false);

  // Map
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
        .order("is_verified", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;

      const enriched = (data || []).map((p) => ({ ...p, coords: getCoordsForPartner(p) }));
      // Default sort (initial load): Verified first, then Name
      enriched.sort((a, b) => {
        if (!!a.is_verified === !!b.is_verified) return (a.name || "").localeCompare(b.name || "");
        return a.is_verified ? -1 : 1;
      });
      setPartners(enriched);
    } catch (e) {
      console.error(e);
      toast.error(t('partner.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const requestGPS = () => {
    if (!navigator.geolocation) return toast.error(t('partner.gps_error'));
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);
        setGpsActive(true);
        setGpsLoading(false);
        setMapCenter([latitude, longitude]);
        setMapZoom(12);
        setMapCenter([latitude, longitude]);
        setMapZoom(12);
        toast.success(t('partner.pos_found'));
      },
      () => { setGpsLoading(false); toast.error(t('partner.pos_error')); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearGPS = () => {
    setGpsActive(false); setUserPos(null);
    setMapCenter([41.1171, 16.8719]); setMapZoom(9);
  };

  // ── COMPUTED (cities + categories) ──
  const cities = useMemo(() => {
    const set = new Set();
    partners.forEach((p) => { if (p.city) set.add(p.city); });
    return Array.from(set).sort();
  }, [partners]);

  const categories = useMemo(() => {
    const set = new Set();
    partners.forEach((p) => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [partners]);

  const filtered = useMemo(() => {
    let list = [...partners];
    const q = search.trim().toLowerCase();

    if (activeCity !== ALL_KEY) list = list.filter((p) => p.city === activeCity);
    if (activeCategory !== ALL_KEY) list = list.filter((p) => p.category === activeCategory);
    if (q) list = list.filter((p) => `${p.name} ${p.city} ${p.category}`.toLowerCase().includes(q));

    if (gpsActive && userPos) {
      list = list.map((p) => {
        if (!p.coords) return { ...p, distance: null };
        const dist = haversineKm(userPos[0], userPos[1], p.coords[0], p.coords[1]);
        return { ...p, distance: Math.round(dist * 10) / 10 };
      });
      list = list.filter((p) => p.distance !== null && p.distance <= radius);
      list = list.filter((p) => p.distance !== null && p.distance <= radius);
      // Sort by verified first, then distance
      list.sort((a, b) => {
        if (a.is_verified === b.is_verified) return (a.distance ?? 999) - (b.distance ?? 999);
        return a.is_verified ? -1 : 1;
      });
    } else {
      // Sort by verified first, then name
      list.sort((a, b) => {
        if (a.is_verified === b.is_verified) return (a.name || "").localeCompare(b.name || "");
        return a.is_verified ? -1 : 1;
      });
    }
    return list;
  }, [partners, search, activeCity, activeCategory, gpsActive, userPos, radius]);

  const mappablePartners = useMemo(() => filtered.filter((p) => p.coords), [filtered]);

  // ── RENDER ──
  return (
    <div className="max-w-[900px] mx-auto pb-32">

      {/* ═══ HEADER ═══ */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-black/5 -mx-4 px-4 py-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          {!searchOpen ? (
            <h1 className="text-2xl font-bold text-olive-dark tracking-tight">{t('partner.page_title')}</h1>
          ) : (
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-olive-dark absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                className="w-full bg-sand/20 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-olive-dark/10 transition-all font-medium placeholder:text-olive-light/70"
                placeholder={t('common.search')}
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setSearchOpen(v => !v); if (searchOpen) setSearch(""); }}
              className="w-10 h-10 rounded-full bg-sand/10 hover:bg-sand/30 flex items-center justify-center transition-colors"
            >
              {searchOpen ? <X size={20} className="text-olive-dark" /> : <Search size={20} className="text-olive-dark" />}
            </button>
            <button
              onClick={() => setViewMode(v => v === "list" ? "map" : "list")}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${viewMode === "map" ? "bg-olive-dark text-white shadow-olive-dark/30" : "bg-white border border-sand/50 text-olive-dark hover:bg-sand/10"}`}
            >
              {viewMode === "map" ? <List size={20} /> : <MapIcon size={20} />}
            </button>
          </div>
        </div>

        {/* ═══ ROW 1: GPS + Location Chips ═══ */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={gpsActive ? clearGPS : requestGPS}
            disabled={gpsLoading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${gpsActive
              ? "bg-olive-dark text-white shadow-lg shadow-olive-dark/20"
              : "bg-white border border-sand/50 text-olive-dark hover:bg-sand/20"
              }`}
          >
            {gpsLoading ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Locate size={14} />}
            {t('partner.pos_found')}
          </button>

          {gpsActive && (
            <div className="relative">
              <button
                onClick={() => setShowRadiusSelector(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gold/10 text-olive-dark text-xs font-bold border border-gold/20 whitespace-nowrap"
              >
                <SlidersHorizontal size={12} /> {radius} km
              </button>
              {showRadiusSelector && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-xl border border-sand/30 p-1.5 z-40 min-w-[100px]">
                  {RADIUS_OPTIONS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => { setRadius(r.value); setShowRadiusSelector(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${radius === r.value ? "bg-sand/30 text-olive-dark" : "hover:bg-sand/10 text-olive-light"}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="w-px bg-sand/50 my-1 shrink-0" />

          {/* City Chips */}
          <button
            onClick={() => setActiveCity(ALL_KEY)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCity === ALL_KEY
              ? "bg-olive-dark text-white shadow-md shadow-olive-dark/10"
              : "bg-sand/10 text-olive-dark/70 hover:bg-sand/20 hover:text-olive-dark"
              }`}
          >
            {t('common.all')}
          </button>
          {cities.map(c => (
            <button
              key={c}
              onClick={() => setActiveCity(c)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${c === activeCity
                ? "bg-olive-dark text-white shadow-md shadow-olive-dark/10"
                : "bg-sand/10 text-olive-dark/70 hover:bg-sand/20 hover:text-olive-dark"
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* ═══ ROW 2: Category Chips ═══ */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(ALL_KEY)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border ${activeCategory === ALL_KEY
                ? "bg-gold/10 text-gold border-gold/30"
                : "bg-transparent text-olive-light border-sand/30 hover:border-olive-light hover:text-olive-dark"
                }`}
            >
              {t('common.all')}
            </button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border ${c === activeCategory
                  ? "bg-gold/10 text-gold border-gold/30"
                  : "bg-transparent text-olive-light border-sand/30 hover:border-olive-light hover:text-olive-dark"
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ LOADING ═══ */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-olive-dark border-t-transparent rounded-full" />
        </div>
      )}

      {/* ═══ MAP VIEW ═══ */}
      {!loading && viewMode === "map" && (
        <div className="mt-4 px-2">
          <div className="rounded-[2rem] overflow-hidden border border-sand/30 shadow-2xl shadow-olive-dark/5 h-[50vh] sm:h-[55vh]">
            <MapContainer center={mapCenter} zoom={mapZoom} zoomControl={false} style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-tiles-saturation" />
              <RecenterMap center={mapCenter} zoom={mapZoom} />

              {userPos && (
                <>
                  <Marker position={userPos} icon={L.divIcon({ className: 'user-marker', html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(59,130,246,0.5)"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })} />
                  <Circle center={userPos} radius={radius * 1000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1, dashArray: '4 8' }} />
                </>
              )}

              {mappablePartners.map(p => (
                <Marker key={p.id} position={p.coords} icon={createPartnerIcon()}>
                  <Popup>
                    <div className="text-center p-1 font-sans">
                      <h3 className="font-bold text-sm">{p.name}</h3>
                      <Link to={`/partner/${p.id}`} className="block w-full py-1.5 bg-[#3d5a3e] text-white text-xs font-bold rounded-lg mt-2 hover:bg-black transition">Vedi</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Partner Grid below Map */}
          <div className="mt-6">
            <p className="text-xs font-bold text-olive-dark uppercase tracking-widest mb-4 px-2">{filtered.length} {t('partner.page_title')} sulla mappa</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map(p => <PartnerCard key={p.id} p={p} />)}
            </div>
          </div>
        </div>
      )}

      {/* ═══ LIST VIEW (MAGAZINE GRID) ═══ */}
      {!loading && viewMode === "list" && (
        <div className="mt-4 px-2">
          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-xs font-bold text-olive-dark uppercase tracking-widest">{filtered.length} Esperienze</p>
            {gpsActive && filtered.length === 0 && <button onClick={() => setRadius(50)} className="text-xs underline text-olive-dark font-bold">Estendi Raggio</button>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map(p => <PartnerCard key={p.id} p={p} />)}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 col-span-2">
              <MapPin size={40} className="mx-auto mb-2 text-olive-dark opacity-30" />
              <p className="text-olive-light">{t('partner.not_found')}</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .map-tiles-saturation { filter: saturate(0.8); }
        .leaflet-popup-content-wrapper { border-radius: 16px !important; box-shadow: 0 4px 20px rgba(0,0,0,.12) !important; }
        .leaflet-popup-tip { display: none; }
      `}</style>
    </div>
  );
}