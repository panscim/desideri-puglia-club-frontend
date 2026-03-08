import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Ticket,
    CalendarBlank,
    Clock,
    MapPin,
    CaretRight,
    Info,
    QrCode
} from '@phosphor-icons/react';
import { EventsService } from '../services/events';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const Biglietti = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await EventsService.getUserDetailedBookings();
                setBookings(data);
            } catch (err) {
                console.error('Error fetching bookings:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchBookings();
        }
    }, [user]);

    const formatEventDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return format(date, "EEE, dd MMM", { locale: it });
        } catch (e) {
            return dateStr;
        }
    };

    const formatEventTime = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return format(date, "HH:mm");
        } catch (e) {
            return "";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
                    <p className="text-zinc-500 font-medium animate-pulse">Caricamento biglietti...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 pb-32">
            {/* Header */}
            <header className="bg-white border-b border-zinc-100 px-6 py-8 sticky top-0 z-30">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-black text-zinc-950 tracking-tight font-satoshi">Biglietti</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Gestisci le tue prenotazioni e i QR Code</p>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 pt-8">
                <AnimatePresence mode="wait">
                    {bookings.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2rem] p-10 border border-zinc-200 border-dashed text-center flex flex-col items-center"
                        >
                            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                                <Ticket size={40} className="text-zinc-300" />
                            </div>
                            <h2 className="text-xl font-bold text-zinc-950 mb-2">Ancora nessun biglietto</h2>
                            <p className="text-zinc-500 text-[15px] leading-relaxed max-w-[280px] mx-auto mb-8">
                                Prenota il tuo posto per i prossimi eventi esclusivi del Club nella sezione Scopri.
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-8 py-3.5 bg-zinc-950 text-white rounded-full font-bold text-[15px] shadow-lg shadow-zinc-950/10 active:scale-95 transition"
                            >
                                Scopri Eventi
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            {bookings.map((booking, index) => {
                                const ev = booking.event;
                                if (!ev) return null;

                                return (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => navigate(`/booking-confirmation/${ev.id}`)}
                                        className="group cursor-pointer relative"
                                    >
                                        {/* Ticket Card Wrapper with Glass Overlay Effect */}
                                        <div className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-zinc-300 transition-all duration-500 flex flex-col relative group-active:scale-[0.98]">

                                            {/* Status Badge - Positioned clearly at the top */}
                                            <div className="px-6 pt-6 flex justify-between items-center">
                                                {booking.status === 'confermato' && (
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                            Confermato
                                                        </span>
                                                    </div>
                                                )}
                                                {/* rimosso badge in attesa */}
                                                {booking.status === 'da_pagare_in_loco' && (
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                                            Pagamento in loco
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-tighter">
                                                    ID: {booking.id.slice(0, 8).toUpperCase()}
                                                </div>
                                            </div>

                                            {/* Main Content */}
                                            <div className="p-6 pt-4 flex gap-5">
                                                {/* Event Image with Premium Border */}
                                                <div className="w-28 h-28 rounded-3xl overflow-hidden flex-shrink-0 border-4 border-zinc-50 shadow-xl relative group-hover:rotate-1 transition-transform duration-500">
                                                    <img
                                                        src={ev.immagine_url || ev.image_url}
                                                        alt={ev.titolo || ev.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>

                                                {/* Info Container */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <h3 className="text-[19px] font-black text-zinc-950 leading-[1.2] mb-4 group-hover:text-zinc-800 transition-colors">
                                                        {ev.titolo || ev.title}
                                                    </h3>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-1.5 text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg">
                                                                <CalendarBlank size={14} weight="fill" />
                                                                <span className="text-[11px] font-bold uppercase tracking-tight">
                                                                    {formatEventDate(ev.data_inizio)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg">
                                                                <Clock size={14} weight="fill" />
                                                                <span className="text-[11px] font-bold tracking-tight">
                                                                    {formatEventTime(ev.data_inizio)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-900 transition-colors">
                                                            <div className="w-5 h-5 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
                                                                <MapPin size={12} weight="bold" />
                                                            </div>
                                                            <span className="text-[12px] font-bold truncate">
                                                                {ev.luogo}, {ev.partners?.city}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Interactive Divider with SVG cutouts */}
                                            <div className="relative h-6 flex items-center px-4">
                                                <div className="w-full border-t-2 border-dashed border-zinc-100" />
                                                <div className="absolute -left-3 w-6 h-6 bg-zinc-50 rounded-full border border-zinc-200 group-hover:border-zinc-300 transition-colors" />
                                                <div className="absolute -right-3 w-6 h-6 bg-zinc-50 rounded-full border border-zinc-200 group-hover:border-zinc-300 transition-colors" />
                                            </div>

                                            {/* Action Bar */}
                                            <div className="px-6 py-5 bg-gradient-to-r from-zinc-50 to-white flex items-center justify-between group-hover:from-zinc-100 group-hover:to-zinc-50 transition-all duration-300">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-2xl bg-zinc-950 flex items-center justify-center text-white shadow-lg transition-transform group-hover:-rotate-6">
                                                            <QrCode size={20} weight="bold" />
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-[13px] font-black text-zinc-950">Mostra QR Code</span>
                                                        <span className="block text-[11px] font-bold text-zinc-400">Valida il tuo ingresso</span>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-950 group-hover:border-zinc-950 group-hover:bg-zinc-950 group-hover:text-white transition-all duration-300">
                                                    <CaretRight size={20} weight="bold" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>

                {/* Info Box */}
                <div className="mt-12 p-6 bg-zinc-100 rounded-[2rem] flex gap-4 border border-zinc-200/50">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 text-zinc-400">
                        <Info size={24} weight="bold" />
                    </div>
                    <div>
                        <h4 className="text-[14px] font-bold text-zinc-900">Come funziona?</h4>
                        <p className="text-[13px] text-zinc-500 leading-relaxed mt-1">
                            Mostra il QR Code presente nel biglietto all'ingresso dell'evento. Una volta scansionato dallo staff, il biglietto verrà contrassegnato come utilizzato.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Biglietti;
