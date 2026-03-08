import Stripe from 'stripe'

let stripeInstance = null

export function getStripe() {
  if (stripeInstance) return stripeInstance

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }

  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  })

  return stripeInstance
}
