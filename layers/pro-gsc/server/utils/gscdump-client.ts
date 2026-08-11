// gscdump.com Partner API client (Nuxt server adapter).
//
// Frozen public-v1 operations use the registry-driven SDK. The legacy client
// is kept only as a source of parameter types for the handful of user-management
// operations below; every request now goes through the v1 client.

import type {
  BuilderStateWire,
  DataDetailOptions,
  DataQueryOptions,
  GscdumpAnalysisParams,
  GscdumpAvailableSite,
  IndexingDiagnosticsParams,
  IndexingUrlsParams,
  RegisterPartnerUserParams,
  UpdatePartnerUserTokensParams,
  WebhookEventType,
} from '@gscdump/contracts'
import type {
  GscdumpAnalysisResponse,
  GscdumpDataDetailResponse,
  GscdumpDataResponse,
  GscdumpSyncStatusResponse,
  PartnerLifecycleResponse,
  PartnerLifecycleSite,
} from '../../shared/gscdump-api'
import { GSCDUMP_ONBOARDING_CONTRACT_VERSION } from '@gscdump/contracts'
import {
  findLifecycleSite as findSdkLifecycleSite,
  lifecycleSiteToSyncStatus as lifecycleSdkSiteToSyncStatus,
  lifecycleSiteToUserSite as lifecycleSdkSiteToUserSite,
} from '@gscdump/sdk/lifecycle'
import { isGscdumpV1Error } from '@gscdump/sdk/v1'
import { CANONICAL_WEBHOOK_EVENTS } from '@gscdump/sdk/webhook'
import { createGscdumpPublicV1Client } from './gscdump-origin'

export { analyticsStatusToSyncStatus } from '@gscdump/sdk/lifecycle'
export type { GscdumpAvailableSite }

export function findLifecycleSite(lifecycle: PartnerLifecycleResponse, siteIdOrPropertyUrl: string): PartnerLifecycleSite | null {
  return findSdkLifecycleSite(lifecycle as never, siteIdOrPropertyUrl) as PartnerLifecycleSite | null
}

export function lifecycleSiteToSyncStatus(site: PartnerLifecycleSite): ReturnType<typeof lifecycleSdkSiteToSyncStatus> {
  return lifecycleSdkSiteToSyncStatus(site as never)
}

export function lifecycleSiteToUserSite(site: PartnerLifecycleSite): ReturnType<typeof lifecycleSdkSiteToUserSite> {
  return lifecycleSdkSiteToUserSite(site as never)
}

export function useGscdumpClient() {
  const client = createGscdumpPublicV1Client()

  function rethrowV1AsH3(err: unknown): never {
    if (isGscdumpV1Error(err)) {
      throw createError({
        statusCode: err.status ?? 500,
        message: err.message,
        data: {
          code: err.code,
          details: err.details,
          requestId: err.requestId,
          retryable: err.retryable,
        },
      })
    }
    throw err
  }

  function toV1ReportState(state: BuilderStateWire, searchType?: DataQueryOptions['searchType']): BuilderStateWire & Record<string, unknown> {
    return {
      ...state,
      searchType: searchType ?? state.searchType ?? 'web',
    }
  }

  async function getUserLifecycle(userId: string): Promise<PartnerLifecycleResponse> {
    return client.getUserLifecycle({ params: { userId } })
      .then(response => ({
        contractVersion: GSCDUMP_ONBOARDING_CONTRACT_VERSION,
        ...response.data,
        sites: response.data.sites.map(site => ({
          intId: null,
          catalogSiteId: null,
          lifecycleRevision: 0,
          ...site,
        })),
      }))
      .catch(rethrowV1AsH3)
  }

  async function getSiteSyncStatus(siteId: string, userId: string): Promise<GscdumpSyncStatusResponse> {
    const lifecycle = await getUserLifecycle(userId)
    const site = findLifecycleSite(lifecycle, siteId)
    if (!site)
      throw createError({ statusCode: 404, message: 'Site not found in gscdump lifecycle' })
    return lifecycleSiteToSyncStatus(site) as GscdumpSyncStatusResponse
  }

  async function waitForUserReady(userId: string, options: {
    attempts?: number
    intervalMs?: number
  } = {}): Promise<PartnerLifecycleResponse> {
    const attempts = options.attempts ?? 12
    const intervalMs = options.intervalMs ?? 1000
    let latest: PartnerLifecycleResponse | null = null

    for (let attempt = 0; attempt < attempts; attempt++) {
      latest = await getUserLifecycle(userId)
      if (latest.account.status === 'ready')
        return latest
      if (latest.account.status === 'refresh_missing' || latest.account.status === 'scope_missing' || latest.account.status === 'reauth_required') {
        throw createError({
          statusCode: 401,
          statusMessage: 'GSCDUMP_REAUTH_REQUIRED',
          message: 'Google Search Console authorization must be refreshed',
          data: latest.account,
        })
      }
      if (latest.account.status === 'disconnected' || latest.account.status === 'oauth_received') {
        throw createError({
          statusCode: 409,
          statusMessage: 'GSCDUMP_NOT_CONNECTED',
          message: 'gscdump user is not fully connected',
          data: latest.account,
        })
      }
      if (attempt < attempts - 1)
        await new Promise(resolve => setTimeout(resolve, intervalMs))
    }

    throw createError({
      statusCode: 409,
      statusMessage: 'GSCDUMP_USER_PROVISIONING',
      message: 'gscdump user database is still provisioning',
      data: latest,
    })
  }

  async function getAnalysis(siteId: string, params: GscdumpAnalysisParams): Promise<GscdumpAnalysisResponse> {
    if ((params.preset === 'non-brand' || params.preset === 'brand-only') && !params.brandTerms?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'brandTerms is required for brand/non-brand presets',
      })
    }
    return client.getSiteAnalysis({ params: { siteId }, query: params })
      .then(response => response.data as unknown as GscdumpAnalysisResponse)
      .catch(rethrowV1AsH3)
  }

  return {
    // User management
    registerUser: (body: RegisterPartnerUserParams) =>
      client.createUser({ body }).then(response => response.data).catch(rethrowV1AsH3),
    updateUserTokens: (userId: string, body: UpdatePartnerUserTokensParams) =>
      client.updateUserTokens({ params: { userId }, body }).then(response => response.data).catch(rethrowV1AsH3),
    getUserLifecycle,
    getSiteSyncStatus,
    waitForUserReady,
    getAvailableSites: (userId: string) =>
      client.listAvailableSites({ params: { userId }, query: {} }).then(response => response.data).catch(rethrowV1AsH3),

    // Site management
    registerSite: (params: {
      userId: string
      siteUrl?: string
      requestedUrl?: string
      gscPropertyUrl?: string
      webhookUrl?: string
      webhookEvents?: WebhookEventType[]
    }) =>
      client.createSite({
        params: { userId: params.userId },
        body: {
          siteUrl: (params.requestedUrl || params.siteUrl)!,
          ...(params.requestedUrl && { requestedUrl: params.requestedUrl }),
          ...(params.gscPropertyUrl && { gscPropertyUrl: params.gscPropertyUrl }),
          ...(params.webhookUrl && { webhookUrl: params.webhookUrl }),
          webhookEvents: params.webhookEvents?.length ? params.webhookEvents : [...CANONICAL_WEBHOOK_EVENTS],
        },
      }).then(response => response.data).catch(rethrowV1AsH3),
    deleteSite: (siteId: string) =>
      client.deleteSite({ params: { siteId } }).then(response => response.data).catch(rethrowV1AsH3),

    // Analytics
    getData: (siteId: string, state: BuilderStateWire, queryOptions?: DataQueryOptions): Promise<GscdumpDataResponse> =>
      client.queryAnalyticsReport({
        params: { siteId },
        body: {
          state: toV1ReportState(state, queryOptions?.searchType),
          ...(queryOptions?.comparison ? { comparison: toV1ReportState(queryOptions.comparison, queryOptions.searchType) } : {}),
          ...(queryOptions?.filter ? { filter: queryOptions.filter } : {}),
        },
      }).then(response => response.data as unknown as GscdumpDataResponse).catch(rethrowV1AsH3),
    getDataDetail: (siteId: string, state: BuilderStateWire, queryOptions?: DataDetailOptions): Promise<GscdumpDataDetailResponse> =>
      client.queryAnalyticsReportDetail({
        params: { siteId },
        body: {
          state: toV1ReportState(state, queryOptions?.searchType),
          ...(queryOptions?.comparison ? { comparison: toV1ReportState(queryOptions.comparison, queryOptions.searchType) } : {}),
        },
      }).then(response => response.data as unknown as GscdumpDataDetailResponse).catch(rethrowV1AsH3),
    getAnalysis,

    // Sitemaps: all v1 since `partner.sites.sitemaps.action.create` (submit/delete/refresh).
    getSitemaps: (siteId: string) =>
      client.getSiteSitemaps({ params: { siteId } }).then(response => response.data).catch(rethrowV1AsH3),
    getSitemapChanges: (siteId: string, days = 28) =>
      client.getSiteSitemapChanges({ params: { siteId }, query: { days } }).then(response => response.data).catch(rethrowV1AsH3),
    submitSitemap: (siteId: string, sitemapUrl: string, action: 'submit' | 'delete') =>
      client.createSitemapAction({ params: { siteId }, body: { action, sitemapUrl } })
        .then(response => response.data)
        .catch(rethrowV1AsH3),
    refreshSitemaps: (siteId: string) =>
      client.createSitemapAction({ params: { siteId }, body: { action: 'refresh' } })
        .then(response => response.data)
        .catch(rethrowV1AsH3),

    // Indexing
    getIndexing: (siteId: string, days = 28) =>
      client.getSiteIndexing({ params: { siteId }, query: { days } }).then(response => response.data).catch(rethrowV1AsH3),
    getIndexingUrls: (siteId: string, query: IndexingUrlsParams = {}) =>
      client.listSiteIndexingUrls({ params: { siteId }, query }).then(response => response.data).catch(rethrowV1AsH3),
    getIndexingDiagnostics: (siteId: string, query: IndexingDiagnosticsParams = {}) =>
      client.getSiteIndexingDiagnostics({ params: { siteId }, query }).then(response => response.data).catch(rethrowV1AsH3),
  }
}
