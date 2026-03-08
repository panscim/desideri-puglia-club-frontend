import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventsService } from '../services/events';
import { useAuth } from '../contexts/AuthContext';
import BookingQRCode from '../components/BookingQRCode';
import { ArrowLeft } from '@phosphor-icons/react';
import toast from 'react-hot-toast';

const BookingConfirmation = () => {
    const { id } = useParams(); // Questo è event_id
    const navigate = useNavigate();
    const { profile, user } = useAuth();
    const [event, setEvent] = useState(null);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEventAndBooking = async () => {
            try {
                // Fetch the event details
                const allEvents = await EventsService.getActiveEvents();
                const foundEvent = allEvents.find(e => e.id === id);
                if (foundEvent) {
                    setEvent(foundEvent);

                    const url = new URL(window.location.href);
                    const fromCheckout = url.searchParams.get('checkout') === 'success';

                    // Fetch real record in prenotazioni_eventi.
                    // Dopo redirect Stripe il webhook potrebbe impiegare alcuni secondi.
                    let bookingData = null;
                    for (let i = 0; i < (fromCheckout ? 6 : 1); i += 1) {
                        // eslint-disable-next-line no-await-in-loop
                        bookingData = await EventsService.getBookingForUser(id);
                        if (bookingData) break;
                        // eslint-disable-next-line no-await-in-loop
                        await new Promise((resolve) => setTimeout(resolve, 1500));
                    }

                    if (!bookingData) {
                        toast.error('Prenotazione non ancora sincronizzata. Riprova tra pochi secondi.');
                        navigate(-1);
                        return;
                    }
                    setBooking(bookingData);
                } else {
                    toast.error('Evento non trovato');
                    navigate(-1);
                }
            } catch (err) {
                console.error(err);
                toast.error('Errore nel caricamento della prenotazione');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchEventAndBooking();
        }
    }, [id, navigate]);

    const handleCancel = async () => {
        try {
            setLoading(true);
            const res = await EventsService.cancelBooking(id, booking?.id);
            if (res.success) {
                toast.success('Prenotazione annullata con successo');
                navigate('/dashboard'); // Oppure navigate(-1)
            } else {
                toast.error(res.error || 'Errore annullamento');
            }
        } catch (e) {
            toast.error('Errore annullamento');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] bg-stone-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A1A1A]" />
            </div>
        );
    }

    if (!event || !profile || !booking) return null;

    const reservationId = booking.id;
    const bookingStatus = booking.status;

    return (
        <div className="min-h-[100dvh] bg-[#F5F4F0] relative overflow-y-auto"
            style={{
                paddingTop: 'env(safe-area-inset-top, 20px)',
                paddingBottom: 'env(safe-area-inset-bottom, 40px)',
                backgroundImage: 'radial-gradient(circle at 50% 0%, #ffffff 0%, #F5F4F0 100%)'
            }}
        >
            {/* Top Bar */}
            <div className="px-5 py-4 flex items-center justify-between relative z-20">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-sm border border-black/5"
                >
                    <ArrowLeft size={20} color="#1A1A1A" />
                </button>
            </div>

            {/* Content Container */}
            <div className="px-5 pb-32 pt-2">
                <BookingQRCode
                    reservationId={reservationId}
                    bookingStatus={bookingStatus}
                    event={event}
                    userProfile={profile}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    );
};

export default BookingConfirmation;
