import { supabase } from './supabase'
import { NotificationService } from './notifications'

export const EventsService = {
    /**
     * Recupera tutti gli eventi imminenti / attivi, visibili al pubblico.
     */
    async getActiveEvents() {
        try {
            // 1. Fetch eventi club (ufficiali)
            const queryClub = supabase
                .from('eventi_club')
                .select(`
                  *,
                  partners ( id, name, city, logo_url ),
                  cards:ricompensa_card_id ( id, image_url, rarity, title )
                `)
                .eq('disponibile', true)

            // 2. Fetch eventi creati dai partner
            const queryPartner = supabase
                .from('partner_events_created')
                .select(`
                  id, title, description, location, city, starts_at, ends_at, interest_tags, is_active,
                  price, available_spots, registration_deadline,
                  partners ( id, name, city, logo_url, subscription_status )
                `)
                .eq('is_active', true)
                .eq('partners.subscription_status', 'active')

            const [clubRes, partnerRes] = await Promise.all([queryClub, queryPartner])

            if (clubRes.error) throw clubRes.error
            if (partnerRes.error) throw partnerRes.error

            // 3. Recuperiamo i conteggi iscritti aggregati
            const { data: bookingCounts, error: countsError } = await supabase
                .from('prenotazioni_eventi')
                .select('event_id')
                .eq('status', 'confermato');

            if (countsError) throw countsError;

            // Creiamo un mappa [id]: count
            const countsMap = (bookingCounts || []).reduce((acc, curr) => {
                acc[curr.event_id] = (acc[curr.event_id] || 0) + 1;
                return acc;
            }, {});

            // Normalizziamo i dati del club
            const clubEvents = (clubRes.data || []).map(ev => ({
                ...ev,
                isGuestEvent: false, // Per distinguere il tipo di routing
                iscritti_count: countsMap[ev.id] || 0,
                data_inizio: ev.data_inizio || ev.event_date, // normalizza il campo data
            }))

            // Normalizziamo i dati del partner in formato compatibile con Eventi.jsx
            const partnerEvents = (partnerRes.data || []).map(ev => ({
                id: ev.id,
                titolo: ev.title,
                descrizione: ev.description,
                luogo: ev.location || ev.city,
                data_inizio: ev.starts_at,
                data_fine: ev.ends_at,
                prezzo: ev.price,
                posti_totali: ev.available_spots,
                categoria: ev.interest_tags?.[0] || 'Partner Event',
                immagine_url: ev.partners?.logo_url || 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?q=80&w=800',
                isGuestEvent: true, // Indica che l'id proviene da partner_events_created
                partners: ev.partners,
                iscritti_count: countsMap[ev.id] || 0
            }))

            const allEvents = [...clubEvents, ...partnerEvents]
                .sort((a, b) => {
                    const aTime = new Date(a.data_inizio).getTime() || 0;
                    const bTime = new Date(b.data_inizio).getTime() || 0;
                    return aTime - bTime;
                })
                .slice(0, 15) // Limit finale

            return allEvents
        } catch (err) {
            console.error('Error fetching active events:', err)
            return []
        }
    },

    /**
     * Recupera tutti gli eventi (per la dashboard Admin).
     */
    async getAllEvents() {
        try {
            const query = supabase
                .from('eventi_club')
                .select(`
                  *,
                  partners ( name ),
                  cards:ricompensa_card_id ( title )
                `)
                .order('data_creazione', { ascending: false })

            const { data, error } = await query

            if (error) throw error
            return data || []
        } catch (err) {
            console.error('Error fetching all events:', err)
            throw err
        }
    },

    /**
     * Crea un nuovo evento.
     */
    async createEvent(eventData) {
        try {
            const { data, error } = await supabase
                .from('eventi_club')
                .insert([eventData])
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (err) {
            console.error('Error creating event:', err)
            return { success: false, error: err.message }
        }
    },

    /**
     * Aggiorna un evento esistente.
     */
    async updateEvent(id, eventData) {
        try {
            const { data, error } = await supabase
                .from('eventi_club')
                .update(eventData)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (err) {
            console.error('Error updating event:', err)
            return { success: false, error: err.message }
        }
    },

    /**
     * Elimina fisicamente un evento.
     */
    async deleteEvent(id) {
        try {
            const { error } = await supabase
                .from('eventi_club')
                .delete()
                .eq('id', id)

            if (error) throw error
            return { success: true }
        } catch (err) {
            console.error('Error deleting event:', err)
            return { success: false, error: err.message }
        }
    },

    /**
     * Sblocca la card ricompensa associata a un evento per l'utente loggato.
     */
    async unlockEventCard(cardId) {
        try {
            const { data: session } = await supabase.auth.getSession()
            const userId = session?.session?.user?.id

            if (!userId) {
                return { success: false, error: 'Devi effettuare il login per sbloccare i premi.' }
            }

            // Verifica se l'utente possiede già questa Card (evita doppi sblocchi)
            const { data: existingCard } = await supabase
                .from('user_cards')
                .select('id')
                .eq('user_id', userId)
                .eq('card_id', cardId)
                .maybeSingle()

            if (existingCard) {
                return { success: false, error: 'Hai già sbloccato questa Card Premio!' }
            }

            // Assegna la Card al portafoglio dell'utente
            const { data, error } = await supabase
                .from('user_cards')
                .insert([{ user_id: userId, card_id: cardId }])
                .select()
                .single()

            if (error) throw error

            return { success: true, data }

        } catch (err) {
            console.error('Error unlocking event card:', err)
            return { success: false, error: err.message }
        }
    },

    /**
     * Recupera un singolo evento per ID cercando prima in eventi_club, poi in partner_events_created.
     */
    async getEventById(id) {
        try {
            // Prova in eventi_club
            const { data: clubData, error: clubError } = await supabase
                .from('eventi_club')
                .select(`
                    *,
                    partners ( id, name, city, logo_url, description ),
                    cards:ricompensa_card_id ( id, image_url, rarity, title, curiosity1_it )
                `)
                .eq('id', id)
                .maybeSingle()
            
            if (clubError) console.error("Error fetching club event:", clubError);

            // Recuperiamo il conteggio iscritti reale per questo evento
            const { count: iscrittiCount } = await supabase
                .from('prenotazioni_eventi')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', id)
                .eq('status', 'confermato');

            if (clubData) return { ...clubData, isGuestEvent: false, iscritti_count: iscrittiCount || 0 }

            // Se non c'è nel club, prova in partner_events_created
            const { data: partnerData } = await supabase
                .from('partner_events_created')
                .select(`
                    *,
                    partners ( id, name, city, logo_url, description, subscription_status )
                `)
                .eq('id', id)
                .maybeSingle()

            if (partnerData) {
                return {
                    id: partnerData.id,
                    titolo: partnerData.title,
                    descrizione: partnerData.description,
                    luogo: partnerData.location || partnerData.city,
                    data_inizio: partnerData.starts_at,
                    data_fine: partnerData.ends_at,
                    prezzo: partnerData.price,
                    posti_totali: partnerData.available_spots,
                    registration_deadline: partnerData.registration_deadline,
                    payment_methods: partnerData.payment_methods,
                    iban: partnerData.iban,
                    payment_instructions: partnerData.payment_instructions,
                    categoria: partnerData.interest_tags?.[0] || 'Partner Event',
                    immagine_url: partnerData.partners?.logo_url || 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?q=80&w=800',
                    isGuestEvent: true,
                    partners: partnerData.partners,
                    iscritti_count: iscrittiCount || 0
                }
            }

            return null
        } catch (err) {
            console.error('Error fetching event by id:', err)
            return null
        }
    },

    /**
     * Recupera tutte le prenotazioni attive per l'utente loggato.
     */
    async getUserBookings() {
        try {
            const { data: session } = await supabase.auth.getSession()
            const userId = session?.session?.user?.id
            if (!userId) return []

            const { data, error } = await supabase
                .from('prenotazioni_eventi')
                .select('event_id')
                .eq('user_id', userId)
                .eq('status', 'confermato')

            if (error) throw error
            return data.map(b => b.event_id)
        } catch (err) {
            console.error('Error fetching user bookings:', err)
            return []
        }
    },

    /**
     * Recupera il record completo della prenotazione per un utente e un evento.
     */
    async getBookingForUser(eventId) {
        try {
            const { data: session } = await supabase.auth.getSession()
            const userId = session?.session?.user?.id
            if (!userId) return null

            const { data, error } = await supabase
                .from('prenotazioni_eventi')
                .select('*')
                .eq('user_id', userId)
                .eq('event_id', eventId)
                .eq('status', 'confermato')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (error) throw error
            return data
        } catch (err) {
            console.error('Error fetching booking for user:', err)
            return null
        }
    },

    /**
     * Crea una nuova prenotazione (biglietto) su Supabase.
     */
    async createBooking(eventId, isGuestEvent = false) {
        try {
            const { data: session } = await supabase.auth.getSession()
            const userId = session?.session?.user?.id
            if (!userId) return { success: false, error: 'Devi essere loggato per prenotare.' }

            // 1. Fetch Event Payment Details to determine initial status
            let eventPaymentMethods = [];
            let partnerUserId = null;

            if (isGuestEvent) {
                const { data: partnerEvent } = await supabase
                    .from('partner_events_created')
                    .select('payment_methods, partner_id, partners(user_id)')
                    .eq('id', eventId)
                    .single();

                eventPaymentMethods = partnerEvent?.payment_methods || [];
                partnerUserId = partnerEvent?.partners?.user_id;
            } else {
                // For admin DDP events, we assume they are always 'confermato' directly, or handle accordingly if they have methods.
                // Assuming admin events don't use these specific methods for now, default to 'confermato'.
            }

            // Determine Status
            let initialStatus = 'confermato';
            if (eventPaymentMethods.includes('in_loco')) {
                initialStatus = 'da_pagare_in_loco';
            } else if (eventPaymentMethods.includes('carta')) {
                initialStatus = 'confermato';
            }

            // 2. Create the Booking
            const { data, error } = await supabase
                .from('prenotazioni_eventi')
                .insert([{
                    user_id: userId,
                    event_id: eventId,
                    is_guest_event: isGuestEvent,
                    status: initialStatus
                }])
                .select()
                .single()

            if (error) throw error

            // 3. INVIA NOTIFICA ALL'ORGANIZZATORE
            try {
                if (isGuestEvent && partnerUserId) {
                    const userName = session?.session?.user?.user_metadata?.first_name || 'Un utente';

                    let notifTitle = '🎉 Nuova Prenotazione!';
                    let notifMessage = `${userName} ha appena prenotato il suo posto al tuo evento.`;

                    if (initialStatus === 'da_pagare_in_loco') {
                        notifMessage = `${userName} ha prenotato e pagherà in loco.`;
                    }

                    await NotificationService.createNotification({
                        userId: partnerUserId,
                        titolo: notifTitle,
                        messaggio: notifMessage,
                        tipo: 'prenotazione',
                        link_azione: '/partner-dashboard'
                    })
                }
            } catch (notifyErr) {
                console.error('Quiet fail info notification:', notifyErr)
            }

            return { success: true, data }
        } catch (err) {
            console.error('Error creating booking:', err)
            return { success: false, error: err.message }
        }
    },

    /**
     * Annulla una prenotazione esistente settando status = 'annullato'.
     */
    async cancelBooking(eventId, bookingId = null) {
        try {
            const { data: session } = await supabase.auth.getSession()
            const userId = session?.session?.user?.id
            if (!userId) return { success: false, error: 'User not authenticated' }

            let bookingQuery = supabase
                .from('prenotazioni_eventi')
                .select('id, user_id, event_id, status')
                .eq('user_id', userId)
                .eq('event_id', eventId)
                .eq('status', 'confermato')
                .order('created_at', { ascending: false })
                .limit(1)

            if (bookingId) bookingQuery = bookingQuery.eq('id', bookingId)

            const { data: bookingRecord, error: bookingReadError } = await bookingQuery.maybeSingle()
            if (bookingReadError) throw bookingReadError
            if (!bookingRecord?.id) return { success: false, error: 'Prenotazione non trovata' }

            // Se il ticket e' stato pagato via Stripe, esegue il rimborso automatico.
            const { data: paymentRecord } = await supabase
                .from('booking_payments')
                .select('id, status, stripe_payment_intent_id')
                .eq('booking_id', bookingRecord.id)
                .maybeSingle()

            if (paymentRecord?.status === 'paid' && paymentRecord?.stripe_payment_intent_id) {
                const refundResp = await fetch('/api/refund-booking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bookingId: bookingRecord.id,
                        eventId,
                        userId,
                    }),
                })
                const refundPayload = await refundResp.json()
                if (!refundResp.ok) {
                    return { success: false, error: refundPayload.error || 'Rimborso non riuscito' }
                }
            }

            const { data, error } = await supabase
                .from('prenotazioni_eventi')
                .update({ status: 'annullato', updated_at: new Date().toISOString() })
                .eq('id', bookingRecord.id)
                .select()

            if (error) throw error

            // INVIA NOTIFICA ANNULLAMENTO ALL'ORGANIZZATORE
            try {
                // Verifichiamo prima se è guest_event per l'evento appena cancellato (potremmo leggere i record di quell'id)
                const { data: bookingData } = await supabase
                    .from('prenotazioni_eventi')
                    .select('is_guest_event')
                    .eq('event_id', eventId)
                    .limit(1).single() // Assumendo che esista

                if (bookingData?.is_guest_event) {
                    const { data: partnerEvent } = await supabase
                        .from('partner_events_created')
                        .select('partner_id, partners(user_id)')
                        .eq('id', eventId)
                        .single()

                    const partnerUserId = partnerEvent?.partners?.user_id
                    if (partnerUserId) {
                        const userName = session?.session?.user?.user_metadata?.first_name || 'Un utente';
                        await NotificationService.createNotification({
                            userId: partnerUserId,
                            titolo: '⚠️ Prenotazione Annullata',
                            messaggio: `${userName} non potrà più partecipare al tuo evento.`,
                            tipo: 'annullamento',
                            link_azione: '/partner-dashboard'
                        })
                    }
                }
            } catch (notifyErr) {
                console.error('Quiet fail info notification:', notifyErr)
            }

            return { success: true, data }
        } catch (err) {
            console.error('Error canceling booking:', err)
            return { success: false, error: err.message }
        }
    },

    /**
     * Recupera i dettagli di una prenotazione tramite il suo ID per lo scanner QR.
     */
    async getBookingById(bookingId) {
        try {
            const { data, error } = await supabase
                .from('prenotazioni_eventi')
                .select(`
                    id, 
                    status, 
                    num_ospiti,
                    event_id,
                    is_guest_event,
                    created_at,
                    utenti ( id, nome, cognome, email )
                `)
                .eq('id', bookingId)
                .maybeSingle()

            if (error) throw error
            return { success: true, data }
        } catch (err) {
            console.error('Error fetching booking by id:', err)
            return { success: false, error: err.message }
        }
    },

    /**
     * Valida (utilizza) un biglietto scansionato.
     */
    async validateBooking(bookingId) {
        try {
            console.log('Validating booking:', bookingId);
            const { data, error } = await supabase
                .from('prenotazioni_eventi')
                .update({ status: 'utilizzato', updated_at: new Date().toISOString() })
                .eq('id', bookingId)
                // Ci assicuriamo di non validare due volte
                .eq('status', 'confermato')
                .select()
                .single()

            if (error) {
                console.error('Supabase error validating booking:', error);
                throw error;
            }
            console.log('Booking validated successfully:', data);
            return { success: true, data }
        } catch (err) {
            console.error('Error validating booking:', err)
            return { success: false, error: err.message }
        }
    },

    /**
     * Recupera il numero di prenotazioni confermate per un evento.
     */
    async getBookingCount(eventId) {
        try {
            const { count, error } = await supabase
                .from('prenotazioni_eventi')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', eventId)
                .eq('status', 'confermato');

            if (error) throw error;
            return count || 0;
        } catch (err) {
            console.error('Error fetching booking count:', err);
            return 0;
        }
    },

    /**
     * Recupera profili dei partecipanti confermati a un evento.
     */
    async getEventParticipants(eventId) {
        try {
            const { data, error } = await supabase
                .from('prenotazioni_eventi')
                .select(`
                    status,
                    utenti!inner ( id, nome, cognome, avatar_url )
                `)
                .eq('event_id', eventId)
                .eq('status', 'confermato')
                .limit(50); // Limit per performance

            if (error) throw error;

            return (data || []).map(b => ({
                name: `${b.utenti?.nome || ''} ${b.utenti?.cognome ? b.utenti.cognome.charAt(0) + '.' : ''}`.trim(),
                avatar: b.utenti?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.utenti?.nome || 'U')}&background=random`
            }));
        } catch (err) {
            console.error('Error fetching event participants:', err);
            return [];
        }
    },

    /**
     * Recupera tutte le prenotazioni confermate dell'utente con dettagli dell'evento.
     */
    async getUserDetailedBookings() {
        try {
            const { data: session } = await supabase.auth.getSession()
            const userId = session?.session?.user?.id
            if (!userId) return []

            const { data: bookings, error } = await supabase
                .from('prenotazioni_eventi')
                .select(`
                    id,
                    event_id,
                    status,
                    created_at,
                    is_guest_event
                `)
                .eq('user_id', userId)
                .eq('status', 'confermato')
                .order('created_at', { ascending: false });

            if (error) throw error
            if (!bookings || bookings.length === 0) return []

            const detailedBookings = await Promise.all(
                bookings.map(async (b) => {
                    const eventDetails = await this.getEventById(b.event_id);
                    return {
                        ...b,
                        event: eventDetails
                    };
                })
            );

            return detailedBookings.filter(b => b.event !== null);
        } catch (err) {
            console.error('Error fetching detailed user bookings:', err)
            return []
        }
    }
}
