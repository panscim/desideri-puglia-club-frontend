import { supabase } from './supabase';
import { calculateDistance } from '../utils/geolocation';

export const AlbumService = {
    // Fetch all available cards (both unlocked and locked)
    async getAllCards() {
        const { data: cards, error: cardsError } = await supabase
            .from('cards')
            .select('*')
            .order('city', { ascending: true }); // Group by city initially

        if (cardsError) throw cardsError;

        // Fetch user's unlocked cards
        const { data: userCards, error: userCardsError } = await supabase
            .from('user_cards')
            .select('card_id, unlocked_at, is_favorite');

        if (userCardsError) throw userCardsError;

        // Merge data
        const unlockedMap = new Map(userCards.map(uc => [uc.card_id, uc]));

        return cards.map(card => ({
            ...card,
            isUnlocked: unlockedMap.has(card.id),
            unlockedAt: unlockedMap.get(card.id)?.unlocked_at,
            isFavorite: unlockedMap.get(card.id)?.is_favorite
        }));
    },

    // Check proximity for all monuments and unlock if close
    async checkProximityUnlock(userLat, userLng, cards) {
        if (!userLat || !userLng) return [];

        const unlockedNow = [];

        // Filter only locked monuments
        const lockedMonuments = cards.filter(c => c.type === 'monument' && !c.isUnlocked);

        for (const card of lockedMonuments) {
            if (card.gps_lat && card.gps_lng) {
                const distance = calculateDistance(userLat, userLng, card.gps_lat, card.gps_lng);

                // If within radius (default 100m if not set)
                const radius = card.gps_radius || 100;

                if (distance <= radius) {
                    // Attempt unlock
                    const result = await this.unlockCard(card.id);
                    if (result.success) {
                        unlockedNow.push({ ...card, ...result.data });
                    }
                }
            }
        }

        return unlockedNow;
    },

    // Unlock a card (via GPS or PIN)
    async unlockCard(cardId) {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) return { success: false, error: 'Not logged in' };
        const userId = session.session.user.id;

        // 1. Check if already unlocked (double check)
        const { data: existing } = await supabase
            .from('user_cards')
            .select('id')
            .eq('user_id', userId)
            .eq('card_id', cardId)
            .single();

        if (existing) return { success: false, error: 'Already unlocked' };

        // 2. Insert into user_cards
        const { data, error } = await supabase
            .from('user_cards')
            .insert({ user_id: userId, card_id: cardId })
            .select()
            .single();

        if (error) return { success: false, error };

        // 3. Award points (Optional: trigger DB function or handle here)
        // For now we just return success. Ideally points should be handled via trigger or RPC to prevent client-side spoofing,
        // but for MVP this confirms the unlock.

        return { success: true, data };
    },

    // Validate PIN and unlock partner card
    async unlockWithPin(pinCode) {
        // 1. Find card with this PIN
        const { data: card, error } = await supabase
            .from('cards')
            .select('*')
            .eq('type', 'partner')
            .eq('pin_code', pinCode)
            .single();

        if (error || !card) return { success: false, error: 'PIN non valido' };

        // 2. Unlock it
        const unlockRes = await this.unlockCard(card.id);

        if (!unlockRes.success) {
            if (unlockRes.error === 'Already unlocked') {
                return { success: false, error: 'Hai già questa figurina!' };
            }
            return { success: false, error: 'Errore durante lo sblocco' };
        }

        return { success: true, card: card };
    }
};
