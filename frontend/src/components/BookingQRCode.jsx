import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
    User, CalendarBlank, MapPin, CurrencyEur, Buildings, ChatCircle, XCircle
} from '@phosphor-icons/react';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const BookingQRCode = ({ reservationId, bookingStatus, event, userProfile, onCancel }) => {
    const [qrLoaded, setQrLoaded] = useState(false);

    useEffect(() => {
        // Trigger haptic feedback when QR is "loaded"
        const triggerHaptic = async () => {
            if (Capacitor.isNativePlatform()) {
                await Haptics.impact({ style: ImpactStyle.Medium });
            }
            setQrLoaded(true);
        };
        const timer = setTimeout(triggerHaptic, 400);
        return () => clearTimeout(timer);
    }, []);

    const handleCancelClick = async () => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
            const result = await ActionSheet.showActions({
                title: 'Annulla Prenotazione',
                message: 'Sei sicuro di voler annullare la prenotazione?',
                options: [
                    {
                        title: 'Annulla Prenotazione',
                        style: ActionSheetButtonStyle.Destructive,
                    },
                    {
                        title: 'Chiudi',
                        style: ActionSheetButtonStyle.Cancel,
                    },
                ],
            });
            if (result.index === 0) {
                onCancel();
            }
        } else {
            // Fallback per Web
            if (window.confirm('Sei sicuro di voler annullare la prenotazione?')) {
                onCancel();
            }
        }
    };

    const handleContactClick = async () => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
        }

        const phone = event.partners?.telefono || '393331234567'; // Numero partner o default DDP
        const message = `Ciao! Ti scrivo in merito alla mia prenotazione (Ticket: ${reservationId}) per l'evento: *${event.titolo || event.title}*.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleMapClick = async () => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
        }
        // Fallback open map
        const address = encodeURIComponent(event.luogo || event.location || '');
        if (Capacitor.getPlatform() === 'ios') {
            window.open(`http://maps.apple.com/?q=${address}`, '_system');
        } else {
            window.open(`https://maps.google.com/?q=${address}`, '_system');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto relative z-10">
            {/* Main Ticket Card */}
            <div
                className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-white/40 overflow-hidden relative"
                style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)' }}
            >
                {/* Header */}
                <div className="text-center mb-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-1">
                        Ticket Digitale
                    </p>
                    <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-[#1A1A1A] leading-tight">
                        {event.titolo || event.title}
                    </h2>
                </div>

                {/* QR Code Section */}
                <div className="flex justify-center mb-6 relative z-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: qrLoaded ? 1 : 0.8, opacity: qrLoaded ? 1 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
                        className="p-4 bg-white rounded-3xl shadow-lg border border-stone-100 flex flex-col items-center justify-center text-center w-[190px] h-[190px]"
                        style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                    >
                        <QRCodeSVG
                            value={reservationId}
                            size={160} // Dimensione ridotta a 160px
                            bgColor={"#ffffff"}
                            fgColor={"#1A1A1A"}
                            level={"Q"}
                            includeMargin={false}
                            className="rounded-xl overflow-hidden"
                            style={{ borderRadius: '12px' }}
                        />
                    </motion.div>
                </div>

                {/* Ticket Separator Dynamically Placed */}
                <div className="relative mx-[-24px] h-8 flex items-center mb-2">
                    <div className="absolute left-[-16px] w-8 h-8 bg-[#F5F4F0] rounded-full shadow-inner" style={{ boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.04)' }}></div>
                    <div className="absolute right-[-16px] w-8 h-8 bg-[#F5F4F0] rounded-full shadow-inner" style={{ boxShadow: 'inset 2px 0 5px rgba(0,0,0,0.04)' }}></div>
                    <div className="w-full border-t-[2px] border-dashed border-stone-200"></div>
                </div>

                {/* Info List */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center shrink-0">
                            <User size={20} color="#7A7060" weight="regular" />
                        </div>
                        <div className="flex-1 border-b border-stone-100 pb-3">
                            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-0.5">Nome</p>
                            <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-[17px] font-bold text-[#1A1A1A]">
                                {userProfile.nome} {userProfile.cognome}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center shrink-0">
                            <Buildings size={20} color="#7A7060" weight="regular" />
                        </div>
                        <div className="flex-1 border-b border-stone-100 pb-3">
                            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-0.5">Organizzatore</p>
                            <p className="text-[15px] font-semibold text-[#1A1A1A]">
                                {event.partners?.name || 'Desideri Puglia Club'}
                            </p>
                        </div>
                    </div>

                    {event.prezzo > 0 && (
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center shrink-0">
                                <CurrencyEur size={20} color="#7A7060" weight="regular" />
                            </div>
                            <div className="flex-1 border-b border-stone-100 pb-3">
                                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-0.5">Prezzo</p>
                                <p className="text-[15px] font-mono font-medium text-[#1A1A1A]">
                                    {event.prezzo} €
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center shrink-0">
                            <CalendarBlank size={20} color="#7A7060" weight="regular" />
                        </div>
                        <div className="flex-1 border-b border-stone-100 pb-3">
                            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-0.5">Data/Ora</p>
                            <p className="text-[15px] font-semibold text-[#1A1A1A]">
                                {new Date(event.data_inizio || event.starts_at).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4" onClick={handleMapClick} role="button">
                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0 shadow-md">
                            <MapPin size={20} color="#FFFFFF" weight="fill" />
                        </div>
                        <div className="flex-1 pb-1">
                            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-0.5">Luogo</p>
                            <p className="text-[15px] font-medium text-[#1A1A1A] leading-snug">
                                {event.luogo || event.location || event.city}
                            </p>
                            <p className="text-[12px] text-blue-600 mt-1 font-medium">Apri Mappa</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Section */}
            <div className="mt-6 space-y-3">
                <button
                    onClick={handleContactClick}
                    className="w-full h-14 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center gap-2 border border-white/50 shadow-sm active:scale-[0.98] transition-transform"
                >
                    <ChatCircle size={20} color="#1A1A1A" weight="bold" />
                    <span className="font-bold text-[15px] text-[#1A1A1A]">Contatta l'organizzatore</span>
                </button>

                <button
                    onClick={handleCancelClick}
                    className="w-full h-14 bg-white/40 backdrop-blur-md rounded-2xl flex items-center justify-center gap-2 border border-rose-100 shadow-sm active:scale-[0.98] transition-transform"
                >
                    <XCircle size={20} className="text-rose-600/80" weight="bold" />
                    <span className="font-bold text-[14px] text-rose-600/80">Non posso più partecipare</span>
                </button>
            </div>
        </div>
    );
};

export default BookingQRCode;
