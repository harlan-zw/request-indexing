import { eq } from 'drizzle-orm'
import { schema } from '#layers/pro-saas/server/database'
import { defineIdempotentHandler } from '#layers/pro-saas/server/utils/handler'
import { ProError } from '#layers/pro-saas/shared/errors'
import { createTrialCheckoutSession, ensureStripeCustomer, normalizeBillingCheckoutRequest } from '../../../utils/billing-sessions'
import { useStripeClient } from '../../../utils/stripe-client'

export default defineIdempotentHandler({}, async ({ event, db, caller }) => {
  const body: { tier?: 'pro' | 'growth' | 'scale', cycle?: 'monthly' | 'annual' } = (await readBody<{ tier?: 'pro' | 'growth' | 'scale', cycle?: 'monthly' | 'annual' }>(event).catch(() => ({}))) ?? {}
  const query = getQuery(event)
  const checkoutRequest = normalizeBillingCheckoutRequest({
    tier: body.tier ?? (query.tier === 'scale' ? 'scale' : query.tier === 'growth' ? 'growth' : query.tier === 'pro' ? 'pro' : undefined),
    cycle: body.cycle ?? (query.cycle === 'annual' ? 'annual' : query.cycle === 'monthly' ? 'monthly' : undefined),
  })

  const userRow = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.userId, caller.user.id))
    .get()

  if (!userRow)
    throw new ProError('unauthorized')

  if (userRow.subscriptionStatus === 'trial' || userRow.subscriptionStatus === 'active')
    return { alreadyStarted: true, reason: userRow.subscriptionStatus }

  const stripe = useStripeClient(event)
  const stripeCustomerId = await ensureStripeCustomer(event, db, stripe, userRow)
  const checkoutSession = await createTrialCheckoutSession(event, stripe, stripeCustomerId, userRow.userId, checkoutRequest)

  return { url: checkoutSession.url }
}, { scope: 'trial-start' })
