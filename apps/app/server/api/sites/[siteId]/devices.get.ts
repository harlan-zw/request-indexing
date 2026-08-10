// TODO(v1): Re-implement via `useGscdumpClient().getData(siteId, { dimensions:
// ['device'], filter: between(date, ...) })`.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: devices endpoint deferred to gscdump-backed dashboard.' })
})
