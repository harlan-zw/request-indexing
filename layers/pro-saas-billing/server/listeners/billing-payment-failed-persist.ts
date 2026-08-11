import type { EventPayload } from '#domain-events/server'
import { defineListener } from '@harlan-zw/nuxt-domain-events/server'
import { insertBillingEvent } from './_billing-event'

export default defineListener({
  name: 'billing.payment-failed-persist',
  event: 'pro:billing:payment-failed',
  execution: { _tag: 'sync', failure: 'isolate' },
  handle: ({ event, userId, teamId, invoiceId, amountDue, attemptCount }: EventPayload<'pro:billing:payment-failed'>) => (
    insertBillingEvent(event, {
      userId,
      teamId,
      kind: 'payment_failed',
      stripeId: invoiceId,
      amount: amountDue,
      reason: null,
      metadata: JSON.stringify({ attempt_count: attemptCount }),
    })
  ),
})
