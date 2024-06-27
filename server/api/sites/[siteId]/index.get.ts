import { count } from 'drizzle-orm'
import { jobs, sitePaths, sites } from '~/server/database/schema'
import { authenticateAdmin } from '~/server/app/utils/auth'

export default defineEventHandler(async (e) => {
  // TODO support non-admin queries
  await authenticateAdmin(e)
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
  const _jobs = await useDrizzle().query.jobs.findMany({
    where: and(eq(jobs.entityId, site.siteId), eq(jobs.entityType, 'site')),
  })
  //     pageCount: sql`(SELECT COUNT(*) FROM ${sitePaths}WHERE ${sitePaths.siteId} = ${sites.siteId})`,
  //     pageCountIndexed: sql`(SELECT COUNT(*) FROM ${sitePaths}WHERE ${sitePaths.siteId} = ${sites.siteId}AND ${sitePaths.isIndexed} = 1)`,
  const pageCount = await useDrizzle().select({ count: count() })
    .from(sitePaths)
    .where(eq(sitePaths.siteId, site.siteId))
    .groupBy(sitePaths.isIndexed)
  return {
    site,
    jobs: _jobs,
    pageCount,
  }
})
