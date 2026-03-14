import { getStripe } from './_lib/stripeClient.js'
import { createSupabaseAdmin } from './_lib/supabaseAdmin.js'

function toMinor(amount) {
  return Math.max(0, Math.round(Number(amount || 0) * 100))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { userId, eventId, successUrl, cancelUrl } = req.body || {}
    if (!userId || !eventId) {
      return res.status(400).json({ error: 'Missing userId or eventId' })
    }

    const stripe = getStripe()
    const supabase = createSupabaseAdmin()

    const { data: eventData, error: eventError } = await supabase
      .from('partner_events_created')
      .select('id, title, price, partner_id, payment_methods, partners(*)')
      .eq('id', eventId)
      .single()

    if (eventError || !eventData) {
      return res.status(404).json({ error: 'Evento partner non trovato' })
    }

    if (!Array.isArray(eventData.payment_methods) || !eventData.payment_methods.includes('carta')) {
      return res.status(400).json({ error: 'Questo evento non supporta pagamento carta' })
    }

    const amount = toMinor(eventData.price)
    if (amount <= 0) {
      return res.status(400).json({ error: 'Prezzo evento non valido per checkout Stripe' })
    }

    const partner = eventData.partners || {}
    const commissionRate = Number(partner.commission_rate ?? 25)
    const appFee = Math.round((amount * commissionRate) / 100)
    const destinationAccount = partner.stripe_account_id || partner.stripe_connect_account_id || null

    if (!destinationAccount) {
      return res.status(400).json({ error: 'Partner non configurato per incassi Stripe Connect' })
    }

    const origin = req.headers.origin || 'https://desideri-puglia-club-frontend.vercel.app'
    const okUrl = successUrl || `${origin}/booking-confirmation/${eventId}?checkout=success`
    const koUrl = cancelUrl || `${origin}/eventi/${eventId}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: okUrl,
      cancel_url: koUrl,
      customer_email: undefined,
      client_reference_id: userId,
      metadata: {
        type: 'event_booking',
        user_id: userId,
        event_id: eventId,
        partner_id: String(eventData.partner_id),
        is_guest_event: 'true',
        commission_rate: String(commissionRate),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: amount,
            product_data: {
              name: eventData.title || 'Evento Partner',
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: appFee,
        transfer_data: {
          destination: destinationAccount,
        },
        metadata: {
          type: 'event_booking',
          user_id: userId,
          event_id: eventId,
          partner_id: String(eventData.partner_id),
        },
      },
    })

    return res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('create-event-checkout error:', error)
    return res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
