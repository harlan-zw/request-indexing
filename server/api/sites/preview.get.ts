import { count, inArray } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import { jobs, siteDateAnalytics, sitePaths, sites, userSites } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)

  const { force: _force } = getQuery(event)
  const force = String(_force) === 'true'

  if (force) {
    return { sites: [], isPending: true }
  }

  const db = useDrizzle()
  const whereQuery = and(
    eq(userSites.userId, user.userId),
  )

  const mySitesQuery = db.select({ siteId: userSites.siteId })
    .from(userSites)
    .where(whereQuery)

  const sq = db.select({
    siteId: sitePaths.siteId,
    pageCount30Day: count().as('pageCount30Day'),
  })
    .from(sitePaths)
    .groupBy(sitePaths.siteId)
    .where(and(
      inArray(sitePaths.siteId, mySitesQuery),
    ))
    .as('sq')
  const sq2 = db.select({
    siteId: siteDateAnalytics.siteId,
    startOfData: sql<Date>`MIN(date)`.as('startOfData'),
    isLosingData: sql<boolean>`julianday('now') - julianday(MIN(date)) >= 500`.as('isLosingData'),
  })
    .from(siteDateAnalytics)
    .groupBy(siteDateAnalytics.siteId)
    .where(inArray(siteDateAnalytics.siteId, mySitesQuery))
    .as('sq2')
  const sq3 = db.select({
    siteId: userSites.siteId,
    permissionLevel: userSites.permissionLevel,
  })
    .from(userSites)
    .where(whereQuery)
    .as('sq3')

  // Check if user has a pending sync job (not completed, not failed)
  const pendingJob = await db.select({ id: jobs.id })
    .from(jobs)
    .where(and(
      eq(jobs.userId, user.userId),
      sql`json_extract(${jobs.payload}, '$._task') = 'users/sync-gsc-sites'`,
      sql`${jobs.completedAt} IS NULL`,
      sql`${jobs.failedAt} IS NULL`,
    ))
    .get()

  return {
    jobStatus: pendingJob ? 'pending' : 'completed',
    sites: await db.select({
      property: sites.property,
      sitemaps: sites.sitemaps,
      siteId: sites.publicId,
      domain: sites.domain,
      lastSynced: sites.lastSynced,
      pageCount30Day: sq.pageCount30Day,
      startOfData: sq2.startOfData,
      isLosingData: sq2.isLosingData,
      permissionLevel: sq3.permissionLevel,
    })
      .from(sites)
      .where(and(
        inArray(sites.siteId, mySitesQuery),
        eq(sites.active, true),
      ))
      .leftJoin(sq, eq(sites.siteId, sq.siteId))
      .leftJoin(sq2, eq(sites.siteId, sq2.siteId))
      .leftJoin(sq3, eq(sites.siteId, sq3.siteId)),
  }
})
