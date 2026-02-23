import React, { useState } from 'react';
import { X, MapPin, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { isUserWithinRadius } from '../utils/geolocation';
import toast from 'react-hot-toast';

const EventUnlockModal = ({ isOpen, onClose, event, onUnlockSuccess }) => {
    const [isChecking, setIsChecking] = useState(false);
    const [pinInput, setPinInput] = useState('');

    if (!isOpen || !event) return null;

    const handleGpsUnlock = async () => {
        setIsChecking(true);
        try {
            if (!event.latitudine || !event.longitudine) {
                toast.error("Coordinate dell'evento mancanti. Impossibile verificare la posizione.");
                return;
            }

            const result = await isUserWithinRadius(event.latitudine, event.longitudine, 50);

            if (result.isWithin) {
                toast.success("Posizione verificata con successo!");
                onUnlockSuccess(event);
            } else {
                toast.error(`Sei troppo lontano dall'evento. Distanza rilevata: ${result.distanceMeters}m (Richiesto: < 50m)`);
            }
        } catch (error) {
            toast.error(error.message || "Impossibile recuperare la posizione GPS. Assicurati di aver concesso i permessi.");
        } finally {
            setIsChecking(false);
        }
    };

    const handlePinUnlock = () => {
        setIsChecking(true);
        setTimeout(() => {
            if (pinInput.trim().toUpperCase() === event.pin_code?.toUpperCase()) {
                toast.success("PIN Corretto! Hai sbloccato la Card.");
                onUnlockSuccess(event);
            } else {
                toast.error("Il PIN inserito non è corretto. Riprova.");
            }
            setIsChecking(false);
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-sm bg-stone-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header Image */}
                <div className="h-48 relative bg-stone-900 shrink-0">
                    <img
                        src={event.immagine_url || "https://images.unsplash.com/photo-1596484552834-8a58f7eb41e8?q=80&w=600&auto=format"}
                        alt={event.titolo}
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-4 left-4 pr-4">
                        <div className="text-gold text-xs font-bold tracking-widest uppercase mb-1 drop-shadow-md">
                            {event.luogo}
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-white leading-tight drop-shadow-lg">
                            {event.titolo}
                        </h3>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    <div className="text-center mb-6">
                        <h4 className="text-olive-dark font-bold text-lg mb-2">Partecipa all'Evento</h4>
                        <p className="text-sm text-olive-light">
                            {event.tipo_sblocco === 'gps'
                                ? "Conferma la tua presenza recandoti nel luogo dell'evento per ricevere la Card in esclusiva."
                                : "Inserisci il PIN Segreto fornito dal nostro Partner Organizzatore per ottenere la ricompensa."}
                        </p>
                    </div>

                    {event.tipo_sblocco === 'gps' ? (
                        <div className="space-y-4">
                            <div className="bg-sand/30 rounded-2xl p-4 border border-sand flex items-start gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                                    <MapPin className="w-5 h-5 text-gold" />
                                </div>
                                <div className="text-sm text-olive-dark">
                                    <span className="font-bold block mb-0.5">Controllo Presenza</span>
                                    Devi trovarti entro un raggio di 50 metri dal punto di interesse designato. Assicurati di attivare il GPS.
                                </div>
                            </div>

                            <button
                                onClick={handleGpsUnlock}
                                disabled={isChecking}
                                className="w-full py-3.5 bg-olive-dark hover:bg-olive-800 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-olive-dark/20"
                            >
                                {isChecking ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Controllo GPS...</>
                                ) : (
                                    <><CheckCircle2 className="w-5 h-5" /> Sono sul posto</>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 mt-2">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <KeyRound className="w-5 h-5 text-gold" />
                                </div>
                                <input
                                    type="text"
                                    value={pinInput}
                                    onChange={(e) => setPinInput(e.target.value)}
                                    placeholder="Inserisci il PIN Segreto"
                                    className="w-full pl-11 pr-4 py-4 bg-white border-2 border-sand focus:border-gold focus:ring-4 focus:ring-gold/20 rounded-xl text-center font-mono text-lg font-bold text-olive-dark placeholder:text-stone-300 transition-all uppercase outline-none"
                                />
                            </div>

                            <button
                                onClick={handlePinUnlock}
                                disabled={isChecking || !pinInput.trim()}
                                className="w-full py-4 bg-gold hover:bg-[#cda429] text-olive-dark rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gold/30 active:scale-[0.98]"
                            >
                                {isChecking ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Verifica in corso...</>
                                ) : (
                                    "Sblocca Ora"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventUnlockModal;
