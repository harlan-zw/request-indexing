import type { GscColumn } from '@gscdump/sdk/period-presets'
import type { CompareMode, Period } from './useGscPeriod'
import {
  COMPARE_OPTIONS,
  GSC_COLUMN_OPTIONS,
  GSC_PERIOD_OPTIONS,
  GSC_PERIOD_OPTIONS_LONG,
  PERIOD_PRESETS,
} from '@gscdump/sdk/period-presets'
import { isCustomPeriod, parseCustomPeriod } from './useGscPeriod'

export type { GscColumn, GscColumnOption, PeriodPreset } from '@gscdump/sdk/period-presets'
export { COMPARE_OPTIONS, GSC_COLUMN_OPTIONS, GSC_PERIOD_OPTIONS, GSC_PERIOD_OPTIONS_LONG, PERIOD_PRESETS }

const DEFAULT_PERIOD: Period = '3m'
const DEFAULT_COMPARE: CompareMode = 'previous'
const DEFAULT_STABLE_DATA = true
const DEFAULT_COLUMNS: GscColumn[] = ['clicks', 'impressions']

// ===== Shared localStorage helpers =====

export function readStored<T>(key: string, fallback: T): T {
  if (import.meta.server)
    return fallback
  const raw = localStorage.getItem(key)
  if (raw == null)
    return fallback
  try {
    return JSON.parse(raw)
  }
  catch {
    return fallback
  }
}

export function writeStored(key: string, value: unknown) {
  if (import.meta.server)
    return
  localStorage.setItem(key, JSON.stringify(value))
}

// ===== URL + localStorage synced filter =====

/**
 * Creates a ref that syncs with URL query params and localStorage.
 * Priority: URL query > localStorage > defaultValue.
 * Uses a local ref to avoid stale route.query during rapid updates.
 */
export function useProUrlSyncedFilter<T extends string | number>(
  queryKey: string,
  storageKey: string,
  defaultValue: T,
  opts?: { fromString?: (s: string) => T, toString?: (v: T) => string },
): Ref<T> {
  const route = useRoute()
  const fromStr = opts?.fromString ?? (s => s as T)
  const toStr = opts?.toString ?? (v => String(v))

  // Use cookie so SSR can read the value and avoid hydration mismatch
  const cookieKey = storageKey.replace(/:/g, '-')
  const cookie = useCookie<T>(cookieKey, { default: () => defaultValue, watch: false })

  // Resolve initial value: URL query > cookie/localStorage > default.
  // Use useState so all callers of useProGscFilters() share the same ref —
  // critical for parent/child page coordination (e.g. layout date picker
  // updating the child page's table fetch).
  const rawQuery = route.query[queryKey] as string | undefined
  const initial = rawQuery
    ? fromStr(rawQuery)
    : cookie.value ?? readStored<T>(storageKey, defaultValue)
  const value = useState<T>(`pro-filter:${storageKey}`, () => initial)
  let skipUrlSync = false

  // Migrate localStorage → cookie after hydration (deferred to avoid SSR mismatch)
  if (import.meta.client) {
    onMounted(() => {
      if (rawQuery || cookie.value !== defaultValue)
        return
      const stored = readStored<T>(storageKey, defaultValue)
      if (stored !== defaultValue) {
        value.value = stored
        cookie.value = stored
      }
    })
  }

  // Sync URL query changes → local ref (e.g. browser back/forward)
  watch(() => route.query[queryKey] as string | undefined, (raw) => {
    const resolved = raw ? fromStr(raw) : cookie.value ?? readStored<T>(storageKey, defaultValue)
    if (resolved !== value.value) {
      skipUrlSync = true
      value.value = resolved
      skipUrlSync = false
    }
  })

  // Sync local ref → cookie + localStorage + URL
  watch(value, (val) => {
    cookie.value = val
    writeStored(storageKey, val)
    if (skipUrlSync)
      return
    const isDefault = val === defaultValue
    const newQuery = { ...route.query, [queryKey]: isDefault ? undefined : toStr(val) }
    navigateTo({ query: newQuery }, { replace: true })
  })

  return value
}

const customLabelFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const customLabelFmtYear = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function getPeriodLabel(period: Period): string {
  const custom = parseCustomPeriod(period)
  if (custom) {
    const s = new Date(`${custom.start}T00:00:00`)
    const e = new Date(`${custom.end}T00:00:00`)
    const sameYear = s.getFullYear() === e.getFullYear()
    return sameYear
      ? `${customLabelFmt.format(s)} – ${customLabelFmtYear.format(e)}`
      : `${customLabelFmtYear.format(s)} – ${customLabelFmtYear.format(e)}`
  }
  return PERIOD_PRESETS.find(p => p.value === period)?.label ?? period
}

export function useProGscFilters() {
  const period = useProUrlSyncedFilter<Period>('period', 'pro:period', DEFAULT_PERIOD)
  const compareMode = useProUrlSyncedFilter<CompareMode>('compare', 'pro:compare', DEFAULT_COMPARE)

  // Remember the pre-zoom preset so resetZoom() restores it.
  // Shared across callers via useState so the same page consumer sees consistent state.
  const preZoomPeriod = useState<Period | null>('pro:preZoomPeriod', () => null)

  function zoomTo(range: { start: string, end: string, prevStart?: string, prevEnd?: string }) {
    if (!isCustomPeriod(period.value)) {
      preZoomPeriod.value = period.value
    }
    const suffix = range.prevStart && range.prevEnd ? `:${range.prevStart}:${range.prevEnd}` : ''
    period.value = `custom:${range.start}:${range.end}${suffix}` as Period
  }

  function resetZoom() {
    period.value = preZoomPeriod.value ?? DEFAULT_PERIOD
    preZoomPeriod.value = null
  }

  const isZoomed = computed(() => isCustomPeriod(period.value))

  // Stable data toggle: when true (default), end date is offset by 3 days to avoid incomplete GSC data
  // Uses useCookie so the ref is shared across all useProGscFilters() callers (useCookie deduplicates by key)
  const stableData = useCookie<boolean>('pro-stable-data', { default: () => DEFAULT_STABLE_DATA })

  // Migrate localStorage → cookie after hydration (deferred to avoid SSR mismatch)
  if (import.meta.client) {
    onMounted(() => {
      if (stableData.value !== DEFAULT_STABLE_DATA)
        return
      const stored = readStored<boolean>('pro:stable-data', DEFAULT_STABLE_DATA)
      if (stored !== DEFAULT_STABLE_DATA)
        stableData.value = stored
    })
  }
  // Keep localStorage in sync for backwards compat
  watch(stableData, val => writeStored('pro:stable-data', val))

  const route = useRoute()

  // Columns: URL query > localStorage > default (ref + watcher to avoid stale route.query)
  function parseColumnsFromUrl(raw: string | undefined): GscColumn[] | null {
    if (!raw)
      return null
    const parsed = raw.split(',').filter(c => GSC_COLUMN_OPTIONS.some(o => o.key === c)) as GscColumn[]
    return parsed.length ? parsed : null
  }

  const initialColumns = parseColumnsFromUrl(route.query.columns as string | undefined) ?? DEFAULT_COLUMNS
  const columns = ref(initialColumns) as Ref<GscColumn[]>
  let skipColUrlSync = false

  // Apply localStorage columns after hydration (deferred to avoid SSR mismatch)
  if (import.meta.client) {
    onMounted(() => {
      if (parseColumnsFromUrl(route.query.columns as string | undefined))
        return
      const stored = readStored<GscColumn[]>('pro:columns', DEFAULT_COLUMNS)
      if (stored.join(',') !== columns.value.join(','))
        columns.value = stored
    })
  }

  watch(() => route.query.columns as string | undefined, (raw) => {
    const parsed = parseColumnsFromUrl(raw) ?? readStored<GscColumn[]>('pro:columns', DEFAULT_COLUMNS)
    if (parsed.join(',') !== columns.value.join(',')) {
      skipColUrlSync = true
      columns.value = parsed
      skipColUrlSync = false
    }
  })

  watch(columns, (val) => {
    writeStored('pro:columns', val)
    if (skipColUrlSync)
      return
    const isDefault = val.length === DEFAULT_COLUMNS.length && val.every((c, i) => c === DEFAULT_COLUMNS[i])
    navigateTo({ query: { ...route.query, columns: isDefault ? undefined : val.join(',') } }, { replace: true })
  })

  function toggleColumn(col: GscColumn) {
    const current = [...columns.value]
    const idx = current.indexOf(col)
    if (idx >= 0) {
      if (current.length > 1)
        current.splice(idx, 1)
    }
    else {
      current.push(col)
    }
    const order = GSC_COLUMN_OPTIONS.map(o => o.key)
    current.sort((a, b) => order.indexOf(a) - order.indexOf(b))
    columns.value = current
  }

  function isColumnActive(col: GscColumn) {
    return columns.value.includes(col)
  }

  return {
    period,
    compareMode,
    stableData,
    columns,
    periodOptions: GSC_PERIOD_OPTIONS,
    columnOptions: GSC_COLUMN_OPTIONS,
    toggleColumn,
    isColumnActive,
    zoomTo,
    resetZoom,
    isZoomed,
    preZoomPeriod,
  }
}
