import { count, inArray, isNotNull } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import { jobs, sites, teamSites } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)

  const db = useDrizzle()

  const whereQuery = and(
    eq(teamSites.teamId, user.currentTeamId),
  )

  const mySitesQuery = await db.select({ siteId: teamSites.siteId })
    .from(teamSites)
    .where(whereQuery)

  if (!mySitesQuery.length) {
    return { sites: [] }
  }

  // Count completed jobs per site per queue
  const siteJobs = await db.select({
    siteId: jobs.siteId,
    queue: jobs.queue,
    jobCount: count(),
  })
    .from(jobs)
    .where(
      and(
        inArray(jobs.siteId, mySitesQuery.map(s => s.siteId)),
        isNotNull(jobs.completedAt),
      ),
    )
    .groupBy(jobs.siteId, jobs.queue)

  const result = await db.select({
    _id: sites.siteId,
    siteId: sites.publicId,
    domain: sites.domain,
    property: sites.property,
    isSynced: sites.isSynced,
  })
    .from(sites)
    .where(and(
      inArray(sites.siteId, mySitesQuery.map(s => s.siteId)),
      eq(sites.active, true),
    ))
    .all()

  return {
    sites: result.map((site) => {
      const sJobs = siteJobs.filter(s => s.siteId === site._id)
      return {
        ...site,
        _id: undefined,
        ingestingPsi: sJobs.find(s => s.queue === 'psi')?.jobCount || 0,
        ingestingSitemap: sJobs.find(s => s.queue === 'default')?.jobCount || 0,
      }
    }),
  }
})
