import type { H3Event } from 'h3'
import { logger } from '~~/shared/server/logger'
import { useStripeClient } from './stripe-client'

export interface StripePurchaseResult {
  found: boolean
  customerId?: string
  email?: string
  paymentIntentId?: string
  checkoutSessionId?: string
  subscriptionId?: string
  subscriptionStatus?: string
}

export async function findStripePurchaseByEmail(event: H3Event, email: string): Promise<StripePurchaseResult> {
  email = email.toLowerCase().trim()
  const config = useRuntimeConfig(event)
  if (!config.stripeSecretKey) {
    return { found: false }
  }

  const stripe = useStripeClient(event)

  // search for customers by email
  const customers = await stripe.customers.list({ email, limit: 1 })

  const customer = customers.data[0]
  if (customer) {
    // check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    })

    const activeSub = subscriptions.data[0]
    if (activeSub) {
      return {
        found: true,
        customerId: customer.id,
        email: customer.email || undefined,
        subscriptionId: activeSub.id,
        subscriptionStatus: activeSub.status,
      }
    }

    // no active subscription, return customer but no lifetime status
  }

  // no customer - check for guest checkout via checkout sessions
  const sessions = await stripe.checkout.sessions.list({
    customer_details: { email },
    limit: 10,
  })

  // Note: we no longer treat one-time payments as valid for new signups
  // All signups must have an active subscription

  return { found: false }
}

export async function findStripePurchaseByCheckoutSession(event: H3Event, checkoutSessionId: string): Promise<StripePurchaseResult> {
  const config = useRuntimeConfig(event)
  if (!config.stripeSecretKey) {
    return { found: false }
  }

  const stripe = useStripeClient(event)

  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId).catch((err) => {
    logger.error('[stripe] checkout session retrieve failed:', err.message)
    return null
  })
  if (!session || session.payment_status !== 'paid') {
    return { found: false }
  }

  return {
    found: true,
    customerId: session.customer as string | undefined,
    email: session.customer_details?.email || undefined,
    paymentIntentId: session.payment_intent as string | undefined,
    checkoutSessionId: session.id,
  }
}

export async function cancelStripeSubscription(event: H3Event, subscriptionId: string): Promise<{ ok: boolean, status?: string, message?: string }> {
  const config = useRuntimeConfig(event)
  if (!config.stripeSecretKey)
    return { ok: false, message: 'STRIPE_SECRET_KEY not configured' }

  const stripe = useStripeClient(event)
  return stripe.subscriptions.cancel(subscriptionId)
    .then(sub => ({ ok: true, status: sub.status }))
    .catch((error: unknown) => ({
      ok: false,
      status: typeof error === 'object' && error !== null && 'statusCode' in error ? String(error.statusCode) : undefined,
      message: error instanceof Error ? error.message : String(error),
    }))
}

export async function findStripePurchaseByEmails(event: H3Event, emails: string[]): Promise<StripePurchaseResult & { matchedEmail?: string }> {
  for (const email of emails) {
    const result = await findStripePurchaseByEmail(event, email)
    if (result.found) {
      return { ...result, matchedEmail: email }
    }
  }
  return { found: false }
}
