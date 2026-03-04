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

  const query = getQuery(event)
  const gscdump = useGscdumpClient()

  const state = JSON.parse(decodeURIComponent(query.q as string))
  const comparison = query.qc ? JSON.parse(decodeURIComponent(query.qc as string)) : undefined

  return gscdump.getDataDetail(site.gscdumpSiteId, state, { comparison })
})
