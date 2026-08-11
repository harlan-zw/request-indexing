import { eq } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import { logWarn } from '~~/shared/logging'
import { dispatchEvent } from '#domain-events/server'
import { users } from '#layers/pro-saas/server/database'
import { defineIdempotentHandler } from '#layers/pro-saas/server/utils/handler'
import { ProError } from '#layers/pro-saas/shared/errors'
import { findStripePurchaseByEmail } from '../../utils/stripe-purchases'

export default defineIdempotentHandler(async (event) => {
  const session = await requireUserSession(event)

  const body = await readBody<{ email: string }>(event).catch(() => null)
  if (!body?.email) {
    throw new ProError('validation_failed', { message: 'Email required' })
  }

  const email = body.email.toLowerCase().trim()
  const purchase = await findStripePurchaseByEmail(event, email)

  if (!purchase.found || !purchase.subscriptionStatus) {
    throw new ProError('not_found', { message: 'No payment found for that email' })
  }

  const db = useDrizzle(event)

  // check if there's already a stripe-only user with this email (created by webhook)
  const [stripeOnlyUser] = await db.select()
    .from(users)
    .where(eq(users.stripeEmail, email))
    .limit(1)

  // if stripe-only user exists and is different from current user, delete it (merge)
  if (stripeOnlyUser && stripeOnlyUser.userId !== session.user.id) {
    await db.delete(users).where(eq(users.userId, stripeOnlyUser.userId))
  }

  // update current user with stripe info
  const [existing] = await db.select()
    .from(users)
    .where(eq(users.userId, session.user.id))
    .limit(1)

  if (!existing) {
    // Session is valid but the user row is gone (deleted out from under the cookie).
    // Clear the cookie so the client can recover by logging in again.
    await clearUserSession(event)
    throw new ProError('unauthorized')
  }

  const apiKeyGen = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 40)
  const newApiKey = existing.apiKey || apiKeyGen()

  await db.update(users)
    .set({
      stripeCustomerId: purchase.customerId,
      stripeEmail: purchase.email,
      stripePaymentIntentId: purchase.paymentIntentId,
      stripeCheckoutSessionId: purchase.checkoutSessionId,
      subscriptionId: purchase.subscriptionId,
      subscriptionStatus: purchase.subscriptionStatus as 'trial' | 'active' | 'past_due' | 'paused' | 'canceled' | 'read_only' | 'archived',
      apiKey: newApiKey,
      updatedAt: Date.now(),
    })
    .where(eq(users.userId, session.user.id))

  // Publish integration-linked side effects through the domain event registry.
  await dispatchEvent('pro:integration:linked', {
    event,
    userId: session.user.id,
    kind: 'stripe',
  }).catch((err: unknown) => logWarn('webhook.side_effect_failed', err, { event: 'pro:integration:linked' }))

  return { success: true, subscriptionStatus: purchase.subscriptionStatus, apiKey: newApiKey }
}, { scope: 'link-stripe' })
