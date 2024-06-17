import { count, inArray } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import { jobs, sites, teamSites } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)

  // we need to check for the following 3 states which we can gather from the current jobs table
  // Ingesting Google Search Console data
  // Running PageSpeed Insights Tests
  // Crawling indexable pages

  const db = useDrizzle()

  // db.select({
  //   ingestingGsc: sql`(SELECT COUNT(*) FROM ${jobs} WHERE ${jobs.status} = 'pending' AND ${jobs.entityId} = )`,
  // })
  const whereQuery = and(
    eq(teamSites.teamId, user.currentTeamId),
  )

  const mySitesQuery = await db.select({ siteId: teamSites.siteId })
    .from(teamSites)
    .where(whereQuery)

  // team has no sites
  if (!mySitesQuery.length) {
    return {
      sites: [],
    }
  }

  const siteJobs = await db.select({
    // siteId: jobs.entityId,
    siteId: jobs.entityId,
    // name: jobs.name,
    queue: jobs.queue,
    jobCount: count(),
    // jobCount: sql`(SELECT COUNT(*) FROM ${jobs} WHERE ${jobs.status} = 'pending' AND ${jobs.entityId} = ${sites.siteId} AND ${jobs.entityType} = 'site')`.as('jobCount'),
  })
    .from(jobs)
    .where(
      and(
        inArray(jobs.entityId, mySitesQuery.map(s => s.siteId)),
        eq(jobs.entityType, 'site'),
        eq(jobs.status, 'completed'),
      ),
    )
    .groupBy(jobs.entityId, jobs.queue)

  const result = await db.select({
    _id: sites.siteId,
    siteId: sites.publicId,
    domain: sites.domain,
    property: sites.property,
    // sitemaps: sites.sitemaps,
    isSynced: sites.isSynced,
    // ingestingGsc: sq.ingestingGsc,

    // permissionLevel: userSites.permissionLevel,
    // pageCount: sql`(SELECT COUNT(*) FROM ${sitePaths} WHERE ${sitePaths.siteId} = ${sites.siteId})`,
    // pageCountIndexed: sql`(SELECT COUNT(*) FROM ${sitePaths} WHERE ${sitePaths.siteId} = ${sites.siteId} AND ${sitePaths.isIndexed} = 1)`,
    // psiAverageDesktopScore: sql`(SELECT AVG(${siteUrls.psiDesktopScores}) FROM ${siteUrls} WHERE ${siteUrls.siteId} = ${sites.siteId})`,
    // psiAverageMobileScore: sql`-- (SELECT AVG(${siteUrls.psiMobileScores}) FROM ${siteUrls} WHERE ${siteUrls.siteId} = ${sites.siteId})`,
  })
    .from(sites)
    // .leftJoin(teamSites, and(eq(sites.siteId, teamSites.siteId), eq(teamSites.teamId, user.team.teamId)))
    // .leftJoin(sq, eq(sq.siteId, sites.siteId))
    // .leftJoin(userSites, and(eq(sites.siteId, userSites.siteId), eq(userSites.userId, user.userId)))
    .where(and(
      inArray(sites.siteId, mySitesQuery.map(s => s.siteId)),
      eq(sites.active, true),
      // eq(teamSites.teamId, user.team.teamId),
    ))
    .all()

  return {
    sites: result.map((site) => {
      const sJobs = siteJobs.filter(s => s.siteId === site._id)
      return {
        ...site,
        _id: undefined,
        ingestingGsc: sJobs.find(s => s.queue === 'gsc')?.jobCount || 0,
        ingestingPsi: sJobs.find(s => s.queue === 'psi')?.jobCount || 0,
        ingestingSitemap: sJobs.find(s => s.queue === 'default')?.jobCount || 0,
      }
    }),
  }
})
