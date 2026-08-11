import type { H3Event } from 'h3'
import { billingEvents } from '#layers/pro-saas/server/database'

export interface PersistedBillingRow {
  userId: number
  teamId: number | null
  kind: 'payment_failed' | 'refunded' | 'disputed'
  stripeId: string
  amount: number
  reason: string | null
  metadata: string | null
}

export async function insertBillingEvent(event: H3Event, row: PersistedBillingRow): Promise<void> {
  const db = useDrizzle(event)
  await db.insert(billingEvents).values({ ...row, createdAt: Date.now() }).onConflictDoNothing()
}
