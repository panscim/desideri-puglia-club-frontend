// src/pages/Eventi.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventsService } from '../services/events';
import { useTranslation } from 'react-i18next';
import { getLocalized } from '../utils/content';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
    CaretLeft,
    CalendarBlank,
    MapPin,
    Clock,
    Ticket
} from '@phosphor-icons/react';

export default function Eventi() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [eventi, setEventi] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEventi();
    }, []);

    const loadEventi = async () => {
        try {
            setLoading(true);
            const data = await EventsService.getActiveEvents();
            setEventi(data || []);
        } catch (err) {
            console.error('Error loading events:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-zinc-950 font-satoshi text-white pb-24">

            {/* HEADER FIXED */}
            <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 active:scale-95 transition-transform"
                >
                    <CaretLeft size={24} weight="bold" />
                </button>
                <div>
                    <h1 className="text-xl font-black tracking-tight leading-none">Eventi del Club</h1>
                    <p className="text-xs font-geist text-zinc-400 mt-1">Spegni il telefono, vivi la realtà.</p>
                </div>
            </div>

            {/* LISTA EVENTI */}
            <div className="p-4 flex flex-col gap-6 mt-4">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-full h-[300px] bg-zinc-900/50 rounded-2xl animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : eventi.length > 0 ? (
                    eventi.map((evento) => (
                        <div key={evento.id} className="relative w-full rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden group">

                            {/* Image Cover */}
                            <div className="relative w-full h-[220px]">
                                <img
                                    src={evento.image_url || "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=600&auto=format"}
                                    alt={getLocalized(evento, 'title', i18n.language)}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                                {/* Date Badge */}
                                {evento.event_date && (
                                    <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-xl">
                                        <CalendarBlank size={16} className="text-red-500" weight="fill" />
                                        <span className="text-sm font-bold font-geist">
                                            {format(new Date(evento.event_date), "d MMM", { locale: it })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-5 flex flex-col gap-3 -mt-6 relative z-10">
                                <h2 className="text-[22px] font-black leading-tight drop-shadow-md">
                                    {getLocalized(evento, 'title', i18n.language)}
                                </h2>

                                <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm font-geist text-zinc-400 mt-1">
                                    {evento.location && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={16} weight="fill" className="text-zinc-500" />
                                            <span>{evento.location}</span>
                                        </div>
                                    )}
                                    {evento.event_date && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={16} weight="fill" className="text-zinc-500" />
                                            <span>{format(new Date(evento.event_date), "HH:mm")}</span>
                                        </div>
                                    )}
                                    {evento.capacity && (
                                        <div className="flex items-center gap-1.5">
                                            <Ticket size={16} weight="fill" className="text-zinc-500" />
                                            <span>Max {evento.capacity} posti</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm font-geist text-zinc-300 leading-relaxed mt-2 line-clamp-3">
                                    {getLocalized(evento, 'description', i18n.language)}
                                </p>

                                <button
                                    onClick={() => alert("Funzione prenotazione in arrivo!")}
                                    className="mt-4 w-full bg-white text-zinc-950 font-bold py-3.5 rounded-xl text-[15px] active:scale-[0.98] transition-all shadow-md"
                                >
                                    Partecipa
                                </button>
                            </div>

                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 flex flex-col items-center gap-3">
                        <CalendarBlank size={48} className="text-zinc-700" />
                        <h3 className="text-zinc-400 font-bold text-lg">Nessun evento in programma</h3>
                        <p className="text-zinc-600 text-sm">Controlla di nuovo nei prossimi giorni!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
