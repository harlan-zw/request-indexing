import { eq } from 'drizzle-orm'
import { schema } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { ProError } from '#layers/pro-saas/shared/errors'
import { createBillingPortalSession } from '../../../utils/billing-sessions'
import { useStripeClient } from '../../../utils/stripe-client'

export default defineProApiHandler({}, async ({ event, db, caller }) => {
  const userRow = await db
    .select({ stripeCustomerId: schema.users.stripeCustomerId })
    .from(schema.users)
    .where(eq(schema.users.userId, caller.user.id))
    .get()

  if (!userRow?.stripeCustomerId)
    throw new ProError('validation_failed', { message: 'No Stripe customer for this user' })

  const stripe = useStripeClient(event)
  const portalSession = await createBillingPortalSession(event, stripe, userRow.stripeCustomerId)

  return { url: portalSession.url }
})
