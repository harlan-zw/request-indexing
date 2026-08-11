import type { EventPayload } from '#domain-events/server'
import { defineListener } from '@harlan-zw/nuxt-domain-events/server'
import { insertBillingEvent } from './_billing-event'

export default defineListener({
  name: 'billing.disputed-persist',
  event: 'pro:billing:disputed',
  execution: { _tag: 'sync', failure: 'isolate' },
  handle: ({ event, userId, teamId, chargeId, amount, reason }: EventPayload<'pro:billing:disputed'>) => (
    insertBillingEvent(event, {
      userId,
      teamId,
      kind: 'disputed',
      stripeId: chargeId,
      amount,
      reason,
      metadata: null,
    })
  ),
})
