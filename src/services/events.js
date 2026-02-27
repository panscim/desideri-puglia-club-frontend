import { supabase } from './supabase'

export const EventsService = {
    /**
     * Recupera tutti gli eventi imminenti / attivi, visibili al pubblico.
     */
    async getActiveEvents() {
        try {
            const query = supabase
                .from('eventi_club')
                .select(`
                  *,
                  partners ( id, name, city, logo_url ),
                  cards:ricompensa_card_id ( id, image_url, rarity, title )
                `)
                .eq('disponibile', true)
                .gte('data_fine', new Date().toISOString())
                .order('data_inizio', { ascending: true })

            const { data, error } = await query

            if (error) throw error
            return data || []
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
     * Recupera un singolo evento per ID con dettagli partner e card.
     */
    async getEventById(id) {
        try {
            const { data, error } = await supabase
                .from('eventi_club')
                .select(`
                    *,
                    partners ( id, name, city, logo_url, description ),
                    cards:ricompensa_card_id ( id, image_url, rarity, title, description )
                `)
                .eq('id', id)
                .single()

            if (error) throw error
            return data
        } catch (err) {
            console.error('Error fetching event by id:', err)
            return null
        }
    }
}
