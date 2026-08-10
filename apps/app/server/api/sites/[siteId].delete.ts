// TODO(v1): Site deletion deferred to admin-scoped route on the pro-saas
// team-sites table. v0 took an admin role and tore down per-site v0 analytics
// tables that no longer exist (`siteKeywordDateAnalytics`,
// `sitePathDateAnalytics`, `userSites`). gscdump-side deletion already lives
// on `useGscdumpClient().deleteSite(gscdumpSiteId)`.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: site deletion moved to admin / pro-saas team-sites flow.' })
})
