import { useAuthenticatedUser } from '~/server/app/utils/auth'
import { sites, teamSites, userTeamSites } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const user = await useAuthenticatedUser(event)

  const db = useDrizzle()

  const result = await db.select({
    siteId: sites.publicId,
    domain: sites.domain,
    property: sites.property,
    sitemaps: sites.sitemaps,
    permissionLevel: userTeamSites.permissionLevel,
  })
    .from(sites)
    .leftJoin(teamSites, and(eq(sites.siteId, teamSites.siteId), eq(teamSites.teamId, user.team.teamId)))
    .leftJoin(userTeamSites, and(eq(sites.siteId, userTeamSites.siteId), eq(userTeamSites.userId, user.userId), eq(userTeamSites.teamId, user.team.teamId)))
    .where(and(
      eq(teamSites.visible, true), // can be hidden at a team level
      eq(sites.isDomainProperty, false),
      eq(userTeamSites.visible, true), // can be hidden at user level
    ))
    .all()

  return { sites: result }
})
