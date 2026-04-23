// gscdump.com Partner API Client
// Ported from nuxtseo.com

import type { BuilderState } from 'gscdump/query'

// Re-export types from gscdump/query for convenience
export type { BuilderState, Dimension, Filter, Metric } from 'gscdump/query'

// Comparison filter for qc parameter
export type GscComparisonFilter = 'new' | 'lost' | 'improving' | 'declining'

// ===== Unified Data Response Types =====

export interface GscdumpDataRow {
  // Dimension values (dynamic based on query)
  page?: string
  query?: string
  queryCanonical?: string
  country?: string
  device?: string
  date?: string
  // Metrics
  clicks: number
  impressions: number
  ctr: number
  position: number
  // Comparison (when qc provided)
  prevClicks?: number
  prevImpressions?: number
  prevCtr?: number
  prevPosition?: number
  // Auto-included extras
  topKeyword?: string
  topPage?: string
  variantCount?: number
  variants?: Array<{ query: string, clicks: number, impressions: number, position: number }>
  difficulty?: number
  searchVolume?: number
  cpc?: number
  // Legacy fields
  firstDate?: string
  lastDate?: string
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

// ===== Response Types =====

export interface GscdumpUserRegistration {
  userId: string
  apiKey: string
  isNew: boolean
}

export interface GscdumpUserTokenUpdate {
  userId: string
  updated: boolean
  sites: GscdumpAvailableSite[]
}

export interface GscdumpAvailableSite {
  siteUrl: string
  permissionLevel: string
  registered: boolean
  siteId?: string
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'error'
  syncProgress?: { completed: number, total: number, percent: number }
  lastSyncAt?: number | null
  newestDateSynced?: string | null
  oldestDateSynced?: string | null
}

export interface GscdumpSiteRegistration {
  siteId: string
  status: 'pending' | 'syncing' | 'error'
  existing?: boolean
}

export interface GscdumpUserSite {
  siteId: string
  siteUrl: string
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error'
  syncProgress?: {
    completed: number
    total: number
    percent: number
  }
  lastSyncAt: number | null
  newestDateSynced: string | null
  oldestDateSynced: string | null
}

export interface GscdumpSyncStatusResponse {
  siteUrl: string
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error'
  oldestDateAvailable: string | null
  oldestDateSynced: string | null
  newestDateSynced: string | null
  lastSyncAt: number | null
  lastError: string | null
  jobs: {
    queued: number
    processing: number
    completed: number
    failed: number
  }
  progress: number
  jobProgress: number
  daysSynced: number
  daysAvailable: number
  isSyncing: boolean
  hasData: boolean
  isComplete: boolean
  tables: Record<string, {
    queued: number
    processing: number
    completed: number
    failed: number
    totalRows: number
  }>
  days?: Record<string, {
    tables: Record<string, {
      status: string
      rowsFetched: number
      rowsInserted: number
      error: string | null
    }>
  }>
  failedJobs?: Array<{
    date: string
    tableName: string
    error: string
    retryCount: number
  }>
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

export interface GscdumpSitemap {
  path: string
  lastSubmitted?: string
  isPending?: boolean
  isSitemapsIndex?: boolean
  lastDownloaded?: string
  warnings?: number
  errors?: number
  type?: string
  contents?: { type: string, submitted: number, indexed: number }[]
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

export interface GscdumpBrandSummary {
  brandClicks: number
  nonBrandClicks: number
  brandShare: number
  brandImpressions: number
  nonBrandImpressions: number
}

export interface GscdumpAnalysisResponse {
  preset: string
  keywords: GscdumpAnalysisResult[]
  totalCount: number
  summary?: GscdumpBrandSummary
  meta: {
    siteUrl: string
    presetDescription: string
    params: Record<string, any>
  }
}

// ===== Indexing Types =====

export interface GscdumpIndexingTrendDay {
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
}

export interface GscdumpIndexingSummary {
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

export interface GscdumpIndexingResponse {
  trend: GscdumpIndexingTrendDay[]
  summary: GscdumpIndexingSummary
  meta: {
    siteUrl: string
    syncStatus: string
  }
}

export interface GscdumpIndexingUrl {
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
}

export interface GscdumpIndexingUrlsResponse {
  urls: GscdumpIndexingUrl[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  meta: {
    siteUrl: string
    filter: string
  }
}

export interface GscdumpIndexingIssue {
  type: string
  label: string
  severity: 'error' | 'warning' | 'info'
  count: number
}

export interface GscdumpIndexingDiagnosticsResponse {
  summary: {
    totalUrls: number
    indexed: number
    indexedPercent: number
  }
  issues: GscdumpIndexingIssue[]
}

// ===== Client Implementation =====

export function useGscdumpClient() {
  const config = useRuntimeConfig()
  const { apiKey } = config.gscdump
  const apiUrl = 'https://gscdump.com/api'
  if (!apiKey)
    throw createError({ statusCode: 500, message: 'GSCDUMP_API_KEY not configured' })

  const headers = { 'x-api-key': apiKey }

  // ===== Partner User Endpoints =====

  async function registerUser(params: {
    userGoogleId: string
    userEmail: string
    userName?: string
    accessToken: string
    refreshToken: string
    tokenExpiresAt: number
  }): Promise<GscdumpUserRegistration> {
    return $fetch<GscdumpUserRegistration>(`${apiUrl}/users/register`, {
      method: 'POST',
      headers,
      body: params,
    })
  }

  async function updateUserTokens(userId: string, params: {
    accessToken: string
    refreshToken: string
    tokenExpiresAt: number
  }): Promise<GscdumpUserTokenUpdate> {
    return $fetch<GscdumpUserTokenUpdate>(`${apiUrl}/users/${userId}/tokens`, {
      method: 'PATCH',
      headers,
      body: params,
    })
  }

  async function getUserSites(userId: string): Promise<{ sites: GscdumpUserSite[] }> {
    return $fetch<{ sites: GscdumpUserSite[] }>(`${apiUrl}/users/${userId}/sites`, { headers })
  }

  async function getSiteSyncStatus(siteId: string): Promise<GscdumpSyncStatusResponse> {
    return $fetch<GscdumpSyncStatusResponse>(`${apiUrl}/sites/${siteId}/sync-status`, { headers })
  }

  async function getAvailableSites(userId: string): Promise<{ sites: GscdumpAvailableSite[] }> {
    return $fetch<{ sites: GscdumpAvailableSite[] }>(`${apiUrl}/users/${userId}/available-sites`, { headers })
  }

  // ===== Partner Site Endpoints =====

  async function registerSite(params: {
    userId: string
    siteUrl: string
    webhookUrl?: string
  }): Promise<GscdumpSiteRegistration> {
    return $fetch<GscdumpSiteRegistration>(`${apiUrl}/sites/register`, {
      method: 'POST',
      headers,
      body: params,
    })
  }

  async function deleteSite(siteId: string): Promise<{ success: boolean }> {
    return $fetch<{ success: boolean }>(`${apiUrl}/sites/${siteId}`, {
      method: 'DELETE',
      headers,
    })
  }

  // ===== Unified Data Endpoints =====

  async function getData(
    siteId: string,
    state: BuilderState,
    options?: { comparison?: BuilderState, filter?: GscComparisonFilter },
  ): Promise<GscdumpDataResponse> {
    const query: Record<string, string> = {
      q: encodeURIComponent(JSON.stringify(state)),
    }
    if (options?.comparison)
      query.qc = encodeURIComponent(JSON.stringify(options.comparison))
    if (options?.filter)
      query.filter = options.filter

    return $fetch<GscdumpDataResponse>(`${apiUrl}/sites/${siteId}/data`, {
      headers,
      query,
    })
  }

  async function getDataDetail(
    siteId: string,
    state: BuilderState,
    options?: { comparison?: BuilderState },
  ): Promise<GscdumpDataDetailResponse> {
    const query: Record<string, string> = {
      q: encodeURIComponent(JSON.stringify(state)),
    }
    if (options?.comparison)
      query.qc = encodeURIComponent(JSON.stringify(options.comparison))

    return $fetch<GscdumpDataDetailResponse>(`${apiUrl}/sites/${siteId}/data/detail`, {
      headers,
      query,
    })
  }

  async function getAnalysis(siteId: string, params: GscdumpAnalysisParams): Promise<GscdumpAnalysisResponse> {
    if ((params.preset === 'non-brand' || params.preset === 'brand-only') && !params.brandTerms?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'brandTerms is required for brand/non-brand presets',
      })
    }
    return $fetch<GscdumpAnalysisResponse>(`${apiUrl}/sites/${siteId}/analysis`, {
      headers,
      query: params,
    })
  }

  async function getSitemaps(siteId: string) {
    return $fetch<{ sitemaps: GscdumpSitemap[] }>(`${apiUrl}/sites/${siteId}/sitemaps`, {
      headers,
    })
  }

  async function submitSitemap(siteId: string, sitemapUrl: string, action: 'submit' | 'delete' = 'submit') {
    return $fetch<{ success: boolean, action: 'submitted' | 'deleted', sitemapUrl: string }>(`${apiUrl}/sites/${siteId}/sitemaps`, {
      method: 'POST',
      headers,
      body: { sitemapUrl, action },
    })
  }

  async function refreshSitemaps(siteId: string) {
    return $fetch<{ success: boolean, action: 'refreshed', sitemapCount: number, changed: boolean }>(`${apiUrl}/sites/${siteId}/sitemaps`, {
      method: 'POST',
      headers,
      body: { action: 'refresh' },
    })
  }

  // ===== Indexing Endpoints =====

  async function getIndexing(siteId: string, days = 28): Promise<GscdumpIndexingResponse> {
    return $fetch<GscdumpIndexingResponse>(`${apiUrl}/sites/${siteId}/indexing`, {
      headers,
      query: { days },
    })
  }

  async function getIndexingUrls(siteId: string, params: {
    limit?: number
    offset?: number
    status?: 'indexed' | 'not_indexed' | 'pending'
    issue?: string
    search?: string
  } = {}): Promise<GscdumpIndexingUrlsResponse> {
    return $fetch<GscdumpIndexingUrlsResponse>(`${apiUrl}/sites/${siteId}/indexing/urls`, {
      headers,
      query: params,
    })
  }

  async function getIndexingDiagnostics(siteId: string): Promise<GscdumpIndexingDiagnosticsResponse> {
    return $fetch<GscdumpIndexingDiagnosticsResponse>(`${apiUrl}/sites/${siteId}/indexing/diagnostics`, {
      headers,
    })
  }

  return {
    // User management
    registerUser,
    updateUserTokens,
    getUserSites,
    getAvailableSites,
    // Site management
    registerSite,
    deleteSite,
    // Unified data queries
    getData,
    getDataDetail,
    // Analysis & sitemaps
    getAnalysis,
    getSitemaps,
    submitSitemap,
    refreshSitemaps,
    getSiteSyncStatus,
    // Indexing
    getIndexing,
    getIndexingUrls,
    getIndexingDiagnostics,
  }
}
