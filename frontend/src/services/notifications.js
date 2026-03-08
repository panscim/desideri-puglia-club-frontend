import { supabase } from './supabase';

export const NotificationService = {
    /**
     * Recupera le ultime notifiche per un utente, ordinate per data.
     */
    async getUserNotifications(userId, limit = 20) {
        try {
            if (!userId) return [];

            const { data, error } = await supabase
                .from('notifiche')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    /**
     * Recupera il conteggio solo di quelle non lette.
     */
    async getUnreadCount(userId) {
        try {
            if (!userId) return 0;

            const { count, error } = await supabase
                .from('notifiche')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('letta', false);

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    },

    /**
     * Segna tutte le notifiche non lette di un utente come lette.
     */
    async markAllAsRead(userId) {
        try {
            if (!userId) return false;

            const { error } = await supabase
                .from('notifiche')
                .update({ letta: true })
                .eq('user_id', userId)
                .eq('letta', false);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            return false;
        }
    },

    /**
     * Segna una singola notifica come letta.
     */
    async markAsRead(notificationId) {
        try {
            const { error } = await supabase
                .from('notifiche')
                .update({ letta: true })
                .eq('id', notificationId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    },

    /**
     * Crea una nuova notifica per un determinato utente
     * @param {Object} params - { userId, titolo, messaggio, tipo, link_azione }
     */
    async createNotification({ userId, titolo, messaggio, tipo = 'sistema', link_azione = null }) {
        try {
            if (!userId) return false;

            const { error } = await supabase
                .from('notifiche')
                .insert([{
                    user_id: userId,
                    titolo,
                    messaggio,
                    tipo,
                    link_azione
                }]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error creating notification:', error);
            return false;
        }
    }
};
