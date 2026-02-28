import { supabase } from './supabase';

export const ConciergeService = {
  /**
   * Fetch available daily plans with optional city/season filtering
   */
  async getDailyPlans({ city, season, targetAudience } = {}) {
    let query = supabase
      .from('daily_plans')
      .select(`
        *,
        creator:utenti(nome, cognome, nickname, avatar_url)
      `)
      .eq('is_published', true)
      .order('purchases_count', { ascending: false });

    if (city) query = query.eq('city', city);
    if (season) query = query.eq('season', season);
    if (targetAudience) query = query.eq('target_audience', targetAudience);

    const { data, error } = await query;
    if (error) {
      console.error('--- SUPABASE ERROR [getDailyPlans] ---');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      return [];
    }
    return data;
  },

  /**
   * Fetch a single plan with its timeline slots
   */
  async getPlanDetail(planId) {
    const { data: plan, error: planError } = await supabase
      .from('daily_plans')
      .select(`
        *,
        creator:utenti(nome, cognome, nickname, avatar_url),
        slots:plan_slots(*)
      `)
      .eq('id', planId)
      .single();

    if (planError) {
      console.error('Error fetching plan detail:', planError);
      return null;
    }

    // Sort slots by order
    if (plan.slots) {
      plan.slots.sort((a, b) => a.slot_order - b.slot_order);
    }

    return plan;
  },

  /**
   * Purchase a daily plan (calls database RPC)
   */
  async purchasePlan(userId, planId, stripePaymentId = null) {
    const { data, error } = await supabase.rpc('purchase_daily_plan', {
      p_user_id: userId,
      p_plan_id: planId,
      p_stripe_payment_id: stripePaymentId
    });

    if (error) {
      console.error('Error purchasing plan:', error);
      return { success: false, error: error.message };
    }
    return data;
  },

  /**
   * Check if a user has already purchased a plan
   */
  async checkPurchase(userId, planId) {
    const { data, error } = await supabase
      .from('plan_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  },

  /**
   * Submit a vibe report
   */
  async submitVibe(vibeData) {
    const { data, error } = await supabase
      .from('vibe_reports')
      .insert([vibeData])
      .select()
      .single();

    if (error) {
      console.error('Error submitting vibe:', error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  /**
   * Fetch live vibe reports (only non-expired ones)
   */
  async getLiveVibes() {
    const { data, error } = await supabase
      .from('vibe_reports')
      .select(`
        *,
        user:utenti(nickname, avatar_url)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching live vibes:', error);
      return [];
    }
    return data;
  }
};
