import { getStripe } from './_lib/stripeClient.js'
import { createSupabaseAdmin } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { userId, partnerId, returnUrl, refreshUrl } = req.body || {}
    if (!userId && !partnerId) {
      return res.status(400).json({ error: 'Missing userId or partnerId' })
    }

    const supabase = createSupabaseAdmin()
    const stripe = getStripe()

    let partnerQuery = supabase.from('partners').select('*')
    if (partnerId) partnerQuery = partnerQuery.eq('id', partnerId)
    else partnerQuery = partnerQuery.eq('owner_user_id', userId)

    const { data: partner, error: partnerError } = await partnerQuery.maybeSingle()
    if (partnerError) throw partnerError
    if (!partner) return res.status(404).json({ error: 'Partner not found' })

    let accountId = partner.stripe_account_id || partner.stripe_connect_account_id || null

    if (!accountId) {
      let email = null
      const { data: userData } = await supabase
        .from('utenti')
        .select('email')
        .eq('id', partner.owner_user_id)
        .maybeSingle()
      email = userData?.email || null

      const account = await stripe.accounts.create({
        type: 'express',
        country: 'IT',
        email: email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          partner_id: partner.id,
          owner_user_id: partner.owner_user_id || '',
        },
      })
      accountId = account.id

      await supabase
        .from('partners')
        .update({
          stripe_account_id: accountId,
          stripe_connect_account_id: accountId,
        })
        .eq('id', partner.id)
    }

    try {
      await stripe.accounts.update(accountId, {
        settings: {
          payouts: {
            schedule: { delay_days: 3 },
          },
        },
      })
    } catch (e) {
      console.warn('Optional account update failed:', e.message)
    }

    const appUrl = process.env.VITE_APP_URL || process.env.APP_URL || req.headers.origin || 'https://desideri-puglia-club-frontend.vercel.app'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      return_url: returnUrl || `${appUrl}/partner/dashboard?stripe_success=1`,
      refresh_url: refreshUrl || `${appUrl}/partner/dashboard?stripe_refresh=1`,
    })

    return res.status(200).json({ url: accountLink.url, accountId })
  } catch (error) {
    console.error('create-connect-onboarding-link error:', error)
    return res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
