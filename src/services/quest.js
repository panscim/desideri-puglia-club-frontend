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
    }

}
