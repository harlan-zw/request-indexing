import type { EventPayload } from '#domain-events/server'
import { defineListener } from '@harlan-zw/nuxt-domain-events/server'
import { insertBillingEvent } from './_billing-event'

export default defineListener({
  name: 'billing.refunded-persist',
  event: 'pro:billing:refunded',
  execution: { _tag: 'sync', failure: 'isolate' },
  handle: ({ event, userId, teamId, chargeId, amount, reason }: EventPayload<'pro:billing:refunded'>) => (
    insertBillingEvent(event, {
      userId,
      teamId,
      kind: 'refunded',
      stripeId: chargeId,
      amount,
      reason,
      metadata: null,
    })
  ),
})
