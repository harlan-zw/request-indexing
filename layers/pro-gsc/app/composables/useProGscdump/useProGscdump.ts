// Typed v1 client plus an escape hatch for consumer-specific gscdump routes.
// Reads credentials from the SSR-hydrated integration payload (ADR-0002),
// injects `x-api-key`, and routes errors through the shared toast helper.
//
// Public operations must use the typed methods below. `fetchGscdump` remains
// only for request-indexing-specific routes that do not have a public v1
// operation yet.
import type { GscdumpV1OperationInput } from '@gscdump/sdk/v1'
import type {
  GscdumpAnalysisResponse,
  GscdumpDataDetailResponse,
  GscdumpDataResponse,
  GscdumpIndexingDiagnosticsResponse,
  GscdumpIndexingResponse,
  GscdumpIndexingUrlsResponse,
  GscdumpSitemapChangesResponse,
  GscdumpSitemapsResponse,
} from '../../../shared/gscdump-api'
import { createGscdumpV1Client } from '@gscdump/sdk/v1'
import { showGscdumpErrorToast } from '../../utils/gscdump-toast'
import { parseGscdumpError } from '../_gscdump-error'
import { useGscdumpIntegration } from '../useGscdumpIntegration'

export function useProGscdump() {
  const { apiKey, userId, apiBase } = useGscdumpIntegration()

  function createV1Client() {
    return createGscdumpV1Client({
      apiRoot: `${apiBase.value.replace(/\/+$/, '')}/api`,
      credential: () => {
        if (!apiKey.value || !userId.value)
          throw createError({ statusCode: 401, message: 'gscdump credentials unavailable' })
        return apiKey.value
      },
    })
  }

  // The v1 schemas are deliberately wider than this consumer's established
  // read models (for example nullable inspection fields). Keep the cast at one
  // compatibility boundary while every request remains operation-typed.
  async function runV1<T>(request: () => Promise<{ data: unknown }>, silent = false): Promise<T> {
    return request()
      .then(response => response.data as T)
      .catch((error) => {
        if (!silent)
          showGscdumpErrorToast(parseGscdumpError(error))
        throw error
      })
  }

  function queryAnalyticsReport(input: GscdumpV1OperationInput<'analytics.reports.query'>, silent = false) {
    return runV1<GscdumpDataResponse>(() => createV1Client().queryAnalyticsReport(input), silent)
  }

  function queryAnalyticsReportDetail(input: GscdumpV1OperationInput<'analytics.reports.detail.query'>, silent = false) {
    return runV1<GscdumpDataDetailResponse>(() => createV1Client().queryAnalyticsReportDetail(input), silent)
  }

  function getSiteAnalysis(input: GscdumpV1OperationInput<'partner.sites.analysis.get'>, silent = false) {
    return runV1<GscdumpAnalysisResponse>(() => createV1Client().getSiteAnalysis(input), silent)
  }

  function getSiteIndexing(input: GscdumpV1OperationInput<'partner.sites.indexing.get'>, silent = false) {
    return runV1<GscdumpIndexingResponse>(() => createV1Client().getSiteIndexing(input), silent)
  }

  function listSiteIndexingUrls(input: GscdumpV1OperationInput<'partner.sites.indexing.urls.list'>, silent = false) {
    return runV1<GscdumpIndexingUrlsResponse>(() => createV1Client().listSiteIndexingUrls(input), silent)
  }

  function getSiteIndexingDiagnostics(input: GscdumpV1OperationInput<'partner.sites.indexing.diagnostics.get'>, silent = false) {
    return runV1<GscdumpIndexingDiagnosticsResponse>(() => createV1Client().getSiteIndexingDiagnostics(input), silent)
  }

  function getSiteSitemaps(input: GscdumpV1OperationInput<'partner.sites.sitemaps.get'>, silent = false) {
    return runV1<GscdumpSitemapsResponse>(() => createV1Client().getSiteSitemaps(input), silent)
  }

  function getSiteSitemapChanges(input: GscdumpV1OperationInput<'partner.sites.sitemaps.changes.get'>, silent = false) {
    return runV1<GscdumpSitemapChangesResponse>(() => createV1Client().getSiteSitemapChanges(input), silent)
  }

  async function fetchGscdump<T>(
    path: string,
    options?: { query?: Record<string, any>, method?: string, body?: any, silent?: boolean },
  ): Promise<T> {
    if (import.meta.server)
      throw new Error('[gscdump] Cannot fetch credentials during SSR')
    if (!apiKey.value || !userId.value)
      throw createError({ statusCode: 401, message: 'gscdump credentials unavailable' })

    const apiUrl = `${apiBase.value.replace(/\/+$/, '')}/api`
    return $fetch<T>(`${apiUrl}${path}`, {
      headers: { 'x-api-key': apiKey.value },
      query: options?.query,
      method: options?.method as any,
      body: options?.body,
    }).catch((e) => {
      if (!options?.silent)
        showGscdumpErrorToast(parseGscdumpError(e))
      throw e
    })
  }

  return {
    fetchGscdump,
    getSiteAnalysis,
    getSiteIndexing,
    getSiteIndexingDiagnostics,
    getSiteSitemapChanges,
    getSiteSitemaps,
    listSiteIndexingUrls,
    queryAnalyticsReport,
    queryAnalyticsReportDetail,
  }
}
