import type { H3Event } from 'h3'
import type Stripe from 'stripe'
import type { BillingCycle, BillingSubscriptionTier } from '../../shared/subscription'
import { desc, eq } from 'drizzle-orm'
import { schema } from '#layers/pro-saas/server/database'
import { lookupKeyForTierCycle } from '../../shared/subscription'
import { siteUrl } from './stripe-client'
import { resolvePriceByLookupKey } from './stripe-tier'

export interface BillingCheckoutRequest {
  tier: BillingSubscriptionTier
  cycle: BillingCycle
}

export interface BillingUserRow {
  userId: number
  stripeCustomerId: string | null
  stripeEmail?: string | null
}

export function normalizeBillingCheckoutRequest(input: { tier?: string, cycle?: string } | null | undefined): BillingCheckoutRequest {
  const tier = input?.tier
  return {
    tier: tier === 'scale' ? 'scale' : tier === 'growth' ? 'growth' : 'pro',
    cycle: input?.cycle === 'annual' ? 'annual' : 'monthly',
  }
}

export async function ensureStripeCustomer(
  event: H3Event,
  db: ReturnType<typeof useDrizzle>,
  stripe: Stripe,
  user: BillingUserRow,
): Promise<string> {
  if (user.stripeCustomerId)
    return user.stripeCustomerId

  const primaryIdentity = await db.select({
    email: schema.userIdentities.email,
    displayName: schema.userIdentities.displayName,
  })
    .from(schema.userIdentities)
    .where(eq(schema.userIdentities.userId, user.userId))
    .orderBy(desc(schema.userIdentities.lastUsedAt))
    .get()

  const customer = await stripe.customers.create(
    {
      email: primaryIdentity?.email ?? user.stripeEmail ?? undefined,
      name: primaryIdentity?.displayName ?? undefined,
      metadata: { userId: String(user.userId), source: 'billing_checkout' },
    },
    { idempotencyKey: `customer-${user.userId}` },
  )

  await db.update(schema.users)
    .set({ stripeCustomerId: customer.id, updatedAt: Date.now() })
    .where(eq(schema.users.userId, user.userId))

  return customer.id
}

export async function createTrialCheckoutSession(
  event: H3Event,
  stripe: Stripe,
  customerId: string,
  userId: number,
  request: BillingCheckoutRequest,
): Promise<Stripe.Checkout.Session> {
  const config = useRuntimeConfig(event)
  const priceLookup = lookupKeyForTierCycle(request.tier, request.cycle, {
    stripePriceLookupProMonthly: config.stripe.prices.proMonthly,
    stripePriceLookupProAnnual: config.stripe.prices.proAnnual,
    stripePriceLookupGrowthMonthly: config.stripe.prices.growthMonthly,
    stripePriceLookupGrowthAnnual: config.stripe.prices.growthAnnual,
    stripePriceLookupScaleMonthly: config.stripe.prices.scaleMonthly,
    stripePriceLookupScaleAnnual: config.stripe.prices.scaleAnnual,
  })
  const price = await resolvePriceByLookupKey(stripe, priceLookup)
  const base = siteUrl(event)

  return stripe.checkout.sessions.create(
    {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      subscription_data: {
        trial_period_days: config.stripe.trialDays ?? 14,
        trial_settings: {
          end_behavior: { missing_payment_method: 'pause' },
        },
        metadata: {
          userId: String(userId),
          trial_source: 'self_serve',
          requested_tier: request.tier,
          requested_cycle: request.cycle,
        },
      },
      payment_method_collection: 'if_required',
      managed_payments: { enabled: true },
      customer_update: { address: 'auto', name: 'auto' },
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      success_url: `${base}/dashboard?welcome=trial`,
      cancel_url: `${base}/account/upgrade`,
    },
    { idempotencyKey: `trial-checkout-${userId}-${request.tier}-${request.cycle}` },
  )
}

export async function createBillingPortalSession(
  event: H3Event,
  stripe: Stripe,
  customerId: string,
  returnPath = '/account',
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl(event)}${returnPath}`,
  })
}
