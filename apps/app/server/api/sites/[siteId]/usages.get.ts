// TODO(v1): Usage rollups deferred. v0 aggregated `siteDateAnalytics` for
// dashboard quota indicators. In v1, surface gscdump sync progress + ProSaaS
// `api_usage` table instead.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: usages endpoint deferred.' })
})
