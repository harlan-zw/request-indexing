// TODO(v1): Per-page detail deferred to gscdump `getDataDetail` with
// `eq(page, ...)` filter + `dimensions: ['date']`.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: page detail endpoint deferred to gscdump-backed dashboard.' })
})
