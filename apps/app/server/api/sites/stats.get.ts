// TODO(v1): Site-list stats summary deferred. v0 aggregated
// `siteDateAnalytics`/`siteDateCountryAnalytics` across the user's team. In v1
// this is a portfolio summary over `useGscdumpClient().getUserLifecycle()` +
// per-site `getDataDetail` daily rollups.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: sites/stats endpoint deferred to gscdump-backed portfolio.' })
})
