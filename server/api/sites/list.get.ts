import { useAuthenticatedUser } from '~/server/app/utils/auth'
import { siteUrls, sites, teamSites } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const user = await useAuthenticatedUser(event)

  const db = useDrizzle()

  const result = await db.select({
    siteId: sites.publicId,
    domain: sites.domain,
    property: sites.property,
    sitemaps: sites.sitemaps,
    // permissionLevel: userSites.permissionLevel,
    pageCount: sql`(SELECT COUNT(*) FROM ${siteUrls} WHERE ${siteUrls.siteId} = ${sites.siteId})`,
    pageCountIndexed: sql`(SELECT COUNT(*) FROM ${siteUrls} WHERE ${siteUrls.siteId} = ${sites.siteId} AND ${siteUrls.isIndexed} = 1)`,
    psiAverageDesktopScore: sql`(SELECT AVG(${siteUrls.psiDesktopScore}) FROM ${siteUrls} WHERE ${siteUrls.siteId} = ${sites.siteId})`,
    psiAverageMobileScore: sql`(SELECT AVG(${siteUrls.psiMobileScore}) FROM ${siteUrls} WHERE ${siteUrls.siteId} = ${sites.siteId})`,
  })
    .from(sites)
    .leftJoin(teamSites, and(eq(sites.siteId, teamSites.siteId), eq(teamSites.teamId, user.team.teamId)))
    // .leftJoin(userSites, and(eq(sites.siteId, userSites.siteId), eq(userSites.userId, user.userId)))
    .where(and(
      eq(sites.active, true),
      eq(teamSites.teamId, user.team.teamId),
    ))
    .all()

  return { sites: result }
})
