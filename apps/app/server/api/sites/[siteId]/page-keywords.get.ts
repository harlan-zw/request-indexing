// TODO(v1): Re-implement via `useGscdumpClient().getData(siteId, { dimensions:
// ['query'], filter: and(eq(page, ...), between(date, ...)) })`. v0 read from
// `siteKeywordDatePathAnalytics`.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: page-keywords endpoint deferred to gscdump-backed dashboard.' })
})
