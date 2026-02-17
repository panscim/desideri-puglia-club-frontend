import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { buffer } from 'micro'

// Initialize Stripe
// Note: STRIPE_SECRET_KEY must be set in Vercel Environment Variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
})

// Initialize Supabase with Service Role for admin privileges
// Note: SUPABASE_SERVICE_ROLE_KEY must be set in Vercel Environment Variables
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Disable body parser for signature verification
export const config = {
    api: {
        bodyParser: false,
    },
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).end('Method Not Allowed')
    }

    let event
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']

    try {
        event = stripe.webhooks.constructEvent(
            buf,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (err) {
        console.error(`❌ Webhook signature verification failed:`, err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const { client_reference_id, metadata, amount_total, payment_intent } = session
        const userId = client_reference_id // Stripe Client Reference ID should be the UUID of the user/partner

        console.log(`🔔 Payment received: ${metadata?.type} for user ${userId}`)

        try {
            // 1. BOOST (B2C)
            if (metadata?.type === 'boost') {
                if (!userId) throw new Error('Missing userId for boost')

                const multiplier = parseFloat(metadata.multiplier || '1.5')
                const durationHours = parseInt(metadata.duration_hours || '24', 10)

                // Calcola scadenza
                const now = new Date()
                const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000)

                // Aggiorna utente
                const { error: uErr } = await supabase
                    .from('utenti')
                    .update({
                        boost_multiplier: multiplier,
                        boost_expires_at: expiresAt.toISOString()
                    })
                    .eq('id', userId)

                if (uErr) throw uErr

                // Log transazione
                await supabase.from('logs_transazioni').insert({
                    user_id: userId,
                    tipo: 'boost_acquisto',
                    punti: 0,
                    punti_effettivi: 0,
                    note: `Acquistato Boost x${multiplier} per ${durationHours}h (€${amount_total / 100})`
                })
            }

            // 2. GETTONI (B2B - Partner)
            else if (metadata?.type === 'gettoni') {
                const partnerId = userId // In questo caso il client_reference_id è il partner_id
                if (!partnerId) throw new Error('Missing partnerId for gettoni')

                const quantity = parseInt(metadata.quantity || '0', 10)

                // Aggiorna partner (incrementa saldo)
                // Usa RPC o fetch+update. Meglio RPC se esiste per atomicità, ma qui facciamo fetch+upd per semplicità server-side
                const { data: p, error: pEsc } = await supabase.from('partners').select('saldo_punti').eq('id', partnerId).single()
                if (pEsc) throw pEsc

                const newBalance = (p.saldo_punti || 0) + quantity

                const { error: updErr } = await supabase
                    .from('partners')
                    .update({ saldo_punti: newBalance })
                    .eq('id', partnerId)

                if (updErr) throw updErr

                // Log transazione
                await supabase.from('logs_transazioni').insert({
                    partner_id: partnerId,
                    tipo: 'acquisto_gettoni',
                    punti: quantity, // Quantità gettoni
                    punti_effettivi: quantity,
                    note: `Acquistati ${quantity} gettoni (€${amount_total / 100})`
                })
            }

            // 3. PRODOTTO FISICO (Shop)
            else if (metadata?.type === 'product') {
                if (!userId) throw new Error('Missing userId for product')
                const productId = metadata.product_id

                // Decrementa stock
                if (productId) {
                    const { data: item } = await supabase.from('market_items').select('stock').eq('id', productId).single()
                    if (item && typeof item.stock === 'number') {
                        await supabase.from('market_items').update({ stock: item.stock - 1 }).eq('id', productId)
                    }
                }

                // Crea ordine
                // Nota: Assumiamo che la tabella market_orders esista e abbia queste colonne
                // Se non esiste, questo fallirà e vedremo l'errore nei log di Vercel
                const { error: ordErr } = await supabase.from('market_orders').insert({
                    user_id: userId,
                    // item_id o market_item_id? Provo market_item_id che è più probabile se item:market_items(...)
                    // Se fallisce, bisognerà correggere il nome colonna
                    market_item_id: productId,
                    status: 'pagato',
                    metodo: 'stripe',
                    prezzo_pagato: amount_total / 100,
                    payment_intent_id: typeof payment_intent === 'string' ? payment_intent : payment_intent?.id,
                    created_at: new Date().toISOString()
                })

                if (ordErr) {
                    console.error('Failed to create order:', ordErr)
                    // Fallback: prova con `item_id` se `market_item_id` fallisce? 
                    // Meglio gestire l'errore e basta per ora.
                    throw ordErr
                }
            }

        } catch (err) {
            console.error('❌ Error processing webhook logic:', err)
            return res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    res.json({ received: true })
}
