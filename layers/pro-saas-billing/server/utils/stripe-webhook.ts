import type Stripe from 'stripe'

export const STRIPE_SUBSCRIPTION_SYNC_EVENTS = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'customer.subscription.trial_will_end',
  'subscription_schedule.updated',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.finalized',
  'charge.refunded',
  'charge.dispute.created',
  'charge.dispute.closed',
])

export type BillingWebhookKind = 'payment_failed' | 'refunded' | 'disputed'

export type BillingWebhookDispatch
  = | {
    hook: 'pro:billing:payment-failed'
    kind: 'payment_failed'
    payload: {
      invoiceId: string
      amountDue: number
      attemptCount: number
    }
  }
  | {
    hook: 'pro:billing:refunded'
    kind: 'refunded'
    payload: {
      chargeId: string
      amount: number
      reason: string | null
    }
  }
  | {
    hook: 'pro:billing:disputed'
    kind: 'disputed'
    payload: {
      chargeId: string
      amount: number
      reason: string
    }
  }

export interface TrialDripDispatch {
  sequence: 'trial'
  stepIndex: 0 | 3
}

export function stripeCustomerIdFromEvent(stripeEvent: Stripe.Event): string | null {
  const obj = stripeEvent.data.object as unknown as Record<string, unknown>
  const rawCustomer = obj.customer
  const customerFromField
    = typeof rawCustomer === 'string'
      ? rawCustomer
      : (rawCustomer && typeof (rawCustomer as { id?: unknown }).id === 'string'
          ? (rawCustomer as { id: string }).id
          : null)
  return customerFromField
    ?? (stripeEvent.type.startsWith('customer.') && typeof obj.id === 'string' ? obj.id : null)
}

export function shouldSyncSubscriptionFromStripe(stripeEvent: Stripe.Event): boolean {
  return STRIPE_SUBSCRIPTION_SYNC_EVENTS.has(stripeEvent.type)
}

export function billingDispatchForStripeEvent(stripeEvent: Stripe.Event): BillingWebhookDispatch | null {
  const obj = stripeEvent.data.object as unknown as Record<string, unknown>

  if (stripeEvent.type === 'invoice.payment_failed') {
    const inv = obj as unknown as Stripe.Invoice & { attempt_count?: number }
    return {
      hook: 'pro:billing:payment-failed',
      kind: 'payment_failed',
      payload: {
        invoiceId: inv.id ?? '',
        amountDue: inv.amount_due ?? 0,
        attemptCount: inv.attempt_count ?? 0,
      },
    }
  }

  if (stripeEvent.type === 'charge.refunded') {
    const charge = obj as unknown as Stripe.Charge
    return {
      hook: 'pro:billing:refunded',
      kind: 'refunded',
      payload: {
        chargeId: charge.id,
        amount: charge.amount_refunded ?? 0,
        reason: (charge.refunds?.data?.[0]?.reason as string | null | undefined) ?? null,
      },
    }
  }

  if (stripeEvent.type === 'charge.dispute.created') {
    const dispute = obj as unknown as Stripe.Dispute
    return {
      hook: 'pro:billing:disputed',
      kind: 'disputed',
      payload: {
        chargeId: typeof dispute.charge === 'string' ? dispute.charge : (dispute.charge as { id: string })?.id ?? '',
        amount: dispute.amount ?? 0,
        reason: dispute.reason ?? 'unknown',
      },
    }
  }

  return null
}

export function trialDripForStripeEvent(stripeEvent: Stripe.Event): TrialDripDispatch | null {
  if (stripeEvent.type === 'customer.subscription.created') {
    const sub = stripeEvent.data.object as Stripe.Subscription
    if (sub.status === 'trialing')
      return { sequence: 'trial', stepIndex: 0 }
  }
  if (stripeEvent.type === 'customer.subscription.paused')
    return { sequence: 'trial', stepIndex: 3 }
  return null
}

export function planChangedInSubscriptionEvent(stripeEvent: Stripe.Event, beforeTier: string | null | undefined, afterTier: string | null | undefined): boolean {
  if (!stripeEvent.type.startsWith('customer.subscription.'))
    return false
  return beforeTier !== afterTier || stripeEvent.type === 'customer.subscription.created'
}
