// Pre-hook listener: cancel the user's Stripe subscription before pro D1 rows
// are purged. Critical — if this throws, the producer aborts the delete so the
// user can't end up with a deleted local row but a live Stripe subscription.

import { cancelStripeSubscription } from '../utils/stripe-purchases'

export default defineProListener('pro:user:deleting', async ({ event, subscriptionId, subscriptionStatus }) => {
  if (!subscriptionId)
    return
  if (subscriptionStatus === 'canceled')
    return
  const result = await cancelStripeSubscription(event, subscriptionId)
  if (!result.ok)
    throw new Error(`stripe cancel failed: ${result.message}`)
}, { critical: true })
