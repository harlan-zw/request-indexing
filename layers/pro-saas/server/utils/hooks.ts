import type { ConsolaInstance } from 'consola'
import type { H3Event } from 'h3'
import { createConsola } from 'consola'

export interface SiteAddedPayload {
  event: H3Event
  siteId: number
  teamId: number
  url: string
  userId: number
  isNew: boolean
}

export interface SiteRemovedPayload {
  event: H3Event
  siteId: number
  teamId: number
  userId: number
  /** gscdump-side site id, captured before the row was purged. */
  gscdumpSiteId: string | null
}

export interface UserDeletingPayload {
  event: H3Event
  userId: number
  email: string
  stripeCustomerId: string | null
  gscdumpUserId: string | null
  subscriptionId: string | null
  subscriptionStatus: string | null
}

export interface UserDeletedPayload {
  event: H3Event
  userId: number
  email: string
  stripeCustomerId: string | null
  gscdumpUserId: string | null
}

export interface SubscriptionChangedPayload {
  event: H3Event
  teamId: number
  oldPlan: string
  newPlan: string
  status: string
}

export interface MembershipAddedPayload {
  event: H3Event
  teamId: number
  userId: number
  role: string
}

export interface MembershipRemovedPayload {
  event: H3Event
  teamId: number
  userId: number
  /** Role the user HAD at the time of removal. */
  role: string
}

export interface MembershipRoleChangedPayload {
  event: H3Event
  teamId: number
  userId: number
  /** New role. */
  role: string
  previousRole: string
}

export interface IntegrationLinkedPayload {
  event: H3Event
  userId: number
  kind: 'gscdump' | 'stripe' | 'github' | 'google' | 'resend'
}

export interface IntegrationUnlinkedPayload {
  event: H3Event
  userId: number
  kind: 'gscdump' | 'stripe' | 'github' | 'google' | 'resend'
}

export interface BillingPaymentFailedPayload {
  event: H3Event
  userId: number
  teamId: number | null
  invoiceId: string
  amountDue: number
  attemptCount: number
}

export interface BillingRefundedPayload {
  event: H3Event
  userId: number
  teamId: number | null
  chargeId: string
  amount: number
  reason: string | null
}

export interface BillingDisputedPayload {
  event: H3Event
  userId: number
  teamId: number | null
  chargeId: string
  amount: number
  reason: string
}

export interface OnboardingCompletedPayload {
  event: H3Event
  userId: number
  teamId: number
}

/**
 * Per-feature usage contribution returned to the `/api/pro/usage` aggregator.
 * Each layer that meters a billable resource (AI chat spend, DataForSEO calls,
 * etc.) appends one entry per key. Producer reads `contributions` after the
 * hook resolves.
 */
export interface ProUsageContribution {
  key: string
  estimatedUsd?: number
  limitUsd?: number | null
  overCap?: boolean
  resetsAt?: string | null
  used?: number
  limit?: number | null
}

export interface UsageCollectPayload {
  event: H3Event
  userId: number
  contributions: ProUsageContribution[]
}

// Producer-owned hook declarations live in the firing layer's own `hooks.ts`
// (e.g. `pro:perf:scan-complete` in `layers/pro-perf/server/utils/hooks.ts`,
// `pro:gsc:sync-complete` in `layers/pro-gsc/server/utils/hooks.ts`). Nitro
// merges the `NitroRuntimeHooks` augmentation across layers; `dispatchProEvent`
// / `dispatchProTaskEvent` see the union. Hooks declared here are shared
// pro-saas concerns (identity, membership, subscription, billing) that span
// multiple consumer layers.

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'pro:site:added': (payload: SiteAddedPayload) => void | Promise<void>
    'pro:site:removed': (payload: SiteRemovedPayload) => void | Promise<void>
    'pro:user:deleting': (payload: UserDeletingPayload) => void | Promise<void>
    'pro:user:deleted': (payload: UserDeletedPayload) => void | Promise<void>
    'pro:subscription:changed': (payload: SubscriptionChangedPayload) => void | Promise<void>
    'pro:membership:added': (payload: MembershipAddedPayload) => void | Promise<void>
    'pro:membership:removed': (payload: MembershipRemovedPayload) => void | Promise<void>
    'pro:membership:role-changed': (payload: MembershipRoleChangedPayload) => void | Promise<void>
    'pro:integration:linked': (payload: IntegrationLinkedPayload) => void | Promise<void>
    'pro:integration:unlinked': (payload: IntegrationUnlinkedPayload) => void | Promise<void>
    'pro:billing:payment-failed': (payload: BillingPaymentFailedPayload) => void | Promise<void>
    'pro:billing:refunded': (payload: BillingRefundedPayload) => void | Promise<void>
    'pro:billing:disputed': (payload: BillingDisputedPayload) => void | Promise<void>
    'pro:onboarding:completed': (payload: OnboardingCompletedPayload) => void | Promise<void>
    'pro:usage:collect': (payload: UsageCollectPayload) => void | Promise<void>
  }
}

type HookKey = keyof import('nitropack/types').NitroRuntimeHooks
type HookPayload<K extends HookKey> = Parameters<import('nitropack/types').NitroRuntimeHooks[K]>[0]

export interface ProListenerOptions {
  /**
   * If true, errors thrown by the listener propagate up to the producer (aborting
   * the original request). Use only for pre-hooks where the producer must abort
   * on listener failure (e.g. `pro:user:deleting` Stripe cancellation).
   * Default false: errors are logged and swallowed (best-effort post-hook).
   */
  critical?: boolean
}

/**
 * Standard wrapper for pro Nitro hook listeners. Concentrates the per-listener
 * boilerplate (try/catch, structured logging, duration capture) so each listener
 * file is just `defineProListener('hook:name', async (payload) => { ... })`.
 *
 * Producers MUST NOT rely on listener failures (per ADR-0007); the default mode
 * swallows errors. `critical: true` opts a listener into propagation, intended
 * only for the Stripe-cancel-on-user-delete pre-hook pattern.
 */
const fallbackLog = createConsola({ defaults: { tag: 'pro-listener' } })

function listenerLogger(hook: string, payload: { event?: H3Event }): ConsolaInstance {
  const ctxLogger = (payload?.event?.context as any)?.logger as ConsolaInstance | undefined
  return (ctxLogger ?? fallbackLog).withTag(`listener:${hook}`)
}

export function defineProListener<K extends HookKey>(
  hook: K,
  fn: (payload: HookPayload<K>) => void | Promise<void>,
  opts: ProListenerOptions = {},
) {
  return defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook(hook, (async (payload: any) => {
      const log = listenerLogger(hook, payload)
      const t0 = Date.now()
      try {
        await fn(payload)
        log.debug('ok', { ms: Date.now() - t0 })
      }
      catch (err) {
        log.error('failed', { ms: Date.now() - t0, err })
        if (opts.critical)
          throw err
      }
    }) as any)
  })
}

type ProListenerPlugin = ReturnType<typeof defineProListener>

/**
 * Compose multiple `defineProListener` registrations into a single Nitro plugin.
 * Use when one listener file owns several related hooks (e.g. all `pro:billing:*`
 * persistence in `plugins/listener.billing.persist.ts`).
 */
export function defineProListeners(listeners: ProListenerPlugin[]) {
  return defineNitroPlugin((nitroApp) => {
    for (const l of listeners)
      l(nitroApp)
  })
}

export {}
