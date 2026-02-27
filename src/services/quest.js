// src/services/quest.js
import { supabase } from './supabase'

/**
 * Service to handle Quest Sets and user progress
 */
export const QuestService = {

    // Fetch all active quest sets and their steps, along with reward card info
    async getActiveSets() {
        try {
            const { data, error } = await supabase
                .from('quest_sets')
                .select(`
          *,
          steps:quest_set_steps(*),
          reward:cards(*)
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (err) {
            console.error('Error fetching quest sets:', err)
            return []
        }
    },

    // Start (or resume) a saga for a user — upserts a record in user_quest_sets
    async startSaga(userId, sagaId) {
        if (!userId || !sagaId) return { success: false, error: 'Missing params' }
        try {
            console.log('[QuestService] Starting saga:', sagaId, 'for user:', userId);
            const { error } = await supabase
                .from('user_quest_sets')
                .upsert(
                    {
                        user_id: userId,
                        quest_set_id: sagaId,
                        status: 'in_progress',
                        started_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id,quest_set_id' }
                )

            if (error) throw error
            return { success: true }
        } catch (err) {
            console.error('[QuestService] Error starting saga:', err)
            return { success: false, error: err.message }
        }
    },

    // Fetch the user's active (in-progress) sagas with step completion count
    async getUserActiveSagas(userId) {
        if (!userId) {
            console.warn('[QuestService] getUserActiveSagas: No userId provided');
            return [];
        }
        try {
            console.log('[QuestService] Fetching active sagas for user:', userId);

            // 1. Fetch user quest sets that are in progress
            const { data: userSets, error: setsError } = await supabase
                .from('user_quest_sets')
                .select(`
                    *,
                    quest_sets (
                        id, 
                        title, 
                        title_it, 
                        title_en, 
                        image_url, 
                        city,
                        quest_set_steps (id)
                    )
                `)
                .eq('user_id', userId)
                .neq('status', 'completed')
                .order('started_at', { ascending: false });

            if (setsError) {
                console.error('[QuestService] Error fetching user_quest_sets:', setsError);
                throw setsError;
            }

            if (!userSets || userSets.length === 0) {
                console.log('[QuestService] No active user_quest_sets found in DB.');
                return [];
            }

            console.log('[QuestService] Raw userSets data:', userSets);

            // 2. Fetch ALL completed steps for this user to match in-memory (safer than complex join)
            const { data: userSteps, error: stepsError } = await supabase
                .from('user_quest_set_steps')
                .select('step_id')
                .eq('user_id', userId);

            if (stepsError) {
                console.error('[QuestService] Error fetching user_quest_set_steps:', stepsError);
            }

            const completedStepIds = new Set((userSteps || []).map(s => s.step_id));

            // 3. Merge and format
            const activeSagas = userSets.map(us => {
                // Handle cases where Supabase might return quest_sets as an array or object
                const saga = Array.isArray(us.quest_sets) ? us.quest_sets[0] : us.quest_sets;

                if (!saga) {
                    console.warn(`[QuestService] No quest_sets data found for quest_set_id: ${us.quest_set_id}`);
                    return null;
                }

                const totalSteps = saga.quest_set_steps?.length || 0;
                // Count which steps of this saga are in the completedStepIds set
                const doneSteps = (saga.quest_set_steps || [])
                    .filter(step => completedStepIds.has(step.id))
                    .length;

                const percent = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

                return {
                    userSetId: us.id,
                    questSetId: us.quest_set_id,
                    startedAt: us.started_at,
                    status: us.status,
                    sagaTitle: saga.title_it || saga.title || 'Saga Senza Titolo',
                    sagaImage: saga.image_url,
                    sagaCity: saga.city,
                    totalSteps,
                    doneSteps,
                    percent,
                };
            }).filter(s => s !== null);

            console.log('[QuestService] Final processed activeSagas:', activeSagas);
            return activeSagas;
        } catch (err) {
            console.error('[QuestService] getUserActiveSagas failure:', err);
            return [];
        }
    },

    // Fetch user progress for a specific user
    async getUserProgress(userId) {
        if (!userId) return { sets: [], completedSteps: [] }

        try {
            const { data: userSets, error: errorSets } = await supabase
                .from('user_quest_sets')
                .select('*')
                .eq('user_id', userId)

            if (errorSets) throw errorSets

            const { data: userSteps, error: errorSteps } = await supabase
                .from('user_quest_set_steps')
                .select('*')
                .eq('user_id', userId)

            if (errorSteps) throw errorSteps

            return {
                sets: userSets || [],
                completedSteps: (userSteps || []).map(step => step.step_id)
            }
        } catch (err) {
            console.error('Error fetching user quest progress:', err)
            return { sets: [], completedSteps: [] }
        }
    },

    // Fetch detailed info for a single Quest Set including hydrated steps
    async getSagaDetail(setId) {
        try {
            const { data: saga, error } = await supabase
                .from('quest_sets')
                .select(`
                    *,
                    steps:quest_set_steps(*)
                `)
                .eq('id', setId)
                .single()

            if (error) throw error
            if (!saga) return null

            if (saga.steps) {
                saga.steps.sort((a, b) => a.step_order - b.step_order)
            }

            const cardIds = saga.steps.filter(s => s.reference_table === 'cards' && s.reference_id).map(s => s.reference_id)
            const partnerIds = saga.steps.filter(s => s.reference_table === 'partners' && s.reference_id).map(s => s.reference_id)

            const fetchPromises = []
            if (cardIds.length > 0) {
                fetchPromises.push(supabase.from('cards').select('*').in('id', cardIds))
            }
            if (partnerIds.length > 0) {
                fetchPromises.push(supabase.from('partners').select('id, logo_url, nome, lat, lng').in('id', partnerIds))
            }

            const results = await Promise.all(fetchPromises)

            const referencesMap = {}
            for (const result of results) {
                if (result.data) {
                    for (const row of result.data) {
                        referencesMap[row.id] = row
                    }
                }
            }

            saga.steps = saga.steps.map(step => {
                const ref = referencesMap[step.reference_id] || {}
                return {
                    ...step,
                    cardData: step.reference_table === 'cards' ? ref : null,
                    partnerData: step.reference_table === 'partners' ? ref : null,
                    _image_url: step.reference_table === 'partners' ? ref.logo_url : ref.image_url,
                    _latitude: step.reference_table === 'partners' ? ref.lat : ref.gps_lat,
                    _longitude: step.reference_table === 'partners' ? ref.lng : ref.gps_lng,
                }
            })

            return saga
        } catch (err) {
            console.error('Error fetching saga detail:', err)
            return null
        }
    },

    // Unlock a specific quest step for a user
    async unlockQuestStep(userId, stepId) {
        if (!userId || !stepId) return { success: false, error: 'Missing params' }
        try {
            const { error } = await supabase
                .from('user_quest_set_steps')
                .upsert({ user_id: userId, step_id: stepId }, { onConflict: 'user_id,step_id' })

            if (error) throw error
            return { success: true }
        } catch (err) {
            console.error('Error unlocking quest step:', err)
            return { success: false, error: err.message }
        }
    }

}
