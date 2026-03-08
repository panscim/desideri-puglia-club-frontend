import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { EventsService } from '../services/events';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function QRScannerModal({ isOpen, onClose }) {
    const [scannedId, setScannedId] = useState(null);
    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [hasCameraError, setHasCameraError] = useState(false);

    const triggerHaptic = async (type = 'success') => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: type === 'success' ? ImpactStyle.Heavy : ImpactStyle.Medium });
        }
    };

    const handleCheckBooking = async (idToParse) => {
        setLoading(true);
        setStatusMessage({ type: '', text: '' });

        const res = await EventsService.getBookingById(idToParse);

        if (!res.success || !res.data) {
            setStatusMessage({ type: 'error', text: 'QR Code non riconosciuto dal sistema o ID invalido.' });
            triggerHaptic('error');
            setLoading(false);
            return;
        }

        const data = res.data;
        setBookingData(data);

        if (data.status === 'utilizzato') {
            setStatusMessage({ type: 'error', text: 'Questo biglietto è GIÀ STATO UTILIZZATO.' });
            triggerHaptic('error');
        } else if (data.status === 'annullato') {
            setStatusMessage({ type: 'error', text: 'Questo biglietto risulta ANNULLATO dall\'utente.' });
            triggerHaptic('error');
        } else if (data.status === 'confermato') {
            setStatusMessage({ type: 'success', text: 'Biglietto VALIDO. Convalida in corso...' });
            triggerHaptic('success');
            // VALIDAZIONE AUTOMATICA: per un'esperienza "scan and go"
            setTimeout(() => {
                handleValidate(data); // Passiamo i dati direttamente per evitare dipendenze dallo state appena settato
            }, 300);
        } else {
            setStatusMessage({ type: 'error', text: `Stato biglietto errato: ${data.status}` });
            triggerHaptic('error');
        }

        setLoading(false);
    };

    const handleScan = (detectedCodes) => {
        if (scannedId || !detectedCodes || detectedCodes.length === 0) return;

        const decodedText = detectedCodes[0].rawValue;
        if (!decodedText) return;

        setScannedId(decodedText);
        handleCheckBooking(decodedText);
    };

    const handleError = (error) => {
        console.error('QR Scanner Error:', error);
        if (error?.message?.includes('Permission') || error?.name === 'NotAllowedError') {
            setHasCameraError(true);
            toast.error('Permesso fotocamera negato. Abilitalo nelle impostazioni di iOS/Safari.');
        }
    };

    const handleValidate = async (bookingToValidate = null) => {
        const targetBooking = bookingToValidate || bookingData;
        if (!targetBooking || targetBooking.status !== 'confermato') return;

        setLoading(true);
        const res = await EventsService.validateBooking(targetBooking.id);

        if (res.success) {
            toast.success('Biglietto VALIDATO con successo!');
            triggerHaptic('success');
            setBookingData({ ...bookingData, status: 'utilizzato' });
            setStatusMessage({ type: 'success', text: 'Ingresso convalidato. Il biglietto è ora bruciato.' });
        } else {
            toast.error('Errore durante la validazione. Controlla la connessione.');
            setStatusMessage({ type: 'error', text: 'Errore durante l\'aggiornamento nel database.' });
        }

        setLoading(false);
    };

    const handleReset = () => {
        setScannedId(null);
        setBookingData(null);
        setStatusMessage({ type: '', text: '' });
        setHasCameraError(false);
    };

    const closeAndReset = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative min-h-[500px]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-white z-10 shadow-sm relative">
                    <div>
                        <h2 className="text-xl font-bold font-satoshi text-zinc-900 leading-tight">Scanner Ticket</h2>
                        <p className="text-[13px] font-medium text-zinc-500">Inquadra il QR Code dell'utente</p>
                    </div>
                    <button
                        onClick={closeAndReset}
                        className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="relative bg-zinc-950 flex-1 flex flex-col w-full">
                    {!scannedId ? (
                        hasCameraError ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                                    <AlertCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Fotocamera Bloccata</h3>
                                    <p className="text-zinc-400 text-sm">Hai negato l'accesso alla fotocamera o non è supportata su questo browser. Vai nelle impostazioni di sistema/Safari e consenti l'accesso.</p>
                                </div>
                                <button onClick={handleReset} className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm mt-4">
                                    Riprova
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 w-full h-full relative overflow-hidden">
                                <Scanner
                                    onScan={handleScan}
                                    onError={handleError}
                                    components={{
                                        audio: false,
                                        finder: true,
                                        tracker: true
                                    }}
                                    styles={{
                                        container: { width: '100%', height: '100%', padding: 0 }
                                    }}
                                />
                                {/* Crosshair overlay personalizzato */}
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl"></div>
                                    </div>
                                    <p className="no-theme-flip text-white font-medium text-sm mt-6 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                                        Allinea il QR dentro il riquadro
                                    </p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 gap-4 p-6 text-center z-20 backdrop-blur-xl">
                            {loading ? (
                                <>
                                    <Loader2 size={48} className="no-theme-flip text-white animate-spin" />
                                    <p className="no-theme-flip text-white font-medium mt-2">Verifica in database...</p>
                                </>
                            ) : (
                                <>
                                    {statusMessage.type === 'success' && bookingData?.status === 'confermato' && (
                                        <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 animate-bounce-short">
                                            <CheckCircle size={48} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                        </div>
                                    )}
                                    {statusMessage.type === 'error' && (
                                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-4 animate-pulse">
                                            <AlertCircle size={48} className="text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                                        </div>
                                    )}
                                    {bookingData?.status === 'utilizzato' && (
                                        <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                                            <AlertCircle size={48} className="text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                        </div>
                                    )}

                                    {bookingData && (
                                        <h3 className="no-theme-flip text-[28px] font-black leading-tight text-white mb-2 font-satoshi tracking-tight" style={{ color: '#FFFFFF' }}>
                                            {bookingData?.utenti?.nome} {bookingData?.utenti?.cognome}
                                        </h3>
                                    )}

                                    <div className={`px-5 py-4 mt-2 rounded-[1rem] border shadow-lg ${statusMessage.type === 'success' && bookingData?.status === 'confermato' ? 'bg-emerald-500/20 border-emerald-500/50' :
                                        statusMessage.type === 'error' && bookingData?.status === 'utilizzato' ? 'bg-amber-500/20 border-amber-500/50' :
                                            'bg-red-500/20 border-red-500/50'
                                        }`}>
                                        <p className={`no-theme-flip text-[17px] font-bold tracking-tight ${statusMessage.type === 'success' && bookingData?.status === 'confermato' ? 'text-emerald-300' :
                                            statusMessage.type === 'error' && bookingData?.status === 'utilizzato' ? 'text-amber-300' :
                                                'text-red-300'
                                            }`} style={{ color: statusMessage.type === 'success' && bookingData?.status === 'confermato' ? '#6ee7b7' : statusMessage.type === 'error' && bookingData?.status === 'utilizzato' ? '#fcd34d' : '#fca5a5' }}>
                                            {statusMessage.text}
                                        </p>
                                    </div>

                                    {bookingData && bookingData.status === 'confermato' && statusMessage.type === 'success' && (
                                        <button
                                            onClick={handleValidate}
                                            className="no-theme-flip mt-8 mx-auto w-full max-w-[260px] h-14 bg-emerald-500 hover:bg-emerald-400 rounded-full text-zinc-950 font-black text-[17px] shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={22} weight="bold" />
                                            CONVALIDA BIGLIETTO
                                        </button>
                                    )}

                                    <button
                                        onClick={handleReset}
                                        className="no-theme-flip mt-6 px-8 py-3.5 rounded-full bg-white/10 border border-white/30 text-white text-[15px] font-bold hover:bg-white/20 transition-colors"
                                        style={{ color: '#ffffff' }}
                                    >
                                        Scansiona un altro ticket o Chiudi
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
