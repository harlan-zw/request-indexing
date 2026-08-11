import type { GscdumpIndexingUrlStatus } from '@gscdump/contracts'
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

  const query = getQuery(event)
  const gscdump = useGscdumpClient()
  const statusValues: GscdumpIndexingUrlStatus[] = ['indexed', 'not_indexed', 'pending']
  const status = statusValues.find(value => value === query.status)

  return gscdump.getIndexingUrls(site.gscdumpSiteId, {
    limit: Number(query.limit) || undefined,
    offset: Number(query.offset) || undefined,
    status,
    issue: query.issue as string,
    search: query.search as string,
  })
})
