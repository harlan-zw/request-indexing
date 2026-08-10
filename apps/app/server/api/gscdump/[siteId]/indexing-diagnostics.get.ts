import { eq } from 'drizzle-orm'
import { authenticateUser } from '~~/layers/core/server/app/utils/auth'
import { sites } from '~~/layers/core/server/db/schema'

export default defineEventHandler(async (event) => {
  await authenticateUser(event)

  const { siteId } = getRouterParams(event, { decode: true })
  const site = await useDrizzle().query.sites.findFirst({
    where: eq(sites.publicId, siteId!),
  })
  if (!site?.gscdumpSiteId) {
    throw createError({ statusCode: 404, message: 'Site not found or not registered with gscdump' })
  }

  const gscdump = useGscdumpClient()
  return gscdump.getIndexingDiagnostics(site.gscdumpSiteId)
})
