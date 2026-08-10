// TODO(v1): Re-implement via `useGscdumpClient().getData(siteId, { dimensions:
// ['page'], filter: between(date, ...) })`. v0 joined `sitePathDateAnalytics`
// with `siteKeywordDatePathAnalytics` for top-keyword per page; gscdump exposes
// `topKeyword` directly on data rows. Contract: paginated rows + totals.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: pages endpoint deferred to gscdump-backed dashboard.' })
})
