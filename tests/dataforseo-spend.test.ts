import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The public tools spend a DataForSEO account shared with nuxtseo.com. Until
// 2026-08-23 nothing recorded or bounded that spend. These scratch checks drive
// the exported budget + ledger functions the route seams call.

const inserted: Array<Record<string, unknown>> = []
// The D1 ledger write is a side effect at the storage boundary; capture it
// instead of booting drizzle against a binding no node test has.
vi.mock('../layers/core/server/utils/drizzle', () => ({
  useDrizzle: () => ({
    insert: () => ({
      values: (v: Record<string, unknown>) => {
        inserted.push(v)
        return Promise.resolve()
      },
    }),
  }),
  tables: { dataforseoRequests: 'dataforseo_requests' },
}))

const { checkDataForSeoBudget, recordDataForSeoSpend } = await import('../layers/core/server/app/services/dataforseo-spend')

const USD = 1_000_000

/** Real in-memory fixture of the counter surface nitro's cache storage provides. */
function memoryStorage(): { getItem: (k: string) => Promise<unknown>, setItem: (k: string, v: number, o?: { ttl: number }) => Promise<void> } {
  const store = new Map<string, number>()
  return {
    getItem: k => Promise.resolve(store.get(k) ?? null),
    setItem: (k, v) => {
      store.set(k, v)
      return Promise.resolve()
    },
  }
}

function env(budgetUsd: number) {
  return { budgetMicros: Math.round(budgetUsd * USD), storage: memoryStorage() }
}

const SERP = '/serp/google/organic/live/advanced'

describe('dataforseo spend budget', () => {
  beforeEach(() => {
    inserted.length = 0
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('blocks once measured spend passes the daily ceiling', async () => {
    const e = env(2)
    await recordDataForSeoSpend(
      { tool: 'check-index', endpoint: SERP, taskCount: 1 },
      { httpStatus: 200, costUsdMicros: 1.5 * USD },
      e,
    )
    await recordDataForSeoSpend(
      { tool: 'bulk-check', endpoint: SERP, taskCount: 50 },
      { httpStatus: 200, costUsdMicros: 0.75 * USD },
      e,
    )

    const verdict = await checkDataForSeoBudget({ tool: 'check-index', endpoint: SERP, taskCount: 1 }, e)
    expect(verdict.spentMicros).toBe(2.25 * USD)
    expect(verdict.blocked, 'a $2.25 day against a $2 budget must refuse the next call').toBe(true)
    expect(inserted).toHaveLength(2)
    expect(inserted[0]).toMatchObject({ tool: 'check-index', costUsdMicros: 1.5 * USD, status: 'ok' })
  })

  it('predicts a batch cost from list price before the call is made', async () => {
    const e = env(2)
    const fresh = await checkDataForSeoBudget({ tool: 'bulk-check', endpoint: SERP, taskCount: 50 }, e)
    expect(fresh.blocked, '50 tasks x $0.0015 list = $0.075, far under a fresh $2 day').toBe(false)

    await recordDataForSeoSpend(
      { tool: 'bulk-check', endpoint: SERP, taskCount: 50 },
      { httpStatus: 200, costUsdMicros: 1.99 * USD },
      e,
    )
    const next = await checkDataForSeoBudget({ tool: 'bulk-check', endpoint: SERP, taskCount: 50 }, e)
    expect(next.blocked, 'a predicted $0.075 no longer fits under a $2 ceiling').toBe(true)
  })

  it('opens the gate when nothing is recorded (fresh day, broken KV)', async () => {
    const verdict = await checkDataForSeoBudget({ tool: 'check-index', endpoint: SERP, taskCount: 1 }, env(5))
    expect(verdict.blocked).toBe(false)
    expect(verdict.spentMicros).toBe(0)
  })

  it('records failed transports at zero cost but never bills them', async () => {
    const e = env(2)
    await recordDataForSeoSpend(
      { tool: 'check-index', endpoint: SERP, taskCount: 1 },
      { httpStatus: 402, costUsdMicros: null },
      e,
    )
    const verdict = await checkDataForSeoBudget({ tool: 'check-index', endpoint: SERP, taskCount: 1 }, e)
    expect(verdict.spentMicros, 'a 402 charged nothing, so the day is still unspent').toBe(0)
    expect(inserted[0]).toMatchObject({ status: 'http_error', httpStatus: 402, costUsdMicros: null })
  })
})
