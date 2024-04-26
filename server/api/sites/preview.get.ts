import { inArray } from 'drizzle-orm'
import { useAuthenticatedUser } from '~/server/app/utils/auth'
import { siteDateAnalytics, siteUrls, sites, userSites } from '~/server/database/schema'
import { queueJob } from '~/server/plugins/eventServiceProvider'

export default defineEventHandler(async (event) => {
  const user = await useAuthenticatedUser(event)

  const { force: _force } = getQuery(event)
  const force = String(_force) === 'true'

  // const store = userAppStorage(user.userId, `sites`)

  // const mq = useMessageQueue()
  if (force) {
    await queueJob('users/syncGscSites', user)
    // await mq.message('/api/_mq/ingest/sites', { userId: user.userId })
    return { sites: [], isPending: true }
  }
  // let sites = Site.where({
  //   // userId: user.
  // })

  const db = useDrizzle()
  const whereQuery = and(
    eq(userSites.userId, user.userId),
  )
  const result = await db.query.sites.findMany({
    with: {
      userSites: {
        where: whereQuery,
      },
    },
    where: and(
      inArray(sites.siteId, db.select({ siteId: userSites.siteId })
        .from(userSites)
        .where(whereQuery)),
      eq(sites.active, true),
    ),
  })

  if (!result.length)
    return { sites: [], isPending: true }

  const distinctOrigins = await db.select({
    siteId: siteUrls.siteId,
    pageCount30Day: sql<number>`COUNT(*)`,
  })
    .from(siteUrls)
    .groupBy(siteUrls.siteId)
    .where(inArray(siteUrls.siteId, result.map(s => s.siteId)))
  //
  const analytics = await db.select({
    siteId: siteDateAnalytics.siteId,
    startOfData: sql<Date>`MIN(date)`,
    isLosingData: sql<boolean>`julianday('now') - julianday(MIN(date)) >= 500`,
  })
    .from(siteDateAnalytics)
    .groupBy(siteDateAnalytics.siteId)
    .where(inArray(siteDateAnalytics.siteId, result.map(s => s.siteId)))

  return { sites: result, distinctOrigins, analytics, isPending: false }
})
