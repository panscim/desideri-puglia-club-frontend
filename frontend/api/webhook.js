import { buffer } from 'micro'
import { getStripe } from './_lib/stripeClient'
import { createSupabaseAdmin } from './_lib/supabaseAdmin'
import { getPlanByProductId, getPlanByTier } from './_lib/partnerPlans'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function syncPartnerSubscriptionFromSubscriptionObject(subscription, fallbackPartnerId = null) {
  const stripe = getStripe()
  const supabase = createSupabaseAdmin()

  const partnerIdFromMetadata = subscription?.metadata?.partner_id || fallbackPartnerId || null
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
  const subscriptionId = subscription.id
  const item = subscription.items?.data?.[0]
  const rawProduct = item?.price?.product
  const productId = typeof rawProduct === 'string' ? rawProduct : rawProduct?.id
  const mappedPlan = getPlanByProductId(productId) || getPlanByTier(subscription?.metadata?.plan_tier)

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
    console.warn('Webhook sync subscription: partner not found', { partnerIdFromMetadata, customerId, subscriptionId })
    return
  }

  const status = (subscription.status || '').toLowerCase()
  const isActive = ['active', 'trialing'].includes(status)
  const currentPeriodEndUnix = subscription.current_period_end
  const currentPeriodEndIso = currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000).toISOString() : null

  const updatePayload = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
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

  const destinationAccount = partner.stripe_account_id || partner.stripe_connect_account_id
  if (destinationAccount) {
    try {
      await stripe.accounts.update(destinationAccount, {
        settings: {
          payouts: {
            schedule: {
              interval: 'daily',
              delay_days: 3,
            },
          },
        },
      })
    } catch (accountErr) {
      console.warn('Webhook sync subscription: unable to set payout delay', accountErr.message)
    }
  }
}

async function handleEventBookingCheckoutCompleted(session) {
  const stripe = getStripe()
  const supabase = createSupabaseAdmin()

  const metadata = session.metadata || {}
  const userId = metadata.user_id || session.client_reference_id
  const eventId = metadata.event_id
  const partnerId = metadata.partner_id || null
  const commissionRate = Number(metadata.commission_rate || 25)
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id

  if (!userId || !eventId) {
    throw new Error('Missing userId/eventId in event booking checkout session metadata')
  }

  const { data: existingBooking } = await supabase
    .from('prenotazioni_eventi')
    .select('id, status')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .eq('status', 'confermato')
    .maybeSingle()

  let bookingId = existingBooking?.id || null

  if (!bookingId) {
    const { data: createdBooking, error: bookingErr } = await supabase
      .from('prenotazioni_eventi')
      .insert([
        {
          user_id: userId,
          event_id: eventId,
          is_guest_event: true,
          status: 'confermato',
        },
      ])
      .select('id')
      .single()

    if (bookingErr) throw bookingErr
    bookingId = createdBooking.id
  }

  const amountTotal = Number(session.amount_total || 0)
  let applicationFee = 0
  if (paymentIntentId) {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    applicationFee = Number(pi.application_fee_amount || 0)
  }

  const bookingPaymentPayload = {
    booking_id: bookingId,
    user_id: userId,
    event_id: eventId,
    partner_id: partnerId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    amount_total_cents: amountTotal,
    application_fee_amount: applicationFee,
    commission_rate: commissionRate,
    currency: session.currency || 'eur',
    status: 'paid',
  }

  const { error: paymentErr } = await supabase
    .from('booking_payments')
    .upsert([bookingPaymentPayload], { onConflict: 'stripe_checkout_session_id' })

  if (paymentErr) {
    console.warn('booking_payments upsert failed:', paymentErr.message)
  }
}

async function handleLegacyCheckoutCompleted(session) {
  const supabase = createSupabaseAdmin()
  const { client_reference_id, metadata, amount_total, payment_intent } = session
  const userId = client_reference_id

  // 1. BOOST (B2C)
  if (metadata?.type === 'boost') {
    if (!userId) throw new Error('Missing userId for boost')

    const multiplier = parseFloat(metadata.multiplier || '1.5')
    const durationHours = parseInt(metadata.duration_hours || '24', 10)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000)

    const { error: uErr } = await supabase
      .from('utenti')
      .update({
        boost_multiplier: multiplier,
        boost_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId)

    if (uErr) throw uErr

    await supabase.from('logs_transazioni').insert({
      user_id: userId,
      tipo: 'boost_acquisto',
      punti: 0,
      punti_effettivi: 0,
      note: `Acquistato Boost x${multiplier} per ${durationHours}h (€${amount_total / 100})`,
    })
    return
  }

  // 2. GETTONI (B2B - Partner)
  if (metadata?.type === 'gettoni') {
    const partnerId = userId
    if (!partnerId) throw new Error('Missing partnerId for gettoni')

    const quantity = parseInt(metadata.quantity || '0', 10)

    const { data: p, error: pEsc } = await supabase.from('partners').select('saldo_punti').eq('id', partnerId).single()
    if (pEsc) throw pEsc

    const newBalance = (p.saldo_punti || 0) + quantity
    const { error: updErr } = await supabase.from('partners').update({ saldo_punti: newBalance }).eq('id', partnerId)
    if (updErr) throw updErr

    await supabase.from('logs_transazioni').insert({
      partner_id: partnerId,
      tipo: 'acquisto_gettoni',
      punti: quantity,
      punti_effettivi: quantity,
      note: `Acquistati ${quantity} gettoni (€${amount_total / 100})`,
    })
    return
  }

  // 3. PRODOTTO FISICO (Shop)
  if (metadata?.type === 'product') {
    if (!userId) throw new Error('Missing userId for product')
    const productId = metadata.product_id

    if (productId) {
      const { data: item } = await supabase.from('market_items').select('stock').eq('id', productId).single()
      if (item && typeof item.stock === 'number') {
        await supabase.from('market_items').update({ stock: item.stock - 1 }).eq('id', productId)
      }
    }

    const { error: ordErr } = await supabase.from('market_orders').insert({
      user_id: userId,
      market_item_id: productId,
      status: 'pagato',
      metodo: 'stripe',
      prezzo_pagato: amount_total / 100,
      payment_intent_id: typeof payment_intent === 'string' ? payment_intent : payment_intent?.id,
      created_at: new Date().toISOString(),
    })

    if (ordErr) throw ordErr
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  let event
  const stripe = getStripe()
  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const type = session?.metadata?.type

        if (type === 'partner_subscription') {
          if (typeof session.subscription === 'string') {
            const subscription = await stripe.subscriptions.retrieve(session.subscription, {
              expand: ['items.data.price.product'],
            })
            await syncPartnerSubscriptionFromSubscriptionObject(subscription, session?.metadata?.partner_id || null)
          }
        } else if (type === 'event_booking') {
          await handleEventBookingCheckoutCompleted(session)
        } else {
          await handleLegacyCheckoutCompleted(session)
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.created': {
        const subscription = event.data.object
        await syncPartnerSubscriptionFromSubscriptionObject(subscription)
        break
      }

      case 'account.updated': {
        const account = event.data.object
        const accountId = account.id
        const supabase = createSupabaseAdmin()
        const chargesEnabled = Boolean(account.charges_enabled)
        const payoutsEnabled = Boolean(account.payouts_enabled)

        const { data: partner } = await supabase
          .from('partners')
          .select('id, owner_user_id, charges_enabled')
          .or(`stripe_account_id.eq.${accountId},stripe_connect_account_id.eq.${accountId}`)
          .maybeSingle()

        if (partner?.id) {
          await supabase
            .from('partners')
            .update({
              charges_enabled: chargesEnabled,
              payouts_enabled: payoutsEnabled,
              stripe_account_id: accountId,
              stripe_connect_account_id: accountId,
            })
            .eq('id', partner.id)

          if (!partner.charges_enabled && chargesEnabled && partner.owner_user_id) {
            await supabase.from('notifiche').insert({
              user_id: partner.owner_user_id,
              titolo: 'Incassi attivi',
              messaggio: 'Incassi attivi. Ora puoi pubblicare eventi.',
              tipo: 'sistema',
            })
          }
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }

  return res.status(200).json({ received: true })
}
