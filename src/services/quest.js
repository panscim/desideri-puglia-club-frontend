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

    // Fetch user progress for a specific user
    // Returns user set progress and completed steps
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

    // Fetch detailed info for a single Quest Set including hydrated steps (with card/partner images)
    async getSagaDetail(setId) {
        try {
            // 1. Fetch the saga and its steps
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

            // 2. Sort steps by order
            if (saga.steps) {
                saga.steps.sort((a, b) => a.step_order - b.step_order)
            }

            // 3. Extract IDs to fetch references
            const cardIds = saga.steps.filter(s => s.reference_table === 'cards' && s.reference_id).map(s => s.reference_id)
            const partnerIds = saga.steps.filter(s => s.reference_table === 'partners' && s.reference_id).map(s => s.reference_id)

            // 4. Fetch the actual card and partner data in parallel
            const fetchPromises = []
            if (cardIds.length > 0) {
                fetchPromises.push(supabase.from('cards').select('id, image_url, gps_lat, gps_lng').in('id', cardIds))
            }
            if (partnerIds.length > 0) {
                fetchPromises.push(supabase.from('partners').select('id, logo_url, nome, lat, lng').in('id', partnerIds))
            }

            const results = await Promise.all(fetchPromises)

            // Map the results back into a lookup dictionary
            const referencesMap = {}
            for (const result of results) {
                if (result.data) {
                    for (const row of result.data) {
                        referencesMap[row.id] = row
                    }
                }
            }

            // 5. Hydrate the steps with images and coordinates
            saga.steps = saga.steps.map(step => {
                const ref = referencesMap[step.reference_id] || {}
                return {
                    ...step,
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
    }

}
