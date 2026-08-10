import type { H3Event } from 'h3'
import type Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { stripeWebhookEvents, users } from '#layers/pro-saas/server/database'
import { dispatchProEvent } from '#layers/pro-saas/server/utils/dispatch'
import { billingDispatchForStripeEvent, stripeCustomerIdFromEvent } from './stripe-webhook'

/**
 * Idempotent dispatcher: records the Stripe event id, then translates relevant
 * event types into typed `pro:*` hooks. Safe to call multiple times for the
 * same event (returns `{ duplicate: true }` on replay). Designed to be called
 * from the host `server/api/stripe/webhook.post.ts` after signature
 * verification — the host owns user-sync side effects, this util owns the
 * event-bus translation.
 */
export async function handleStripeProEvent(
  event: H3Event,
  stripeEvent: Stripe.Event,
): Promise<{ dispatched: boolean, duplicate: boolean }> {
  const db = useDrizzle(event)

  // Idempotency. PK conflict on event_id => already handled.
  const insertResult = await db
    .insert(stripeWebhookEvents)
    .values({ eventId: stripeEvent.id, eventType: stripeEvent.type, processedAt: new Date() })
    .onConflictDoNothing()
    .returning({ eventId: stripeWebhookEvents.eventId })
  if (insertResult.length === 0)
    return { dispatched: false, duplicate: true }

  const customerId = stripeCustomerIdFromEvent(stripeEvent)

  if (!customerId)
    return { dispatched: false, duplicate: false }

  const userRow = await db
    .select({ id: users.userId, teamId: users.currentTeamId, tier: users.subscriptionTier, status: users.subscriptionStatus })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .get()
  if (!userRow)
    return { dispatched: false, duplicate: false }

  let dispatched = false

  const billingDispatch = billingDispatchForStripeEvent(stripeEvent)
  if (billingDispatch?.hook === 'pro:billing:payment-failed') {
    await dispatchProEvent(event, billingDispatch.hook, {
      userId: userRow.id,
      teamId: userRow.teamId ?? null,
      ...billingDispatch.payload,
    })
    dispatched = true
  }

  if (billingDispatch?.hook === 'pro:billing:refunded') {
    await dispatchProEvent(event, billingDispatch.hook, {
      userId: userRow.id,
      teamId: userRow.teamId ?? null,
      ...billingDispatch.payload,
    })
    dispatched = true
  }

  if (billingDispatch?.hook === 'pro:billing:disputed') {
    await dispatchProEvent(event, billingDispatch.hook, {
      userId: userRow.id,
      teamId: userRow.teamId ?? null,
      ...billingDispatch.payload,
    })
    dispatched = true
  }

  if (stripeEvent.type === 'customer.subscription.updated' && userRow.teamId) {
    // Only fire when status genuinely changed. `previous_attributes` is added by
    // Stripe on .updated events when fields change; absence => no-op for us.
    const prev = (stripeEvent.data as { previous_attributes?: Record<string, unknown> }).previous_attributes
    const sub = stripeEvent.data.object as Stripe.Subscription
    if (prev && 'status' in prev) {
      const newPrice = sub.items?.data?.[0]?.price
      const newPlan = (newPrice?.metadata?.tier as string | undefined) ?? userRow.tier ?? 'none'
      const oldPlan = userRow.tier ?? 'none'
      await dispatchProEvent(event, 'pro:subscription:changed', {
        teamId: userRow.teamId,
        oldPlan,
        newPlan,
        status: sub.status ?? 'unknown',
      })
      dispatched = true
    }
  }

  return { dispatched, duplicate: false }
}
