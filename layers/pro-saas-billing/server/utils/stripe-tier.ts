import type Stripe from 'stripe'

export interface ResolvedTier {
  tier: 'pro' | 'growth' | 'scale'
  sitesLimit: number
  cycle: 'monthly' | 'annual'
}

// Pull tier+limits off price metadata. The base item is whichever item isn't
// a metered overage; we only support one base price per subscription.
export function tierFromSubscription(sub: Stripe.Subscription): ResolvedTier | null {
  const baseItem = sub.items.data.find(i => !['growth_overage', 'scale_overage'].includes(i.price.metadata?.tier as string))
  if (!baseItem)
    return null
  const tier = baseItem.price.metadata?.tier as 'pro' | 'growth' | 'scale' | undefined
  if (tier !== 'pro' && tier !== 'growth' && tier !== 'scale')
    return null
  const sitesLimitRaw = baseItem.price.metadata?.sites_limit
  const sitesLimit = sitesLimitRaw ? Number.parseInt(sitesLimitRaw, 10) : 0
  const cycle = baseItem.price.recurring?.interval === 'year' ? 'annual' : 'monthly'
  return { tier, sitesLimit, cycle }
}

export async function resolvePriceByLookupKey(stripe: Stripe, lookupKey: string): Promise<Stripe.Price> {
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], expand: ['data.product'], limit: 1 })
  const price = prices.data[0]
  if (!price)
    throw new Error(`Stripe price not found for lookup_key=${lookupKey}`)
  return price
}
