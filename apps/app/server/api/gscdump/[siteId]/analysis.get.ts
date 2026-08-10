import type { GscdumpAnalysisParams } from '~~/layers/pro-gsc/shared/gscdump-api'
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

  const query = getQuery(event) as Record<string, string>
  const gscdump = useGscdumpClient()

  return gscdump.getAnalysis(site.gscdumpSiteId, query as unknown as GscdumpAnalysisParams)
})
