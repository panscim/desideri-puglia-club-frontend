import { getStripe } from './_lib/stripeClient.js'
import { createSupabaseAdmin } from './_lib/supabaseAdmin.js'
import { getPlanByTier } from './_lib/partnerPlans.js'

function resolveAppUrl(req) {
  return process.env.VITE_APP_URL || process.env.APP_URL || req.headers.origin || 'http://localhost:5173'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { userId, tier } = req.body || {}
    if (!userId || !tier) {
      return res.status(400).json({ error: 'Missing userId or tier' })
    }

    const plan = getPlanByTier(tier)
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan tier' })
    }

    const stripe = getStripe()
    const supabase = createSupabaseAdmin()

    let { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('owner_user_id', userId)
      .maybeSingle()

    if (partnerError) throw partnerError

    if (!partner) {
      const { data: inserted, error: insertErr } = await supabase
        .from('partners')
        .insert([
          {
            owner_user_id: userId,
            name: `Partner ${String(userId).slice(0, 8)}`,
            subscription_status: 'incomplete',
            is_active: false,
          },
        ])
        .select('*')
        .single()

      if (insertErr) throw insertErr
      partner = inserted
    }

    let customerId = partner.stripe_customer_id || null
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { user_id: userId, partner_id: partner.id },
      })
      customerId = customer.id
      await supabase.from('partners').update({ stripe_customer_id: customerId }).eq('id', partner.id)
    }

    const base = resolveAppUrl(req)
    const okUrl = base + '/partner/dashboard?payment_success=1&subscribed=1&plan=' + encodeURIComponent(plan.tier) + '&session_id={CHECKOUT_SESSION_ID}'
    const koUrl = base + '/partner/subscription/' + tier + '?canceled=1'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      success_url: okUrl,
      cancel_url: koUrl,
      client_reference_id: partner.id,
      metadata: {
        type: 'partner_subscription',
        user_id: userId,
        partner_id: partner.id,
        plan_tier: plan.tier,
        commission_rate: String(plan.commissionRate),
        stripe_product_id: plan.productId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            product_data: {
              name: plan.name,
            },
            recurring: { interval: 'month' },
            unit_amount: plan.unitAmount,
          },
        },
      ],
    })

    return res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('create-partner-subscription-checkout error:', error)
    return res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
