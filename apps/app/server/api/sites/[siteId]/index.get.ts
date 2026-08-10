// TODO(v1): Per-site detail deferred. v0 returned `{ site, jobs, pageCount }`
// for the admin overview. v1 surfaces site detail via pro-saas
// `requireSiteAccess` + gscdump `getSiteSyncStatus`.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: site detail endpoint moved to pro-saas + gscdump lifecycle.' })
})
