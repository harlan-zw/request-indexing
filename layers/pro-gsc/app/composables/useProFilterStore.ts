import { useCookie, useState } from 'nuxt/app'

// Persistence backend for every dashboard filter: period, compare mode,
// stable-data, chart columns, entity counts, search type and the facets.
//
// Why a cookie and not localStorage: the server must be able to read a filter
// while it renders. localStorage is client-only, so the previous design paid
// for that with a post-hydration restore. The ref started on the default, then
// flipped to the persisted value in `onMounted`, and every data fan-out that
// watched a filter therefore ran twice on first load. That doubled the API
// traffic of the search-console and indexing pages.
//
// One cookie holds every filter, so the request header carries a single small
// entry instead of one per filter. The path is scoped to the dashboard, which
// keeps it off the asset requests.
//
// The store is bounded. Some storage keys are per site, so an unbounded map
// would grow with every site a team visits until the cookie broke the request
// header. Entries are evicted oldest first once either budget is exceeded.
//
// Ported from nuxtseo.com `layers/pro/sites/app/composables/useProFilterStore.ts`.

const COOKIE_NAME = 'pro-filters'
const COOKIE_PATH = '/pro/dashboard'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const MAX_ENTRIES = 32
const MAX_BYTES = 2048

export type ProFilterValue = string | number | boolean | string[]
export type ProFilterMap = Record<string, ProFilterValue>

/**
 * Parse an untrusted cookie payload into the filter map. Anything that is not a
 * supported scalar or string list is dropped rather than repaired: a stored
 * object reaching a scalar filter used to serialize into the URL as
 * "[object Object]".
 */
function parseFilterMap(raw: unknown): ProFilterMap {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
    return {}
  const parsed: ProFilterMap = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string' || typeof value === 'boolean')
      parsed[key] = value
    else if (typeof value === 'number' && Number.isFinite(value))
      parsed[key] = value
    else if (Array.isArray(value) && value.every(item => typeof item === 'string'))
      parsed[key] = value as string[]
  }
  return parsed
}

/**
 * A stored value is only usable if it has the same runtime shape as the
 * caller's fallback. A persisted list must never enter a scalar filter.
 */
function matchesFallbackShape(value: ProFilterValue | undefined, fallback: unknown): boolean {
  if (value === undefined)
    return false
  if (Array.isArray(fallback))
    return Array.isArray(value)
  if (Array.isArray(value))
    return false
  return typeof value === typeof fallback
}

/**
 * Drop the oldest entries until the map fits both budgets. Object key order is
 * insertion order, and `write` re-inserts the key it touches, so the first key
 * is always the least recently written.
 */
export function withinFilterBudget(map: ProFilterMap): ProFilterMap {
  let bounded = map
  let keys = Object.keys(bounded)
  while (keys.length > 1 && (keys.length > MAX_ENTRIES || JSON.stringify(bounded).length > MAX_BYTES)) {
    const { [keys[0]!]: _dropped, ...rest } = bounded
    bounded = rest
    keys = Object.keys(bounded)
  }
  return bounded
}

/**
 * Read and write persisted dashboard filters.
 *
 * `useCookie` returns a new ref per call and its refs only converge through an
 * async broadcast, which is the same settles-after-mount shape this store
 * exists to remove. So the cookie is the storage and a single `useState` entry
 * is the shared in-memory value: every caller reads the same object
 * synchronously, on the server and on the client.
 */
export function useProFilterStore() {
  const cookie = useCookie<ProFilterMap>(COOKIE_NAME, {
    default: () => ({}),
    path: COOKIE_PATH,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  })
  const state = useState<ProFilterMap>('pro:filter-store', () => parseFilterMap(cookie.value))

  function read<T extends ProFilterValue>(key: string, fallback: T): T {
    const value = state.value[key]
    return matchesFallbackShape(value, fallback) ? value as T : fallback
  }

  function write(key: string, value: ProFilterValue) {
    const { [key]: _previous, ...rest } = state.value
    const next = withinFilterBudget({ ...rest, [key]: value })
    state.value = next
    cookie.value = next
  }

  return { read, write }
}
