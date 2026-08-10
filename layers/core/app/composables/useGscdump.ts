import type { GscdumpV1Client, GscdumpV1OperationInput, GscdumpV1OperationResponse } from '@gscdump/sdk/v1'
import type { BuilderState } from 'gscdump/query'
import { createGscdumpV1Client } from '@gscdump/sdk/v1'

export interface GscdumpCredentials {
  apiKey: string
  userId: string
  apiUrl: string
}

export interface GscdumpDataRow {
  page?: string
  query?: string
  queryCanonical?: string
  country?: string
  device?: string
  date?: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  prevClicks?: number
  prevImpressions?: number
  prevCtr?: number
  prevPosition?: number
  topKeyword?: string
  topPage?: string
  variantCount?: number
  variants?: Array<{ query: string, clicks: number, impressions: number, position: number }>
  difficulty?: number
  searchVolume?: number
  cpc?: number
  firstDate?: string
  lastDate?: string
}

export interface GscdumpMeta {
  siteUrl: string
  syncStatus: string
  newestDateSynced: string | null
  oldestDateSynced: string | null
  dataDelay: string
  enrichment?: {
    lastEnriched: number
    isDue: boolean
  }
}

export interface GscdumpDataResponse {
  rows: GscdumpDataRow[]
  totalCount: number
  totals: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  meta: GscdumpMeta
}

export interface GscdumpDataDetailResponse {
  daily: Array<{
    date: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
  totals: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  previousTotals?: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  meta: GscdumpMeta
}

export type AnalysisPreset
  = | 'non-brand'
    | 'brand-only'
    | 'striking-distance'
    | 'opportunity'
    | 'movers-rising'
    | 'movers-declining'
    | 'decay'
    | 'zero-click'

export interface GscdumpAnalysisParams {
  preset: AnalysisPreset
  startDate: string
  endDate: string
  prevStartDate?: string
  prevEndDate?: string
  brandTerms?: string
  limit?: number
  offset?: number
  search?: string
  minImpressions?: number
  minPosition?: number
  maxPosition?: number
  maxCtr?: number
}

export interface GscdumpAnalysisResult {
  keyword: string
  queryCanonical?: string
  variantCount?: number
  variants?: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
  page?: string
  topPage?: string
  prevClicks?: number
  prevImpressions?: number
  prevCtr?: number
  prevPosition?: number
  potentialClicks?: number
  opportunityScore?: number
  clicksChange?: number
  clicksChangePercent?: number
  positionChange?: number
  decayPercent?: number
  missedClicks?: number
}

export interface GscdumpAnalysisResponse {
  preset: string
  keywords: GscdumpAnalysisResult[]
  totalCount: number
  summary?: {
    brandClicks: number
    nonBrandClicks: number
    brandShare: number
    brandImpressions: number
    nonBrandImpressions: number
  }
  meta: {
    siteUrl: string
    presetDescription: string
    params: Record<string, any>
  }
}

export interface GscdumpSitemap {
  path: string
  errors: number
  warnings: number
  urlCount: number
  lastDownloaded: string | null
  isPending: boolean
  fetchedAt: number
}

export interface GscdumpSitemapsResponse {
  sitemaps: GscdumpSitemap[]
  history: Array<{ date: string, errors: number, warnings: number, urlCount: number }>
  meta: { siteUrl: string, syncStatus: string | null }
}

export interface GscdumpIndexingResponse {
  trend: Array<{
    date: string
    totalUrls: number
    indexedCount: number
    notIndexedCount: number
    errorCount: number
    indexedPercent: number
    issues: {
      blockedByRobots: number
      noindexDetected: number
      soft404: number
      redirect: number
      notFound: number
      serverError: number
    }
    coverage: {
      submittedIndexed: number
      crawledNotIndexed: number
      discoveredNotCrawled: number
    }
  }>
  summary: {
    totalUrls: number
    indexed: number
    notIndexed: number
    pending: number
    indexedPercent: number
    oldestCheck: string | null
    newestCheck: string | null
    change7d: number | null
    change28d: number | null
  }
  meta: { siteUrl: string, syncStatus: string }
}

export interface GscdumpIndexingUrlsResponse {
  urls: Array<{
    url: string
    verdict: 'PASS' | 'FAIL' | 'PARTIAL' | 'NEUTRAL'
    coverageState: string
    indexingState: string
    robotsTxtState: string
    pageFetchState: string
    lastCrawlTime: string | null
    crawlingUserAgent: string | null
    userCanonical: string | null
    googleCanonical: string | null
    firstCheckedAt: string
    lastCheckedAt: string
    checkCount: number
  }>
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  meta: { siteUrl: string, filter: string }
}

export interface GscdumpIndexingDiagnosticsResponse {
  summary: {
    totalUrls: number
    indexed: number
    indexedPercent: number
  }
  issues: Array<{
    type: string
    label: string
    count: number
    severity: 'error' | 'warning' | 'info'
  }>
}

export type GscComparisonFilter = 'new' | 'lost' | 'improving' | 'declining'

type V1ReportState = GscdumpV1OperationInput<'analytics.reports.query'>['body']['state']
type V1AvailableSitesData = GscdumpV1OperationResponse<'partner.users.sites.available.list'>['data']

// The contract's BuilderState is intentionally open to additive fields, while
// the query package exposes a closed interface. They share the same runtime
// grammar, so keep the unavoidable structural cast at this one boundary.
function toV1ReportState(state: BuilderState): V1ReportState {
  return state as unknown as V1ReportState
}

// ===== Credentials =====

const credentialsCache = ref<GscdumpCredentials | null>(null)
const credentialsPromise = ref<Promise<GscdumpCredentials> | null>(null)

async function getCredentials(): Promise<GscdumpCredentials> {
  if (credentialsCache.value)
    return credentialsCache.value

  if (credentialsPromise.value)
    return credentialsPromise.value

  credentialsPromise.value = $fetch<GscdumpCredentials>('/api/gscdump/credentials')
    .then((creds) => {
      credentialsCache.value = creds
      return creds
    })
    .finally(() => {
      credentialsPromise.value = null
    })

  return credentialsPromise.value
}

export function clearGscdumpCredentials() {
  credentialsCache.value = null
}

// ===== Error Handling =====

export interface GscdumpError {
  message: string
  code: 'AUTH' | 'NOT_FOUND' | 'RATE_LIMIT' | 'SERVER' | 'NETWORK' | 'UNKNOWN'
  status?: number
  retry?: boolean
}

function parseGscdumpError(e: unknown): GscdumpError {
  if (e instanceof Error) {
    const fetchError = e as Error & { status?: number, statusCode?: number, data?: { message?: string } }
    const status = fetchError.status || fetchError.statusCode

    if (status === 401 || status === 403)
      return { message: 'Authentication failed. Please reconnect your account.', code: 'AUTH', status, retry: false }
    if (status === 404)
      return { message: 'Data not found. The site may not be synced yet.', code: 'NOT_FOUND', status, retry: false }
    if (status === 429)
      return { message: 'Rate limited. Please wait a moment and try again.', code: 'RATE_LIMIT', status, retry: true }
    if (status && status >= 500)
      return { message: 'Server error. Please try again later.', code: 'SERVER', status, retry: true }
    if (e.message.includes('fetch') || e.message.includes('network'))
      return { message: 'Network error. Check your connection.', code: 'NETWORK', retry: true }

    return { message: fetchError.data?.message || e.message || 'An error occurred', code: 'UNKNOWN', status, retry: true }
  }
  return { message: 'An unexpected error occurred', code: 'UNKNOWN', retry: true }
}

const recentToasts = new Map<string, number>()
const TOAST_DEDUPE_MS = 5000

// ===== Core Composable =====

export function useGscdump() {
  const toast = useToast()
  const credentials = ref<GscdumpCredentials | null>(null)
  const error = ref<GscdumpError | null>(null)

  function _showErrorToast(gscdumpError: GscdumpError) {
    const key = `${gscdumpError.code}:${gscdumpError.message}`
    const now = Date.now()

    if (recentToasts.has(key) && now - recentToasts.get(key)! < TOAST_DEDUPE_MS)
      return
    recentToasts.set(key, now)

    for (const [k, v] of recentToasts) {
      if (now - v > TOAST_DEDUPE_MS)
        recentToasts.delete(k)
    }

    toast.add({
      title: 'Data Loading Error',
      description: gscdumpError.message,
      color: gscdumpError.code === 'AUTH' ? 'warning' : 'error',
      icon: gscdumpError.code === 'NETWORK' ? 'i-lucide-wifi-off' : 'i-lucide-alert-circle',
    })
  }

  async function ensureCredentials() {
    if (!credentials.value) {
      credentials.value = await getCredentials().catch((e) => {
        const parsed = parseGscdumpError(e)
        error.value = parsed
        _showErrorToast(parsed)
        throw e
      })
    }
    return credentials.value
  }

  async function createV1Client() {
    const creds = await ensureCredentials()
    return createGscdumpV1Client({
      apiRoot: creds.apiUrl.replace(/\/+$/, ''),
      credential: creds.apiKey,
    })
  }

  async function runV1<T>(
    request: (client: GscdumpV1Client) => Promise<{ data: unknown }>,
    silent = false,
  ): Promise<T> {
    try {
      const client = await createV1Client()
      const response = await request(client)
      return response.data as T
    }
    catch (e) {
      const parsed = parseGscdumpError(e)
      error.value = parsed
      if (!silent)
        _showErrorToast(parsed)
      throw e
    }
  }

  function queryAnalyticsReport(input: GscdumpV1OperationInput<'analytics.reports.query'>, silent = false) {
    return runV1<GscdumpDataResponse>(client => client.queryAnalyticsReport(input), silent)
  }

  function queryAnalyticsReportDetail(input: GscdumpV1OperationInput<'analytics.reports.detail.query'>, silent = false) {
    return runV1<GscdumpDataDetailResponse>(client => client.queryAnalyticsReportDetail(input), silent)
  }

  function getSiteAnalysis(input: GscdumpV1OperationInput<'partner.sites.analysis.get'>, silent = false) {
    return runV1<GscdumpAnalysisResponse>(client => client.getSiteAnalysis(input), silent)
  }

  function getSiteIndexing(input: GscdumpV1OperationInput<'partner.sites.indexing.get'>, silent = false) {
    return runV1<GscdumpIndexingResponse>(client => client.getSiteIndexing(input), silent)
  }

  function listSiteIndexingUrls(input: GscdumpV1OperationInput<'partner.sites.indexing.urls.list'>, silent = false) {
    return runV1<GscdumpIndexingUrlsResponse>(client => client.listSiteIndexingUrls(input), silent)
  }

  function getSiteIndexingDiagnostics(input: GscdumpV1OperationInput<'partner.sites.indexing.diagnostics.get'>, silent = false) {
    return runV1<GscdumpIndexingDiagnosticsResponse>(client => client.getSiteIndexingDiagnostics(input), silent)
  }

  function getSiteSitemaps(input: GscdumpV1OperationInput<'partner.sites.sitemaps.get'>, silent = false) {
    return runV1<GscdumpSitemapsResponse>(client => client.getSiteSitemaps(input), silent)
  }

  function listAvailableSites(input: GscdumpV1OperationInput<'partner.users.sites.available.list'>, silent = false) {
    return runV1<V1AvailableSitesData>(client => client.listAvailableSites(input), silent)
  }

  return {
    credentials,
    error,
    ensureCredentials,
    getSiteAnalysis,
    getSiteIndexing,
    getSiteIndexingDiagnostics,
    getSiteSitemaps,
    listAvailableSites,
    listSiteIndexingUrls,
    queryAnalyticsReport,
    queryAnalyticsReportDetail,
  }
}

// ===== Data Composables =====

export function useGscdumpData(
  siteId: MaybeRefOrGetter<string>,
  state: MaybeRefOrGetter<BuilderState>,
  options?: {
    comparison?: MaybeRefOrGetter<BuilderState | undefined>
    filter?: MaybeRefOrGetter<GscComparisonFilter | undefined>
    immediate?: boolean
    watch?: boolean
  },
) {
  const _siteId = computed(() => toValue(siteId))
  const _state = computed(() => toValue(state))
  const _comparison = computed(() => toValue(options?.comparison))
  const _filter = computed(() => toValue(options?.filter))

  const key = computed(() => {
    const parts = ['gscdump', 'data', _siteId.value, JSON.stringify(_state.value)]
    if (_comparison.value)
      parts.push(JSON.stringify(_comparison.value))
    if (_filter.value)
      parts.push(_filter.value)
    return parts.join(':')
  })

  return useAsyncData<GscdumpDataResponse>(
    key,
    async () => {
      if (!_siteId.value)
        return null as unknown as GscdumpDataResponse
      const { queryAnalyticsReport } = useGscdump()
      return queryAnalyticsReport({
        params: { siteId: _siteId.value },
        body: {
          state: toV1ReportState(_state.value),
          comparison: _comparison.value ? toV1ReportState(_comparison.value) : undefined,
          filter: _filter.value,
        },
      })
    },
    {
      server: false,
      immediate: options?.immediate ?? true,
      watch: (options?.watch ?? true) ? [_siteId, _state, _comparison, _filter] : undefined,
    },
  )
}

export function useGscdumpDataDetail(
  siteId: MaybeRefOrGetter<string>,
  state: MaybeRefOrGetter<BuilderState>,
  options?: {
    comparison?: MaybeRefOrGetter<BuilderState | undefined>
    immediate?: boolean
    watch?: boolean
  },
) {
  const _siteId = computed(() => toValue(siteId))
  const _state = computed(() => toValue(state))
  const _comparison = computed(() => toValue(options?.comparison))

  const key = computed(() => {
    const parts = ['gscdump', 'detail', _siteId.value, JSON.stringify(_state.value)]
    if (_comparison.value)
      parts.push(JSON.stringify(_comparison.value))
    return parts.join(':')
  })

  return useAsyncData<GscdumpDataDetailResponse>(
    key,
    async () => {
      if (!_siteId.value)
        return null as unknown as GscdumpDataDetailResponse
      const { queryAnalyticsReportDetail } = useGscdump()
      return queryAnalyticsReportDetail({
        params: { siteId: _siteId.value },
        body: {
          state: toV1ReportState(_state.value),
          comparison: _comparison.value ? toV1ReportState(_comparison.value) : undefined,
        },
      })
    },
    {
      server: false,
      immediate: options?.immediate ?? true,
      watch: (options?.watch ?? true) ? [_siteId, _state, _comparison] : undefined,
    },
  )
}

export function useGscdumpAnalysis(
  siteId: MaybeRefOrGetter<string>,
  params: MaybeRefOrGetter<GscdumpAnalysisParams>,
  options?: { immediate?: boolean, watch?: boolean },
) {
  const _siteId = computed(() => toValue(siteId))
  const _params = computed(() => toValue(params))
  const key = computed(() => ['gscdump', 'analysis', _siteId.value, JSON.stringify(_params.value)].join(':'))

  return useAsyncData<GscdumpAnalysisResponse>(
    key,
    async () => {
      if (!_siteId.value)
        return null as unknown as GscdumpAnalysisResponse
      const { getSiteAnalysis } = useGscdump()
      return getSiteAnalysis({ params: { siteId: _siteId.value }, query: _params.value })
    },
    {
      server: false,
      immediate: options?.immediate ?? true,
      watch: (options?.watch ?? true) ? [_siteId, _params] : undefined,
    },
  )
}

export function useGscdumpSitemaps(
  siteId: MaybeRefOrGetter<string | undefined>,
  options?: { immediate?: boolean, watch?: boolean },
) {
  const _siteId = computed(() => toValue(siteId))
  const key = computed(() => `gscdump:sitemaps:${_siteId.value}`)

  return useAsyncData<GscdumpSitemapsResponse>(
    key,
    async () => {
      if (!_siteId.value)
        return null as unknown as GscdumpSitemapsResponse
      const { getSiteSitemaps } = useGscdump()
      return getSiteSitemaps({ params: { siteId: _siteId.value } })
    },
    {
      server: false,
      immediate: options?.immediate ?? true,
      watch: (options?.watch ?? true) ? [_siteId] : undefined,
    },
  )
}

export function useGscdumpIndexing(
  siteId: MaybeRefOrGetter<string>,
  days?: MaybeRefOrGetter<number>,
  options?: { immediate?: boolean, watch?: boolean },
) {
  const _siteId = computed(() => toValue(siteId))
  const _days = computed(() => toValue(days) ?? 28)
  const key = computed(() => `gscdump:indexing:${_siteId.value}:${_days.value}`)

  return useAsyncData<GscdumpIndexingResponse>(
    key,
    async () => {
      if (!_siteId.value)
        return null as unknown as GscdumpIndexingResponse
      const { getSiteIndexing } = useGscdump()
      return getSiteIndexing({ params: { siteId: _siteId.value }, query: { days: _days.value } })
    },
    {
      server: false,
      immediate: options?.immediate ?? true,
      watch: (options?.watch ?? true) ? [_siteId, _days] : undefined,
    },
  )
}

export function useGscdumpIndexingUrls(
  siteId: MaybeRefOrGetter<string>,
  params?: MaybeRefOrGetter<{
    limit?: number
    offset?: number
    status?: 'indexed' | 'not_indexed' | 'pending'
    issue?: string
    search?: string
  }>,
  options?: { immediate?: boolean, watch?: boolean },
) {
  const _siteId = computed(() => toValue(siteId))
  const _params = computed(() => toValue(params) ?? {})
  const key = computed(() => ['gscdump', 'indexing-urls', _siteId.value, JSON.stringify(_params.value)].join(':'))

  return useAsyncData<GscdumpIndexingUrlsResponse>(
    key,
    async () => {
      if (!_siteId.value)
        return null as unknown as GscdumpIndexingUrlsResponse
      const { listSiteIndexingUrls } = useGscdump()
      return listSiteIndexingUrls({ params: { siteId: _siteId.value }, query: _params.value })
    },
    {
      server: false,
      immediate: options?.immediate ?? true,
      watch: (options?.watch ?? true) ? [_siteId, _params] : undefined,
    },
  )
}

export function useGscdumpIndexingDiagnostics(
  siteId: MaybeRefOrGetter<string>,
  options?: { immediate?: boolean, watch?: boolean },
) {
  const _siteId = computed(() => toValue(siteId))
  const key = computed(() => `gscdump:indexing-diagnostics:${_siteId.value}`)

  return useAsyncData<GscdumpIndexingDiagnosticsResponse>(
    key,
    async () => {
      if (!_siteId.value)
        return null as unknown as GscdumpIndexingDiagnosticsResponse
      const { getSiteIndexingDiagnostics } = useGscdump()
      return getSiteIndexingDiagnostics({ params: { siteId: _siteId.value }, query: {} })
    },
    {
      server: false,
      immediate: options?.immediate ?? true,
      watch: (options?.watch ?? true) ? [_siteId] : undefined,
    },
  )
}

export function useGscdumpConnectedSites(options?: { immediate?: boolean }) {
  return useAsyncData<{ sites: Array<{
    siteId: string
    siteUrl: string
    syncStatus: 'pending' | 'syncing' | 'synced'
    syncProgress?: { completed: number, total: number, percent: number }
    lastSyncAt: number | null
    newestDateSynced: string | null
    oldestDateSynced: string | null
  }> }>(
    'gscdump:connected-sites',
    async () => {
      const { listAvailableSites, ensureCredentials } = useGscdump()
      const creds = await ensureCredentials()
      if (!creds.userId)
        return { sites: [] }
      const result = await listAvailableSites({ params: { userId: creds.userId }, query: {} })
      return {
        sites: result.sites.flatMap(site => site.registered && site.siteId
          ? [{
              siteId: site.siteId,
              siteUrl: site.siteUrl,
              syncStatus: site.syncStatus === 'error' || !site.syncStatus ? 'pending' as const : site.syncStatus,
              syncProgress: site.syncProgress,
              lastSyncAt: site.lastSyncAt ?? null,
              newestDateSynced: site.newestDateSynced ?? null,
              oldestDateSynced: site.oldestDateSynced ?? null,
            }]
          : []),
      }
    },
    {
      server: false,
      immediate: options?.immediate ?? true,
    },
  )
}

// ===== Table Data Helper =====

export type Period = '7d' | '28d' | '3m' | '6m' | '12m'

export function periodToDays(period: Period | string): number {
  const map: Record<string, number> = { '7d': 7, '28d': 28, '3m': 90, '6m': 180, '12m': 365 }
  return map[period] || 28
}

export function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]!
}

export interface GscdumpTableOptions {
  siteId: MaybeRefOrGetter<string | undefined>
  dimension: 'page' | 'query' | 'queryCanonical' | 'country' | 'device' | 'date'
  period?: MaybeRefOrGetter<Period>
  pageSize?: number
  defaultSort?: { column: string, direction: 'asc' | 'desc' }
  extraFilters?: MaybeRefOrGetter<Array<{ type: string, column: string, value: string }> | undefined>
}

export interface GscdumpTableResponse<T = GscdumpDataRow> {
  rows: T[]
  total: number
  totalClicks: number
  totalImpressions: number
  hasPrevData: boolean
  meta: GscdumpMeta | null
}

export function useGscdumpTableData<T = GscdumpDataRow>(options: GscdumpTableOptions) {
  const { siteId, dimension, pageSize = 50, defaultSort } = options

  const _siteId = computed(() => toValue(siteId))
  const _period = computed(() => toValue(options.period) ?? '28d')
  const _extraFilters = computed(() => toValue(options.extraFilters) ?? [])

  const q = ref('')
  const page = ref(1)
  const filter = ref<GscComparisonFilter | 'default'>('default')
  const sort = ref(defaultSort ?? { column: 'clicks', direction: 'desc' as const })
  const _isLoading = ref(false)
  const isLoading = computed(() => _isLoading.value)
  const error = ref<GscdumpError | null>(null)
  const data = ref<GscdumpTableResponse<T>>({
    rows: [],
    total: 0,
    totalClicks: 0,
    totalImpressions: 0,
    hasPrevData: false,
    meta: null,
  })

  const rows = computed(() => data.value.rows)
  const total = computed(() => data.value.total)

  async function refresh() {
    const siteIdVal = _siteId.value
    if (!siteIdVal)
      return

    _isLoading.value = true
    error.value = null

    const days = periodToDays(_period.value)
    const offset = (page.value - 1) * pageSize

    const state: BuilderState = {
      dimensions: [dimension],
      filter: {
        type: 'and',
        filters: [
          { type: 'between', column: 'date', from: daysAgo(days), to: daysAgo(1) },
          ...(q.value ? [{ type: 'contains' as const, column: dimension, value: q.value }] : []),
          ..._extraFilters.value,
        ],
      } as unknown as BuilderState['filter'],
      orderBy: { column: sort.value.column as any, dir: sort.value.direction },
      rowLimit: pageSize,
      startRow: offset,
    }

    const comparison: BuilderState = {
      dimensions: [dimension],
      filter: {
        type: 'between',
        column: 'date',
        from: daysAgo(days * 2),
        to: daysAgo(days + 1),
      } as unknown as BuilderState['filter'],
    }

    const gscdump = useGscdump()
    const result = await gscdump.queryAnalyticsReport({
      params: { siteId: siteIdVal },
      body: {
        state: toV1ReportState(state),
        comparison: toV1ReportState(comparison),
        filter: filter.value === 'default' ? undefined : filter.value,
      },
    }, true)
      .catch(() => {
        error.value = gscdump.error.value
        return null
      })
      .finally(() => { _isLoading.value = false })

    if (!result)
      return

    const oldestSynced = result.meta?.oldestDateSynced
    const prevStartDate = daysAgo(days * 2 + 2)
    const hasPrevData = !!(oldestSynced && prevStartDate >= oldestSynced)

    data.value = {
      rows: result.rows as T[],
      total: result.totalCount,
      totalClicks: result.totals?.clicks ?? 0,
      totalImpressions: result.totals?.impressions ?? 0,
      hasPrevData,
      meta: result.meta ?? null,
    }
  }

  function toggleFilter(newFilter: GscComparisonFilter | 'default') {
    filter.value = filter.value === newFilter ? 'default' : newFilter
    page.value = 1
  }

  function setPage(newPage: number) {
    page.value = newPage
  }

  function setSort(column: string, direction: 'asc' | 'desc' = 'desc') {
    sort.value = { column, direction }
    page.value = 1
  }

  function toggleSort(column: string) {
    if (sort.value.column === column)
      sort.value.direction = sort.value.direction === 'asc' ? 'desc' : 'asc'
    else
      sort.value = { column, direction: 'desc' }
    page.value = 1
  }

  watch([q, filter, page, sort, _siteId, _period, _extraFilters], () => {
    if (_siteId.value)
      refresh()
  }, { deep: true })

  watch(_siteId, (id) => {
    if (id)
      refresh()
  }, { immediate: true })

  return {
    q,
    page,
    filter,
    sort,
    isLoading,
    error,
    data,
    rows,
    total,
    pageSize,
    refresh,
    toggleFilter,
    setPage,
    setSort,
    toggleSort,
  }
}

export function useGscdumpDates(
  siteId: MaybeRefOrGetter<string | undefined>,
  period: MaybeRefOrGetter<Period>,
  options?: { immediate?: boolean, watch?: boolean },
) {
  const _siteId = computed(() => toValue(siteId))
  const _period = computed(() => toValue(period))
  const key = computed(() => `gscdump:dates:${_siteId.value}:${_period.value}`)

  return useAsyncData(
    key,
    async () => {
      const siteIdVal = _siteId.value
      if (!siteIdVal)
        return null

      const { queryAnalyticsReportDetail } = useGscdump()
      const days = periodToDays(_period.value)

      const state: BuilderState = {
        dimensions: ['date'],
        filter: { type: 'between', column: 'date', from: daysAgo(days), to: daysAgo(1) } as unknown as BuilderState['filter'],
        orderBy: { column: 'date', dir: 'asc' },
      }

      const comparison: BuilderState = {
        dimensions: ['date'],
        filter: { type: 'between', column: 'date', from: daysAgo(days * 2), to: daysAgo(days + 1) } as unknown as BuilderState['filter'],
      }

      const result = await queryAnalyticsReportDetail({
        params: { siteId: siteIdVal },
        body: { state: toV1ReportState(state), comparison: toV1ReportState(comparison) },
      })

      return {
        dates: result.daily,
        period: result.totals,
        prevPeriod: result.previousTotals ?? null,
        meta: result.meta,
        hasPrevData: !!result.previousTotals,
      }
    },
    {
      server: false,
      immediate: options?.immediate ?? true,
      watch: (options?.watch ?? true) ? [_siteId, _period] : undefined,
    },
  )
}
