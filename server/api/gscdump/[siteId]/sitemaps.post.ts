import { authenticateUser } from '~/server/app/utils/auth'
import { sites } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  await authenticateUser(event)

  const { siteId } = getRouterParams(event, { decode: true })
  const site = await useDrizzle().query.sites.findFirst({
    where: eq(sites.publicId, siteId),
  })
  if (!site?.gscdumpSiteId) {
    throw createError({ statusCode: 404, message: 'Site not found or not registered with gscdump' })
  }

  const body = await readBody<{ sitemapUrl?: string, action: 'submit' | 'delete' | 'refresh' }>(event)
  const gscdump = useGscdumpClient()

  if (body.action === 'refresh') {
    return gscdump.refreshSitemaps(site.gscdumpSiteId)
  }

  if (!body.sitemapUrl) {
    throw createError({ statusCode: 400, message: 'sitemapUrl required for submit/delete' })
  }

  return gscdump.submitSitemap(site.gscdumpSiteId, body.sitemapUrl, body.action)
})
