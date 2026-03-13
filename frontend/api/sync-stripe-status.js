import { getStripe } from './_lib/stripeClient.js'
import { createSupabaseAdmin } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { partnerId } = req.body || {}
    if (!partnerId) {
      return res.status(400).json({ error: 'Missing partnerId' })
    }

    const supabase = createSupabaseAdmin()
    const stripe = getStripe()

    // 1. Get partner from DB
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, stripe_account_id, stripe_connect_account_id')
      .eq('id', partnerId)
      .maybeSingle()

    if (partnerError) throw partnerError
    if (!partner) return res.status(404).json({ error: 'Partner not found' })

    const accountId = partner.stripe_account_id || partner.stripe_connect_account_id
    if (!accountId) {
      return res.status(400).json({ error: 'No Stripe account linked to this partner' })
    }

    // 2. Fetch latest status from Stripe
    const account = await stripe.accounts.retrieve(accountId)
    const chargesEnabled = Boolean(account.charges_enabled)
    const payoutsEnabled = Boolean(account.payouts_enabled)

    let details = chargesEnabled 
      ? 'Attivazione sincronizzata correttamente!' 
      : 'Stripe indica che l\'attivazione non è ancora completa.'

    if (!chargesEnabled && account.requirements?.errors?.length > 0) {
      const errorMsg = account.requirements.errors[0].reason || 'Verifica identità fallita.'
      details = `Attenzione: Stripe richiede ulteriori verifiche. Errore: ${errorMsg}`
    }

    // 3. Update DB
    const { error: updateError } = await supabase
      .from('partners')
      .update({
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
      })
      .eq('id', partnerId)

    if (updateError) throw updateError

    return res.status(200).json({ 
      success: true, 
      chargesEnabled, 
      payoutsEnabled,
      details 
    })
  } catch (error) {
    console.error('sync-stripe-status error:', error)
    return res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
