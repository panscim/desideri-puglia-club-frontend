// src/services/quest.js
import { supabase } from './supabase'

/**
 * Service to handle Quest Sets and user progress
 * NOTE: user_quest_sets columns are: id, user_id, set_id, status
 * (NOT quest_set_id, NOT started_at)
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

    // Start (or resume) a saga for a user — inserts record in user_quest_sets
    // Correct columns: user_id, set_id, status
    async startSaga(userId, sagaId) {
        if (!userId || !sagaId) return { success: false, error: 'Missing params' }
        try {
            console.log('[QuestService] startSaga: userId=', userId, ' sagaId=', sagaId);

            // 1. Check if a record already exists
            const { data: existing } = await supabase
                .from('user_quest_sets')
                .select('id')
                .eq('user_id', userId)
                .eq('set_id', sagaId)
                .maybeSingle();

            if (existing) {
                console.log('[QuestService] Saga already started, id=', existing.id);
                return { success: true };
            }

            // 2. Insert new record with correct column names
            const { error: insertError } = await supabase
                .from('user_quest_sets')
                .insert({
                    user_id: userId,
                    set_id: sagaId,
                    status: 'in_progress',
                });

            if (insertError) {
                console.error('[QuestService] startSaga INSERT error:', insertError);
                throw insertError;
            }

            console.log('[QuestService] startSaga: saved successfully');
            return { success: true };
        } catch (err) {
            console.error('[QuestService] startSaga FAILURE:', err)
            return { success: false, error: err.message || err }
        }
    },

    // Fetch the user's active (in-progress) sagas with step completion count
    async getUserActiveSagas(userId) {
        if (!userId) {
            console.warn('[QuestService] getUserActiveSagas: No userId');
            return [];
        }
        try {
            console.log('[QuestService] getUserActiveSagas: userId=', userId);

            // Correct FK column is set_id (not quest_set_id)
            const { data: userSets, error: setsError } = await supabase
                .from('user_quest_sets')
                .select('*, quest_sets(*)')
                .eq('user_id', userId)
                .neq('status', 'completed');

            if (setsError) {
                console.error('[QuestService] getUserActiveSagas ERROR:', setsError);
                return [];
            }

            if (!userSets || userSets.length === 0) {
                console.log('[QuestService] No active user_quest_sets found.');
                return [];
            }

            console.log('[QuestService] raw userSets:', userSets);

            // Fetch completed steps for this user
            const { data: userSteps } = await supabase
                .from('user_quest_set_steps')
                .select('step_id')
                .eq('user_id', userId);

            const completedStepIds = new Set((userSteps || []).map(s => s.step_id));

            // Build result for each active saga
            const results = await Promise.all(userSets.map(async (us) => {
                const saga = Array.isArray(us.quest_sets) ? us.quest_sets[0] : us.quest_sets;
                if (!saga) {
                    console.warn('[QuestService] No quest_sets data for set_id:', us.set_id);
                    return null;
                }

                // Fetch step count for this saga
                const { data: steps } = await supabase
                    .from('quest_set_steps')
                    .select('id')
                    .eq('quest_set_id', us.set_id);

                const totalSteps = steps?.length || 0;
                const doneSteps = (steps || []).filter(s => completedStepIds.has(s.id)).length;
                const percent = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

                return {
                    userSetId: us.id,
                    questSetId: us.set_id,  // the actual FK is set_id
                    startedAt: us.created_at,
                    status: us.status,
                    sagaTitle: saga.title_it || saga.title || 'Saga Senza Titolo',
                    sagaImage: saga.image_url,
                    sagaCity: saga.city,
                    totalSteps,
                    doneSteps,
                    percent,
                };
            }));

            const final = results.filter(Boolean);
            console.log('[QuestService] getUserActiveSagas FINAL:', final);
            return final;
        } catch (err) {
            console.error('[QuestService] getUserActiveSagas EXCEPTION:', err);
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
