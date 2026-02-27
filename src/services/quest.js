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
            console.error('Error starting saga:', err)
            return { success: false, error: err.message }
        }
    },

    // Fetch the user's active (in-progress) sagas with step completion count
    async getUserActiveSagas(userId) {
        if (!userId) return []
        try {
            // 1. Fetch user quest sets that are in progress (not completed)
            const { data: userSets, error: setsError } = await supabase
                .from('user_quest_sets')
                .select(`
                    *,
                    saga:quest_sets(
                        id, title, title_it, title_en, image_url, city,
                        steps:quest_set_steps(id)
                    )
                `)
                .eq('user_id', userId)
                .neq('status', 'completed')
                .order('started_at', { ascending: false })

            if (setsError) throw setsError
            if (!userSets || userSets.length === 0) return []

            // 2. Fetch completed steps for this user
            const sagaIds = userSets.map(s => s.quest_set_id)
            const { data: completedSteps } = await supabase
                .from('user_quest_set_steps')
                .select('step_id, quest_set_steps!inner(quest_set_id)')
                .eq('user_id', userId)
                .in('quest_set_steps.quest_set_id', sagaIds)

            // 3. Build a map of completed step counts per saga
            const completedCountMap = {}
            for (const row of (completedSteps || [])) {
                const setId = row.quest_set_steps?.quest_set_id
                if (setId) {
                    completedCountMap[setId] = (completedCountMap[setId] || 0) + 1
                }
            }

            // 4. Merge into result objects
            return userSets.map(us => {
                const saga = us.saga || {}
                const totalSteps = saga.steps?.length || 0
                const doneSteps = completedCountMap[us.quest_set_id] || 0
                const percent = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0

                return {
                    userSetId: us.id,
                    questSetId: us.quest_set_id,
                    startedAt: us.started_at,
                    status: us.status,
                    sagaTitle: saga.title_it || saga.title,
                    sagaImage: saga.image_url,
                    sagaCity: saga.city,
                    totalSteps,
                    doneSteps,
                    percent,
                }
            })
        } catch (err) {
            console.error('Error fetching user active sagas:', err)
            return []
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
