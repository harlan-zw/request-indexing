import type { IndexCohortsResponse } from '#layers/pro-indexing/shared/contracts/index-cohorts'
import { useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { buildIndexCohortsFromIndexingUrls } from '#layers/pro-indexing/server/utils/index-cohorts'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

// Which part of this site does Google treat worse than the rest?
//
// The reason taxonomy Search Console publishes ("37 crawled but not indexed")
// names a symptom the developer cannot act on. Partitioning the inspected set
// by path and asking which partition Google treats differently names a place
// they can. The join, the Wilson intervals and the Bonferroni correction all
// live in `server/utils/index-cohorts.ts`, so this handler only fetches.
//
// The cohort test needs the WHOLE inspected set, not a page of it: a partial
// sample would rank sections by which rows happened to load. A truncated read
// therefore answers `no-evidence` rather than a ranking built on half the data.

/** One read. Above this the inspection set is too large to compare honestly in a request. */
const MAX_COHORT_URLS = 2000

export default defineProApiHandler({ site: true }, async ({ site: access }): Promise<IndexCohortsResponse> => {
  const gscdumpSiteId = access.site.gscdumpSiteId
  if (!gscdumpSiteId)
    return { _tag: 'no-evidence', crawlSettingsId: null, asOf: null, reason: 'no-inspection-join' }

  const response = await useGscdumpClient().getIndexingUrls(gscdumpSiteId, { limit: MAX_COHORT_URLS })

  if (response.pagination.hasMore)
    return { _tag: 'no-evidence', crawlSettingsId: null, asOf: null, reason: 'no-inspection-join' }

  return buildIndexCohortsFromIndexingUrls(
    { urls: response.urls, siteUrl: response.meta?.siteUrl ?? access.site.property },
    new Date().toISOString(),
  )
})
