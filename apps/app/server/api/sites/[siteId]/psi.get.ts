// TODO(v1): PSI dashboards deferred to v1.1 (pro-perf layer). v0 read from
// `sitePathDateAnalytics` joined with PSI scan tables; v1 owns CWV/PSI via
// `pro-perf` + CrUX history fetchers (see nuxtseo.com `fetchCwvHistory`).
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: psi endpoint deferred to v1.1 pro-perf layer.' })
})
