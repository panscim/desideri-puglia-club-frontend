import { supabase } from './supabase';

export const PartnerService = {
    /**
     * Recupera le statistiche reali per un partner.
     * @param {string} partnerId 
     * @param {string} pinCode 
     */
    async getPartnerStats(partnerId, pinCode) {
        try {
            // 1. Cercare la card associata al partner tramite pin_code
            const { data: card, error: cardError } = await supabase
                .from('cards')
                .select('id')
                .eq('pin_code', pinCode)
                .maybeSingle();

            if (cardError) throw cardError;

            let completedUnlocks = 0;
            let recentAccesses = [];
            let weeklyData = [
                { name: "Lun", unlocks: 0 },
                { name: "Mar", unlocks: 0 },
                { name: "Mer", unlocks: 0 },
                { name: "Gio", unlocks: 0 },
                { name: "Ven", unlocks: 0 },
                { name: "Sab", unlocks: 0 },
                { name: "Dom", unlocks: 0 },
            ];

            if (card) {
                // 2. Conteggio totale sblocchi (tutti i tempi)
                const { count, error: countError } = await supabase
                    .from('user_cards')
                    .select('*', { count: 'exact', head: true })
                    .eq('card_id', card.id);

                if (countError) throw countError;
                completedUnlocks = count || 0;

                // 3. Ultimi accessi reali (ultimi 10 sblocchi)
                const { data: accesses, error: accessError } = await supabase
                    .from('user_cards')
                    .select(`
                        unlocked_at,
                        utenti ( nome, cognome )
                    `)
                    .eq('card_id', card.id)
                    .order('unlocked_at', { ascending: false })
                    .limit(10);

                if (accessError) throw accessError;

                recentAccesses = (accesses || []).map((a, idx) => {
                    const d = new Date(a.unlocked_at);
                    const now = new Date();
                    const diffMin = Math.floor((now - d) / 60000);

                    let timeStr = "";
                    if (diffMin < 60) timeStr = `${diffMin} min fa`;
                    else if (diffMin < 1440) timeStr = `${Math.floor(diffMin / 60)} ore fa`;
                    else timeStr = d.toLocaleDateString('it-IT');

                    return {
                        id: idx,
                        user: `${a.utenti?.nome || 'Utente'} ${a.utenti?.cognome ? a.utenti.cognome.charAt(0) + '.' : ''}`.trim(),
                        time: timeStr,
                        source: "Codice PIN"
                    }
                });

                // 4. Trend settimanale (ultimi 7 giorni)
                const last7Days = new Date();
                last7Days.setDate(last7Days.getDate() - 7);

                const { data: trendData, error: trendError } = await supabase
                    .from('user_cards')
                    .select('unlocked_at')
                    .eq('card_id', card.id)
                    .gte('unlocked_at', last7Days.toISOString());

                if (trendError) throw trendError;

                const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
                const countsPerDay = {};

                // Popoliamo gli ultimi 7 giorni
                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    countsPerDay[dayNames[d.getDay()]] = 0;
                }

                (trendData || []).forEach(row => {
                    const dayName = dayNames[new Date(row.unlocked_at).getDay()];
                    if (countsPerDay[dayName] !== undefined) {
                        countsPerDay[dayName]++;
                    }
                });

                // Ordiniamo Lun -> Dom per coerenza col grafico precedente
                const order = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
                weeklyData = order.map(name => ({
                    name,
                    unlocks: countsPerDay[name] || 0
                }));
            }

            return {
                completed_unlocks: completedUnlocks,
                recentAccesses,
                weeklyData
            };
        } catch (err) {
            console.error('Error in getPartnerStats:', err);
            return null;
        }
    },

    /**
     * Recupera i partecipanti di un evento specifico del partner.
     */
    async getEventParticipants(eventId) {
        try {
            const { data, error } = await supabase
                .from('prenotazioni_eventi')
                .select(`
                    id,
                    created_at,
                    utenti ( id, nome, cognome, avatar_url, email )
                `)
                .eq('event_id', eventId)
                .eq('status', 'confermato')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(b => ({
                id: b.id,
                name: `${b.utenti?.nome || ''} ${b.utenti?.cognome || ''}`.trim(),
                email: b.utenti?.email,
                avatar: b.utenti?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.utenti?.nome || 'U')}&background=random`,
                date: new Date(b.created_at).toLocaleString('it-IT')
            }));
        } catch (err) {
            console.error('Error in getEventParticipants:', err);
            return [];
        }
    }
};
