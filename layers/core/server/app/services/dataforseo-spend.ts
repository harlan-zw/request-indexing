// Per-call cost accounting for the DataForSEO account shared with nuxtseo.com.
//
// Until 2026-08-23 the public tools spent credit with no record and no ceiling,
// and the month's billing export could not be attributed to a caller. Every
// outbound batch now writes one `dataforseo_requests` row carrying the
// provider's OWN measured cost (micro-USD), and a shared daily budget closes
// the tools once it is spent — the same contract nuxtseo.com's free tools
// adopted the same week.
//
// Dependencies are explicit: budget and storage arrive as a `DataForSeoSpendEnv`
// so the decision core stays pure and testable; the route seam passes the nitro
// defaults via `dataForSeoSpendEnv(event)`.

import type { H3Event } from 'h3'
import { getHeader } from 'h3'

const USD_MICROS = 1_000_000

/**
 * The counter store surface the budget needs — the shape nitro's `cache`
 * storage already provides. Structural (not `unstorage.Storage`) so this
 * module adds no dependency and tests can hand-roll a Map.
 */
export interface DataForSeoSpendStorage {
  getItem: (key: string) => Promise<unknown>
  setItem: (key: string, value: number, opts?: { ttl: number }) => Promise<void>
}

/**
 * List price per task, micro-USD, for the live endpoints the tools use. Used
 * only by the PRE-call gate to predict a batch's cost; the ledger and the
 * budget counter record the provider's measured cost afterwards.
 *   - SERP organic live advanced: $0.0015/task (depth ≤ 100)
 *   - Labs domain_rank_overview live: $0.0021/task
 */
export const TASK_COST_MICROS: ReadonlyMap<string, number> = new Map([
  ['/serp/google/organic/live/advanced', 1500],
  ['/dataforseo_labs/google/domain_rank_overview/live', 2100],
])

/** Daily ceiling for all DataForSEO tool spend combined, USD. Default $5. */
export const DEFAULT_DAILY_BUDGET_USD = 5

export interface DataForSeoSpendEnv {
  /** Budget ceiling in micro-USD for the UTC day. */
  budgetMicros: number
  /** The counter store. In production the `cache` KV namespace. */
  storage: DataForSeoSpendStorage
}

/**
 * Resolve the production env: `dataforseo.dailyBudgetUsd` runtime config
 * (NUXT_DATAFORSEO_DAILY_BUDGET_USD) and the `cache` storage namespace.
 */
export function dataForSeoSpendEnv(): DataForSeoSpendEnv {
  const config = useRuntimeConfig().dataforseo as { dailyBudgetUsd?: string } | undefined
  const n = Number(config?.dailyBudgetUsd)
  const budgetUsd = Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_BUDGET_USD
  return { budgetMicros: Math.round(budgetUsd * USD_MICROS), storage: useStorage('cache') }
}

function dayBucket(now: Date): string {
  return `dataforseo:budget:${now.toISOString().slice(0, 10)}`
}

function secondsUntilDayEnd(now: Date): number {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return Math.ceil((end - now.getTime()) / 1000) + 60
}

export interface DataForSeoSpendQuery {
  /** Caller-facing tool name for attribution, e.g. 'check-index'. */
  tool: string
  /** Provider endpoint path. */
  endpoint: string
  /** Tasks in the batch. Cost is metered per task; the ledger row records the count. */
  taskCount: number
}

export interface DataForSeoSpendVerdict {
  /** True when the daily budget is exhausted and the call must not be made. */
  blocked: boolean
  /** Micro-USD spent today so far, all tools combined. */
  spentMicros: number
  /** Micro-USD the caller may still spend today. */
  remainingMicros: number
}

/**
 * Read today's shared spend and decide whether one more call fits.
 *
 * A storage read that fails opens the gate instead of closing it: a missing
 * counter must read as "nothing spent", never as "budget gone" — the tools
 * being up is worth more than the cents a broken KV read would save.
 */
export async function checkDataForSeoBudget(
  query: DataForSeoSpendQuery,
  env: DataForSeoSpendEnv,
  now = new Date(),
): Promise<DataForSeoSpendVerdict> {
  const spent = await env.storage.getItem(dayBucket(now)).catch(() => null) as number | null ?? 0
  const perCall = query.taskCount * (TASK_COST_MICROS.get(query.endpoint) ?? 0)
  return {
    blocked: spent + perCall > env.budgetMicros,
    spentMicros: spent,
    remainingMicros: Math.max(0, env.budgetMicros - spent),
  }
}

/**
 * Record one completed batch against the ledger and the daily budget.
 *
 * `costUsdMicros` is the provider's measured sum for the tasks it actually
 * served, read from the response envelope; null when the batch failed before a
 * body (HTTP error), where DataForSEO charges nothing. Best-effort: a ledger or
 * KV failure logs and never breaks the tool response, because the budget gate
 * already ran before the call.
 *
 * `env` carries the spend environment plus the optional request event (for the
 * caller-IP hash on the ledger row) — the shape every service call context is.
 */
export async function recordDataForSeoSpend(
  query: DataForSeoSpendQuery,
  outcome: { httpStatus: number, costUsdMicros: number | null },
  env: DataForSeoSpendEnv & { event?: H3Event },
  now = new Date(),
): Promise<void> {
  const event = env.event
  const ipHash = event
    ? await hashCallerIp(event).catch(() => null)
    : null

  const bucket = dayBucket(now)
  // Lazy: keeps this module free of a drizzle import at load time (tools that
  // only gate don't pay it), and resolves the binding from the event when one
  // is in scope.
  const { useDrizzle, tables } = await import('../../utils/drizzle')
  const results = await Promise.allSettled([
    useDrizzle(event).insert(tables.dataforseoRequests).values({
      tool: query.tool,
      endpoint: query.endpoint,
      taskCount: query.taskCount,
      status: outcome.httpStatus >= 200 && outcome.httpStatus < 300 ? 'ok' : 'http_error',
      httpStatus: outcome.httpStatus,
      costUsdMicros: outcome.costUsdMicros,
      ipHash,
      createdAt: now,
    }),
    outcome.costUsdMicros !== null
      ? env.storage.getItem(bucket)
          .catch(() => null)
          .then((spent: unknown) =>
            env.storage.setItem(bucket, (typeof spent === 'number' ? spent : 0) + outcome.costUsdMicros!, { ttl: secondsUntilDayEnd(now) }))
      : Promise.resolve(),
  ])
  // Genuinely ignorable best-effort: the gate already ran pre-call, so a failed
  // record only means the ceiling closes a few calls late.
  for (const r of results) {
    if (r.status === 'rejected')
      console.warn('[dataforseo-spend] record failed', r.reason)
  }
}

async function hashCallerIp(event: H3Event): Promise<string | null> {
  const ip = getHeader(event, 'cf-connecting-ip')
    || getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
  if (!ip)
    return null
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
  return `ip:${[...new Uint8Array(digest)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')}`
}
