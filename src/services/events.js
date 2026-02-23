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
                  partners ( id, nome, citta, logo_url ),
                  cards:ricompensa_card_id ( id, image_url, rarity, title_it )
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
                  partners ( nome ),
                  cards:ricompensa_card_id ( title_it )
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
    }
}
