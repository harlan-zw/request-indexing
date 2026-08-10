// Shared response/request types for the gscdump.com Partner API.
// Imported by both the server-side client (server/utils/gscdump-client.ts)
// and the client-side composable (app/composables/useProGscdump.ts).

export type {
  IndexingInspectRateLimited as GscdumpInspectRateLimited,
  IndexingInspectResponse as GscdumpInspectResponse,
  IndexingInspectResult as GscdumpInspectResult,
} from '@gscdump/contracts'
export type {
  GscComparisonFilter,
  GscdumpAvailableSite,
  GscdumpDataDetailResponse,
  GscdumpDataResponse,
  GscdumpDataRow,
  GscdumpMeta,
  GscdumpPerSitemapHistoryEntry,
  GscdumpSitemap,
  GscdumpSitemapHistory,
  GscdumpSitemapsResponse,
  GscdumpSiteRegistration,
  GscdumpSyncStatusResponse,
  GscdumpTotals,
  GscdumpUserRegistration,
  GscdumpUserSite,
  GscdumpUserStatus,
  GscdumpUserTokenUpdate,
  PartnerLifecycleAccount,
  PartnerLifecycleResponse,
  PartnerLifecycleSite,
} from '@gscdump/sdk'

export interface GscdumpSitemapChangesResponse {
  added: { url: string, sitemap: string, firstSeenAt: number }[]
  removed: { url: string, sitemap: string, removedAt: number }[]
  summary: { totalAdded: number, totalRemoved: number, period: { days: number } }
}

// ===== Analysis Presets =====

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
  /** Canonical form of the keyword (normalized, grouped) */
  queryCanonical?: string
  /** Number of distinct query variants grouped under this canonical */
  variantCount?: number
  /** All query variants that map to this canonical */
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

export interface GscdumpAnalyticsParams {
  startDate: string
  endDate: string
  prevStartDate?: string
  prevEndDate?: string
}

// ===== Indexing =====

export interface GscdumpIndexingSignals {
  mobilePass: number
  mobileFail: number
  richResultsPass: number
  richResultsFail: number
}

export interface GscdumpIndexingSummarySignals extends GscdumpIndexingSignals {
  mobileUnspecified: number
  richResultTypes: Array<{ type: string, count: number }>
  crawlingMobile: number
  crawlingDesktop: number
}

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
  signals?: GscdumpIndexingSignals
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
  signals?: GscdumpIndexingSummarySignals
}

export interface GscdumpIndexingResponse {
  trend: GscdumpIndexingTrendDay[]
  summary: GscdumpIndexingSummary
  meta: {
    siteUrl: string
    syncStatus: string
    indexingStatus?: 'pending' | 'partial' | 'complete'
    indexingProgress?: number
    sitemapTotal?: number
    inspectedCount?: number
    noSitemapsSubmitted?: boolean
    sitemapsPending?: boolean
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
  mobileVerdict?: string | null
  mobileIssues?: string[] | null
  richResultsVerdict?: string | null
  richResultsItems?: Array<{ richResultType: string, items: Array<{ name: string }> }> | null
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

// The v1 report contract intentionally accepts additive BuilderState fields.
// Keep that extensibility visible to TypeScript at the SDK boundary.
export type BuilderState = import('@gscdump/sdk/query').BuilderState & Record<string, unknown>
export type { Dimension, Filter, Metric } from '@gscdump/sdk/query'

export interface GscdumpQueryTrendResponse {
  daily: { date: string, queryCount: number }[]
  total: number
  previousTotal?: number
  meta: {
    siteUrl: string
    syncStatus: string
  }
}
