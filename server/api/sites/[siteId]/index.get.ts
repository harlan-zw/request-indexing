import { count } from 'drizzle-orm'
import { jobs, sitePaths, sites } from '~/server/db/schema'

export default defineEventHandler(async (e) => {
  await requireAdminAuth(e)
  const { siteId } = getRouterParams(e, { decode: true })
  const site = await useDrizzle().query.sites.findFirst({
    where: eq(sites.publicId, siteId),
  })
  if (!site) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Site not found',
    })
  }
  const _jobs = await useDrizzle().select().from(jobs).where(eq(jobs.siteId, site.siteId))
  const pageCount = await useDrizzle().select({ count: count() }).from(sitePaths).where(eq(sitePaths.siteId, site.siteId)).groupBy(sitePaths.isIndexed)
  return {
    site,
    jobs: _jobs,
    pageCount,
  }
})
