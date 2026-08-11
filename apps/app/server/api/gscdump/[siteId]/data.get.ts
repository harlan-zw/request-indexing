import type { BuilderStateWire, GscComparisonFilter } from '@gscdump/contracts'
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

  const state = JSON.parse(decodeURIComponent(String(query.q))) as BuilderStateWire
  const comparison = query.qc ? JSON.parse(decodeURIComponent(String(query.qc))) as BuilderStateWire : undefined
  const filterValues: GscComparisonFilter[] = ['new', 'lost', 'improving', 'declining']
  const filter = filterValues.find(value => value === query.filter)

  return gscdump.getData(site.gscdumpSiteId, state, { comparison, filter })
})
