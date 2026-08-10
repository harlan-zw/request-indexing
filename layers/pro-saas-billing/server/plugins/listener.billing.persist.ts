// Persist Stripe billing webhooks to `billing_events`. One mapper per
// `pro:billing:*` event keeps the wire format ↔ row shape translation in one
// place. Idempotent via UNIQUE(kind, stripe_id); replays no-op.

import type { H3Event } from 'h3'
import type {
  BillingDisputedPayload,
  BillingPaymentFailedPayload,
  BillingRefundedPayload,
} from '#layers/pro-saas/server/utils/hooks'
import { billingEvents } from '#layers/pro-saas/server/database'

interface PersistedBillingRow {
  userId: string
  teamId: string | null
  kind: 'payment_failed' | 'refunded' | 'disputed'
  stripeId: string
  amount: number
  reason: string | null
  metadata: string | null
}

async function insertBillingEvent(event: H3Event, row: PersistedBillingRow): Promise<void> {
  const db = useDrizzle(event)
  await db.insert(billingEvents).values({ ...row, createdAt: Date.now() }).onConflictDoNothing()
}

export default defineProListeners([
  defineProListener(
    'pro:billing:refunded',
    ({ event, userId, teamId, chargeId, amount, reason }: BillingRefundedPayload) =>
      insertBillingEvent(event, {
        userId,
        teamId,
        kind: 'refunded',
        stripeId: chargeId,
        amount,
        reason,
        metadata: null,
      }),
  ),
  defineProListener(
    'pro:billing:disputed',
    ({ event, userId, teamId, chargeId, amount, reason }: BillingDisputedPayload) =>
      insertBillingEvent(event, {
        userId,
        teamId,
        kind: 'disputed',
        stripeId: chargeId,
        amount,
        reason,
        metadata: null,
      }),
  ),
  defineProListener(
    'pro:billing:payment-failed',
    ({ event, userId, teamId, invoiceId, amountDue, attemptCount }: BillingPaymentFailedPayload) =>
      insertBillingEvent(event, {
        userId,
        teamId,
        kind: 'payment_failed',
        stripeId: invoiceId,
        amount: amountDue,
        reason: null,
        metadata: JSON.stringify({ attempt_count: attemptCount }),
      }),
  ),
])
