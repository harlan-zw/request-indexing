import type { EventPayload } from '#domain-events/server'
import { defineListener } from '@harlan-zw/nuxt-domain-events/server'
import { cancelStripeSubscription } from '../utils/stripe-purchases'

export default defineListener({
  name: 'billing.user-deleting-stripe-cancel',
  event: 'pro:user:deleting',
  execution: { _tag: 'sync', failure: 'propagate' },
  handle: async ({ event, subscriptionId, subscriptionStatus }: EventPayload<'pro:user:deleting'>) => {
    if (!subscriptionId || subscriptionStatus === 'canceled')
      return
    const result = await cancelStripeSubscription(event, subscriptionId)
    if (!result.ok)
      throw new Error(`stripe cancel failed: ${result.message}`)
  },
})
