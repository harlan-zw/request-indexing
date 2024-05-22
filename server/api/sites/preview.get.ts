import { count, inArray } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import { siteDateAnalytics, sitePaths, sites, userSites } from '~/server/database/schema'
import { queueJob } from '~/server/plugins/eventServiceProvider'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)

  const { force: _force } = getQuery(event)
  const force = String(_force) === 'true'

  if (force) {
    await queueJob('users/syncGscSites', {
      userId: user.userId,
    })
    // await mq.message('/api/_mq/ingest/sites', { userId: user.userId })
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
  // sq3 is for the user site permission
  const sq3 = db.select({
    siteId: userSites.siteId,
    permissionLevel: userSites.permissionLevel,
  })
    .from(userSites)
    .where(whereQuery)
    .as('sq3')
  return await db.select({
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
    .leftJoin(sq3, eq(sites.siteId, sq3.siteId))
})
