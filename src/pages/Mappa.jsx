// src/pages/Mappa.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../services/supabase';
import { QuestService } from '../services/quest';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getLocalized } from '../utils/content';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Target,
    X,
    CaretLeft,
    Compass,
    CalendarBlank,
    MagnifyingGlass
} from '@phosphor-icons/react';
import 'leaflet/dist/leaflet.css';

// Custom Marker — usa solo inline CSS (Tailwind viene purgato da Vite nelle stringhe)
const MARKER_COLORS = {
    storico: { bg: '#1c1917', border: '#c4a35a', glow: 'rgba(196,163,90,0.35)' },   // gold on dark
    cultura: { bg: '#1c1917', border: '#c4a35a', glow: 'rgba(196,163,90,0.35)' },
    natura: { bg: '#111c14', border: '#6aa66a', glow: 'rgba(106,166,106,0.35)' },  // muted green
    trekking: { bg: '#111c14', border: '#6aa66a', glow: 'rgba(106,166,106,0.35)' },
    gastro: { bg: '#1c1410', border: '#c47a2e', glow: 'rgba(196,122,46,0.35)' },  // muted amber
    gastronomia: { bg: '#1c1410', border: '#c47a2e', glow: 'rgba(196,122,46,0.35)' },
    evento: { bg: '#2b1014', border: '#e11d48', glow: 'rgba(225,29,72,0.45)' },   // ruby red for events
    default: { bg: '#18181b', border: '#52525b', glow: 'rgba(82,82,91,0.3)' },     // zinc
};

const createCustomMarker = (type, isActive, isEvent = false) => {
    const key = isEvent ? 'evento' : (type?.toLowerCase() || 'default');
    let colors = MARKER_COLORS.default;
    for (const [k, v] of Object.entries(MARKER_COLORS)) {
        if (key.includes(k)) { colors = v; break; }
    }

    const ringStyle = isActive
        ? `box-shadow:0 0 0 3px ${colors.glow},0 6px 24px rgba(0,0,0,0.7);transform:scale(1.12);`
        : `box-shadow:0 4px 16px rgba(0,0,0,0.6);`;

    const svgIcon = isEvent
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="${colors.border}" viewBox="0 0 256 256"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="${colors.border}" viewBox="0 0 256 256"><path d="M128,16a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,16Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,192Zm37.66-93.66a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32-11.32L148.69,104H88a8,8,0,0,1,0-16h64A8,8,0,0,1,165.66,98.34Z"/></svg>`;

    const html = `
      <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <div style="
          width:34px;height:34px;
          border-radius:50% 50% 50% 50% / 55% 55% 45% 45%;
          background:${colors.bg};
          border:1.5px solid ${colors.border};
          ${ringStyle}
          display:flex;align-items:center;justify-content:center;
          transition:transform .15s ease;
        ">
          ${svgIcon}
        </div>
      </div>
    `;

    return L.divIcon({
        html,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
};

// Pulsing user marker
const userLocationIcon = L.divIcon({
    html: `
        <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(196,163,90,0.3);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:relative;width:14px;height:14px;border-radius:50%;background:#c4a35a;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>
        </div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

// Componente per centrare la mappa e controllare gli aggiornamenti di view
const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [center, zoom, map]);
    return null;
};

export default function Mappa() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { profile } = useAuth();

    // Stato
    const [mapItems, setMapItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    // GPS Stato
    const [userLocation, setUserLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState([41.1171, 16.8719]); // Bari default
    const [mapZoom, setMapZoom] = useState(8);

    // Filtri e Ricerca
    const [activeTab, setActiveTab] = useState('saghe'); // 'saghe' | 'eventi'
    const [activeCategory, setActiveCategory] = useState('Tutti');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        loadMapData();
    }, []);

    const loadMapData = async () => {
        setLoading(true);
        try {
            // Fetch sia Saghe che Eventi
            const sagheData = await QuestService.getActiveSets();
            const { EventsService } = await import('../services/events');
            const eventiData = await EventsService.getActiveEvents();

            // Normalizza Saghe
            const normalizedSaghe = (sagheData || []).map(s => {
                let coord = { lat: 41.1171 + (Math.random() * 0.5), lng: 16.8719 + (Math.random() * 0.5) };
                if (s.city?.toLowerCase() === 'trani') coord = { lat: 41.2721, lng: 16.4168 };
                if (s.city?.toLowerCase() === 'barletta') coord = { lat: 41.3168, lng: 16.2764 };
                if (s.city?.toLowerCase() === 'andria') coord = { lat: 41.2268, lng: 16.2979 };

                return {
                    ...s,
                    __itemType: 'saga',
                    lat: s.latitude || coord.lat,
                    lng: s.longitude || coord.lng,
                    _title: s.title || s.titolo,
                    _desc: s.description || s.descrizione,
                    _image: s.image_url || s.map_image_url
                };
            });

            // Normalizza Eventi
            const normalizedEventi = (eventiData || []).map(e => {
                // Genera coordinate fittizie se assenti
                let coord = { lat: 40.3520 + (Math.random() * 0.5), lng: 18.1691 + (Math.random() * 0.5) }; // Lecce offset

                return {
                    ...e,
                    __itemType: 'evento',
                    lat: e.latitudine || coord.lat,
                    lng: e.longitudine || coord.lng,
                    _title: e.titolo || e.title,
                    _desc: e.descrizione || e.description,
                    _image: e.immagine_url || e.image_url
                };
            });

            setMapItems([...normalizedSaghe, ...normalizedEventi]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocalizzazione non supportata dal tuo browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const loc = [latitude, longitude];
                setUserLocation(loc);
                setMapCenter(loc);
                setMapZoom(13);
            },
            (err) => {
                console.warn('GPS Denied or failure:', err);
                alert('Impossibile ottenere la posizione corrente. Controlla i permessi.');
            },
            { enableHighAccuracy: true }
        );
    };

    const categories = ['Tutti', 'Cultura', 'Natura', 'Gastronomia', 'Storico', 'Trekking'];

    const filteredItems = useMemo(() => {
        let result = mapItems;

        // Tab Filter (Saghe vs Eventi)
        result = result.filter(s => s.__itemType === (activeTab === 'saghe' ? 'saga' : 'evento'));

        // Categoria Filter (Applicato principalmente alle Saghe, per gli Eventi lo by-passiamo o lo applichiamo se c'è)
        if (activeCategory !== 'Tutti') {
            result = result.filter(s => {
                if (s.__itemType === 'saga') {
                    return s.quest_type?.toLowerCase().includes(activeCategory.toLowerCase()) ||
                        s.type?.toLowerCase().includes(activeCategory.toLowerCase()) ||
                        s._title?.toLowerCase().includes(activeCategory.toLowerCase());
                }
                // Eventi: simple keyword matching if they don't have a rigid category
                if (s.__itemType === 'evento') {
                    return s._title?.toLowerCase().includes(activeCategory.toLowerCase()) ||
                        s._desc?.toLowerCase().includes(activeCategory.toLowerCase());
                }
                return true;
            });
        }

        // Search Filter
        if (searchQuery.trim() !== '') {
            const lowQ = searchQuery.toLowerCase();
            result = result.filter(s =>
                (s._title || '').toLowerCase().includes(lowQ) ||
                (s.city || s.luogo || '').toLowerCase().includes(lowQ)
            );
        }

        return result;
    }, [mapItems, activeTab, activeCategory, searchQuery]);

    return (
        <div className="relative w-full h-[100dvh] bg-zinc-950 flex flex-col font-satoshi overflow-hidden">

            {/* FLOATING HEADER COMPONENT */}
            <div className="absolute top-0 w-full z-[1000] pointer-events-none flex flex-col gap-4">

                <div className="flex items-center justify-between px-4 pt-12 pb-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-zinc-900/90 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto active:scale-95 transition-transform shadow-lg shrink-0"
                    >
                        <CaretLeft size={24} weight="bold" />
                    </button>

                    <div className="flex-1 px-4 pointer-events-auto relative">
                        <div className="w-full bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-full py-2 px-4 flex items-center gap-2 text-white shadow-xl">
                            <MagnifyingGlass size={18} weight="bold" className="text-zinc-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearching(true)}
                                onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                                placeholder="Cerca città, saghe o eventi..."
                                className="bg-transparent border-none outline-none w-full text-sm font-geist placeholder:text-zinc-500"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="p-1 rounded-full bg-white/10 text-white">
                                    <X size={12} weight="bold" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* TWO-TIER FILTERING */}
                <div className="flex flex-col gap-3 px-4 pb-2 w-full pointer-events-auto">

                    {/* MACRO TABS (Saghe / Eventi) */}
                    <div className="flex items-center bg-zinc-900/80 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-lg shrink-0">
                        <button
                            onClick={() => { setActiveTab('saghe'); setActiveCategory('Tutti'); }}
                            className={`flex-1 py-1.5 rounded-full text-sm font-bold transition-all ${activeTab === 'saghe' ? 'bg-white text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            Esplora Saghe
                        </button>
                        <button
                            onClick={() => { setActiveTab('eventi'); setActiveCategory('Tutti'); }}
                            className={`flex-1 py-1.5 rounded-full text-sm font-bold transition-all ${activeTab === 'eventi' ? 'bg-rose-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            Eventi del Club
                        </button>
                    </div>

                    {/* SUB-CATEGORIES PILLS */}
                    <div className="flex overflow-x-auto gap-2 no-scrollbar">
                        {categories.map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveCategory(f)}
                                className={`px-4 py-1.5 rounded-full text-[13px] font-geist font-medium whitespace-nowrap transition-all shadow-md border ${activeCategory === f
                                    ? 'bg-zinc-700 text-white border-zinc-500'
                                    : 'bg-zinc-900/60 backdrop-blur-md text-zinc-400 border-white/5'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                </div>
            </div>

            {/* LEAFLET MAP */}
            <div className="flex-1 w-full h-full relative z-[0]">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    zoomControl={false}
                    className="w-full h-full bg-zinc-950"
                >
                    <MapController center={mapCenter} zoom={mapZoom} />

                    {/* CARTO DB DARK MATTER THEME */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {/* USER LOCATION MARKER */}
                    {userLocation && (
                        <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={100} />
                    )}

                    {/* MARKERS (Saghe & Eventi) */}
                    {filteredItems.map(item => (
                        <Marker
                            key={`${item.__itemType}-${item.id}`}
                            position={[item.lat, item.lng]}
                            icon={createCustomMarker(item.quest_type, selectedItem?.id === item.id, item.__itemType === 'evento')}
                            eventHandlers={{
                                click: () => {
                                    setSelectedItem(item);
                                    setMapCenter([item.lat, item.lng]);
                                    setMapZoom(14);
                                }
                            }}
                        />
                    ))}
                </MapContainer>
            </div>

            {/* QUICK SEARCH VISUAL RESULTS (If typing) */}
            <AnimatePresence>
                {isSearching && searchQuery.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-28 left-4 right-4 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-[1001] max-h-[40vh] overflow-y-auto no-scrollbar"
                    >
                        {filteredItems.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500 font-geist text-sm">Nessun risultato trovato</div>
                        ) : (
                            <div className="flex flex-col">
                                {filteredItems.slice(0, 5).map(item => (
                                    <button
                                        key={`search-${item.__itemType}-${item.id}`}
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setMapCenter([item.lat, item.lng]);
                                            setMapZoom(14);
                                            setSearchQuery('');
                                            setIsSearching(false);
                                        }}
                                        className="flex items-center gap-3 p-3 border-b border-white/5 hover:bg-white/5 transition-colors text-left"
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.__itemType === 'evento' ? 'bg-rose-500/20 text-rose-500' : 'bg-gold/20 text-gold'}`}>
                                            {item.__itemType === 'evento' ? <CalendarBlank weight="fill" /> : <MapPin weight="fill" />}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-white font-bold text-sm truncate">{item._title}</span>
                                            <span className="text-zinc-500 text-xs truncate capitalize">{item.__itemType} • {item.city || item.luogo || 'Puglia'}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING ACTION BUTTONS */}
            <div className="absolute right-4 bottom-28 z-[1000] flex flex-col gap-3 pointer-events-auto">
                <button
                    onClick={requestLocation}
                    className="w-12 h-12 rounded-full bg-blue-600 shadow-xl shadow-blue-900/20 text-white flex items-center justify-center animate-bounce-short active:scale-95 transition-transform"
                >
                    <Target size={24} weight="bold" />
                </button>
            </div>

            {/* BOTTOM SHEET MOUNT (SAGA OR EVENT PREVIEW) */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute bottom-0 left-0 right-0 z-[1000] bg-zinc-900 border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col pointer-events-auto"
                    >
                        <div className="w-full flex justify-center pt-3 pb-1">
                            <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-sm ${selectedItem.__itemType === 'evento' ? 'border-rose-500/30 text-rose-500 bg-rose-500/10' : 'border-red-500/30 text-red-500 bg-red-500/10'}`}>
                                            {selectedItem.__itemType === 'evento' ? 'Evento' : 'Originals'}
                                        </span>
                                        {(selectedItem.city || selectedItem.luogo) && (
                                            <span className="text-zinc-400 text-[12px] font-geist flex items-center gap-1">
                                                <MapPin weight="fill" /> {selectedItem.city || selectedItem.luogo}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black text-white leading-tight">
                                        {selectedItem._title}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-1.5 bg-zinc-800 rounded-full text-zinc-400"
                                >
                                    <X size={18} weight="bold" />
                                </button>
                            </div>

                            <div className="w-full h-40 rounded-xl overflow-hidden relative shadow-inner">
                                <img
                                    src={selectedItem._image || "https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format"}
                                    alt={selectedItem._title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
                                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white text-xs font-bold">
                                    {selectedItem.__itemType === 'evento' ? (
                                        <><CalendarBlank size={16} /> <span>{new Date(selectedItem.data_inizio || selectedItem.event_date).toLocaleDateString('it-IT')}</span></>
                                    ) : (
                                        <><Compass size={16} /> <span>{selectedItem.difficulty || 'Avventura Epica'}</span></>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm font-geist text-zinc-300 line-clamp-2 leading-relaxed">
                                {selectedItem._desc}
                            </p>

                            <button
                                onClick={() => {
                                    if (selectedItem.__itemType === 'evento') navigate('/eventi');
                                    else navigate(`/saga/${selectedItem.id}/intro`);
                                }}
                                className={`w-full text-zinc-950 font-bold py-3.5 rounded-xl text-md active:scale-[0.98] transition-transform shadow-lg ${selectedItem.__itemType === 'evento' ? 'bg-rose-500 text-white' : 'bg-white shadow-white/10'}`}
                            >
                                {selectedItem.__itemType === 'evento' ? 'Altre Info' : 'Inizia Viaggio'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* If there's no selected saga, let the BottomNav space be visible via padding (handled outside this component technically, but let's assume Mappa is fullscreen) */}
        </div>
    );
}
