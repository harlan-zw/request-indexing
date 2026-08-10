import { eq } from 'drizzle-orm'
import { schema } from '#layers/pro-saas/server/database'
import { defineIdempotentHandler } from '#layers/pro-saas/server/utils/handler'
import { ProError } from '#layers/pro-saas/shared/errors'
import { resolveBillingAction, resolveBillingLifecycle } from '../../../../shared/subscription'
import {
  createBillingPortalSession,
  createTrialCheckoutSession,
  ensureStripeCustomer,
  normalizeBillingCheckoutRequest,
} from '../../../utils/billing-sessions'
import { useStripeClient } from '../../../utils/stripe-client'

export default defineIdempotentHandler({}, async ({ event, db, caller }) => {
  const body = await readBody<{ tier?: 'pro' | 'growth' | 'scale', cycle?: 'monthly' | 'annual' }>(event).catch(() => ({}))
  const checkoutRequest = normalizeBillingCheckoutRequest(body)

  const userRow = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.userId, caller.user.id))
    .get()

  if (!userRow)
    throw new ProError('unauthorized')

  const lifecycle = resolveBillingLifecycle({
    status: userRow.subscriptionStatus,
    tier: userRow.subscriptionTier,
    cancelAtPeriodEnd: userRow.cancelAtPeriodEnd,
    stripeCustomerId: userRow.stripeCustomerId,
  })

  const stripe = useStripeClient(event)
  const action = resolveBillingAction(lifecycle)

  if (action.mode === 'portal') {
    const portalSession = await createBillingPortalSession(event, stripe, userRow.stripeCustomerId!)
    return { url: portalSession.url, mode: action.mode, intent: action.intent }
  }

  if (action.mode === 'none')
    return { alreadyStarted: true, mode: action.mode, intent: action.intent, reason: lifecycle.status }

  const stripeCustomerId = await ensureStripeCustomer(event, db, stripe, userRow)
  const checkoutSession = await createTrialCheckoutSession(event, stripe, stripeCustomerId, userRow.userId, checkoutRequest)
  return { url: checkoutSession.url, mode: action.mode, intent: action.intent }
}, { scope: 'billing-checkout' })
