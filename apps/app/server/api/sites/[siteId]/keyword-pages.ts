// TODO(v1): Re-implement via gscdump `getData` with `['query','page']`
// dimensions. v0 read `siteKeywordDatePathAnalytics` joined to `keywords`.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: keyword-pages endpoint deferred to gscdump-backed dashboard.' })
})
