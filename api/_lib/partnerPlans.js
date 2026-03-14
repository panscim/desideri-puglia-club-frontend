export const PARTNER_PLANS = [
  {
    tier: 'discovery',
    name: 'Puglia Discovery',
    productId: 'prod_U6dXaqx4SvzxdW',
    unitAmount: 900,
    commissionRate: 25,
  },
  {
    tier: 'pro',
    name: 'Puglia Pro',
    productId: 'prod_U6dY6wVCv9xLCH',
    unitAmount: 2900,
    commissionRate: 15,
  },
  {
    tier: 'grande',
    name: 'Grande Puglia',
    productId: 'prod_U6dZmZC556bqNX',
    unitAmount: 5900,
    commissionRate: 10,
  },
]

export function getPlanByProductId(productId) {
  return PARTNER_PLANS.find((plan) => plan.productId === String(productId))
}

export function getPlanByTier(tier) {
  return PARTNER_PLANS.find((plan) => plan.tier === String(tier))
}
