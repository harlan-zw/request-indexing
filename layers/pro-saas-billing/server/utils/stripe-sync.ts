import type Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import * as schema from '#layers/pro-saas/server/database'
import { tierFromSubscription } from './stripe-tier'

type DB = ReturnType<typeof useDrizzle>

type SubStatus = 'trial' | 'active' | 'past_due' | 'paused' | 'canceled' | 'read_only' | 'archived'
function mapStripeStatus(
  status: Stripe.Subscription.Status,
  pause: Stripe.Subscription.PauseCollection | null | undefined,
): SubStatus {
  if (pause)
    return 'paused'
  switch (status) {
    case 'trialing': return 'trial'
    case 'active': return 'active'
    case 'past_due':
    case 'unpaid': return 'past_due'
    case 'canceled': return 'canceled'
    // `incomplete` is the brief pre-payment window for the very first invoice
    // (expires after ~23h). Keep it permissive so a flaky checkout doesn't
    // immediately revoke access. `incomplete_expired` is terminal — the user
    // never paid and Stripe will not bill them.
    case 'incomplete': return 'trial'
    case 'incomplete_expired': return 'canceled'
    default: return 'canceled'
  }
}

// Pull current Customer + Subscription state from Stripe and mirror it into
// our `users` row. Caller resolves the customerId from a webhook payload or a
// trusted server context. Idempotent and safe to replay; treat all writes as
// "set to derived state" rather than incremental.
export async function syncUserFromStripe(stripe: Stripe, db: DB, customerId: string): Promise<void> {
  const customer = await stripe.customers.retrieve(customerId, {
    expand: ['subscriptions.data.items.data.price'],
  })
  if (customer.deleted)
    return
  const c = customer as Stripe.Customer

  // Prefer the live subscription (trial/active/past_due/paused) over a stale
  // canceled/expired one. data[0] is newest-first by created desc, but a
  // cancel-then-resubscribe race can put a dead sub at the front.
  const ACTIVE: ReadonlySet<Stripe.Subscription.Status> = new Set([
    'trialing',
    'active',
    'past_due',
    'unpaid',
    'paused',
  ])
  const subs: Stripe.Subscription[] = c.subscriptions?.data ?? []
  const sub = subs.find((s: Stripe.Subscription) => ACTIVE.has(s.status)) ?? subs[0]
  if (!sub)
    return

  const resolved = tierFromSubscription(sub)
  if (!resolved)
    return

  // current_period_* moved off Subscription onto each SubscriptionItem in the
  // 2026-04-22.dahlia API. Take the base item (non-overage) as the canonical
  // billing period — overage items rebill on the same cycle anyway.
  const baseItem = sub.items.data.find((i: Stripe.SubscriptionItem) => i.price.metadata?.tier !== 'agency_overage') ?? sub.items.data[0]
  const periodStart = baseItem?.current_period_start
  const periodEnd = baseItem?.current_period_end

  const status = mapStripeStatus(sub.status, sub.pause_collection)

  const userRow = await db
    .select({ id: schema.users.userId })
    .from(schema.users)
    .where(eq(schema.users.stripeCustomerId, customerId))
    .get()

  if (!userRow)
    return

  await db.update(schema.users).set({
    subscriptionId: sub.id,
    subscriptionStatus: status,
    subscriptionTier: resolved.tier,
    sitesLimit: resolved.sitesLimit,
    billingCycle: resolved.cycle,
    currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    updatedAt: Date.now(),
  }).where(eq(schema.users.userId, userRow.id))
}
