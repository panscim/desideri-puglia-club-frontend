import { getStripe } from './_lib/stripeClient.js'
import { createSupabaseAdmin } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { bookingId, eventId, userId } = req.body || {}
    if (!bookingId || !eventId || !userId) {
      return res.status(400).json({ error: 'Missing bookingId, eventId or userId' })
    }

    const stripe = getStripe()
    const supabase = createSupabaseAdmin()

    const { data: booking, error: bookingError } = await supabase
      .from('prenotazioni_eventi')
      .select('id, user_id, event_id, status')
      .eq('id', bookingId)
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Prenotazione non trovata' })
    }

    if (booking.status !== 'confermato') {
      return res.status(400).json({ error: 'Prenotazione non rimborsabile in questo stato' })
    }

    const { data: paymentRow, error: paymentError } = await supabase
      .from('booking_payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'paid')
      .maybeSingle()

    if (paymentError) throw paymentError
    if (!paymentRow?.stripe_payment_intent_id) {
      return res.status(400).json({ error: 'Nessun pagamento Stripe associato a questa prenotazione' })
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentRow.stripe_payment_intent_id,
      reason: 'requested_by_customer',
      metadata: {
        booking_id: bookingId,
        event_id: eventId,
        user_id: userId,
      },
    })

    const { error: updatePaymentError } = await supabase
      .from('booking_payments')
      .update({
        status: 'refunded',
        stripe_refund_id: refund.id,
        refunded_at: new Date().toISOString(),
      })
      .eq('id', paymentRow.id)

    if (updatePaymentError) throw updatePaymentError

    return res.status(200).json({ success: true, refundId: refund.id })
  } catch (error) {
    console.error('refund-booking error:', error)
    return res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
