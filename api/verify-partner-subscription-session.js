import { getStripe } from './_lib/stripeClient.js'
import { createSupabaseAdmin } from './_lib/supabaseAdmin.js'
import { getPlanByProductId, getPlanByTier } from './_lib/partnerPlans.js'

async function syncPartnerSubscriptionFromSession(session) {
  const stripe = getStripe()
  const supabase = createSupabaseAdmin()

  if (!session?.subscription) {
    return { success: false, reason: 'missing_subscription' }
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription, {
    expand: ['items.data.price.product'],
  })

  const partnerIdFromMetadata = subscription?.metadata?.partner_id || session?.metadata?.partner_id || session?.client_reference_id || null
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
  const item = subscription.items?.data?.[0]
  const rawProduct = item?.price?.product
  const productId = typeof rawProduct === 'string' ? rawProduct : rawProduct?.id
  const mappedPlan = getPlanByProductId(productId) || getPlanByTier(subscription?.metadata?.plan_tier) || getPlanByTier(session?.metadata?.plan_tier)

  let partner = null

  if (partnerIdFromMetadata) {
    const { data } = await supabase.from('partners').select('*').eq('id', partnerIdFromMetadata).maybeSingle()
    partner = data || null
  }

  if (!partner && customerId) {
    const { data } = await supabase.from('partners').select('*').eq('stripe_customer_id', customerId).maybeSingle()
    partner = data || null
  }

  if (!partner) {
    return { success: false, reason: 'partner_not_found' }
  }

  const status = String(subscription.status || '').toLowerCase()
  const isActive = ['active', 'trialing'].includes(status)
  const currentPeriodEndIso = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null

  const updatePayload = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: status,
    is_active: isActive,
    plan_tier: mappedPlan?.tier || partner.plan_tier || null,
    commission_rate: mappedPlan?.commissionRate ?? partner.commission_rate ?? 25,
    stripe_product_id: mappedPlan?.productId || productId || null,
    subscription_current_period_end: currentPeriodEndIso,
    must_choose_plan_once: false,
  }

  const { error } = await supabase.from('partners').update(updatePayload).eq('id', partner.id)
  if (error) throw error

  return {
    success: true,
    partnerId: partner.id,
    subscriptionStatus: status,
    isActive,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { sessionId } = req.body || {}

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    if (!session || session.mode !== 'subscription') {
      return res.status(400).json({ error: 'Invalid checkout session' })
    }

    const result = await syncPartnerSubscriptionFromSession(session)
    return res.status(200).json(result)
  } catch (error) {
    console.error('verify-partner-subscription-session error:', error)
    return res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
