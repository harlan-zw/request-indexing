import { inArray } from 'drizzle-orm'
import { useMessageQueue } from '~/lib/nuxt-ttyl/runtime/nitro/mq'
import { useAuthenticatedUser } from '~/server/app/utils/auth'
import { siteUrlAnalytics, siteUrls, sites, userTeamSites } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const user = await useAuthenticatedUser(event)

  const { force: _force } = getQuery(event)
  const force = String(_force) === 'true'

  // const store = userAppStorage(user.userId, `sites`)

  const mq = useMessageQueue()
  if (force) {
    await mq.message('/api/_mq/ingest/sites', { userId: user.userId })
    return { sites: [], isPending: true }
  }
  // let sites = Site.where({
  //   // userId: user.
  // })

  const db = useDrizzle()
  const whereQuery = and(
    eq(userTeamSites.teamId, user.team.teamId),
    eq(userTeamSites.userId, user.userId),
  )
  const result = await db.query.sites.findMany({
    with: {
      userTeamSites: {
        where: whereQuery,
      },
    },
    where: and(
      inArray(sites.siteId, db.select({ siteId: userTeamSites.siteId })
        .from(userTeamSites)
        .where(whereQuery)),
      eq(sites.isDomainProperty, false),
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
    siteId: siteUrlAnalytics.siteId,
    startOfData: sql<Date>`MIN(date)`,
    isLosingData: sql<boolean>`julianday('now') - julianday(MIN(date)) >= 500`,
  })
    .from(siteUrlAnalytics)
    .groupBy(siteUrlAnalytics.siteId)
    .where(inArray(siteUrlAnalytics.siteId, result.map(s => s.siteId)))

  return { sites: result, distinctOrigins, analytics, isPending: false }
})
