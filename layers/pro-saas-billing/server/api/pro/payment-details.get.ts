import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { useStripeClient } from '../../utils/stripe-client'

export default defineProApiHandler({}, async ({ event }) => {
  const query = getQuery(event)
  const paymentIntentId = query.paymentIntentId as string | undefined
  const checkoutSessionId = query.checkoutSessionId as string | undefined

  if (!paymentIntentId && !checkoutSessionId) {
    return { amount: null, currency: null, date: null, receiptUrl: null }
  }

  const stripe = useStripeClient(event)

  let amount: number | undefined
  let currency: string | undefined
  let created: number | undefined
  let receiptUrl: string | undefined

  if (paymentIntentId) {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    amount = pi.amount
    currency = pi.currency
    created = pi.created

    if (pi.latest_charge) {
      const charge = await stripe.charges.retrieve(pi.latest_charge as string)
      receiptUrl = charge.receipt_url ?? undefined
    }
  }
  else if (checkoutSessionId) {
    const cs = await stripe.checkout.sessions.retrieve(checkoutSessionId)
    amount = cs.amount_total ?? undefined
    currency = cs.currency ?? undefined
    created = cs.created

    if (cs.payment_intent) {
      const pi = await stripe.paymentIntents.retrieve(cs.payment_intent as string)
      if (pi.latest_charge) {
        const charge = await stripe.charges.retrieve(pi.latest_charge as string)
        receiptUrl = charge.receipt_url ?? undefined
      }
    }
  }

  return {
    amount: amount ? amount / 100 : null,
    currency: currency?.toUpperCase() ?? null,
    date: created ? new Date(created * 1000).toISOString() : null,
    receiptUrl,
  }
})
