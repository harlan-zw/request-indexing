export default defineGscdumpSiteHandler(async ({ event, gscdumpSiteId }) => {
  const body = await readBody<{ sitemapUrl?: string, action: 'submit' | 'delete' | 'refresh' }>(event)
  const gscdump = useGscdumpClient()

  if (body.action === 'refresh') {
    return gscdump.refreshSitemaps(gscdumpSiteId)
  }

  if (!body.sitemapUrl) {
    throw createError({ statusCode: 400, message: 'sitemapUrl required for submit/delete' })
  }

  return gscdump.submitSitemap(gscdumpSiteId, body.sitemapUrl, body.action)
})
