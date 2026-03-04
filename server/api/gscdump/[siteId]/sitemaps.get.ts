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

  const gscdump = useGscdumpClient()
  return gscdump.getSitemaps(site.gscdumpSiteId)
})
