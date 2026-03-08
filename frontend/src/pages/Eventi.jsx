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
        <div className="min-h-[100dvh] bg-bg-primary font-sans text-text-primary pb-24">

            {/* HEADER FIXED */}
            <div className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-border-default px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-surface border border-border-default flex items-center justify-center text-text-primary active:scale-95 transition-all hover:border-accent/30"
                >
                    <CaretLeft size={20} weight="bold" />
                </button>
                <div>
                    <h1 className="text-xl font-serif font-black tracking-tight leading-none text-text-primary">Eventi del Club</h1>
                    <p className="overline !text-text-muted !mb-0 !mt-1">Spegni il telefono, vivi la realtà.</p>
                </div>
            </div>

            {/* LISTA EVENTI */}
            <div className="p-6 flex flex-col gap-10 mt-6">
                {loading ? (
                    <div className="flex flex-col gap-8">
                        {[1, 2].map(i => (
                            <div key={i} className="w-full h-[320px] bg-bg-secondary rounded-[2.5rem] animate-pulse border border-border-default" />
                        ))}
                    </div>
                ) : eventi.length > 0 ? (
                    eventi.map((evento) => (
                        <div key={evento.id} className="relative w-full rounded-[2.5rem] bg-surface border border-border-default overflow-hidden group shadow-sm">

                            {/* Image Cover */}
                            <div className="relative w-full h-[240px]">
                                <img
                                    src={evento.image_url || "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=600&auto=format"}
                                    alt={getLocalized(evento, 'title', i18n.language)}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/80 via-transparent to-transparent" />

                                {/* Date Badge */}
                                {evento.event_date && (
                                    <div className="absolute top-5 left-5 bg-bg-primary/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-border-default flex items-center gap-2.5 shadow-xl">
                                        <CalendarBlank size={18} className="text-accent" weight="fill" />
                                        <span className="text-[13px] font-black tracking-tight text-text-primary">
                                            {format(new Date(evento.event_date), "d MMM", { locale: it })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-7 flex flex-col gap-4 relative z-10">
                                <h2 className="text-[28px] font-serif font-black leading-tight text-text-primary tracking-tight">
                                    {getLocalized(evento, 'title', i18n.language)}
                                </h2>

                                <div className="flex flex-wrap gap-y-3 gap-x-6 text-[13px] font-black uppercase tracking-[0.1em] text-text-muted mt-1">
                                    {evento.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={18} weight="fill" className="text-accent-gold" />
                                            <span>{evento.location}</span>
                                        </div>
                                    )}
                                    {evento.event_date && (
                                        <div className="flex items-center gap-2">
                                            <Clock size={18} weight="fill" className="text-accent-gold" />
                                            <span>{format(new Date(evento.event_date), "HH:mm")}</span>
                                        </div>
                                    )}
                                    {evento.capacity && (
                                        <div className="flex items-center gap-2">
                                            <Ticket size={18} weight="fill" className="text-accent-gold" />
                                            <span>Max {evento.capacity} posti</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-[15px] text-text-muted leading-relaxed mt-2 line-clamp-3 font-medium">
                                    {getLocalized(evento, 'description', i18n.language)}
                                </p>

                                <button
                                    onClick={() => alert("Funzione prenotazione in arrivo!")}
                                    className="btn-primary mt-4 w-full !py-4"
                                >
                                    Partecipa
                                </button>
                            </div>

                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 flex flex-col items-center gap-6 opacity-40">
                        <CalendarBlank size={64} weight="thin" className="text-text-muted" />
                        <div>
                            <h3 className="text-text-muted font-serif font-black text-xl mb-2">Nessun evento</h3>
                            <p className="text-text-muted text-sm font-medium">Controlla di nuovo nei prossimi giorni!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
