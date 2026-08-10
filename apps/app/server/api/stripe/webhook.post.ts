import type Stripe from 'stripe'
import { useStripeClient } from '#layers/pro-saas-billing/server/utils/stripe-client'
import { handleStripeProEvent } from '#layers/pro-saas-billing/server/utils/stripe-event-handler'
import { syncUserFromStripe } from '#layers/pro-saas-billing/server/utils/stripe-sync'
import { shouldSyncSubscriptionFromStripe, stripeCustomerIdFromEvent } from '#layers/pro-saas-billing/server/utils/stripe-webhook'

/**
 * Host-level Stripe webhook entry. Signature verification + dispatch to the
 * billing layer's typed handler. Side effects (user sync) live here; event-bus
 * translation lives in `handleStripeProEvent`.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const sigHeader = getHeader(event, 'stripe-signature')
  if (!sigHeader)
    throw createError({ statusCode: 400, statusMessage: 'missing stripe-signature' })

  const raw = await readRawBody(event, 'utf8')
  if (!raw)
    throw createError({ statusCode: 400, statusMessage: 'empty body' })

  const stripe = useStripeClient(event)

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = await stripe.webhooks.constructEventAsync(
      raw,
      sigHeader,
      config.stripe.webhookSecret,
    )
  }
  catch (err) {
    throw createError({ statusCode: 400, statusMessage: `signature verification failed: ${(err as Error).message}` })
  }

  // Idempotency + pro:* hook translation.
  const result = await handleStripeProEvent(event, stripeEvent)

  // Sync user mirror (read-only state from Stripe → users table) on subscription-touching events.
  if (shouldSyncSubscriptionFromStripe(stripeEvent)) {
    const customerId = stripeCustomerIdFromEvent(stripeEvent)
    if (customerId)
      await syncUserFromStripe(stripe, useDrizzle(event), customerId)
  }

  return { ok: true, ...result }
})
